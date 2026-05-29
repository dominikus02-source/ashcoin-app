import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StakingPosition, StakingProduct } from '../types';

export const STAKING_PRODUCTS: StakingProduct[] = [
  { id: 'flexible', name: 'Flexible Staking', apy: 8.5, lockPeriodDays: 0, minAmount: 10, maxAmount: 10000, penalty: 0, color: '#6C5CE7' },
  { id: '30day', name: '30-Day Lock', apy: 12, lockPeriodDays: 30, minAmount: 50, maxAmount: 50000, penalty: 0.05, color: '#00CEC9' },
  { id: '90day', name: '90-Day Lock', apy: 18, lockPeriodDays: 90, minAmount: 100, maxAmount: 100000, penalty: 0.1, color: '#FDCB6E' },
  { id: '180day', name: '180-Day Lock', apy: 25, lockPeriodDays: 180, minAmount: 500, maxAmount: 500000, penalty: 0.15, color: '#E17055' },
];

const PLATFORM_FEE = 0.1;

interface StakingState {
  positions: StakingPosition[];
  totalStaked: number;
  totalRewards: number;
  claimedRewards: number;

  addPosition: (position: StakingPosition) => void;
  updatePosition: (id: string, updates: Partial<StakingPosition>) => void;
  removePosition: (id: string) => void;
  claimRewards: (positionId: string) => number;
  getEffectiveApy: (apy: number) => number;
  calculateRewards: (amount: number, apy: number, days: number) => { gross: number; fee: number; net: number };
}

export const useStakingStore = create<StakingState>()(
  persist(
    (set, get) => ({
      positions: [],
      totalStaked: 0,
      totalRewards: 0,
      claimedRewards: 0,

      addPosition: (position) =>
        set((state) => ({ positions: [...state.positions, position], totalStaked: state.totalStaked + position.amount })),

      updatePosition: (id, updates) =>
        set((state) => ({
          positions: state.positions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      removePosition: (id) =>
        set((state) => {
          const pos = state.positions.find((p) => p.id === id);
          return {
            positions: state.positions.filter((p) => p.id !== id),
            totalStaked: state.totalStaked - (pos?.amount || 0),
          };
        }),

      claimRewards: (positionId) => {
        const state = get();
        const position = state.positions.find((p) => p.id === positionId);
        if (!position) return 0;

        const claimable = position.rewards - position.claimedRewards;
        if (claimable <= 0) return 0;

        const fee = claimable * PLATFORM_FEE;
        const netReward = claimable - fee;

        set((s) => ({
          positions: s.positions.map((p) => (p.id === positionId ? { ...p, claimedRewards: p.claimedRewards + claimable } : p)),
          totalRewards: s.totalRewards + claimable,
          claimedRewards: s.claimedRewards + netReward,
        }));

        return netReward;
      },

      getEffectiveApy: (apy) => apy * (1 - PLATFORM_FEE),

      calculateRewards: (amount, apy, days) => {
        const gross = amount * (apy / 100) * (days / 365);
        const fee = gross * PLATFORM_FEE;
        const net = gross - fee;
        return { gross, fee, net };
      },
    }),
    {
      name: 'ash-staking-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ positions: state.positions, totalStaked: state.totalStaked, totalRewards: state.totalRewards, claimedRewards: state.claimedRewards }),
    }
  )
);
