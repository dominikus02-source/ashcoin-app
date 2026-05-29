export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username: string | null;
  balance: number;
  ASHBalance: number;
  wallets: {
    funding: number;
    trading: number;
  };
  stakingUnlocked: boolean;
  mining: {
    isActive: boolean;
    startTime: number | null;
    lastSync: number;
  };
  boosts: {
    normalEndTime: number;
    premiumEndTime: number;
  };
  createdAt: number;
  lastDailyClaim: number;
}

export interface MiningSession {
  isActive: boolean;
  startTime: number | null;
  elapsed: number;
  earned: number;
  hashrate: number;
}

export interface Transaction {
  id: string;
  type: 'mining_reward' | 'daily_bonus' | 'transfer_sent' | 'transfer_received'
       | 'transfer_to_staking' | 'transfer_from_staking' | 'deposit' | 'withdraw'
       | 'node_reward' | 'stake' | 'unstake' | 'stake_reward';
  amount: number;
  fee?: number;
  description: string;
  balanceAfter: number;
  createdAt: number;
  status?: 'pending' | 'completed' | 'failed';
}

export interface SyndicateNode {
  hashrate: number;
  dailyReward: number;
  totalEarned: number;
  uptime: number;
  temperature: number;
  status: 'active' | 'paused' | 'offline' | 'starting' | 'stopping';
  tier: NodeTier;
  hourlyRate: number;
  startTime: number | null;
}

export type NodeTier = 'Bronze' | 'Silver' | 'Gold' | 'Starter' | 'Node' | 'Super Node' | 'Genesis';

export interface NodeTierConfig {
  name: NodeTier;
  minASH: number;
  hashrate: number;
  dailyReward: number;
  hourlyRate: number;
  color: string;
  benefits: string[];
}

export interface StakingPosition {
  id: string;
  amount: number;
  apy: number;
  lockPeriod: number;
  startDate: number;
  endDate: number;
  rewards: number;
  claimedRewards: number;
  status: 'active' | 'locked' | 'completed' | 'unstaking';
  productId: string;
}

export interface StakingProduct {
  id: string;
  name: string;
  apy: number;
  lockPeriodDays: number;
  minAmount: number;
  maxAmount: number;
  penalty: number;
  color: string;
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface PortfolioAsset {
  symbol: string;
  name: string;
  balance: number;
  valueUSD: number;
  change24h: number;
  color: string;
}

export interface NetworkWallet {
  address: string;
  chain: string;
  balance: number;
  symbol: string;
  connected: boolean;
}

export interface TabConfig {
  name: string;
  title: string;
  icon: string;
  href: string;
}
