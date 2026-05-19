// 1. PASTIKAN import ini ada di baris paling pertama
import 'react-native-gesture-handler'; 

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/context/ThemeContext';

export default function RootLayout() {
  return (
    // GestureHandlerRootView sebaiknya berada di paling luar setelah Provider
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          
          {/* Routing Utama */}
          <Stack screenOptions={{ headerShown: false }}>
            {/* Halaman awal untuk cek auth (index.tsx) */}
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            
            {/* Grup Auth (Login/Register) */}
            <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
            
            {/* Grup Main App (Dashboard, Profile, dll) */}
            <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
            
            {/* KYC Page */}
            <Stack.Screen name="kyc" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </Stack>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}