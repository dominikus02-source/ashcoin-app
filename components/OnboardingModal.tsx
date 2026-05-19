// components/OnboardingModal.tsx
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Dimensions
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useSettingsStore, themes, translations } from '../src/stores/useSettingsStore';

const { width } = Dimensions.get('window');

export default function OnboardingModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { language, theme } = useSettingsStore();
  const colors = themes[theme];
  const t = translations[language];
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const pages = [
    { icon: '⛏️', title: t.onboardingWelcome, desc: t.onboardingWelcomeDesc, color: '#fbbf24' },
    { icon: '⏱️', title: t.onboardingMining, desc: t.onboardingMiningDesc, color: '#fbbf24' },
    { icon: '🚀', title: t.onboardingBoost, desc: t.onboardingBoostDesc, color: '#00f2ff' },
    { icon: '🎁', title: t.onboardingDaily, desc: t.onboardingDailyDesc, color: '#00ff88' },
    { icon: '👥', title: t.onboardingInvite, desc: t.onboardingInviteDesc, color: '#a78bfa' },
    { icon: '💸', title: t.onboardingSendReceive, desc: t.onboardingSendReceiveDesc, color: '#fb923c' },
    { icon: '🔒', title: t.onboardingSecurity, desc: t.onboardingSecurityDesc, color: '#34d399' },
    { icon: '🌐', title: t.onboardingEcosystem, desc: t.onboardingEcosystemDesc, color: '#60a5fa' },
  ];

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentPage + 1) * width, animated: true });
      setCurrentPage(currentPage + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const isLastPage = currentPage === pages.length - 1;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              {t.skip}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ width: width * pages.length }}
        >
          {pages.map((page, index) => (
            <View key={index} style={[styles.slide, { width }]}>
              <View style={[styles.iconCircle, { backgroundColor: page.color + '20' }]}>
                <Text style={styles.iconEmoji}>{page.icon}</Text>
              </View>
              <Text style={[styles.slideTitle, { color: colors.text }]}>{page.title}</Text>
              <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>{page.desc}</Text>
              <View style={[styles.progressDots, { marginTop: 32 }]}>
                {pages.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: i === currentPage ? page.color : colors.border,
                        width: i === currentPage ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: 40 }]}>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: pages[currentPage]?.color || colors.primary }]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>
              {isLastPage ? t.startMining : t.continue}
            </Text>
            {!isLastPage && <ChevronRight size={20} color="#0f172a" />}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 60, paddingHorizontal: 24 },
  skipBtn: { padding: 8 },
  skipText: { fontSize: 15, fontWeight: '500' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  iconEmoji: { fontSize: 48 },
  slideTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  slideDesc: { fontSize: 16, textAlign: 'center', lineHeight: 26, paddingHorizontal: 8 },
  progressDots: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24, paddingTop: 20 },
  nextBtn: { flexDirection: 'row', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtnText: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
});
