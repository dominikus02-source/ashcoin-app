import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores/useAuthStore';
import { useUserStore } from '../store/useUserStore';
import { useNodeStore, NODE_TIERS } from '../store/useNodeStore';
import { useAppStore } from '../store/useAppStore';

export function useAppSync() {
  const { uid, userMeta, isLoading: authLoading, initAuthListener } = useAuthStore();
  const setAuth = useUserStore((s) => s.setAuth);
  const setBalances = useUserStore((s) => s.setBalances);
  const setLoading = useUserStore((s) => s.setLoading);
  const setNode = useNodeStore((s) => s.setNode);
  const setAshPrice = useAppStore((s) => s.setAshPrice);

  useEffect(() => {
    if (!authLoading && uid && userMeta) {
      setAuth(uid, userMeta.email, userMeta.displayName, userMeta.photoURL, userMeta.username);
    }
  }, [uid, userMeta, authLoading, setAuth]);

  useEffect(() => {
    if (!uid) return;

    const userRef = doc(db, 'users', uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const balance = data.balance ?? 0;
        const ashBalance = data.ASHBalance ?? 0;
        const funding = data.wallets?.funding ?? 0;
        const trading = data.wallets?.trading ?? 0;

        setBalances(
          typeof balance === 'number' ? balance : 0,
          typeof ashBalance === 'number' ? ashBalance : 0,
          typeof funding === 'number' ? funding : 0,
          typeof trading === 'number' ? trading : 0,
        );

        setLoading(false);

        const miningData = data.mining || {};
        const tierConfig = NODE_TIERS.find((t) => t.name === (data.nodeTier || 'Bronze')) || NODE_TIERS[0];
        setNode({
          hashrate: tierConfig.hashrate,
          dailyReward: tierConfig.dailyReward,
          hourlyRate: tierConfig.hourlyRate,
          tier: tierConfig.name,
          status: miningData.isActive ? 'active' : 'offline',
          startTime: miningData.startTime ?? null,
          uptime: 99.5,
          temperature: 42,
        });
      },
      (err) => {
        console.error('[APPSYNC] Firestore error:', err);
        setLoading(false);
      }
    );

    return unsub;
  }, [uid, setBalances, setLoading, setNode]);

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    setAshPrice(0.42);
  }, [setAshPrice]);
}
