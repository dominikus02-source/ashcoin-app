// app/(main)/profile.tsx
import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { signOut, updateProfile, sendEmailVerification } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  Camera, ChevronRight, Edit2, FileText, Globe,
  Lock, LogOut, Moon, ShieldCheck, Sun, Shield, X, Check, Mail, Smartphone
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert, Image, Linking, Modal, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, storage } from '../../src/lib/firebase';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { translations, useSettingsStore, themes } from '../../src/stores/useSettingsStore';

const AUTH_CACHE_KEY = 'ash_auth_credentials';

const LINKS = {
  privacyPolicy: 'https://ashcoin-landing.web.app/privacy-policy.html',
  termsOfService: 'https://ashcoin-landing.web.app/terms-of-service.html',
  website: 'https://ashcoin-landing.web.app/',
  whitepaper: 'https://ashcoin-landing.web.app/ASH_Protocol_Ultimate_Whitepaper_v1.2.pdf',
  telegram: 'https://t.me/ashcoin_official',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { uid, userMeta, clearUser, setMeta } = useAuthStore();
  const { language, theme, setLanguage, setTheme } = useSettingsStore();

  const colors = themes[theme];
  const t = translations[language];

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(userMeta?.displayName || '');
  const [hasEdited, setHasEdited] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [showTwoFAModal, setShowTwoFAModal] = useState(false);
  const [twoFAEmailVerified, setTwoFAEmailVerified] = useState(false);
  const [twoFAPhoneVerified, setTwoFAPhoneVerified] = useState(false);
  const [twoFAEmailSent, setTwoFAEmailSent] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [phoneOTP, setPhoneOTP] = useState('');
  const [phoneOTPSent, setPhoneOTPSent] = useState(false);
  const [phoneOTPCorrect, setPhoneOTPCorrect] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [piUsername, setPiUsername] = useState('');
  const [isEditingPi, setIsEditingPi] = useState(false);
  const [newPiUsername, setNewPiUsername] = useState('');

  useEffect(() => {
    if (!uid) return;
    const checkStatus = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data();
          setHasEdited(data.hasEditedProfile || false);
          setBiometricEnabled(data.security?.biometric || false);
          setTwoFAEnabled(data.security?.twoFA || false);
          setTwoFAEmailVerified(data.twoFA?.emailVerified || false);
          setTwoFAPhoneVerified(data.twoFA?.phoneVerified || false);
          setPiUsername(data.piUsername || '');
          setNewPiUsername(data.piUsername || '');
          const firestoreName = data.displayName || data.username;
          if (firestoreName) {
            setNewName(firestoreName);
            if (!userMeta?.displayName) {
              setMeta({ displayName: firestoreName, username: data.username });
            }
          }
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      }
    };
    checkStatus();
  }, [uid]);

  const handleSaveName = async () => {
    if (!newName.trim() || !uid) return;
    try {
      await updateDoc(doc(db, 'users', uid), { displayName: newName, hasEditedProfile: true });
      setMeta({ displayName: newName });
      setHasEdited(true);
      setIsEditingName(false);
      Alert.alert(t.success, t.nameSaved);
    } catch (error) {
      Alert.alert(t.error, t.nameSaveFailed);
    }
  };

  const handleSavePiUsername = async () => {
    if (!newPiUsername.trim() || !uid) return;
    try {
      await updateDoc(doc(db, 'users', uid), { piUsername: newPiUsername.trim() });
      setPiUsername(newPiUsername.trim());
      setIsEditingPi(false);
      Alert.alert(t.success, t.piUsernameSaved);
    } catch (error) {
      Alert.alert(t.error, t.piUsernameFailed);
    }
  };

  const toggleBiometric = async () => {
    if (!uid) return;
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      Alert.alert(t.error, 'Device ini tidak mendukung biometrik.');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify Identity',
      fallbackLabel: 'Use PIN',
    });
    if (result.success) {
      const newStatus = !biometricEnabled;
      setBiometricEnabled(newStatus);
      await updateDoc(doc(db, 'users', uid), { 'security.biometric': newStatus });
    }
  };

  const handleToggleTwoFA = async (val: boolean) => {
    if (!uid) return;
    if (val && (!twoFAEmailVerified && !twoFAPhoneVerified)) {
      setShowTwoFAModal(true);
      return;
    }
    setTwoFAEnabled(val);
    await updateDoc(doc(db, 'users', uid), { 'security.twoFA': val });
  };

  const handleOpenTwoFA = () => {
    if (twoFAEnabled) {
      Alert.alert(t.twoFAActive, t.twoFAActiveDesc, [{ text: t.ok }]);
    } else {
      setShowTwoFAModal(true);
    }
  };

  const handleSendEmailVerification = async () => {
    if (!auth.currentUser) return;
    setVerifyingEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setTwoFAEmailSent(true);
      Alert.alert(t.emailSent, `${t.emailSentDesc} ${auth.currentUser.email}. ${t.checkInbox}`);
    } catch (err) {
      Alert.alert(t.error, t.emailSendFailed);
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleCheckEmailVerified = async () => {
    if (!auth.currentUser) return;
    setVerifyingEmail(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setTwoFAEmailVerified(true);
        await updateDoc(doc(db, 'users', uid!), { 'twoFA.emailVerified': true, 'security.twoFA': true });
        setTwoFAEnabled(true);
        setShowTwoFAModal(false);
        Alert.alert(t.success, t.emailVerified);
      } else {
        Alert.alert(t.notVerifiedYet, t.notVerifiedYetDesc);
      }
    } catch (err) {
      Alert.alert(t.error, t.verificationCheckFailed);
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleSendPhoneOTP = async () => {
    if (!pendingPhone || !uid) return;
    const cleanPhone = pendingPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert(t.invalidPhone, t.invalidPhoneDesc);
      return;
    }
    setVerifyingPhone(true);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setPhoneOTPCorrect(otp);
      await updateDoc(doc(db, 'users', uid), { 'twoFA.pendingPhone': cleanPhone, 'twoFA.phoneOTP': otp, 'twoFA.phoneOTPExpiry': Date.now() + 300000 });
      setPhoneOTPSent(true);
      Alert.alert(t.otpSent, `${t.otpSentDesc}: ${otp}\n\nNote: In production, this would be sent via SMS.`);
    } catch (err) {
      Alert.alert(t.error, t.otpSendFailed);
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!phoneOTP || !uid) return;
    if (phoneOTP !== phoneOTPCorrect) {
      Alert.alert(t.wrongCode, t.wrongCodeDesc);
      return;
    }
    try {
      setTwoFAPhoneVerified(true);
      await updateDoc(doc(db, 'users', uid), { 'twoFA.phoneVerified': true, 'twoFA.phoneNumber': pendingPhone, 'twoFA.phoneOTP': null, 'security.twoFA': true });
      setTwoFAEnabled(true);
      setShowTwoFAModal(false);
      setPendingPhone('');
      setPhoneOTP('');
      setPhoneOTPSent(false);
      Alert.alert(t.success, t.phoneVerified);
    } catch (err) {
      Alert.alert(t.error, t.otpVerifyFailed);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t.logoutTitle, t.logoutDesc, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.logout,
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            await AsyncStorage.removeItem(AUTH_CACHE_KEY);
            await AsyncStorage.removeItem('ash-auth-storage');
            clearUser();
            router.replace('/');
          } catch (error) {
            Alert.alert(t.error, t.logoutFailed);
          }
        },
      },
    ]);
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert(t.error, 'Tidak bisa membuka link.'));
  };

  const handleUploadPhoto = async () => {
    if (!uid) {
      Alert.alert(t.error, 'You must be logged in to upload a photo.');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t.permissionRequired, t.permissionRequiredDesc);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setIsUploadingPhoto(true);
    try {
      const uri = result.assets[0].uri;
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const mimeType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const blob = await new Promise<Blob>((resolve, reject) => {
        const bstr = atob(base64);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        resolve(new Blob([u8arr], { type: mimeType }));
      });
      const fileRef = ref(storage, `avatars/${uid}`);
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);
      await updateDoc(doc(db, 'users', uid), { photoURL: downloadURL });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }
      setMeta({ photoURL: downloadURL });
      Alert.alert(t.success, t.photoUploadSuccess);
    } catch (err) {
      console.error('[PROFILE] Upload photo failed:', err);
      Alert.alert(t.error, t.photoUploadFailed);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const displayName = userMeta?.displayName || newName || t.miner;
  const username = userMeta?.username || userMeta?.email?.split('@')[0] || '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <TouchableOpacity onPress={handleUploadPhoto} disabled={isUploadingPhoto} style={styles.avatarWrapper}>
            {isUploadingPhoto ? (
              <ActivityIndicator size="small" color="#fbbf24" style={styles.avatar} />
            ) : (
              <Image source={{ uri: userMeta?.photoURL || 'https://via.placeholder.com/150' }} style={styles.avatar} />
            )}
            <View style={styles.cameraIconWrap}>
              {isUploadingPhoto ? <ActivityIndicator size="small" color="#fff" /> : <Camera size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>@{username}</Text>
          <Text style={[styles.tapHint, { color: colors.textSecondary }]}>{t.tapAvatar}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.account}</Text>
        <View style={[styles.menuGroup, { borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border, opacity: hasEdited ? 0.5 : 1 }]}
            onPress={() => !hasEdited && setIsEditingName(true)}
            disabled={hasEdited}
          >
            <Edit2 size={20} color={hasEdited ? colors.textSecondary : colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>{hasEdited ? t.nameLocked : t.editName}</Text>
            {hasEdited ? <Lock size={16} color={colors.error} /> : <ChevronRight size={16} color={colors.textSecondary} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => router.push('/kyc')}>
            <ShieldCheck size={20} color={colors.success} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t.kycVerification}</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomWidth: 0, borderTopWidth: 1, borderTopColor: colors.border }]} 
            onPress={() => setIsEditingPi(true)}
          >
            <Globe size={20} color="#fbbf24" />
            <View style={{flex: 1}}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t.piNetworkUsername}</Text>
              <Text style={[styles.subText, { color: colors.textSecondary }]}>{piUsername || t.notLinked}</Text>
            </View>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.security}</Text>
        <View style={[styles.menuGroup, { borderColor: colors.border }]}>
          <View style={[styles.menuItem, { borderBottomColor: colors.border, justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Lock size={20} color={colors.primary} />
              <View>
                <Text style={[styles.menuText, { color: colors.text }]}>{t.biometricLogin}</Text>
                <Text style={[styles.subText, { color: colors.textSecondary }]}>{t.faceIdFingerprint}</Text>
              </View>
            </View>
            <Switch trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" onValueChange={toggleBiometric} value={biometricEnabled} />
          </View>
          <View style={[styles.menuItem, { borderBottomWidth: 0, justifyContent: 'space-between' }]}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }} onPress={handleOpenTwoFA}>
              <ShieldCheck size={20} color={colors.primary} />
              <View>
                <Text style={[styles.menuText, { color: colors.text }]}>{t.twoFactorAuth}</Text>
                <Text style={[styles.subText, { color: colors.textSecondary }]}>
                  {twoFAEnabled ? t.enabled : twoFAEmailVerified || twoFAPhoneVerified ? t.setupIncomplete : t.notConfigured}
                </Text>
              </View>
            </TouchableOpacity>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
              onValueChange={handleToggleTwoFA}
              value={twoFAEnabled}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.preferences}</Text>
        <View style={[styles.menuGroup, { borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => setLanguage(language === 'id' ? 'en' : 'id')}>
            <Globe size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t.language}: {language.toUpperCase()}</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={20} color={colors.primary} /> : <Moon size={20} color={colors.textSecondary} />}
            <Text style={[styles.menuText, { color: colors.text }]}>{t.theme}: {theme === 'dark' ? t.darkTheme : t.lightTheme}</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.resources}</Text>
        <View style={[styles.menuGroup, { borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => openLink(LINKS.website)}>
            <Globe size={20} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t.officialWebsite}</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => openLink(LINKS.whitepaper)}>
            <FileText size={20} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t.whitepaper}</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => openLink(LINKS.telegram)}>
            <Globe size={20} color="#29a4e0" />
            <Text style={[styles.menuText, { color: colors.text }]}>{t.telegramCommunity}</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.legal}</Text>
        <View style={[styles.menuGroup, { borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => openLink(LINKS.privacyPolicy)}>
            <Shield size={20} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t.privacyPolicy}</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => openLink(LINKS.termsOfService)}>
            <FileText size={20} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t.termsOfService}</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.versionBox, { borderColor: colors.border }]}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>ASH COIN v1.0.0</Text>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>com.ashcoin.app</Text>
        </View>

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.border }]} onPress={handleLogout}>
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>{t.logout}</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal visible={isEditingName} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.editName}</Text>
              <TouchableOpacity onPress={() => setIsEditingName(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textSecondary, marginBottom: 4, fontSize: 12 }}>{t.fullName}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={newName} onChangeText={setNewName}
              placeholder={t.fullNamePlaceholder} placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border, flexDirection: 'row', gap: 6 }]} onPress={() => setIsEditingName(false)}>
                <X size={16} color={colors.text} />
                <Text style={{ color: colors.text, fontWeight: '700' }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleSaveName}>
                <Check size={16} color="#0f172a" />
                <Text style={{ color: '#0f172a', fontWeight: '700' }}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditingPi} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.linkPiNetwork}</Text>
              <TouchableOpacity onPress={() => setIsEditingPi(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textSecondary, marginBottom: 4, fontSize: 12 }}>{t.piUsername}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={newPiUsername} onChangeText={setNewPiUsername}
              placeholder={t.piUsernamePlaceholder} placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border, flexDirection: 'row', gap: 6 }]} onPress={() => setIsEditingPi(false)}>
                <X size={16} color={colors.text} />
                <Text style={{ color: colors.text, fontWeight: '700' }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleSavePiUsername}>
                <Check size={16} color="#0f172a" />
                <Text style={{ color: '#0f172a', fontWeight: '700' }}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showTwoFAModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, width: '92%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.setup2FA}</Text>
              <TouchableOpacity onPress={() => setShowTwoFAModal(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.subText, { color: colors.textSecondary, marginBottom: 20 }]}>
              {t.verifyAtLeastOne}
            </Text>

            <View style={[styles.twoFABox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Mail size={20} color={twoFAEmailVerified ? '#00ff88' : colors.primary} />
                <Text style={[styles.menuText, { color: colors.text, flex: 1 }]}>{t.emailVerification}</Text>
                {twoFAEmailVerified ? (
                  <Check size={16} color="#00ff88" />
                ) : twoFAEmailSent ? (
                  <TouchableOpacity onPress={handleCheckEmailVerified} disabled={verifyingEmail}>
                    {verifyingEmail ? <ActivityIndicator size="small" color={colors.primary} /> : (
                      <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>{t.check}</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
              {twoFAEmailVerified ? (
                <Text style={[styles.subText, { color: '#00ff88' }]}>{t.verified}</Text>
              ) : (
                <>
                  <Text style={[styles.subText, { color: colors.textSecondary, marginBottom: 8 }]}>
                    {t.sentTo} {auth.currentUser?.email || '...'}
                  </Text>
                  {!twoFAEmailSent ? (
                    <TouchableOpacity
                      style={[styles.twoFABtn, { backgroundColor: colors.primary }]}
                      onPress={handleSendEmailVerification}
                      disabled={verifyingEmail}
                    >
                      {verifyingEmail ? <ActivityIndicator size="small" color="#0f172a" /> : (
                        <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 13 }}>{t.sendVerificationLink}</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.twoFABtn, { backgroundColor: colors.border }]}
                      onPress={handleCheckEmailVerified}
                      disabled={verifyingEmail}
                    >
                      {verifyingEmail ? <ActivityIndicator size="small" color={colors.textSecondary} /> : (
                        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>{t.iveVerified}</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            <View style={[styles.twoFABox, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Smartphone size={20} color={twoFAPhoneVerified ? '#00ff88' : colors.primary} />
                <Text style={[styles.menuText, { color: colors.text, flex: 1 }]}>{t.phoneVerification}</Text>
                {twoFAPhoneVerified ? <Check size={16} color="#00ff88" /> : null}
              </View>
              {twoFAPhoneVerified ? (
                <Text style={[styles.subText, { color: '#00ff88' }]}>{t.verified}</Text>
              ) : !phoneOTPSent ? (
                <>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    placeholder={t.phonePlaceholder}
                    placeholderTextColor={colors.textSecondary}
                    value={pendingPhone}
                    onChangeText={setPendingPhone}
                    keyboardType="phone-pad"
                  />
                  <TouchableOpacity
                    style={[styles.twoFABtn, { backgroundColor: colors.primary, marginTop: 8 }]}
                    onPress={handleSendPhoneOTP}
                    disabled={verifyingPhone}
                  >
                    {verifyingPhone ? <ActivityIndicator size="small" color="#0f172a" /> : (
                      <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 13 }}>{t.sendOtp}</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.subText, { color: colors.textSecondary, marginBottom: 8 }]}>
                    {t.otpSentDesc} {pendingPhone}. {t.otpEnterDesc}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    placeholder={t.enterOtp}
                    placeholderTextColor={colors.textSecondary}
                    value={phoneOTP}
                    onChangeText={setPhoneOTP}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={[styles.twoFABtn, { backgroundColor: colors.primary, marginTop: 8 }]}
                    onPress={handleVerifyPhoneOTP}
                  >
                    <Text style={{ color: '#0f172a', fontWeight: '700', fontSize: 13 }}>{t.verifyOtp}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setPhoneOTPSent(false); setPhoneOTP(''); }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, textAlign: 'center' }}>{t.resendOtp}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border, marginTop: 20 }]} onPress={() => setShowTwoFAModal(false)}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', marginBottom: 12, borderWidth: 2, borderColor: '#fbbf24', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  avatar: { width: '100%', height: '100%' },
  cameraIconWrap: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0f172a', padding: 4, borderRadius: 12 },
  name: { fontSize: 22, fontWeight: '700' },
  email: { fontSize: 14, marginTop: 4 },
  tapHint: { fontSize: 11, marginTop: 6 },
  sectionTitle: { fontSize: 11, fontWeight: '700', marginBottom: 8, marginTop: 20, letterSpacing: 1.5 },
  menuGroup: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1 },
  menuText: { fontSize: 15, fontWeight: '500', flex: 1 },
  subText: { fontSize: 12, marginTop: 2 },
  versionBox: { marginTop: 20, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 4 },
  versionText: { fontSize: 12, fontFamily: 'monospace' },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, padding: 16, borderRadius: 16 },
  logoutText: { fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  twoFABox: { borderWidth: 1, borderRadius: 12, padding: 14 },
  twoFABtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
});
