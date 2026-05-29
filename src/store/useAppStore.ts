import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, MiningSession, PricePoint } from '../types';

interface AppState {
  userData: UserData | null;
  miningSession: MiningSession | null;
  ashPrice: number;
  priceHistory: PricePoint[];
  isDarkMode: boolean;
  isHydrated: boolean;

  setUserData: (data: UserData | null) => void;
  updateUserData: (partial: Partial<UserData>) => void;
  setMiningSession: (session: MiningSession | null) => void;
  setAshPrice: (price: number) => void;
  setPriceHistory: (history: PricePoint[]) => void;
  setDarkMode: (dark: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userData: null,
      miningSession: null,
      ashPrice: 0,
      priceHistory: [],
      isDarkMode: true,
      isHydrated: false,

      setUserData: (data) => set({ userData: data }),
      updateUserData: (partial) =>
        set((state) => ({
          userData: state.userData ? { ...state.userData, ...partial } : null,
        })),
      setMiningSession: (session) => set({ miningSession: session }),
      setAshPrice: (price) => set({ ashPrice: price }),
      setPriceHistory: (history) => set({ priceHistory: history }),
      setDarkMode: (dark) => set({ isDarkMode: dark }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'ash-finance-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        ashPrice: state.ashPrice,
        priceHistory: state.priceHistory,
        isDarkMode: state.isDarkMode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
