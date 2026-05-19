// src/config/ads.ts
import { Platform } from 'react-native';

export const IS_DEV_MODE = __DEV__; // True kalau di Expo Go / Development

export const AD_IDS = {
  bannerMarket: IS_DEV_MODE
    ? 'ca-app-pub-3940256099942544/6300978111' // Test Banner ID dari Google
    : 'ca-app-pub-1372831940635891/6937596013', // Real Ad ID (Market_Bottom_Banner)

  rewardedPremium: IS_DEV_MODE
    ? 'ca-app-pub-3940256099942544/5224354917' // Test Rewarded ID dari Google
    : 'ca-app-pub-1372831940635891/2439961119', // Real Ad ID (Miner_Premium_Access)

  rewardedFree: IS_DEV_MODE
    ? 'ca-app-pub-3940256099942544/5224354917' // Test Rewarded ID dari Google
    : 'ca-app-pub-1372831940635891/8410459782', // Real Ad ID (Miner_Surge_Free)
};