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
import { ToastProvider } from '../src/components/ui/Toast';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';

function AppInitializer({ children }: { children: React.ReactNode }) {
  useAppSync();
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SafeAreaProvider>
              <AppInitializer>
                <ToastProvider>
                  <StatusBar style="light" />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" options={{ animation: 'fade' }} />
                    <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                    <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
                    <Stack.Screen name="kyc" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                  </Stack>
                </ToastProvider>
              </AppInitializer>
            </SafeAreaProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
