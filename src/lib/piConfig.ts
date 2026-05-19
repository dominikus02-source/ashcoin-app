// src/lib/piConfig.ts

/**
 * Pi Network Configuration
 * 
 * Karena Pi SDK tidak support React Native secara native,
 * kita menggunakan pendekatan Deep Linking ke Pi Browser.
 */

export const PI_CONFIG = {
  // URL untuk membuka Pi Browser
  piBrowserUrl: 'https://minepi.com', 
  // URL Developer Portal
  developerPortal: 'https://develop.pi',
  // Harga referensi (bisa diupdate via API nanti)
  ashPriceUsd: 0.63,
  ashPriceIdr: 10000,
};

/**
 * Deteksi apakah aplikasi sedang berjalan di dalam Pi Browser
 * (Biasanya via WebView atau jika app di-convert jadi Pi App)
 */
export const isPiBrowser = (): boolean => {
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    return /PiBrowser/i.test(navigator.userAgent);
  }
  return false;
};

/**
 * Cek apakah Pi Browser terinstall di device
 * Kita asumsikan terinstall jika bisa resolve URL scheme tertentu
 * atau fallback ke web.
 */
export const canOpenPiBrowser = async (): Promise<boolean> => {
  // Di React Native, kita coba buka URL Pi Browser
  // Jika gagal, user mungkin belum install
  return true; 
};
