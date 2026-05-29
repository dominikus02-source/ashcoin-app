import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username: string | null;
  balance: number;
  ashBalance: number;
  fundingBalance: number;
  tradingBalance: number;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (uid: string, email?: string | null, displayName?: string | null, photoURL?: string | null, username?: string | null) => void;
  setBalances: (balance: number, ashBalance: number, funding: number, trading: number) => void;
  setDisplayName: (name: string) => void;
  setPhotoURL: (url: string) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      uid: null,
      email: null,
      displayName: null,
      photoURL: null,
      username: null,
      balance: 0,
      ashBalance: 0,
      fundingBalance: 0,
      tradingBalance: 0,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (uid, email, displayName, photoURL, username) =>
        set({ uid, email: email ?? null, displayName: displayName ?? null, photoURL: photoURL ?? null, username: username ?? null, isAuthenticated: true, isLoading: false }),

      setBalances: (balance, ashBalance, funding, trading) =>
        set({ balance, ashBalance, fundingBalance: funding, tradingBalance: trading }),

      setDisplayName: (name) => set({ displayName: name }),
      setPhotoURL: (url) => set({ photoURL: url }),
      setLoading: (loading) => set({ isLoading: loading }),
      clearUser: () =>
        set({ uid: null, email: null, displayName: null, photoURL: null, username: null, balance: 0, ashBalance: 0, fundingBalance: 0, tradingBalance: 0, isAuthenticated: false, isLoading: false }),
    }),
    {
      name: 'ash-user-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ uid: state.uid, email: state.email, displayName: state.displayName, photoURL: state.photoURL, username: state.username, isAuthenticated: state.isAuthenticated }),
    }
  )
);
