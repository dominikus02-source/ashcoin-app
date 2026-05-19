// app/(auth)/login.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../src/lib/firebase';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useSettingsStore, themes, translations } from '../../src/stores/useSettingsStore';
import { X, Mail } from 'lucide-react-native';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { theme, language } = useSettingsStore();
  const colors = themes[theme];
  const t = translations[language];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      Alert.alert(t.error, t.emailRequired);
      return;
    }
    if (!password) {
      Alert.alert(t.error, t.passwordRequired);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      await AsyncStorage.setItem('ash_auth_credentials', JSON.stringify({
        email: cleanEmail,
        password,
      }));

      setUser(user.uid, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      Alert.alert(t.success, t.loginSuccess, [
        { text: t.ok, onPress: () => router.replace('/(main)/dashboard') }
      ]);
    } catch (error: any) {
      console.error('[LOGIN] Error:', error.code);
      let message = t.systemError;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = language === 'id' ? 'Email atau password salah.' : 'Wrong email or password.';
      } else if (error.code === 'auth/invalid-email') {
        message = t.invalidEmail;
      } else if (error.code === 'auth/too-many-requests') {
        message = language === 'id' ? 'Terlalu banyak percobaan. Coba lagi nanti.' : 'Too many attempts. Try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        message = t.networkError;
      }
      Alert.alert(t.loginFailed, message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.signOut();
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error('No ID token from Google');
      }

      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);
      const user = userCredential.user;

      setUser(user.uid, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      Alert.alert(t.success, t.loginSuccess, [
        { text: t.ok, onPress: () => router.replace('/(main)/dashboard') }
      ]);
    } catch (error: any) {
      console.error('[GOOGLE LOGIN] Error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return;
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(t.error, 'Google Play Services not available');
      } else {
        Alert.alert(t.loginFailed, t.systemError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert(t.error, t.emailRequired);
      return;
    }
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setShowForgotModal(false);
      Alert.alert(t.success, t.resetLinkSent);
    } catch (error: any) {
      let message = t.systemError;
      if (error.code === 'auth/user-not-found') {
        message = language === 'id' ? 'Email tidak terdaftar.' : 'Email not registered.';
      } else if (error.code === 'auth/invalid-email') {
        message = t.invalidEmail;
      }
      Alert.alert(t.error, message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>ASH</Text>
            <Text style={[styles.title, { color: colors.text }]}>{t.login}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.welcomeBack}</Text>
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, { backgroundColor: '#ffffff', borderColor: colors.border }]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <View style={styles.googleIcon}>
              <Text style={{ fontSize: 20 }}>G</Text>
            </View>
            <Text style={[styles.googleText, { color: '#1e293b' }]}>
              {language === 'id' ? 'Masuk dengan Google' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{language === 'id' ? 'atau' : 'or'}</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.email}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="email@provider.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.password}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity onPress={() => setShowForgotModal(true)} style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>{t.forgotPassword}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.buttonText}>{t.login.toUpperCase()}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t.dontHaveAccount} </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={[styles.linkText, { color: colors.primary }]}>{t.register}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showForgotModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.forgotPasswordTitle}</Text>
              <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>{t.forgotPasswordDesc}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, marginTop: 12 }]}
              placeholder="email@provider.com"
              placeholderTextColor={colors.textSecondary}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary, marginTop: 16 }, forgotLoading && styles.buttonDisabled]}
              onPress={handleForgotPassword}
              disabled={forgotLoading}
            >
              {forgotLoading ? <ActivityIndicator color="#0f172a" /> : (
                <Text style={styles.buttonText}>{t.sendResetLink}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingVertical: 32, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 48, fontWeight: '900', color: '#fbbf24', letterSpacing: 4 },
  title: { fontSize: 24, fontWeight: '700', marginTop: -8, letterSpacing: 2 },
  subtitle: { fontSize: 14, marginTop: 8 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16, gap: 10 },
  googleIcon: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12 },
  googleText: { fontSize: 15, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 12, fontSize: 13 },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  input: { borderRadius: 14, padding: 16, fontSize: 16, borderWidth: 1 },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 13, fontWeight: '600' },
  button: { borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#0f172a', fontSize: 16, fontWeight: '900' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14 },
  linkText: { fontSize: 14, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 24, padding: 24, borderWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalDesc: { fontSize: 14, lineHeight: 20 },
});
