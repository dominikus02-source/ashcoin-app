import { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { colors, spacing } from '../../../src/constants';
import { Header } from '../../../src/components/common/Header';
import { PriceChart } from '../../../src/components/common/PriceChart';
import { QuickActions } from '../../../src/components/common/QuickActions';
import { SyndicateCard } from '../../../src/components/common/SyndicateCard';
import { PortfolioChart } from '../../../src/components/common/PortfolioChart';
import { ActivityList } from '../../../src/components/common/ActivityList';
import { useUserStore } from '../../../src/store/useUserStore';
import { useNodeStore, NODE_TIERS } from '../../../src/store/useNodeStore';
import { useAppStore } from '../../../src/store/useAppStore';
import { db } from '../../../src/lib/firebase';
import { PricePoint, SyndicateNode, PortfolioAsset, Transaction } from '../../../src/types';
import { formatBalance } from '../../../src/utils';

const MOCK_PRICES: PricePoint[] = Array.from({ length: 100 }, (_, i) => ({
  timestamp: Date.now() - (99 - i) * 3600000,
  price: 0.42 + Math.sin(i / 10) * 0.05 + Math.random() * 0.02,
}));

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('24H');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const { balance, ashBalance, fundingBalance, tradingBalance, photoURL, displayName, isLoading: userLoading } = useUserStore();
  const { status, hashrate, dailyReward, uptime, totalEarned, tier, hourlyRate } = useNodeStore();
  const { ashPrice } = useAppStore();
  const { uid } = useUserStore.getState();

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const txs: Transaction[] = (data.transactions || []).slice(-10);
        setTransactions(txs);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setRefreshing(false);
  }, []);

  const node: SyndicateNode = {
    hashrate,
    dailyReward,
    totalEarned,
    uptime,
    temperature: 42,
    status: status as SyndicateNode['status'],
    tier,
    hourlyRate,
    startTime: status === 'active' ? Date.now() - 3600000 : null,
  };

  const portfolioAssets: PortfolioAsset[] = [
    { symbol: 'ASH', name: 'ASH Coin', balance: fundingBalance, valueUSD: fundingBalance * ashPrice, change24h: 5.23, color: '#6C5CE7' },
    { symbol: 'sASH', name: 'Staked ASH', balance: ashBalance, valueUSD: ashBalance * ashPrice, change24h: 5.23, color: '#00CEC9' },
    { symbol: 'TRD', name: 'Trading', balance: tradingBalance, valueUSD: tradingBalance * ashPrice, change24h: 0, color: '#FDCB6E' },
  ];

  const totalValueUSD = portfolioAssets.reduce((s, a) => s + a.valueUSD, 0);

  if (userLoading || loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Header
          ashBalance={balance}
          ashPrice={ashPrice}
          avatarUrl={photoURL}
          onNotificationPress={() => {}}
          onSettingsPress={() => router.push('/(tabs)/profile')}
        />

        <View style={styles.content}>
          <PriceChart data={MOCK_PRICES} timeframe={timeframe} onTimeframeChange={setTimeframe} />

          <SyndicateCard node={node} />

          <QuickActions
            onStake={() => router.push('/(tabs)/syndicate')}
            onMining={() => router.push('/(main)/dashboard')}
            onDeposit={() => router.push('/(tabs)/wallet')}
            onWithdraw={() => router.push('/(tabs)/wallet')}
          />

          <PortfolioChart assets={portfolioAssets} totalValue={totalValueUSD} />

          <ActivityList transactions={transactions} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
});
