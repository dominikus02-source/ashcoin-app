// components/SafeAdBanner.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_IDS } from '../src/config/ads';

interface SafeAdBannerProps {
  unitId?: string;
}

export default function SafeAdBanner({ unitId }: SafeAdBannerProps) {
  // Kalau di web, tampilkan placeholder aja
  if (Platform.OS === 'web') {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>🔥 WEB MODE - NO ADS 🔥</Text>
        <Text style={styles.placeholderSub}>Ads only appear on mobile devices</Text>
      </View>
    );
  }

  // Kalau di Android/iOS, render iklan asli
  return (
    <BannerAd
      unitId={unitId || AD_IDS.bannerMarket}
      size={BannerAdSize.BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 60,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#475569',
  },
  placeholderText: {
    color: '#fbbf24',
    fontWeight: '700',
    fontSize: 14,
  },
  placeholderSub: {
    color: '#94a3b8',
    fontSize: 12,
  },
});