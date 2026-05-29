import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../src/context/ThemeContext';
import { queryClient } from '../src/lib/api';
import { useAppSync } from '../src/hooks/useAppSync';

function AppInitializer({ children }: { children: React.ReactNode }) {
  useAppSync();
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SafeAreaProvider>
            <AppInitializer>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ animation: 'fade' }} />
                <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
                <Stack.Screen name="kyc" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              </Stack>
            </AppInitializer>
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
