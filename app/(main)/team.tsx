// app/(main)/team.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, Copy, Crown, Gift, TrendingUp, UserPlus, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useSettingsStore, themes, translations } from '../../src/stores/useSettingsStore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';

interface MemberData {
  uid: string;
  displayName?: string;
  email?: string;
  joinedAt?: number;
  isMining?: boolean;
}

export default function TeamScreen() {
  const { theme, language } = useSettingsStore();
  const colors = themes[theme];
  const t = translations[language];
  const { uid } = useAuthStore();
  
  const [members, setMembers] = useState<MemberData[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const myReferralCode = uid ? uid.substring(uid.length - 6).toUpperCase() : '...';

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!uid) return;

      try {
        setLoading(true);
        const q = query(collection(db, 'users'), where('referredBy', '==', uid));
        const querySnapshot = await getDocs(q);
        
        const teamList: MemberData[] = [];
        let commissionSum = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          teamList.push({
            uid: doc.id,
            displayName: data.displayName || data.email?.split('@')[0] || 'User',
            email: data.email,
            joinedAt: data.createdAt,
            isMining: data.mining?.isActive
          });
          const memberBalance = data.balance || 0;
          commissionSum += memberBalance * 0.05; 
        });

        setMembers(teamList);
        setTotalCommission(commissionSum);

      } catch (error) {
        console.error("Error fetching team:", error);
        Alert.alert(t.error, language === 'id' ? 'Gagal memuat data tim' : 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [uid]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: language === 'id'
          ? `Gabung Sindikat ASH Protocol saya! Gunakan kode ${myReferralCode} untuk mulai mining bersama dan dapatkan reward.`
          : `Join my ASH Protocol Syndicate! Use code ${myReferralCode} to start mining together and earn rewards.`,
        title: 'ASH Protocol',
      });
    } catch (error) {
      Alert.alert(t.error, t.shareFailed);
    }
  };

  const getRank = () => {
    const count = members.length;
    if (count >= 50) return { title: 'LEGENDARY', color: '#fbbf24', icon: <Crown size={20} color="#fbbf24" /> };
    if (count >= 20) return { title: 'GOLD', color: '#fbbf24', icon: <Users size={20} color="#fbbf24" /> };
    if (count >= 5) return { title: 'SILVER', color: '#94a3b8', icon: <UserPlus size={20} color="#94a3b8" /> };
    return { title: 'BRONZE', color: '#64748b', icon: <UserPlus size={20} color="#64748b" /> };
  };

  const rank = getRank();

  if (loading) {
    return (
      <SafeAreaView style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loaderText, { color: colors.textSecondary }]}>{language === 'id' ? 'MEMUAT SINDIKAT...' : 'LOADING SYNDICATE...'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t.syndicate}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.buildYourNetwork}</Text>
        </View>

        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.rankCard}>
          <View style={styles.rankHeader}>
            {rank.icon}
            <Text style={[styles.rankTitle, { color: rank.color }]}>{t.rank}: {rank.title}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{members.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.totalMembers}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{members.filter(m => m.isMining).length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.activeMiners}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#00ff88' }]}>{totalCommission.toFixed(4)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.commissionEarned}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.referralSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.inviteCode}</Text>
          <View style={[styles.codeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.codeText, { color: colors.primary }]}>{myReferralCode}</Text>
            <TouchableOpacity onPress={() => {
              Alert.alert(t.copiedCode, `${t.copiedCodeDesc} ${myReferralCode} ${t.copiedToClipboard}`);
            }}>
              <Copy size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Gift size={18} color="#0f172a" />
            <Text style={styles.shareBtnText}>{t.shareInviteLink}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.commissionSection}>
           <View style={styles.commissionHeader}>
             <BarChart3 size={20} color="#00ff88" />
             <Text style={[styles.commissionTitle, { color: colors.text }]}>{t.liveCommission}</Text>
           </View>
           <View style={[styles.commissionCard, { backgroundColor: colors.card, borderColor: '#00ff88' }]}>
             <Text style={[styles.commissionDesc, { color: colors.textSecondary }]}>{t.commissionDesc}</Text>
             <Text style={styles.commissionAmount}>+{totalCommission.toFixed(4)} ASH</Text>
           </View>
        </View>

        <View style={styles.membersSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.yourNetwork}</Text>
          
          {members.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <UserPlus size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noMembers}</Text>
            </View>
          ) : (
            members.map((member) => (
              <View key={member.uid} style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.memberAvatar, { backgroundColor: colors.border }]}>
                  <Text style={[styles.avatarText, { color: colors.text }]}>{member.displayName?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{member.displayName}</Text>
                  <Text style={[styles.memberStatus, { color: member.isMining ? '#00ff88' : colors.textSecondary }]}>
                    {member.isMining ? `⚡ ${t.miningActive}` : `💤 ${t.idle}`}
                  </Text>
                </View>
                <View style={styles.memberEarning}>
                  <TrendingUp size={14} color={colors.primary} />
                  <Text style={[styles.earningText, { color: colors.primary }]}>{t.active}</Text>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, fontFamily: 'monospace' },
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 14, marginTop: 4 },
  rankCard: { borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  rankHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  rankTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  divider: { width: 1, height: '80%' },
  referralSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  codeBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  codeText: { fontSize: 24, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 2 },
  shareBtn: { flexDirection: 'row', backgroundColor: '#fbbf24', paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareBtnText: { color: '#0f172a', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  commissionSection: { marginBottom: 24 },
  commissionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  commissionTitle: { fontSize: 18, fontWeight: '700' },
  commissionCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  commissionDesc: { fontSize: 12, marginBottom: 8 },
  commissionAmount: { fontSize: 20, fontWeight: '800', color: '#00ff88' },
  membersSection: { marginBottom: 20 },
  emptyState: { padding: 30, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 14 },
  memberCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontWeight: '700' },
  memberName: { fontSize: 16, fontWeight: '600' },
  memberStatus: { fontSize: 12, marginTop: 2 },
  memberEarning: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  earningText: { fontSize: 12, fontWeight: '700' }
});
