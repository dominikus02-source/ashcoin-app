// app/(main)/dashboard.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Zap, Clock, TrendingUp, Gift, Play, RotateCcw, Shield, Crown } from 'lucide-react-native';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useSettingsStore, themes, translations } from '../../src/stores/useSettingsStore';
import { useMiningSync } from '../../src/hooks/useMiningSync';
import OnboardingModal from '../../components/OnboardingModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MINING_DURATION_MS = 6 * 60 * 60 * 1000;
const ONBOARDING_KEY = 'ash_onboarding_done';

export default function Dashboard() {
  const router = useRouter();
  const { uid } = useAuthStore();
  const { theme, language } = useSettingsStore();
  const colors = themes[theme];
  const t = translations[language];

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [now, setNow] = useState(Date.now());
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    loading,
    miningData,
    displayBalance,
    startMining,
    claimMining,
    activateNormalBoost,
    activatePremiumBoost,
  } = useMiningSync();

  useEffect(() => {
    if (!uid) return;
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) {
        setShowOnboarding(true);
      }
    });
  }, [uid]);

  useEffect(() => {
    if (miningData?.mining?.isActive) {
      tickerRef.current = setInterval(() => {
        setNow(Date.now());
      }, 1000);
    }
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [miningData?.mining?.isActive]);

  const handleOnboardingClose = async () => {
    setShowOnboarding(false);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const isMining = miningData?.mining?.isActive || false;
  const startTime = miningData?.mining?.startTime || 0;

  const { progress, remainingTime, earnings, currentHashrate, isBoosted } = useMemo(() => {
    if (!isMining || !startTime) {
      return { progress: 0, remainingTime: 0, earnings: 0, currentHashrate: 0.048, isBoosted: false };
    }
    const elapsed = now - startTime;
    const prog = Math.min((elapsed / MINING_DURATION_MS) * 100, 100);
    const rem = Math.max(MINING_DURATION_MS - elapsed, 0);
    const baseBalance = miningData?.balance || 0;
    const calcBalance = miningData?.calculatedBalance || baseBalance;
    const earn = calcBalance - baseBalance;
    const rate = miningData?.currentHashrate || 0.048;
    const boosted = (miningData?.boosts?.normalEndTime || 0) > now || (miningData?.boosts?.premiumEndTime || 0) > now;
    return { progress: prog, remainingTime: rem, earnings: earn, currentHashrate: rate, isBoosted: boosted };
  }, [isMining, startTime, miningData, now]);

  const handleStartMining = () => {
    if (!isMining) {
      startMining();
    }
  };

  const handleClaimMining = () => {
    if (isMining && progress >= 100) {
      claimMining();
    }
  };

  const handleNormalBoost = () => {
    Alert.alert(
      language === 'id' ? 'Standard Boost' : 'Standard Boost',
      language === 'id'
        ? 'Tonton iklan untuk aktivasi Standard Boost 30 menit (+50% hashrate)?'
        : 'Watch an ad to activate Standard Boost for 30 minutes (+50% hashrate)?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: language === 'id' ? 'Tonton Iklan' : 'Watch Ad',
          onPress: () => {
            activateNormalBoost();
            Alert.alert(t.success, language === 'id' ? 'Boost diaktifkan!' : 'Boost activated!');
          },
        },
      ]
    );
  };

  const handlePremiumBoost = () => {
    const currentBalance = miningData?.calculatedBalance ?? miningData?.balance ?? 0;
    if (currentBalance < 14) {
      Alert.alert(
        language === 'id' ? 'Saldo Tidak Cukup' : 'Insufficient Balance',
        language === 'id'
          ? `Butuh 14 ASH untuk Premium Boost. Saldo kamu: ${currentBalance.toFixed(4)} ASH`
          : `Need 14 ASH for Premium Boost. Your balance: ${currentBalance.toFixed(4)} ASH`
      );
      return;
    }
    Alert.alert(
      language === 'id' ? 'Premium Boost' : 'Premium Boost',
      language === 'id'
        ? 'Gunakan 14 ASH untuk aktivasi Premium Boost 7 hari (+50% hashrate)?'
        : 'Use 14 ASH to activate Premium Boost for 7 days (+50% hashrate)?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: language === 'id' ? 'Aktifkan' : 'Activate',
          onPress: () => {
            activatePremiumBoost();
            Alert.alert(t.success, language === 'id' ? 'Premium Boost diaktifkan!' : 'Premium Boost activated!');
          },
        },
      ]
    );
  };

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loaderText, { color: colors.text, marginTop: 16 }]}>{t.syncing}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OnboardingModal visible={showOnboarding} onClose={handleOnboardingClose} />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t.welcomeBack}</Text>
            <Text style={[styles.username, { color: colors.text }]}>{miningData?.displayName || t.miner}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(main)/profile')}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]} />
          </TouchableOpacity>
        </View>

        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{t.totalBalance}</Text>
          <Text style={[styles.balanceValue, { color: colors.text }]}>
            {displayBalance.toFixed(4)} <Text style={styles.currency}>ASH</Text>
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.statItem}>
              <TrendingUp size={16} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.text }]}>+{earnings.toFixed(4)} ASH</Text>
            </View>
            <Text style={[styles.statDivider, { color: colors.textSecondary }]}>|</Text>
            <View style={styles.statItem}>
              <Zap size={16} color="#fbbf24" />
              <Text style={[styles.statText, { color: colors.text }]}>{isBoosted ? t.boosted : t.normal}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.miningCard, { backgroundColor: colors.card }]}>
          <View style={styles.miningHeader}>
            <Clock size={20} color={isMining ? '#00f2ff' : colors.textSecondary} />
            <Text style={[styles.miningTitle, { color: colors.text }]}>
              {isMining ? t.miningInProgress : t.readyToMine}
            </Text>
          </View>

          {isMining ? (
            <>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
                </View>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>{progress.toFixed(1)}%</Text>
              </View>
              <Text style={[styles.timer, { color: colors.text }]}>{formatTime(remainingTime)}</Text>
              {progress >= 100 ? (
                <TouchableOpacity style={[styles.miningBtn, { backgroundColor: '#10b981' }]} onPress={handleClaimMining}>
                  <Zap size={20} color="#fff" />
                  <Text style={styles.miningBtnText}>{t.claimRewards}</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.miningBtn, { backgroundColor: colors.border, opacity: 0.7 }]}>
                  <Clock size={20} color={colors.textSecondary} />
                  <Text style={[styles.miningBtnText, { color: colors.textSecondary }]}>
                    {language === 'id' ? 'Mining Berjalan...' : 'Mining Running...'}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.rateText, { color: colors.textSecondary }]}>
                {t.miningRate}: {currentHashrate.toFixed(4)} ASH/hour
              </Text>
              <TouchableOpacity style={[styles.miningBtn, { backgroundColor: colors.primary }]} onPress={handleStartMining}>
                <Play size={20} color="#0f172a" />
                <Text style={[styles.miningBtnText, { color: '#0f172a' }]}>{t.startSession}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.boostSection}>
          <Text style={[styles.boostTitle, { color: colors.text }]}>{language === 'id' ? 'Tingkatkan Earning' : 'Boost Earnings'}</Text>
          <View style={styles.boostRow}>
            <TouchableOpacity style={[styles.boostCard, { backgroundColor: colors.card, borderColor: '#00f2ff' }]} onPress={handleNormalBoost}>
              <View style={[styles.boostIcon, { backgroundColor: 'rgba(0,242,255,0.15)' }]}>
                <Shield size={24} color="#00f2ff" />
              </View>
              <Text style={[styles.boostName, { color: colors.text }]}>{language === 'id' ? 'Standard Boost' : 'Standard Boost'}</Text>
              <Text style={[styles.boostDesc, { color: colors.textSecondary }]}>{language === 'id' ? '30 menit (+50%)' : '30 min (+50%)'}</Text>
              <Text style={[styles.boostCost, { color: '#00f2ff' }]}>{language === 'id' ? 'Tonton Iklan' : 'Watch Ad'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.boostCard, { backgroundColor: colors.card, borderColor: '#fbbf24' }]} onPress={handlePremiumBoost}>
              <View style={[styles.boostIcon, { backgroundColor: 'rgba(251,191,36,0.15)' }]}>
                <Crown size={24} color="#fbbf24" />
              </View>
              <Text style={[styles.boostName, { color: colors.text }]}>{language === 'id' ? 'Premium Boost' : 'Premium Boost'}</Text>
              <Text style={[styles.boostDesc, { color: colors.textSecondary }]}>{language === 'id' ? '7 hari (+50%)' : '7 days (+50%)'}</Text>
              <Text style={[styles.boostCost, { color: '#fbbf24' }]}>14 ASH</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.quickLinks}>
          <TouchableOpacity style={[styles.quickLink, { backgroundColor: colors.card }]} onPress={() => router.push('/wallet')}>
            <Gift size={20} color="#fbbf24" />
            <Text style={[styles.quickLinkText, { color: colors.text }]}>{t.wallet}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickLink, { backgroundColor: colors.card }]} onPress={() => router.push('/market')}>
            <TrendingUp size={20} color="#00f2ff" />
            <Text style={[styles.quickLinkText, { color: colors.text }]}>{t.market}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickLink, { backgroundColor: colors.card }]} onPress={() => Alert.alert(t.dailyBonus, t.comeBackTomorrow)}>
            <Gift size={20} color="#10b981" />
            <Text style={[styles.quickLinkText, { color: colors.text }]}>{t.dailyBonus}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickLink, { backgroundColor: colors.card }]} onPress={() => setShowOnboarding(true)}>
            <RotateCcw size={20} color="#a855f7" />
            <Text style={[styles.quickLinkText, { color: colors.text }]}>{t.guide}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderText: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14 },
  username: { fontSize: 24, fontWeight: '900' },
  profileBtn: { padding: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  balanceCard: { borderRadius: 20, padding: 24, marginBottom: 20 },
  balanceLabel: { fontSize: 14, marginBottom: 8 },
  balanceValue: { fontSize: 36, fontWeight: '900', marginBottom: 16 },
  currency: { fontSize: 20, fontWeight: '700', opacity: 0.7 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, fontWeight: '700' },
  statDivider: { marginHorizontal: 12 },
  miningCard: { borderRadius: 20, padding: 24, marginBottom: 20 },
  miningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  miningTitle: { fontSize: 16, fontWeight: '800' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  progressBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  timer: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  rateText: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  miningBtn: { flexDirection: 'row', paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 10 },
  miningBtnText: { fontSize: 16, fontWeight: '900' },
  boostSection: { marginBottom: 20 },
  boostTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  boostRow: { flexDirection: 'row', gap: 12 },
  boostCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1 },
  boostIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  boostName: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  boostDesc: { fontSize: 12, marginBottom: 8 },
  boostCost: { fontSize: 13, fontWeight: '700' },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  quickLink: { width: '23%', padding: 14, borderRadius: 14, alignItems: 'center', gap: 6 },
  quickLinkText: { fontSize: 11, fontWeight: '700' },
});
