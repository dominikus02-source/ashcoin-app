// src/hooks/usePiIntegration.ts
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { PI_CONFIG, isPiBrowser } from '../lib/piConfig';

// Tipe data User Pi
interface PiUser {
  username: string;
  accessToken: string;
  userId: string;
}

export function usePiIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<PiUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Cek koneksi saat component mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = () => {
    if (isPiBrowser()) {
      setIsConnected(true);
      console.log('Running inside Pi Browser');
    } else {
      console.log('Not running in Pi Browser');
    }
  };

  // Fungsi Login dengan Pi Auth
  const loginWithPi = async () => {
    if (!isPiBrowser()) {
      Alert.alert('Error', 'Please open this app using the Pi Browser.');
      return;
    }

    try {
      setLoading(true);
      // @ts-ignore - window.pi tidak ada di type definition React Native default
      const piAuth = await window.pi.auth({
        scopes: ['username', 'payments'], // Izin yang diminta
        onSuccess: (result: any) => {
          setUser(result.user);
          setIsConnected(true);
          Alert.alert('Success', `Welcome back, ${result.user.username}`);
        },
        onCancel: () => {
          Alert.alert('Cancelled', 'Login cancelled by user');
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message);
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to Pi Network');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Kirim Transaksi (Simulasi)
  const sendTransaction = async (amount: number, recipient: string) => {
    if (!isPiBrowser() || !user) {
      Alert.alert('Error', 'Not connected to Pi Network');
      return;
    }

    try {
      setLoading(true);
      // @ts-ignore
      const paymentRequest = await window.pi.wallet.sendPayment({
        amount: amount.toString(),
        memo: 'ASH Payment',
        metadata: { recipient: recipient }
      });

      Alert.alert('Success', 'Transaction sent successfully');
    } catch (error) {
      Alert.alert('Error', 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return { isConnected, user, loading, loginWithPi, sendTransaction };
}