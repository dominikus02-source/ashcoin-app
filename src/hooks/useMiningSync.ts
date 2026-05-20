// src/hooks/useMiningSync.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, collection } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, functions } from '../lib/firebase';
import {
  cancelMiningDoneNotification,
  scheduleDailyMiningReminder,
  scheduleMiningDoneNotification,
  scheduleNormalBoostDoneNotification,
  schedulePremiumBoostDoneNotification,
  setupNotifications,
} from '../lib/notifications';
import { useAuthStore } from '../stores/useAuthStore';
import { doubleToInt64, int64ToDouble, DECIMALS, safeAdd, safeSubtract } from '../lib/balanceTypes';

const BASIC_HASHRATE = 0.048;
const BOOST_MULTIPLIER = 0.5;
const NORMAL_BOOST_DURATION_MS = 30 * 60 * 1000;
const PREMIUM_BOOST_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const PREMIUM_COST = 14;
const MINING_DURATION_SEC = 21600;
const TRANSFER_GAS_FEE = 0.001;

const STAKING_UNLOCK_THRESHOLD = 10_000;
const STAKING_TRANSFER_PCT = 0.01;

const BALANCE_CACHE_KEY = (uid: string) => `ash_balance_cache_${uid}`;
const MINING_CACHE_KEY = (uid: string) => `ash_mining_cache_${uid}`;

// Cloud Functions references
const completeMiningFn = httpsCallable(functions, 'completeMiningSession');
const claimDailyBonusFn = httpsCallable(functions, 'claimDailyBonus');
const transferAshFn = httpsCallable(functions, 'transferAsh');
const transferToStakingFn = httpsCallable(functions, 'transferToStaking');
const transferFromStakingFn = httpsCallable(functions, 'transferFromStaking');

export function useMiningSync() {
  const { uid } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [miningData, setMiningData] = useState<any>(null);
  const [docReady, setDocReady] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(0);

  const tickerRef = useRef<any>(null);
  const notifSetupDone = useRef(false);
  const unsubscribeFirestoreRef = useRef<(() => void) | null>(null);
  const isAutoClosingRef = useRef(false);

  useEffect(() => {
    if (!uid || notifSetupDone.current) return;
    setupNotifications().then((granted) => {
      if (granted) {
        notifSetupDone.current = true;
        scheduleDailyMiningReminder();
      }
    });
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    AsyncStorage.getItem(BALANCE_CACHE_KEY(uid)).then((cached) => {
      if (cached) {
        const parsed = parseFloat(cached);
        if (!isNaN(parsed)) setDisplayBalance(parsed);
      }
    });
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const userRef = doc(db, 'users', uid);
    setLoading(true);

    const initUser = async () => {
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            balance: 2.0,
            ASHBalance: 0,
            wallets: { funding: 0, trading: 0 },
            stakingUnlocked: false,
            mining: { isActive: false, startTime: null, lastSync: Date.now() },
            boosts: { normalEndTime: 0, premiumEndTime: 0 },
            createdAt: Date.now(),
            lastDailyClaim: 0,
            security: { biometric: false, twoFA: false },
            twoFA: { emailVerified: false, phoneVerified: false },
          });
        } else {
          const data = snap.data();
          // Normalize balance fields to double (from int64 if staking app wrote int64)
          const normalizedBalance = normalizeBalance(data.balance);
          const normalizedAshBalance = normalizeBalance(data.ASHBalance);

          const currentFunding = data.wallets?.funding ?? 0;
          if (normalizedBalance !== data.balance || normalizedAshBalance !== data.ASHBalance || normalizedAshBalance !== currentFunding) {
            await updateDoc(userRef, {
              balance: normalizedBalance,
              ASHBalance: normalizedAshBalance,
              'wallets.funding': normalizedAshBalance,
            });
            console.log(`[BALANCE] Normalized: balance=${normalizedBalance}, ASHBalance=${normalizedAshBalance}, wallets.funding=${normalizedAshBalance}`);
          }

          if (!data.stakingUnlocked && normalizedBalance >= STAKING_UNLOCK_THRESHOLD) {
            await updateDoc(userRef, { stakingUnlocked: true });
            console.log(`[STAKING] Unlocked! balance=${normalizedBalance}`);
          }
        }
        setDocReady(true);
        setLoading(false);
      } catch (e) {
        console.error('[MINING_SYNC] Init failed:', e);
        setLoading(false);
      }
    };

    initUser();

    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data()!;
      const now = Date.now();

      // Normalize balances from Firestore (handle int64 → double conversion)
      const balance = normalizeBalance(data.balance);
      const ashBalance = normalizeBalance(data.ASHBalance);

      let currentHashrate = BASIC_HASHRATE;
      if ((data.boosts?.normalEndTime || 0) > now || (data.boosts?.premiumEndTime || 0) > now) {
        currentHashrate += BASIC_HASHRATE * BOOST_MULTIPLIER;
      }

      let calculatedBalance = balance;
      if (data.mining?.isActive && data.mining?.startTime) {
        const elapsedSec = Math.min((now - data.mining.startTime) / 1000, MINING_DURATION_SEC);
        calculatedBalance = safeAdd(balance, elapsedSec * (currentHashrate / 3600));
      }

      const isActive = !!data.mining?.isActive;
      const startTime = data.mining?.startTime;
      const elapsedSec = isActive && startTime ? (now - startTime) / 1000 : 0;
      const isComplete = isActive && startTime && elapsedSec >= MINING_DURATION_SEC;

      if (isComplete && !isAutoClosingRef.current) {
        isAutoClosingRef.current = true;
        try {
          await completeMiningFn();
          await cancelMiningDoneNotification();
          await AsyncStorage.removeItem(MINING_CACHE_KEY(uid!));
        } catch (err) {
          console.error('[MINING_SYNC] Auto-close failed:', err);
          isAutoClosingRef.current = false;
        }
        return;
      }
      isAutoClosingRef.current = false;

      setMiningData({
        ...data,
        balance,
        ASHBalance: ashBalance,
        calculatedBalance,
        currentHashrate,
        isNormalBoostActive: (data.boosts?.normalEndTime || 0) > now,
        isPremiumBoostActive: (data.boosts?.premiumEndTime || 0) > now,
        normalBoostTimeLeft: Math.max(0, (data.boosts?.normalEndTime || 0) - now),
        premiumBoostTimeLeft: Math.max(0, (data.boosts?.premiumEndTime || 0) - now),
      });

      AsyncStorage.setItem(BALANCE_CACHE_KEY(uid), calculatedBalance.toString());
      if (!data.mining?.isActive) setDisplayBalance(balance);
    }, (error) => {
      console.error('[MINING_SYNC] Snapshot error:', error.code);
    });

    unsubscribeFirestoreRef.current = unsubscribe;

    return () => {
      unsubscribe();
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [uid]);

  useEffect(() => {
    if (tickerRef.current) clearInterval(tickerRef.current);

    const isActive = miningData?.mining?.isActive;
    const startTime = miningData?.mining?.startTime;
    const baseBalance = miningData?.balance || 0;
    const hashrate = miningData?.currentHashrate || BASIC_HASHRATE;

    if (isActive && startTime) {
      tickerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedSec = Math.min((now - startTime) / 1000, MINING_DURATION_SEC);
        const newBalance = safeAdd(baseBalance, elapsedSec * (hashrate / 3600));
        setDisplayBalance(newBalance);
        if (Math.floor(elapsedSec) % 5 === 0 && uid) {
          AsyncStorage.setItem(BALANCE_CACHE_KEY(uid), newBalance.toString());
        }
      }, 100);
    }

    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [miningData?.mining?.isActive, miningData?.mining?.startTime, miningData?.balance, miningData?.currentHashrate, uid]);

  const claimMining = useCallback(async () => {
    if (!uid || !docReady || !miningData?.mining?.isActive) return;
    try {
      await completeMiningFn();
      await cancelMiningDoneNotification();
      await AsyncStorage.removeItem(MINING_CACHE_KEY(uid));
    } catch (error) {
      console.error('[MINING_SYNC] Claim failed:', error);
    }
  }, [uid, docReady, miningData]);

  const claimDailyBonus = useCallback(async () => {
    if (!uid || !docReady) return;
    try {
      await claimDailyBonusFn();
    } catch (error) {
      console.error('[MINING_SYNC] Daily bonus failed:', error);
    }
  }, [uid, docReady]);

  const activateNormalBoost = useCallback(async () => {
    if (!uid || !docReady) return;
    try {
      const boostEndTime = Date.now() + NORMAL_BOOST_DURATION_MS;
      await updateDoc(doc(db, 'users', uid), { 'boosts.normalEndTime': boostEndTime });
      await scheduleNormalBoostDoneNotification(boostEndTime);
    } catch (error) {
      console.error('Boost failed:', error);
    }
  }, [uid, docReady]);

  const activatePremiumBoost = useCallback(async () => {
    if (!uid || !docReady) return;
    const currentBalance = miningData?.calculatedBalance ?? miningData?.balance ?? 0;
    if (currentBalance < PREMIUM_COST) {
      alert('Saldo tidak cukup!');
      return;
    }
    try {
      const boostEndTime = Date.now() + PREMIUM_BOOST_DURATION_MS;
      const newBalance = safeSubtract(currentBalance, PREMIUM_COST);
      if (newBalance === null) {
        alert('Saldo tidak cukup!');
        return;
      }
      await updateDoc(doc(db, 'users', uid), {
        balance: newBalance,
        'boosts.premiumEndTime': boostEndTime,
      });
      await schedulePremiumBoostDoneNotification(boostEndTime);
    } catch (error) {
      console.error('Premium Boost failed:', error);
    }
  }, [uid, docReady, miningData]);

  const startMining = useCallback(async () => {
    if (!uid || !docReady || miningData?.mining?.isActive) return;
    try {
      const startTime = Date.now();
      const localMiningState = {
        startTime,
        expectedEnd: startTime + MINING_DURATION_SEC * 1000,
        baseBalance: miningData?.calculatedBalance || miningData?.balance || 0,
        hashRate: miningData?.currentHashrate || BASIC_HASHRATE,
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(MINING_CACHE_KEY(uid), JSON.stringify(localMiningState));
      await updateDoc(doc(db, 'users', uid), {
        'mining.isActive': true,
        'mining.startTime': startTime,
        'mining.lastSync': startTime,
      });
      await scheduleMiningDoneNotification(startTime);
    } catch (error) {
      console.error('[MINING_SYNC] Start failed:', error);
    }
  }, [uid, docReady, miningData]);

  const transferAsh = useCallback(async (recipientUid: string, amount: number) => {
    if (!uid || !docReady) return 'NOT_READY';
    if (uid === recipientUid) return 'CANNOT_SELF';
    if (amount <= 0) return 'INVALID_AMOUNT';
    try {
      await transferAshFn({ recipientUid, amount });
      return 'SUCCESS';
    } catch (error: any) {
      console.error('[MINING_SYNC] Transfer failed:', error);
      const code = error.code;
      if (code === 'failed-precondition') return 'INSUFFICIENT_BALANCE';
      if (code === 'not-found') return 'RECIPIENT_NOT_FOUND';
      return 'ERROR';
    }
  }, [uid, docReady]);

  const transferToStaking = useCallback(async (amount: number): Promise<string> => {
    if (!uid || !docReady) return 'NOT_READY';
    if (amount <= 0) return 'INVALID_AMOUNT';
    try {
      await transferToStakingFn({ amount });
      return 'SUCCESS';
    } catch (error: any) {
      console.error('[MINING_SYNC] Transfer to staking failed:', error);
      const code = error.code;
      if (code === 'failed-precondition') {
        const msg = error.message || '';
        if (msg.includes('10,000')) return 'LOCKED_NEED_10K';
        return msg;
      }
      return 'ERROR';
    }
  }, [uid, docReady]);

  const transferFromStaking = useCallback(async (amount: number): Promise<string> => {
    if (!uid || !docReady) return 'NOT_READY';
    if (amount <= 0) return 'INVALID_AMOUNT';
    try {
      await transferFromStakingFn({ amount });
      return 'SUCCESS';
    } catch (error: any) {
      console.error('[MINING_SYNC] Transfer from staking failed:', error);
      const code = error.code;
      if (code === 'failed-precondition') return 'INSUFFICIENT_STAKING_BALANCE';
      return 'ERROR';
    }
  }, [uid, docReady]);

  return {
    loading,
    miningData,
    displayBalance,
    startMining,
    claimMining,
    claimDailyBonus,
    activateNormalBoost,
    activatePremiumBoost,
    transferAsh,
    transferToStaking,
    transferFromStaking,
    TRANSFER_GAS_FEE,
    STAKING_UNLOCK_THRESHOLD,
    STAKING_TRANSFER_PCT,
  };
}

/**
 * Normalize balance value from Firestore to double.
 * Handles cases where staking app wrote int64 (BigInt) instead of double.
 */
function normalizeBalance(value: unknown): number {
  if (typeof value === 'number') {
    // Check if it's actually an int64 stored as number (very large integer)
    if (Number.isInteger(value) && value > 1_000_000) {
      // Likely int64 representation, convert to double
      return int64ToDouble(BigInt(value));
    }
    return value;
  }
  if (typeof value === 'bigint') {
    return int64ToDouble(value);
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isInteger(parsed) && parsed > 1_000_000) {
      return int64ToDouble(BigInt(parsed));
    }
    return parsed;
  }
  return 0;
}
