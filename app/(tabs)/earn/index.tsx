import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp, Lock, Unlock, Wallet, Gift, Clock, Percent, ChevronRight,
  Info, Zap, Flame, CheckCircle, Target, ListChecks, Star,
} from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../src/constants';
import { Card, Button, ConfirmationModal, GlassCard, StatCard } from '../../../src/components/ui';
import { useStakingStore, STAKING_PRODUCTS } from '../../../src/store/useStakingStore';
import { useUserStore } from '../../../src/store/useUserStore';
import { formatBalance, formatDuration, formatPercent, formatCompact } from '../../../src/utils';
import { notifyStakeConfirmed } from '../../../src/lib/notifications';
import { StakingProduct } from '../../../src/types';

function TabBar({
  tabs,
  active,
  onSelect,
}: {
  tabs: { key: string; label: string; icon: React.ReactNode }[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View style={tabStyles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.7}
            style={tabStyles.tab}
          >
            {isActive && (
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tabStyles.activeBg}
              />
            )}
            <View style={[tabStyles.iconWrap, isActive && { opacity: 1 }]}>
              {tab.icon}
            </View>
            <Text style={[tabStyles.label, isActive && tabStyles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  activeBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.md,
  },
  iconWrap: { opacity: 0.5, zIndex: 1 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    zIndex: 1,
  },
  labelActive: { color: colors.text, fontWeight: '700' },
});

function TaskCard({
  title,
  reward,
  progress,
  total,
  icon,
  completed,
  onClaim,
}: {
  title: string;
  reward: number;
  progress: number;
  total: number;
  icon: React.ReactNode;
  completed: boolean;
  onClaim?: () => void;
}) {
  const pct = Math.min(1, progress / total);
  return (
    <Card style={taskStyles.card}>
      <View style={taskStyles.top}>
        <View style={taskStyles.iconWrap}>{icon}</View>
        <View style={taskStyles.info}>
          <Text style={taskStyles.title}>{title}</Text>
          <Text style={taskStyles.reward}>+{formatCompact(reward)} ASH</Text>
        </View>
        {completed ? (
          <View style={taskStyles.completedBadge}>
            <CheckCircle size={16} color={colors.chartGreen} />
          </View>
        ) : (
          <TouchableOpacity
            style={[taskStyles.claimBtn, progress >= total && taskStyles.claimBtnReady]}
            onPress={onClaim}
            disabled={progress < total}
            activeOpacity={0.7}
          >
            <Text
              style={[
                taskStyles.claimText,
                progress >= total && { color: colors.text },
              ]}
            >
              {progress >= total ? 'Claim' : `${progress}/${total}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={taskStyles.progressBar}>
        <View style={[taskStyles.progressFill, { width: `${pct * 100}%` as any }]} />
      </View>
    </Card>
  );
}

const taskStyles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  iconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { ...typography.bodyBold, color: colors.text },
  reward: { ...typography.captionBold, color: colors.chartGreen, marginTop: 2 },
  completedBadge: { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.chartGreen + '20', alignItems: 'center', justifyContent: 'center' },
  claimBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.cardBorder },
  claimBtnReady: { backgroundColor: colors.primary, borderColor: colors.primary },
  claimText: { ...typography.captionBold, color: colors.textMuted },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceLight, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
});

function StreakCounter({ streak }: { streak: number }) {
  return (
    <GlassCard gradient style={streakStyles.card}>
      <View style={streakStyles.row}>
        <View style={streakStyles.iconWrap}>
          <Flame size={22} color={colors.accent} />
        </View>
        <View style={streakStyles.content}>
          <Text style={streakStyles.label}>Daily Streak</Text>
          <Text style={streakStyles.value}>{streak} days</Text>
        </View>
        <View style={streakStyles.badge}>
          <Star size={12} color={colors.accent} />
          <Text style={streakStyles.badgeText}>Active</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const streakStyles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.accent + '15', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  label: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { ...typography.h3, color: colors.text, marginTop: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.accent + '20' },
  badgeText: { ...typography.micro, color: colors.accent, fontWeight: '700' },
});

function CountdownTimer({ endDate }: { endDate: number }) {
  const remaining = Math.max(0, endDate - Date.now());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);

  if (days > 0) return <Text style={countStyles.text}>{days}d {hours}h left</Text>;
  if (hours > 0) return <Text style={countStyles.text}>{hours}h {mins}m left</Text>;
  return <Text style={[countStyles.text, { color: colors.chartGreen }]}>Unlocked!</Text>;
}

const countStyles = StyleSheet.create({
  text: { ...typography.captionBold, color: colors.accent },
});

export default function EarnScreen() {
  const insets = useSafeAreaInsets();
  const { balance } = useUserStore();
  const {
    positions,
    totalStaked,
    totalRewards,
    claimedRewards,
    addPosition,
    claimRewards,
    calculateRewards,
    getEffectiveApy,
  } = useStakingStore();

  const [activeTab, setActiveTab] = useState('staking');
  const [selectedProduct, setSelectedProduct] = useState<StakingProduct | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState<{ id: string; amount: number } | null>(null);
  const [staking, setStaking] = useState(false);

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
    const endDate =
      selectedProduct.lockPeriodDays > 0
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

  const handleClaim = useCallback(
    (positionId: string) => {
      const netReward = claimRewards(positionId);
      if (netReward > 0) {
        Alert.alert(
          'Rewards Claimed!',
          `+${formatBalance(netReward)} ASH (after platform fee)`,
        );
      }
      setShowClaimModal(null);
    },
    [claimRewards],
  );

  const activePositions = positions.filter(
    (p) => p.status === 'active' || p.status === 'locked',
  );
  const completedPositions = positions.filter((p) => p.status === 'completed');

  const tasks = useMemo(
    () => [
      { key: 'daily_login', title: 'Daily Login', reward: 0.5, progress: 1, total: 1, icon: <Target size={18} color={colors.primary} /> },
      { key: 'mine_hours', title: 'Mine 4 Hours', reward: 1.2, progress: 2, total: 4, icon: <Zap size={18} color={colors.chartGreen} /> },
      { key: 'check_staking', title: 'Check Staking', reward: 0.3, progress: 1, total: 1, icon: <ListChecks size={18} color={colors.info} /> },
      { key: 'complete_quiz', title: 'Complete Quiz', reward: 2.0, progress: 0, total: 1, icon: <Star size={18} color={colors.accent} /> },
    ],
    [],
  );

  const streak = 7;
  const completedTasks = tasks.filter((t) => t.progress >= t.total).length;

  const TABS = [
    { key: 'staking', label: 'Staking', icon: <TrendingUp size={16} color={colors.chartGreen} /> },
    { key: 'tasks', label: 'Tasks', icon: <ListChecks size={16} color={colors.accent} /> },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.headerRow}>
          <View style={styles.headerIconWrap}>
            <TrendingUp size={22} color={colors.text} />
          </View>
          <Text style={styles.title}>Earn</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(50).springify()}>
          <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />
        </Animated.View>

        {activeTab === 'staking' && (
          <>
            <Animated.View entering={FadeInDown.duration(400).delay(100).springify()}>
              <GlassCard gradient style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Wallet size={16} color={colors.primary} />
                  <Text style={styles.summaryLabel}>Available</Text>
                  <Text style={styles.summaryValue}>{formatCompact(balance)} ASH</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Lock size={16} color={colors.accent} />
                  <Text style={styles.summaryLabel}>Staked</Text>
                  <Text style={styles.summaryValue}>{formatCompact(totalStaked)} ASH</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Gift size={16} color={colors.chartGreen} />
                  <Text style={styles.summaryLabel}>Rewards</Text>
                  <Text style={[styles.summaryValue, { color: colors.chartGreen }]}>
                    +{formatCompact(claimedRewards)}
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(150).springify()}>
              <Card style={styles.feeCard}>
                <Info size={14} color={colors.textMuted} />
                <Text style={styles.feeText}>
                  Platform fee:{' '}
                  <Text style={{ color: colors.text, fontWeight: '600' }}>10%</Text> of rewards.
                  Displayed APY is after fee.
                </Text>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(200).springify()}>
              <Text style={styles.sectionTitle}>Staking Products</Text>
            </Animated.View>

            {STAKING_PRODUCTS.map((product, i) => {
              const calc = calculateRewards(1000, product.apy, product.lockPeriodDays || 365);
              return (
                <Animated.View
                  key={product.id}
                  entering={FadeInDown.duration(400).delay(250 + i * 80).springify()}
                >
                  <TouchableOpacity
                    style={[styles.productCard, { borderLeftColor: product.color, borderLeftWidth: 3 }]}
                    onPress={() => {
                      setSelectedProduct(product);
                      setShowStakeModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.productTop}>
                      <View style={[styles.productIcon, { backgroundColor: product.color + '20' }]}>
                        <Percent size={18} color={product.color} />
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productMeta}>
                          {product.lockPeriodDays > 0
                            ? `${product.lockPeriodDays} days lock`
                            : 'Flexible unstaking'}
                        </Text>
                      </View>
                      <LinearGradient
                        colors={[product.color, product.color + '80']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.apyBadge}
                      >
                        <Text style={styles.apyText}>
                          {getEffectiveApy(product.apy).toFixed(1)}%
                        </Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.productDetails}>
                      <View style={styles.productDetail}>
                        <Text style={styles.productDetailLabel}>Min</Text>
                        <Text style={styles.productDetailValue}>{product.minAmount} ASH</Text>
                      </View>
                      <View style={styles.productDetail}>
                        <Text style={styles.productDetailLabel}>Max</Text>
                        <Text style={styles.productDetailValue}>
                          {product.maxAmount >= 100000
                            ? 'Unlimited'
                            : `${product.maxAmount} ASH`}
                        </Text>
                      </View>
                      <View style={styles.productDetail}>
                        <Text style={styles.productDetailLabel}>Penalty</Text>
                        <Text style={styles.productDetailValue}>
                          {(product.penalty * 100).toFixed(0)}%
                        </Text>
                      </View>
                      <ChevronRight size={16} color={colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}

            {activePositions.length > 0 && (
              <>
                <Animated.View entering={FadeInDown.duration(400).delay(600).springify()}>
                  <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>
                    Active Positions
                  </Text>
                </Animated.View>
                {activePositions.map((pos, i) => {
                  const daily = pos.amount * (pos.apy / 100) / 365;
                  const elapsed = Math.max(
                    0,
                    Math.floor((Date.now() - pos.startDate) / 86400000),
                  );
                  const totalDays = pos.lockPeriod || 365;
                  const progress = Math.min(1, elapsed / totalDays);
                  const claimable = pos.rewards - pos.claimedRewards;

                  return (
                    <Animated.View
                      key={pos.id}
                      entering={FadeInDown.duration(400).delay(650 + i * 100).springify()}
                    >
                      <Card style={styles.positionCard}>
                        <View style={styles.positionHeader}>
                          <View>
                            <Text style={styles.positionProduct}>
                              {STAKING_PRODUCTS.find((p) => p.id === pos.productId)?.name ||
                                'Staking'}
                            </Text>
                            <Text style={styles.positionAmount}>
                              {formatBalance(pos.amount)} ASH
                            </Text>
                          </View>
                          <View style={styles.positionRight}>
                            <Text style={styles.positionApy}>
                              {pos.apy.toFixed(1)}% APY
                            </Text>
                            <Text
                              style={[
                                styles.positionStatus,
                                {
                                  color:
                                    pos.status === 'locked'
                                      ? colors.accent
                                      : colors.chartGreen,
                                },
                              ]}
                            >
                              {pos.status === 'locked' ? (
                                <CountdownTimer endDate={pos.endDate} />
                              ) : (
                                'Active'
                              )}
                            </Text>
                          </View>
                        </View>

                        {pos.lockPeriod > 0 && (
                          <View style={styles.progressBar}>
                            <LinearGradient
                              colors={[colors.primary, colors.primaryLight]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[
                                styles.progressFill,
                                { width: `${(progress * 100).toFixed(0)}%` as any },
                              ]}
                            />
                          </View>
                        )}

                        <View style={styles.positionStats}>
                          <View style={styles.positionStat}>
                            <Text style={styles.statLabel}>Daily Reward</Text>
                            <Text style={styles.statValue}>
                              +{formatCompact(daily)}
                            </Text>
                          </View>
                          <View style={styles.positionStat}>
                            <Text style={styles.statLabel}>Earned</Text>
                            <Text style={[styles.statValue, { color: colors.chartGreen }]}>
                              +{formatCompact(pos.rewards)}
                            </Text>
                          </View>
                          <View style={styles.positionStat}>
                            <Text style={styles.statLabel}>Duration</Text>
                            <Text style={styles.statValue}>
                              {elapsed}/{totalDays}d
                            </Text>
                          </View>
                        </View>

                        {claimable > 0 && (
                          <Button
                            title={`Claim ${formatCompact(claimable)} ASH`}
                            onPress={() =>
                              setShowClaimModal({ id: pos.id, amount: claimable })
                            }
                            variant="secondary"
                            size="sm"
                            style={styles.claimBtn}
                          />
                        )}
                      </Card>
                    </Animated.View>
                  );
                })}
              </>
            )}

            {completedPositions.length > 0 && (
              <>
                <Animated.View entering={FadeInDown.duration(400).delay(800).springify()}>
                  <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>
                    Completed
                  </Text>
                </Animated.View>
                {completedPositions.map((pos, i) => (
                  <Animated.View
                    key={pos.id}
                    entering={FadeInDown.duration(400).delay(850 + i * 100).springify()}
                  >
                    <Card key={pos.id} style={styles.completedCard}>
                      <View style={styles.completedRow}>
                        <Text style={styles.completedAmount}>
                          {formatBalance(pos.amount)} ASH
                        </Text>
                        <Text style={styles.completedRewards}>
                          +{formatBalance(pos.rewards)} rewards
                        </Text>
                      </View>
                    </Card>
                  </Animated.View>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'tasks' && (
          <Animated.View entering={FadeInDown.duration(400).delay(100).springify()}>
            <StreakCounter streak={streak} />

            <View style={styles.tasksHeader}>
              <Text style={styles.sectionTitle}>Daily Tasks</Text>
              <Text style={styles.taskCount}>
                {completedTasks}/{tasks.length}
              </Text>
            </View>

            {tasks.map((task, i) => (
              <Animated.View
                key={task.key}
                entering={FadeInDown.duration(400).delay(200 + i * 80).springify()}
              >
                <TaskCard
                  title={task.title}
                  reward={task.reward}
                  progress={task.progress}
                  total={task.total}
                  icon={task.icon}
                  completed={task.progress >= task.total}
                />
              </Animated.View>
            ))}

            <GlassCard gradient style={styles.rewardsSummary}>
              <View style={styles.rewardsSumRow}>
                <Text style={styles.rewardsSumLabel}>Total Available Rewards</Text>
                <Text style={styles.rewardsSumValue}>
                  +{formatCompact(
                    tasks
                      .filter((t) => t.progress >= t.total)
                      .reduce((s, t) => s + t.reward, 0),
                  )}{' '}
                  ASH
                </Text>
              </View>
              <Button title="Claim All Rewards" size="lg" style={{ marginTop: spacing.md }} onPress={() => Alert.alert('Coming Soon', 'Batch claim will be available soon!')} />
            </GlassCard>

            <View style={{ height: 40 }} />
          </Animated.View>
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
        onCancel={() => {
          setShowStakeModal(false);
          setSelectedProduct(null);
          setStakeAmount('');
        }}
        details={
          selectedProduct && parseFloat(stakeAmount) > 0
            ? (() => {
                const calc = calculateRewards(
                  parseFloat(stakeAmount) || 0,
                  selectedProduct.apy,
                  selectedProduct.lockPeriodDays || 365,
                );
                return [
                  { label: 'Amount', value: `${stakeAmount} ASH` },
                  { label: 'APY', value: `${getEffectiveApy(selectedProduct.apy).toFixed(1)}%` },
                  {
                    label: 'Est. Daily',
                    value: `${formatCompact(calc.net / (selectedProduct.lockPeriodDays || 365))} ASH`,
                  },
                  {
                    label: 'Est. Total Reward',
                    value: `${formatCompact(calc.net)} ASH (after fee)`,
                  },
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
          <Text style={styles.inputHint}>
            Min: {selectedProduct?.minAmount || 0} ASH · Balance:{' '}
            {formatBalance(balance)} ASH
          </Text>
        </View>
      </ConfirmationModal>

      <ConfirmationModal
        visible={!!showClaimModal}
        title="Claim Rewards"
        message={`Claim ${formatCompact(showClaimModal?.amount || 0)} ASH in rewards? A 10% platform fee applies.`}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  headerIconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.chartGreen + '20', alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h2, color: colors.text },
  summaryRow: { flexDirection: 'row', padding: spacing.lg, marginBottom: spacing.md },
  summaryItem: { flex: 1, alignItems: 'center', gap: spacing.xs },
  summaryLabel: { ...typography.micro, color: colors.textMuted },
  summaryValue: { ...typography.captionBold, color: colors.text },
  summaryDivider: { width: 1, backgroundColor: colors.cardBorder, marginVertical: 4 },
  feeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginBottom: spacing.lg, backgroundColor: colors.surface },
  feeText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.md, marginTop: spacing.sm },
  productCard: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 3, padding: spacing.md, marginBottom: spacing.sm },
  productTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  productIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1 },
  productName: { ...typography.bodyBold, color: colors.text },
  productMeta: { ...typography.micro, color: colors.textMuted, marginTop: 1 },
  apyBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full },
  apyText: { color: colors.text, fontSize: 13, fontWeight: '800' },
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
  positionStatus: { ...typography.micro, marginTop: 2 },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceLight, marginBottom: spacing.sm, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  positionStats: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  positionStat: { flex: 1, alignItems: 'center' },
  statLabel: { ...typography.micro, color: colors.textMuted },
  statValue: { ...typography.captionBold, color: colors.text },
  claimBtn: { marginTop: spacing.xs },
  completedCard: { marginBottom: spacing.sm },
  completedRow: { flexDirection: 'row', justifyContent: 'space-between' },
  completedAmount: { ...typography.bodyBold, color: colors.text },
  completedRewards: { ...typography.captionBold, color: colors.chartGreen },
  tasksHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  taskCount: { ...typography.captionBold, color: colors.textSecondary },
  rewardsSummary: { marginTop: spacing.lg },
  rewardsSumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardsSumLabel: { ...typography.bodyBold, color: colors.text },
  rewardsSumValue: { ...typography.h3, color: colors.chartGreen },
  modalInputContainer: { marginBottom: spacing.md },
  inputLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, color: colors.text, fontSize: 18, fontWeight: '700' },
  inputHint: { ...typography.micro, color: colors.textMuted, marginTop: spacing.xs },
});
