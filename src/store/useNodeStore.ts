import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NodeTier, NodeTierConfig } from '../types';

export const NODE_TIERS: NodeTierConfig[] = [
  {
    name: 'Bronze',
    minASH: 0,
    hashrate: 0.048,
    dailyReward: 1.152,
    hourlyRate: 0.048,
    color: '#CD7F32',
    benefits: ['Standard mining rate', 'Basic support', 'Daily rewards'],
  },
  {
    name: 'Silver',
    minASH: 100,
    hashrate: 0.096,
    dailyReward: 2.304,
    hourlyRate: 0.096,
    color: '#C0C0C0',
    benefits: ['2x mining rate', 'Priority support', 'Daily rewards + bonus', 'Referral bonus 5%'],
  },
  {
    name: 'Gold',
    minASH: 500,
    hashrate: 0.24,
    dailyReward: 5.76,
    hourlyRate: 0.24,
    color: '#FFD700',
    benefits: ['5x mining rate', 'VIP support', 'Daily rewards + premium bonus', 'Referral bonus 10%', 'Early access features'],
  },
];

interface NodeState {
  status: 'active' | 'paused' | 'offline' | 'starting' | 'stopping';
  hashrate: number;
  dailyReward: number;
  totalEarned: number;
  uptime: number;
  temperature: number;
  tier: NodeTier;
  startTime: number | null;
  sessionEarned: number;
  hourlyRate: number;

  setNode: (data: Partial<NodeState>) => void;
  startNode: () => void;
  stopNode: () => void;
  tickEarnings: (elapsedHours: number) => void;
  addEarned: (amount: number) => void;
  getCurrentTier: (balance: number) => NodeTierConfig;
}

export const useNodeStore = create<NodeState>()(
  persist(
    (set, get) => ({
      status: 'offline',
      hashrate: 0.048,
      dailyReward: 1.152,
      totalEarned: 0,
      uptime: 99.5,
      temperature: 42,
      tier: 'Bronze',
      startTime: null,
      sessionEarned: 0,
      hourlyRate: 0.048,

      setNode: (data) => set(data),

      startNode: () =>
        set({ status: 'active', startTime: Date.now(), temperature: 42 }),

      stopNode: () =>
        set((state) => ({ status: 'offline', startTime: null, totalEarned: state.totalEarned + state.sessionEarned, sessionEarned: 0 })),

      tickEarnings: (elapsedHours) =>
        set((state) => {
          if (state.status !== 'active') return state;
          const earned = elapsedHours * state.hourlyRate;
          return { sessionEarned: earned, totalEarned: state.totalEarned + earned };
        }),

      addEarned: (amount) =>
        set((state) => ({ totalEarned: state.totalEarned + amount })),

      getCurrentTier: (balance) => {
        const tiers = [...NODE_TIERS].reverse();
        for (const t of tiers) {
          if (balance >= t.minASH) return t;
        }
        return NODE_TIERS[0];
      },
    }),
    {
      name: 'ash-node-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ status: state.status, totalEarned: state.totalEarned, uptime: state.uptime, tier: state.tier, startTime: state.startTime, sessionEarned: state.sessionEarned }),
    }
  )
);
