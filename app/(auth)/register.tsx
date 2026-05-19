// app/(auth)/register.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, getDocs, query, collection, where, setDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../src/lib/firebase';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useSettingsStore, themes, translations } from '../../src/stores/useSettingsStore';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, language } = useSettingsStore();
  const colors = themes[theme];
  const t = translations[language];

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    referralCode: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.ref) {
      setFormData(prev => ({ ...prev, referralCode: String(params.ref).toUpperCase() }));
    }
  }, [params.ref]);

  const handleRegister = async () => {
    const cleanEmail = formData.email.trim();
    const cleanDisplayName = formData.displayName.trim();
    const cleanReferral = formData.referralCode.trim().toUpperCase();
    const cleanUsername = formData.username.trim().toLowerCase();

    if (!cleanDisplayName || !cleanEmail || !formData.password) {
      Alert.alert(t.error, language === 'id' ? 'Nama, Email, dan Password wajib diisi!' : 'Name, Email, and Password are required!');
      return;
    }
    if (formData.password.length < 6) {
      Alert.alert(t.error, t.passwordMinLength);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t.error, t.passwordsNotMatch);
      return;
    }

    setLoading(true);
    try {
      let referrerUid: string | null = null;
      if (cleanReferral) {
        const snap = await getDocs(query(collection(db, 'users'), where('referralCode', '==', cleanReferral)));
        if (!snap.empty) {
          referrerUid = snap.docs[0].id;
        } else {
          Alert.alert(t.error, language === 'id' ? 'Kode referral tidak valid. Kode akan diabaikan.' : 'Invalid referral code. Code will be ignored.');
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: cleanDisplayName });
      await sendEmailVerification(user);

      const myReferralCode = user.uid.substring(user.uid.length - 6).toUpperCase();

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: cleanDisplayName,
        username: cleanUsername || `miner_${Math.floor(1000 + Math.random() * 9000)}`,
        balance: 2.0,
        ASHBalance: 0,
        stakingUnlocked: false,
        mining: { isActive: false, startTime: null, lastSync: Date.now() },
        boosts: { normalEndTime: 0, premiumEndTime: 0 },
        lastDailyClaim: 0,
        referralCode: myReferralCode,
        referredBy: referrerUid,
        referralCount: 0,
        createdAt: serverTimestamp(),
        kycStatus: 'none',
        isPremium: false,
        lastLogin: serverTimestamp(),
        security: { biometric: false, twoFA: false },
        twoFA: { emailVerified: false, phoneVerified: false },
      });

      if (referrerUid) {
        await updateDoc(doc(db, 'users', referrerUid), {
          referralCount: increment(1),
          balance: increment(0.5),
        });
        try {
          await setDoc(doc(db, 'users', referrerUid, 'transactions', Date.now().toString()), {
            type: 'referral_bonus',
            amount: 0.5,
            description: `Referral bonus - ${cleanDisplayName} joined`,
            balanceAfter: 0,
            createdAt: Date.now(),
          });
        } catch (_) {}
      }

      await AsyncStorage.setItem('ash_auth_credentials', JSON.stringify({
        email: cleanEmail,
        password: formData.password,
      }));

      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.data();
      useAuthStore.getState().setUser(user.uid, {
        uid: user.uid,
        email: user.email,
        displayName: cleanDisplayName,
        photoURL: data?.photoURL || null,
      });

      Alert.alert(
        t.registerSuccess,
        `${t.verificationEmailSent}${referrerUid ? `\n${t.referrerCredited}` : ''}`,
        [{ text: t.ok, onPress: () => router.replace('/(main)/dashboard') }]
      );
    } catch (error: any) {
      console.error('[REGISTER] Error:', error.code);
      let message = t.systemError;
      if (error.code === 'auth/email-already-in-use') {
        message = t.emailAlreadyUsed;
      } else if (error.code === 'auth/invalid-email') {
        message = t.invalidEmail;
      } else if (error.code === 'auth/weak-password') {
        message = t.weakPassword;
      } else if (error.code === 'auth/network-request-failed') {
        message = t.networkError;
      }
      Alert.alert(t.registerFailed, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>ASH</Text>
            <Text style={[styles.title, { color: colors.text }]}>{t.joinNow}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.startMiningJourney}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.fullName}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={t.fullNamePlaceholder}
                placeholderTextColor={colors.textSecondary}
                value={formData.displayName}
                onChangeText={(v) => setFormData({ ...formData, displayName: v })}
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.email}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="email@provider.com"
                placeholderTextColor={colors.textSecondary}
                value={formData.email}
                onChangeText={(v) => setFormData({ ...formData, email: v })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.password}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={t.passwordMinLength}
                placeholderTextColor={colors.textSecondary}
                value={formData.password}
                onChangeText={(v) => setFormData({ ...formData, password: v })}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.confirmPassword}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={language === 'id' ? 'Ulangi password' : 'Repeat password'}
                placeholderTextColor={colors.textSecondary}
                value={formData.confirmPassword}
                onChangeText={(v) => setFormData({ ...formData, confirmPassword: v })}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.referralCode}</Text>
              <TextInput
                style={[styles.input, styles.referralInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={language === 'id' ? 'Masukkan kode teman' : 'Enter friend\'s code'}
                placeholderTextColor={colors.textSecondary}
                value={formData.referralCode}
                onChangeText={(v) => setFormData({ ...formData, referralCode: v })}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!params.ref}
              />
              {params.ref && (
                <Text style={[styles.referralHint, { color: colors.primary }]}>{t.referralHint} {params.ref}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.buttonText}>{t.createAccount}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t.alreadyHaveAccount} </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={[styles.linkText, { color: colors.primary }]}>{t.login}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 32, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 48, fontWeight: '900', color: '#fbbf24', letterSpacing: 4 },
  title: { fontSize: 24, fontWeight: '700', marginTop: -8, letterSpacing: 2 },
  subtitle: { fontSize: 14, marginTop: 8 },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  input: { borderRadius: 14, padding: 16, fontSize: 16, borderWidth: 1 },
  referralInput: { borderStyle: 'dashed' },
  referralHint: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  button: { borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 12 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#0f172a', fontSize: 16, fontWeight: '900' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14 },
  linkText: { fontSize: 14, fontWeight: '800' },
});
