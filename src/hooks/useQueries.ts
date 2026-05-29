import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDashboard, fetchPriceHistory, fetchTransactions, fetchSyndicateNode } from '../lib/api';
import { useUserStore } from '../store/useUserStore';
import { useNodeStore } from '../store/useNodeStore';
import { Transaction, PricePoint, SyndicateNode } from '../types';

export function useDashboard() {
  const uid = useUserStore((s) => s.uid);
  const setBalances = useUserStore((s) => s.setBalances);
  const setNode = useNodeStore((s) => s.setNode);

  return useQuery({
    queryKey: ['dashboard', uid],
    queryFn: async () => {
      if (!uid) throw new Error('Not authenticated');
      const data = await fetchDashboard(uid);
      setBalances(data.userData.balance, data.userData.ASHBalance, data.userData.wallets.funding, data.userData.wallets.trading);
      setNode(data.node);
      return data;
    },
    enabled: !!uid,
    staleTime: 30_000,
  });
}

export function usePriceHistory(timeframe: string) {
  return useQuery<PricePoint[]>({
    queryKey: ['priceHistory', timeframe],
    queryFn: () => fetchPriceHistory(timeframe),
    staleTime: 60_000,
  });
}

export function useTransactions(uid: string | null) {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', uid],
    queryFn: () => {
      if (!uid) throw new Error('Not authenticated');
      return fetchTransactions(uid);
    },
    enabled: !!uid,
    staleTime: 15_000,
  });
}

export function useNode(uid: string | null) {
  const setNode = useNodeStore((s) => s.setNode);

  return useQuery<SyndicateNode>({
    queryKey: ['syndicateNode', uid],
    queryFn: async () => {
      if (!uid) throw new Error('Not authenticated');
      const data = await fetchSyndicateNode(uid);
      setNode(data);
      return data;
    },
    enabled: !!uid,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useStartNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (uid: string) => {
      const res = await fetch(`https://api.ashcoin.app/v1/syndicate/${uid}/start`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start node');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['syndicateNode'] }),
  });
}

export function useStopNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (uid: string) => {
      const res = await fetch(`https://api.ashcoin.app/v1/syndicate/${uid}/stop`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to stop node');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['syndicateNode'] }),
  });
}
