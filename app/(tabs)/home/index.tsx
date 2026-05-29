import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, ArrowDownLeft, Repeat, QrCode, Coins, ChevronRight, TrendingUp, Zap } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../src/constants';
import { PriceChart } from '../../../src/components/common/PriceChart';
import { SyndicateCard } from '../../../src/components/common/SyndicateCard';
import { ActivityList } from '../../../src/components/common/ActivityList';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { NetworkPill } from '../../../src/components/ui/NetworkPill';
import { useUserStore } from '../../../src/store/useUserStore';
import { useNodeStore } from '../../../src/store/useNodeStore';
import { useAppStore } from '../../../src/store/useAppStore';
import { db } from '../../../src/lib/firebase';
import { PricePoint, SyndicateNode, Transaction } from '../../../src/types';
import { formatBalance, formatUSD, formatCompact } from '../../../src/utils';

const MOCK_PRICES: PricePoint[] = Array.from({ length: 100 }, (_, i) => ({
  timestamp: Date.now() - (99 - i) * 3600000,
  price: 0.42 + Math.sin(i / 10) * 0.05 + Math.random() * 0.02,
}));

function BalanceSkeleton() {
  return (
    <View style={styles.balanceSkeleton}>
      <Skeleton width={120} height={14} />
      <Skeleton width={220} height={42} style={{ marginTop: 6 }} />
      <Skeleton width={140} height={16} style={{ marginTop: 4 }} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.xxl }}>
        <Skeleton height={48} borderRadius={24} style={{ flex: 1 }} />
        <Skeleton height={48} borderRadius={24} style={{ flex: 1 }} />
        <Skeleton height={48} borderRadius={24} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function TokenRow({
  symbol,
  name,
  balance,
  usdValue,
  change24h,
  color,
  delay,
}: {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  change24h: number;
  color: string;
  delay: number;
}) {
  const isUp = change24h >= 0;
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay).springify()}>
      <TouchableOpacity style={styles.tokenRow} activeOpacity={0.7}>
        <LinearGradient
          colors={[color + '30', color + '10']}
          style={styles.tokenIcon}
        >
          <Text style={[styles.tokenIconText, { color }]}>{symbol[0]}</Text>
        </LinearGradient>
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenSymbol}>{symbol}</Text>
          <Text style={styles.tokenName}>{name}</Text>
        </View>
        <View style={styles.tokenValues}>
          <Text style={styles.tokenBalance}>{formatBalance(balance)}</Text>
          <Text style={styles.tokenUSD}>{formatUSD(usdValue)}</Text>
        </View>
        <View style={styles.tokenChange}>
          <Text style={[styles.tokenChangeText, { color: isUp ? colors.chartGreen : colors.chartRed }]}>
            {isUp ? '+' : ''}{change24h.toFixed(2)}%
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function QuickActionPill({
  icon,
  label,
  onPress,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity style={styles.quickPill} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickPillIcon, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={styles.quickPillLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function BalanceChangePill({ change }: { change: number }) {
  const isUp = change >= 0;
  return (
    <View style={[styles.changePill, { backgroundColor: isUp ? colors.chartGreen + '15' : colors.chartRed + '15' }]}>
      <View style={[styles.changeDot, { backgroundColor: isUp ? colors.chartGreen : colors.chartRed }]} />
      <Text style={[styles.changePillText, { color: isUp ? colors.chartGreen : colors.chartRed }]}>
        {isUp ? '+' : ''}{change.toFixed(2)}% (24h)
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('24H');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const { balance, ashBalance, fundingBalance, tradingBalance, photoURL, displayName } = useUserStore();
  const { status, hashrate, dailyReward, uptime, totalEarned, tier, hourlyRate } = useNodeStore();
  const { ashPrice } = useAppStore();
  const { uid } = useUserStore.getState();

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (!snap.exists()) return;
      setTransactions((snap.data().transactions || []).slice(-10));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setRefreshing(false);
  }, []);

  const node: SyndicateNode = {
    hashrate, dailyReward, totalEarned, uptime,
    temperature: 42, status: status as SyndicateNode['status'],
    tier, hourlyRate, startTime: status === 'active' ? Date.now() - 3600000 : null,
  };

  const totalUSD = balance * ashPrice;
  const change24h = 5.23;

  const tokens = useMemo(() => [
    { symbol: 'ASH', name: 'ASH Coin', balance: balance, usdValue: totalUSD, change24h: 5.23, color: colors.tokenAsh },
    { symbol: 'BNB', name: 'BNB Smart Chain', balance: 1.2, usdValue: 1.2 * 580, change24h: -2.1, color: colors.tokenBnb },
  ], [balance, totalUSD]);

  const totalPortfolio = tokens.reduce((s, t) => s + t.usdValue, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <>
            <BalanceSkeleton />
            <View style={styles.content}>
              <Skeleton height={180} borderRadius={14} />
              <Skeleton height={120} borderRadius={14} style={{ marginTop: spacing.md }} />
              <Skeleton height={60} borderRadius={14} style={{ marginTop: spacing.md }} />
            </View>
          </>
        ) : (
          <>
            {/* Header — Trust Wallet style */}
            <LinearGradient
              colors={['#16163A', '#0A0A1A']}
              locations={[0, 1]}
              style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
            >
              <View style={styles.headerTop}>
                <NetworkPill networkId="bnb" />
                <View style={styles.headerActions}>
                  <TouchableOpacity style={styles.headerBtn}>
                    <QrCode size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>Total Portfolio</Text>
                <Text style={styles.balanceValue}>{formatUSD(totalPortfolio)}</Text>
                <View style={styles.balanceMeta}>
                  <BalanceChangePill change={change24h} />
                  <Text style={styles.balanceTokens}>
                    {formatCompact(balance)} ASH · {tokens[1].balance.toFixed(2)} BNB
                  </Text>
                </View>
              </Animated.View>

              {/* Quick actions — Trust Wallet style */}
              <Animated.View entering={FadeInDown.duration(500).delay(150).springify()} style={styles.quickActions}>
                <QuickActionPill icon={<ArrowUpRight size={20} color={colors.primary} />} label="Send" onPress={() => router.push('/(tabs)/wallet')} color={colors.primary} />
                <QuickActionPill icon={<ArrowDownLeft size={20} color={colors.chartGreen} />} label="Receive" onPress={() => router.push('/(tabs)/wallet')} color={colors.chartGreen} />
                <QuickActionPill icon={<Repeat size={20} color={colors.secondary} />} label="Swap" onPress={() => {}} color={colors.secondary} />
                <QuickActionPill icon={<Zap size={20} color={colors.accent} />} label="Buy" onPress={() => {}} color={colors.accent} />
              </Animated.View>
            </LinearGradient>

            <View style={styles.content}>
              {/* Token List — Trust Wallet style */}
              <Animated.View entering={FadeInDown.duration(500).delay(200).springify()}>
                <GlassCard gradient style={styles.tokenCard}>
                  <View style={styles.tokenCardHeader}>
                    <Text style={styles.tokenCardTitle}>Tokens</Text>
                    <TouchableOpacity style={styles.tokenCardAction}>
                      <Text style={styles.tokenCardActionText}>Manage</Text>
                      <ChevronRight size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  {tokens.map((t, i) => (
                    <TokenRow key={t.symbol} {...t} delay={250 + i * 80} />
                  ))}
                </GlassCard>
              </Animated.View>

              {/* Price Chart */}
              <Animated.View entering={FadeInDown.duration(500).delay(350).springify()}>
                <PriceChart data={MOCK_PRICES} timeframe={timeframe} onTimeframeChange={setTimeframe} />
              </Animated.View>

              {/* Syndicate Card */}
              <Animated.View entering={FadeInDown.duration(500).delay(450).springify()}>
                <SyndicateCard node={node} />
              </Animated.View>

              {/* Activity */}
              <Animated.View entering={FadeInDown.duration(500).delay(550).springify()}>
                <ActivityList transactions={transactions} />
              </Animated.View>
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  balanceSkeleton: { padding: spacing.xl, paddingTop: 100, backgroundColor: colors.surface },
  header: { paddingBottom: spacing.xxl },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  balanceSection: { alignItems: 'center', paddingHorizontal: spacing.lg },
  balanceLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: spacing.xs },
  balanceValue: { ...typography.hero, color: colors.text },
  balanceMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  balanceTokens: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  changeDot: { width: 5, height: 5, borderRadius: 2.5 },
  changePillText: { fontSize: 11, fontWeight: '700' },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  quickPill: { alignItems: 'center', gap: spacing.sm },
  quickPillIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPillLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tokenCard: { marginBottom: spacing.lg },
  tokenCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  tokenCardTitle: { ...typography.bodyBold, color: colors.text },
  tokenCardAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tokenCardActionText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder + '60',
    gap: spacing.md,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenIconText: { fontSize: 16, fontWeight: '800' },
  tokenInfo: { flex: 1 },
  tokenSymbol: { ...typography.bodyBold, color: colors.text },
  tokenName: { ...typography.micro, color: colors.textMuted, marginTop: 1 },
  tokenValues: { alignItems: 'flex-end' },
  tokenBalance: { ...typography.captionBold, color: colors.text },
  tokenUSD: { ...typography.micro, color: colors.textMuted },
  tokenChange: { marginLeft: spacing.sm },
  tokenChangeText: { ...typography.captionBold },
});
