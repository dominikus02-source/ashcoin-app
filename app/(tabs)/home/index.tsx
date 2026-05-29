import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing } from '../../../src/constants';
import { Header } from '../../../src/components/common/Header';
import { PriceChart } from '../../../src/components/common/PriceChart';
import { QuickActions } from '../../../src/components/common/QuickActions';
import { SyndicateCard } from '../../../src/components/common/SyndicateCard';
import { PortfolioChart } from '../../../src/components/common/PortfolioChart';
import { ActivityList } from '../../../src/components/common/ActivityList';
import { useAppStore } from '../../../src/store/useAppStore';
import { PricePoint, SyndicateNode, PortfolioAsset, Transaction } from '../../../src/types';

const MOCK_PRICES: PricePoint[] = Array.from({ length: 100 }, (_, i) => ({
  timestamp: Date.now() - (99 - i) * 3600000,
  price: 0.42 + Math.sin(i / 10) * 0.05 + Math.random() * 0.02,
}));

const MOCK_NODE: SyndicateNode = {
  hashrate: 0.048,
  dailyReward: 1.152,
  totalEarned: 47.5,
  uptime: 99.2,
  temperature: 42,
  status: 'active',
  tier: 'Starter',
  hourlyRate: 0.048,
  startTime: Date.now() - 3600000,
};

const MOCK_PORTFOLIO: PortfolioAsset[] = [
  { symbol: 'ASH', name: 'ASH Coin', balance: 1250, valueUSD: 525, change24h: 5.23, color: '#6C5CE7' },
  { symbol: 'sASH', name: 'Staked ASH', balance: 500, valueUSD: 210, change24h: 5.23, color: '#00CEC9' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'mining_reward', amount: 0.048, description: 'Mining Reward - 0.048 ASH earned', balanceAfter: 1250.048, createdAt: Date.now() - 3600000, status: 'completed' },
  { id: '2', type: 'transfer_to_staking', amount: -10, description: 'Transferred 10 ASH to Staking', balanceAfter: 1240, createdAt: Date.now() - 7200000, status: 'completed' },
  { id: '3', type: 'daily_bonus', amount: 0.005, description: 'Daily Bonus', balanceAfter: 1250, createdAt: Date.now() - 86400000, status: 'completed' },
  { id: '4', type: 'mining_reward', amount: 0.052, description: 'Mining Reward - 0.052 ASH earned', balanceAfter: 1249.995, createdAt: Date.now() - 90000000, status: 'completed' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('24H');
  const { userData, ashPrice, setAshPrice } = useAppStore();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Header
          ashBalance={userData?.balance || 1250}
          ashPrice={ashPrice || 0.42}
          avatarUrl={userData?.photoURL}
          onNotificationPress={() => {}}
          onSettingsPress={() => router.push('/(main)/profile')}
        />

        <View style={styles.content}>
          <PriceChart
            data={MOCK_PRICES}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />

          <SyndicateCard node={MOCK_NODE} />

          <QuickActions
            onStake={() => router.push('/(tabs)/syndicate')}
            onMining={() => router.push('/(main)/dashboard')}
            onDeposit={() => router.push('/(tabs)/wallet')}
            onWithdraw={() => router.push('/(tabs)/wallet')}
          />

          <PortfolioChart
            assets={MOCK_PORTFOLIO}
            totalValue={MOCK_PORTFOLIO.reduce((s, a) => s + a.valueUSD, 0)}
          />

          <ActivityList transactions={MOCK_TRANSACTIONS} />
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
