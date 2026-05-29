import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Repeat, Copy, Check,
  QrCode, Wifi, WifiOff, ChevronRight, Search, Filter,
  X, Coins, Clock, ExternalLink, Globe,
} from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../src/constants';
import { Card, Button, ConfirmationModal, GlassCard } from '../../../src/components/ui';
import { NetworkPill } from '../../../src/components/ui/NetworkPill';
import { useUserStore } from '../../../src/store/useUserStore';
import { formatBalance, formatUSD, formatTimeAgo, shortenAddress, formatCompact } from '../../../src/utils';
import { Transaction } from '../../../src/types';

const MOCK_TXS: Transaction[] = [
  { id: 'tx1', type: 'deposit', amount: 100, description: 'Deposit via Midtrans', balanceAfter: 1250, createdAt: Date.now() - 3600000, status: 'completed' },
  { id: 'tx2', type: 'withdraw', amount: -50, description: 'To 0x7421...9f3e', balanceAfter: 1150, createdAt: Date.now() - 7200000, status: 'completed' },
  { id: 'tx3', type: 'transfer_sent', amount: -25, description: 'Sent to 0x7421...9f3e', balanceAfter: 1200, createdAt: Date.now() - 14400000, status: 'completed' },
  { id: 'tx4', type: 'transfer_received', amount: 10, description: 'From 0x3d92...ab71', balanceAfter: 1225, createdAt: Date.now() - 86400000, status: 'completed' },
  { id: 'tx5', type: 'deposit', amount: 200, description: 'Bank Transfer', balanceAfter: 1215, createdAt: Date.now() - 172800000, status: 'completed' },
  { id: 'tx6', type: 'stake', amount: -100, description: 'Staked 30-Day Lock', balanceAfter: 1015, createdAt: Date.now() - 259200000, status: 'completed' },
  { id: 'tx7', type: 'node_reward', amount: 0.5, description: 'Node Daily Reward', balanceAfter: 1015.5, createdAt: Date.now() - 43200000, status: 'completed' },
  { id: 'tx8', type: 'stake_reward', amount: 0.15, description: 'Staking Reward', balanceAfter: 1015.65, createdAt: Date.now() - 21600000, status: 'completed' },
];

const TX_FILTERS = ['All', 'Send', 'Receive', 'Stake', 'Reward'] as const;
type TxFilter = (typeof TX_FILTERS)[number];

const FILTER_TYPE_MAP: Record<TxFilter, string[]> = {
  All: [],
  Send: ['withdraw', 'transfer_sent', 'stake'],
  Receive: ['deposit', 'transfer_received'],
  Stake: ['stake', 'unstake'],
  Reward: ['mining_reward', 'node_reward', 'stake_reward', 'daily_bonus'],
};

function TxIcon({ type }: { type: string }) {
  const cfg: Record<string, { bg: string; icon: React.ReactNode }> = {
    deposit: { bg: colors.chartGreen + '20', icon: <ArrowDownLeft size={14} color={colors.chartGreen} /> },
    withdraw: { bg: colors.danger + '20', icon: <ArrowUpRight size={14} color={colors.danger} /> },
    transfer_sent: { bg: colors.warning + '20', icon: <ArrowUpRight size={14} color={colors.warning} /> },
    transfer_received: { bg: colors.chartGreen + '20', icon: <ArrowDownLeft size={14} color={colors.chartGreen} /> },
    stake: { bg: colors.primary + '20', icon: <Clock size={14} color={colors.primary} /> },
    unstake: { bg: colors.info + '20', icon: <Clock size={14} color={colors.info} /> },
    node_reward: { bg: colors.secondary + '20', icon: <Coins size={14} color={colors.secondary} /> },
    stake_reward: { bg: colors.accent + '20', icon: <Coins size={14} color={colors.accent} /> },
    daily_bonus: { bg: colors.accent + '20', icon: <Coins size={14} color={colors.accent} /> },
    mining_reward: { bg: colors.success + '20', icon: <Coins size={14} color={colors.success} /> },
  };
  const c = cfg[type] || { bg: colors.surfaceLight, icon: <Clock size={14} color={colors.textMuted} /> };
  return <View style={[txIconStyles.wrap, { backgroundColor: c.bg }]}>{c.icon}</View>;
}

const txIconStyles = StyleSheet.create({
  wrap: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[chipStyles.chip, active && chipStyles.active]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[chipStyles.label, active && chipStyles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, marginRight: spacing.sm },
  active: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  label: { ...typography.micro, color: colors.textSecondary, fontWeight: '600' },
  activeLabel: { color: colors.primary },
});

function ActionButton({ icon, label, onPress, gradient }: { icon: React.ReactNode; label: string; onPress: () => void; gradient: [string, string] }) {
  return (
    <TouchableOpacity style={actionStyles.btn} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={gradient} style={actionStyles.icon}>{icon}</LinearGradient>
      <Text style={actionStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const actionStyles = StyleSheet.create({
  btn: { flex: 1, alignItems: 'center', gap: spacing.sm },
  icon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.captionBold, color: colors.text },
});

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { fundingBalance, tradingBalance } = useUserStore();
  const balance = useUserStore((s) => s.balance);

  const [copied, setCopied] = useState<string | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [txFilter, setTxFilter] = useState<TxFilter>('All');
  const [txSearch, setTxSearch] = useState('');

  const userAddress = '0x7421a8b4c5d6e7f890123456789abcdef9876543';

  const handleCopy = useCallback(async (text: string, id: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleWithdraw = useCallback(() => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || amount > balance) {
      Alert.alert('Invalid', 'Check amount and balance');
      return;
    }
    if (!withdrawAddress || withdrawAddress.length < 10) {
      Alert.alert('Invalid', 'Enter a valid address');
      return;
    }
    Alert.alert('Withdrawal Sent', `${formatBalance(amount)} ASH → ${shortenAddress(withdrawAddress)}`);
    setShowWithdraw(false);
    setWithdrawAmount('');
    setWithdrawAddress('');
  }, [withdrawAmount, withdrawAddress, balance]);

  const filteredTxs = useMemo(() => {
    const types = FILTER_TYPE_MAP[txFilter];
    let txs = types.length > 0 ? MOCK_TXS.filter((t) => types.includes(t.type)) : MOCK_TXS;
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      txs = txs.filter((t) => t.description.toLowerCase().includes(q));
    }
    return txs;
  }, [txFilter, txSearch]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.headerIcon}>
            <Wallet size={18} color={colors.text} />
          </LinearGradient>
          <Text style={styles.title}>Wallet</Text>
        </View>
        <NetworkPill networkId="bnb" />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Balance Card — MetaMask style */}
        <Animated.View entering={FadeInDown.duration(500).delay(50).springify()}>
          <GlassCard gradient style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceValue}>{formatUSD(balance * 0.42)}</Text>
            <Text style={styles.balanceCrypto}>{formatBalance(balance)} ASH</Text>

            {/* Address bar */}
            <TouchableOpacity
              style={styles.addressBar}
              onPress={() => handleCopy(userAddress, 'address')}
              activeOpacity={0.7}
            >
              <Globe size={14} color={colors.textMuted} />
              <Text style={styles.addressText}>{shortenAddress(userAddress, 8)}</Text>
              {copied === 'address' ? (
                <Check size={14} color={colors.chartGreen} />
              ) : (
                <Copy size={14} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        {/* Action Buttons — Send / Receive / Swap / Buy */}
        <Animated.View entering={FadeInDown.duration(500).delay(100).springify()}>
          <View style={styles.actionsRow}>
            <ActionButton icon={<ArrowUpRight size={22} color={colors.text} />} label="Send" onPress={() => setShowWithdraw(true)} gradient={['#7C6CF0', '#A29BFE']} />
            <ActionButton icon={<ArrowDownLeft size={22} color={colors.text} />} label="Receive" onPress={() => setShowReceive(true)} gradient={['#00D68F', '#55E6C1']} />
            <ActionButton icon={<Repeat size={22} color={colors.text} />} label="Swap" onPress={() => Alert.alert('Coming Soon', 'Swap will be available in Phase 4')} gradient={['#F0B90B', '#F8D12F']} />
            <ActionButton icon={<QrCode size={22} color={colors.text} />} label="Buy" onPress={() => setShowDeposit(true)} gradient={['#FF6B6B', '#FF8E8E']} />
          </View>
        </Animated.View>

        {/* Token Balances */}
        <Animated.View entering={FadeInDown.duration(500).delay(150).springify()}>
          <GlassCard gradient style={styles.tokenCard}>
            <Text style={styles.tokenCardTitle}>Assets</Text>
            <View style={styles.tokenList}>
              <TouchableOpacity style={styles.tokenRow} activeOpacity={0.7}>
                <LinearGradient colors={[colors.tokenAsh + '30', colors.tokenAsh + '10']} style={styles.tokenIcon}>
                  <Text style={[styles.tokenIconText, { color: colors.tokenAsh }]}>A</Text>
                </LinearGradient>
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenName}>ASH Coin</Text>
                  <Text style={styles.tokenNetwork}>BNB Chain</Text>
                </View>
                <View style={styles.tokenValues}>
                  <Text style={styles.tokenBalance}>{formatBalance(balance)}</Text>
                  <Text style={styles.tokenUsd}>{formatUSD(balance * 0.42)}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.tokenDivider} />
              <TouchableOpacity style={styles.tokenRow} activeOpacity={0.7}>
                <LinearGradient colors={[colors.tokenBnb + '30', colors.tokenBnb + '10']} style={styles.tokenIcon}>
                  <Text style={[styles.tokenIconText, { color: colors.tokenBnb }]}>B</Text>
                </LinearGradient>
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenName}>BNB</Text>
                  <Text style={styles.tokenNetwork}>BNB Chain</Text>
                </View>
                <View style={styles.tokenValues}>
                  <Text style={styles.tokenBalance}>1.2</Text>
                  <Text style={styles.tokenUsd}>{formatUSD(1.2 * 580)}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Transaction History — MetaMask style */}
        <Animated.View entering={FadeInDown.duration(500).delay(200).springify()}>
          <View style={styles.txHeader}>
            <Text style={styles.txHeaderTitle}>Activity</Text>
            <View style={styles.txHeaderRow}>
              <View style={styles.searchRow}>
                <Search size={12} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={txSearch}
                  onChangeText={setTxSearch}
                  placeholder="Search"
                  placeholderTextColor={colors.textMuted}
                />
                {txSearch ? (
                  <TouchableOpacity onPress={() => setTxSearch('')}>
                    <X size={12} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {TX_FILTERS.map((f) => (
              <FilterChip key={f} label={f} active={txFilter === f} onPress={() => setTxFilter(f)} />
            ))}
          </ScrollView>
        </Animated.View>

        {filteredTxs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No activity yet</Text>
          </Card>
        ) : (
          filteredTxs.map((tx, i) => (
            <Animated.View key={tx.id} entering={FadeInUp.duration(300).delay(i * 40).springify()} style={styles.txRow}>
              <TxIcon type={tx.type} />
              <View style={styles.txInfo}>
                <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                <Text style={styles.txTime}>{formatTimeAgo(tx.createdAt)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.amount >= 0 ? colors.chartGreen : colors.chartRed }]}>
                {tx.amount >= 0 ? '+' : ''}{formatBalance(tx.amount)}
              </Text>
            </Animated.View>
          ))
        )}

        {/* Connect Wallet Card */}
        <Animated.View entering={FadeInDown.duration(500).delay(300).springify()}>
          <TouchableOpacity style={styles.connectCard} activeOpacity={0.7}>
            <Wifi size={18} color={colors.primary} />
            <Text style={styles.connectText}>Connect Wallet</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <ConfirmationModal visible={showDeposit} title="Buy ASH" message="Choose your payment method." confirmLabel="Continue" onConfirm={() => { Alert.alert('Buy', `Buy ${depositAmount} ASH`); setShowDeposit(false); setDepositAmount(''); }} onCancel={() => { setShowDeposit(false); setDepositAmount(''); }}>
        <View style={styles.modalInput}>
          <Text style={styles.inputLabel}>Amount (ASH)</Text>
          <TextInput style={styles.input} value={depositAmount} onChangeText={setDepositAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.textMuted} />
          <Text style={styles.inputHint}>Min 10 ASH via Midtrans / Bank Transfer</Text>
        </View>
      </ConfirmationModal>

      <ConfirmationModal visible={showWithdraw} title="Send ASH" message="Enter amount and recipient address." confirmLabel="Send" variant="danger" onConfirm={handleWithdraw} onCancel={() => { setShowWithdraw(false); setWithdrawAmount(''); setWithdrawAddress(''); }}>
        <View style={styles.modalInput}>
          <Text style={styles.inputLabel}>Amount (ASH)</Text>
          <TextInput style={styles.input} value={withdrawAmount} onChangeText={setWithdrawAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.textMuted} />
          <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Recipient Address</Text>
          <TextInput style={styles.input} value={withdrawAddress} onChangeText={setWithdrawAddress} placeholder="0x..." placeholderTextColor={colors.textMuted} autoCapitalize="none" />
          <Text style={styles.inputHint}>Balance: {formatBalance(balance)} ASH · Est. gas: 0.001 ASH</Text>
        </View>
      </ConfirmationModal>

      <ConfirmationModal visible={showReceive} title="Receive" message="Share your wallet address to receive tokens." confirmLabel="Share" onConfirm={() => { Share.share({ message: `My ASH Finance wallet:\n${userAddress}` }); setShowReceive(false); }} onCancel={() => setShowReceive(false)}>
        <TouchableOpacity style={styles.addressCard} onPress={() => handleCopy(userAddress, 'receive')} activeOpacity={0.7}>
          <Text style={styles.addressLabel}>Your Wallet Address</Text>
          <Text style={styles.addressValue}>{userAddress}</Text>
          <View style={styles.addressCopyRow}>
            {copied === 'receive' ? <><Check size={14} color={colors.chartGreen} /><Text style={[styles.addressCopyText, { color: colors.chartGreen }]}>Copied</Text></>
              : <><Copy size={14} color={colors.primary} /><Text style={[styles.addressCopyText, { color: colors.primary }]}>Copy</Text></>}
          </View>
        </TouchableOpacity>
        <View style={styles.qrPlaceholder}>
          <QrCode size={40} color={colors.primary} />
          <Text style={styles.qrHint}>Scan to receive</Text>
        </View>
      </ConfirmationModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h2, color: colors.text },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  balanceCard: { padding: spacing.xl, marginBottom: spacing.md },
  balanceLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  balanceValue: { ...typography.hero2, color: colors.text },
  balanceCrypto: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  addressBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.lg, backgroundColor: colors.surface,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.full, alignSelf: 'center',
  },
  addressText: { ...typography.mono, color: colors.textSecondary, fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  tokenCard: { marginBottom: spacing.lg },
  tokenCardTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.md },
  tokenList: {},
  tokenRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  tokenIcon: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  tokenIconText: { fontSize: 18, fontWeight: '800' },
  tokenInfo: { flex: 1 },
  tokenName: { ...typography.bodyBold, color: colors.text },
  tokenNetwork: { ...typography.micro, color: colors.textMuted, marginTop: 1 },
  tokenValues: { alignItems: 'flex-end' },
  tokenBalance: { ...typography.bodyBold, color: colors.text },
  tokenUsd: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  tokenDivider: { height: 1, backgroundColor: colors.cardBorder + '60' },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  txHeaderTitle: { ...typography.bodyBold, color: colors.text },
  txHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, gap: spacing.xs,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  searchInput: { paddingVertical: spacing.xs, color: colors.text, fontSize: 11, width: 80, fontWeight: '500' },
  filterRow: { marginBottom: spacing.md, marginHorizontal: -spacing.lg, paddingLeft: spacing.lg },
  emptyCard: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  txInfo: { flex: 1 },
  txDesc: { ...typography.caption, color: colors.text },
  txTime: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  txAmount: { ...typography.captionBold },
  connectCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.lg, marginTop: spacing.lg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primary + '30', borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  connectText: { ...typography.bodyBold, color: colors.primary },
  modalInput: { marginBottom: spacing.md },
  inputLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, color: colors.text, fontSize: 18, fontWeight: '700' },
  inputHint: { ...typography.micro, color: colors.textMuted, marginTop: spacing.xs },
  addressCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md },
  addressLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  addressValue: { ...typography.mono, color: colors.primary, textAlign: 'center', marginBottom: spacing.md },
  addressCopyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  addressCopyText: { ...typography.captionBold },
  qrPlaceholder: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, borderStyle: 'dashed', gap: spacing.sm },
  qrHint: { ...typography.caption, color: colors.textMuted },
});
