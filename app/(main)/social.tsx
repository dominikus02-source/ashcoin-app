// app/(main)/social.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ExternalLink, MessageSquare, Send, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';

export default function SocialScreen() {
  const { colors } = useTheme();
  
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const announcements = [
    { id: 1, title: "ASH V2 Upgrade Coming Soon!", date: "2 hours ago", type: "Update" },
    { id: 2, title: "New Staking Pool Opened", date: "1 day ago", type: "Feature" },
    { id: 3, title: "Security Audit Passed", date: "3 days ago", type: "Security" },
  ];

  const chats = [
    { id: 1, user: "Alex", msg: "Hasil mining hari ini gila sih! 🚀", time: "10m" },
    { id: 2, user: "Sarah", msg: "Sudah join Telegram belum? Info cepat banget.", time: "5m" },
    { id: 3, user: "Mike", msg: "Boost premium worth it gak?", time: "2m" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>COMMUNITY</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Connect & Stay Updated</Text>
        </View>

        <TouchableOpacity 
          style={[styles.telegramCard, { borderColor: '#0088cc', backgroundColor: colors.card }]} 
          onPress={() => openLink('https://t.me/ashcoin_official')}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 136, 204, 0.2)' }]}>
            <Send size={24} color="#0088cc" />
          </View>
          <View style={{flex: 1}}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Telegram Group</Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>Join official channel</Text>
          </View>
          <ExternalLink size={18} color="#0088cc" />
        </TouchableOpacity>

        {/* BROADCAST / ANNOUNCEMENTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#fbbf24" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Announcements</Text>
          </View>

          {announcements.map((item) => (
            <View key={item.id} style={[styles.announcementCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.announceBadge}>
                <Text style={styles.badgeText}>{item.type}</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={[styles.announceTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.announceDate, { color: colors.textSecondary }]}>{item.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* GLOBAL CHAT PREVIEW */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={20} color="#00f2ff" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Global Chat</Text>
          </View>

          <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.chatPreview}>
             {chats.map((chat) => (
               <View key={chat.id} style={styles.chatBubble}>
                 <Text style={styles.chatUser}>{chat.user}:</Text>
                 <Text style={styles.chatMsg}>{chat.msg}</Text>
                 <Text style={styles.chatTime}>{chat.time}</Text>
               </View>
             ))}
             
             <TouchableOpacity style={styles.joinChatBtn} onPress={() => Alert.alert('Coming Soon', 'Full chat feature coming in V2')}>
               <Text style={styles.joinChatText}>Open Full Chat</Text>
             </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* SECURITY TIP */}
        <View style={styles.securityTip}>
          <ShieldCheck size={16} color="#00ff88" />
          <Text style={styles.tipText}>Never share your private key or password with anyone.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 14, marginTop: 4 },
  telegramCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 12, marginBottom: 24 },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionTitle: { fontSize: 16, fontWeight: '700' },
  actionDesc: { fontSize: 12, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  announcementCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, gap: 10 },
  announceBadge: { backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fbbf24' },
  announceTitle: { fontSize: 14, fontWeight: '600' },
  announceDate: { fontSize: 11, marginTop: 2 },
  chatPreview: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  chatBubble: { marginBottom: 12 },
  chatUser: { fontSize: 12, fontWeight: '700', color: '#00f2ff' },
  chatMsg: { fontSize: 13, color: '#cbd5e1', marginTop: 2 },
  chatTime: { fontSize: 10, color: '#475569', marginTop: 2, textAlign: 'right' },
  joinChatBtn: { backgroundColor: '#334155', padding: 10, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  joinChatText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  securityTip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0, 255, 136, 0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#00ff88' },
  tipText: { fontSize: 12, color: '#00ff88', flex: 1 }
});