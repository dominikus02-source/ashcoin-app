// app/index.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/useAuthStore';

export default function Index() {
  const { uid, isLoading, initAuthListener } = useAuthStore();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = initAuthListener();
    setAuthReady(true);
    return unsub;
  }, []);

  // Fallback: force navigate after 5s even if isLoading stuck
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        useAuthStore.getState().setLoading(false);
        setTimedOut(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading && !authReady && !timedOut) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text style={styles.loaderText}>ASH PROTOCOL</Text>
        <Text style={styles.subText}>SYNCHRONIZING...</Text>
      </View>
    );
  }

  return <Redirect href={uid ? '/(tabs)/home' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loaderText: { color: '#fbbf24', fontWeight: '900', letterSpacing: 4, fontSize: 18, marginTop: 20 },
  subText: { color: '#64748b', fontSize: 10, marginTop: 4, letterSpacing: 1 },
});
