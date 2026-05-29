import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { TrendingUp, Lock, Unlock, Wallet, Gift, Clock, Percent, ChevronRight, Info } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../src/constants';
import { Card, Button, BalanceDisplay, ConfirmationModal } from '../../../src/components/ui';
import { useStakingStore, STAKING_PRODUCTS } from '../../../src/store/useStakingStore';
import { useUserStore } from '../../../src/store/useUserStore';
import { formatBalance, formatDuration, formatPercent } from '../../../src/utils';
import { notifyStakeConfirmed } from '../../../src/lib/notifications';
import { StakingProduct } from '../../../src/types';

export default function EarnScreen() {
  const insets = useSafeAreaInsets();
  const { balance } = useUserStore();
  const { positions, totalStaked, totalRewards, claimedRewards, addPosition, claimRewards, calculateRewards } = useStakingStore();

  const [selectedProduct, setSelectedProduct] = useState<StakingProduct | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState<{ id: string; amount: number } | null>(null);
  const [staking, setStaking] = useState(false);
  const [showInfo, setShowInfo] = useState<string | null>(null);

  const handleStake = useCallback(async () => {
    if (!selectedProduct) return;
    const amount = parseFloat(stakeAmount);
    if (!amount || amount < selectedProduct.minAmount) {
      Alert.alert('Invalid Amount', `Minimum stake is ${selectedProduct.minAmount} ASH`);
      return;
    }
    if (amount > balance) {
      Alert.alert('Insufficient Balance', `You only have ${formatBalance(balance)} ASH`);
      return;
    }
    setStaking(true);
    await new Promise((r) => setTimeout(r, 1000));

    const now = Date.now();
    const endDate = selectedProduct.lockPeriodDays > 0
      ? now + selectedProduct.lockPeriodDays * 86400000
      : now + 365 * 86400000;

    addPosition({
      id: `stake-${now}`,
      amount,
      apy: selectedProduct.apy,
      lockPeriod: selectedProduct.lockPeriodDays,
      startDate: now,
      endDate,
      rewards: 0,
      claimedRewards: 0,
      status: selectedProduct.lockPeriodDays === 0 ? 'active' : 'locked',
      productId: selectedProduct.id,
    });

    setStaking(false);
    setShowStakeModal(false);
    setStakeAmount('');
    setSelectedProduct(null);
    notifyStakeConfirmed(amount, selectedProduct.name);
  }, [selectedProduct, stakeAmount, balance, addPosition]);

  const handleClaim = useCallback((positionId: string) => {
    const netReward = claimRewards(positionId);
    if (netReward > 0) {
      Alert.alert('Rewards Claimed', `You received ${formatBalance(netReward)} ASH (after ${STAKING_PRODUCTS[0]?.apy ? '10%' : '10%'} platform fee)`);
    }
    setShowClaimModal(null);
  }, [claimRewards]);

  const activePositions = positions.filter((p) => p.status === 'active' || p.status === 'locked');
  const completedPositions = positions.filter((p) => p.status === 'completed');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TrendingUp size={24} color={colors.chartGreen} />
          <Text style={styles.title}>Staking</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Wallet size={16} color={colors.primary} />
            <Text style={styles.summaryLabel}>Available</Text>
            <Text style={styles.summaryValue}>{formatBalance(balance)} ASH</Text>
          </View>
          <View style={styles.summaryCard}>
            <Lock size={16} color={colors.accent} />
            <Text style={styles.summaryLabel}>Staked</Text>
            <Text style={styles.summaryValue}>{formatBalance(totalStaked)} ASH</Text>
          </View>
          <View style={styles.summaryCard}>
            <Gift size={16} color={colors.chartGreen} />
            <Text style={styles.summaryLabel}>Rewards</Text>
            <Text style={[styles.summaryValue, { color: colors.chartGreen }]}>+{formatBalance(claimedRewards)}</Text>
          </View>
        </View>

        <Card style={styles.feeCard}>
          <Info size={14} color={colors.textMuted} />
          <Text style={styles.feeText}>Platform fee: <Text style={{ color: colors.text, fontWeight: '600' }}>10%</Text> of staking rewards. Displayed APY is after platform fee.</Text>
        </Card>

        <Text style={styles.sectionTitle}>Staking Products</Text>
        {STAKING_PRODUCTS.map((product) => {
          const calc = calculateRewards(1000, product.apy, product.lockPeriodDays || 365);
          return (
            <TouchableOpacity
              key={product.id}
              style={[styles.productCard, { borderLeftColor: product.color, borderLeftWidth: 3 }]}
              onPress={() => { setSelectedProduct(product); setShowStakeModal(true); }}
              activeOpacity={0.7}
            >
              <View style={styles.productTop}>
                <View style={[styles.productIcon, { backgroundColor: product.color + '20' }]}>
                  <Percent size={18} color={product.color} />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productMeta}>
                    {product.lockPeriodDays > 0 ? `${product.lockPeriodDays} days lock` : 'Flexible unstaking'}
                  </Text>
                </View>
                <Text style={[styles.productApy, { color: product.color }]}>{product.apy.toFixed(1)}%</Text>
              </View>
              <View style={styles.productDetails}>
                <View style={styles.productDetail}>
                  <Text style={styles.productDetailLabel}>Min</Text>
                  <Text style={styles.productDetailValue}>{product.minAmount} ASH</Text>
                </View>
                <View style={styles.productDetail}>
                  <Text style={styles.productDetailLabel}>Max</Text>
                  <Text style={styles.productDetailValue}>{product.maxAmount} ASH</Text>
                </View>
                <View style={styles.productDetail}>
                  <Text style={styles.productDetailLabel}>Penalty</Text>
                  <Text style={styles.productDetailValue}>{(product.penalty * 100).toFixed(0)}%</Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          );
        })}

        {activePositions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Active Positions</Text>
            {activePositions.map((pos) => {
              const daily = pos.amount * (pos.apy / 100) / 365;
              const elapsed = Math.max(0, Math.floor((Date.now() - pos.startDate) / 86400000));
              const totalDays = pos.lockPeriod || 365;
              const progress = Math.min(1, elapsed / totalDays);
              const claimable = pos.rewards - pos.claimedRewards;

              return (
                <Card key={pos.id} style={styles.positionCard}>
                  <View style={styles.positionHeader}>
                    <View>
                      <Text style={styles.positionProduct}>
                        {STAKING_PRODUCTS.find((p) => p.id === pos.productId)?.name || 'Staking'}
                      </Text>
                      <Text style={styles.positionAmount}>{formatBalance(pos.amount)} ASH</Text>
                    </View>
                    <View style={styles.positionRight}>
                      <Text style={styles.positionApy}>{pos.apy.toFixed(1)}% APY</Text>
                      <Text style={styles.positionStatus}>
                        {pos.status === 'locked' ? `Locked ${pos.lockPeriod}d` : 'Active'}
                      </Text>
                    </View>
                  </View>
                  {pos.lockPeriod > 0 && (
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${(progress * 100).toFixed(0)}%` as any }]} />
                    </View>
                  )}
                  <View style={styles.positionStats}>
                    <View style={styles.positionStat}>
                      <Text style={styles.statLabel}>Daily Reward</Text>
                      <Text style={styles.statValue}>+{formatBalance(daily)}</Text>
                    </View>
                    <View style={styles.positionStat}>
                      <Text style={styles.statLabel}>Earned</Text>
                      <Text style={styles.statValue}>+{formatBalance(pos.rewards)}</Text>
                    </View>
                    <View style={styles.positionStat}>
                      <Text style={styles.statLabel}>Duration</Text>
                      <Text style={styles.statValue}>{elapsed}/{totalDays}d</Text>
                    </View>
                  </View>
                  {claimable > 0 && (
                    <Button
                      title={`Claim ${formatBalance(claimable)} ASH`}
                      onPress={() => setShowClaimModal({ id: pos.id, amount: claimable })}
                      variant="secondary"
                      size="sm"
                      style={styles.claimBtn}
                    />
                  )}
                </Card>
              );
            })}
          </>
        )}

        {completedPositions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Completed</Text>
            {completedPositions.map((pos) => (
              <Card key={pos.id} style={styles.completedCard}>
                <View style={styles.completedRow}>
                  <Text style={styles.completedAmount}>{formatBalance(pos.amount)} ASH</Text>
                  <Text style={styles.completedRewards}>+{formatBalance(pos.rewards)} rewards</Text>
                </View>
              </Card>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmationModal
        visible={showStakeModal && !!selectedProduct}
        title={`Stake in ${selectedProduct?.name || ''}`}
        message={`Enter amount to stake. ${selectedProduct?.lockPeriodDays || 0 > 0 ? `Funds will be locked for ${selectedProduct?.lockPeriodDays} days.` : 'Funds can be unstaked anytime.'}`}
        confirmLabel="Stake Now"
        loading={staking}
        onConfirm={handleStake}
        onCancel={() => { setShowStakeModal(false); setSelectedProduct(null); setStakeAmount(''); }}
        details={
          selectedProduct && parseFloat(stakeAmount) > 0
            ? (() => {
                const calc = calculateRewards(parseFloat(stakeAmount) || 0, selectedProduct.apy, selectedProduct.lockPeriodDays || 365);
                return [
                  { label: 'Amount', value: `${stakeAmount} ASH` },
                  { label: 'APY', value: `${selectedProduct.apy.toFixed(1)}%` },
                  { label: 'Est. Daily Reward', value: `${formatBalance(calc.gross / (selectedProduct.lockPeriodDays || 365))} ASH` },
                  { label: 'Est. Total Reward', value: `${formatBalance(calc.net)} ASH (after fee)` },
                ];
              })()
            : undefined
        }
      >
        <View style={styles.modalInputContainer}>
          <Text style={styles.inputLabel}>Stake Amount (ASH)</Text>
          <TextInput
            style={styles.input}
            value={stakeAmount}
            onChangeText={setStakeAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.inputHint}>Min: {selectedProduct?.minAmount || 0} ASH · Max: {formatBalance(balance)} ASH</Text>
        </View>
      </ConfirmationModal>

      <ConfirmationModal
        visible={!!showClaimModal}
        title="Claim Rewards"
        message={`Claim ${formatBalance(showClaimModal?.amount || 0)} ASH in rewards? A 10% platform fee applies.`}
        confirmLabel="Claim"
        variant="primary"
        onConfirm={() => showClaimModal && handleClaim(showClaimModal.id)}
        onCancel={() => setShowClaimModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.text },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, alignItems: 'center', gap: spacing.xs },
  summaryLabel: { ...typography.micro, color: colors.textMuted },
  summaryValue: { ...typography.captionBold, color: colors.text },
  feeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginBottom: spacing.lg, backgroundColor: colors.surface },
  feeText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.md, marginTop: spacing.md },
  productCard: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 3, padding: spacing.md, marginBottom: spacing.sm },
  productTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  productIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1 },
  productName: { ...typography.bodyBold, color: colors.text },
  productMeta: { ...typography.micro, color: colors.textMuted, marginTop: 1 },
  productApy: { fontSize: 20, fontWeight: '800' },
  productDetails: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  productDetail: { flex: 1, alignItems: 'center' },
  productDetailLabel: { ...typography.micro, color: colors.textMuted },
  productDetailValue: { ...typography.captionBold, color: colors.text },
  positionCard: { marginBottom: spacing.sm },
  positionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  positionProduct: { ...typography.caption, color: colors.textMuted },
  positionAmount: { ...typography.h3, color: colors.text },
  positionRight: { alignItems: 'flex-end' },
  positionApy: { ...typography.captionBold, color: colors.chartGreen },
  positionStatus: { ...typography.micro, color: colors.textMuted, textTransform: 'capitalize' as any },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceLight, marginBottom: spacing.sm, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
  positionStats: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  positionStat: { flex: 1, alignItems: 'center' },
  statLabel: { ...typography.micro, color: colors.textMuted },
  statValue: { ...typography.captionBold, color: colors.text },
  claimBtn: { marginTop: spacing.xs },
  completedCard: { marginBottom: spacing.sm },
  completedRow: { flexDirection: 'row', justifyContent: 'space-between' },
  completedAmount: { ...typography.bodyBold, color: colors.text },
  completedRewards: { ...typography.captionBold, color: colors.chartGreen },
  modalInputContainer: { marginBottom: spacing.md },
  inputLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, color: colors.text, fontSize: 18, fontWeight: '700' },
  inputHint: { ...typography.micro, color: colors.textMuted, marginTop: spacing.xs },
});
