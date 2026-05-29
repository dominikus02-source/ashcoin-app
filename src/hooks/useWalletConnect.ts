import { useCallback, useMemo } from 'react';

interface WalletInfo {
  address: string;
  chain: string;
  connected: boolean;
}

interface WalletState {
  wallets: WalletInfo[];
  isConnecting: boolean;
  connect: (chain?: string) => Promise<void>;
  disconnect: (address: string) => Promise<void>;
  getBalance: (address: string) => Promise<number>;
  signMessage: (message: string) => Promise<string | null>;
}

export function useWalletConnect(): WalletState {
  const wallets: WalletInfo[] = useMemo(() => [
    { address: '0x7421a8b4c5d6e7f890123456789abcdef9876543', chain: 'ethereum', connected: false },
    { address: '0x8f3e2a1b4c5d6e7f890123456789abcdef0123456', chain: 'bnb', connected: false },
  ], []);

  const connect = useCallback(async (_chain?: string) => {
    console.log('[WALLETCONNECT] connect called — not yet implemented');
  }, []);

  const disconnect = useCallback(async (_address: string) => {
    console.log('[WALLETCONNECT] disconnect called — not yet implemented');
  }, []);

  const getBalance = useCallback(async (_address: string): Promise<number> => {
    return 0;
  }, []);

  const signMessage = useCallback(async (_message: string): Promise<string | null> => {
    return null;
  }, []);

  return { wallets, isConnecting: false, connect, disconnect, getBalance, signMessage };
}
