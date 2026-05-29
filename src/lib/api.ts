import { QueryClient } from '@tanstack/react-query';
import { UserData, Transaction, PricePoint, SyndicateNode } from '../types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const BASE_URL = 'https://api.ashcoin.app/v1';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Network error' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

interface DashboardData {
  userData: UserData;
  ashPrice: number;
  priceHistory: PricePoint[];
  node: SyndicateNode;
  recentActivity: Transaction[];
}

export async function fetchDashboard(uid: string): Promise<DashboardData> {
  return fetchAPI<DashboardData>(`/dashboard/${uid}`);
}

export async function fetchPriceHistory(timeframe: string): Promise<PricePoint[]> {
  return fetchAPI<PricePoint[]>(`/price/history?timeframe=${timeframe}`);
}

export async function fetchTransactions(uid: string, limit = 20): Promise<Transaction[]> {
  return fetchAPI<Transaction[]>(`/users/${uid}/transactions?limit=${limit}`);
}

export async function fetchSyndicateNode(uid: string): Promise<SyndicateNode> {
  return fetchAPI<SyndicateNode>(`/syndicate/${uid}/node`);
}
