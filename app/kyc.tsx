// app/kyc.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Camera, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytes } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { useSettingsStore, themes, translations } from '../src/stores/useSettingsStore';
import { useAuthStore } from '../src/stores/useAuthStore';
import { db, storage } from '../src/lib/firebase';

export default function KYCScreen() {
  const router = useRouter();
  const { theme, language } = useSettingsStore();
  const colors = themes[theme];
  const t = translations[language];
  const { uid } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idImage, setIdImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    Alert.alert(
      t.uploadIdPhoto,
      t.chooseSource,
      [
        { text: t.takePhoto, onPress: () => launchCamera() },
        { text: t.chooseGallery, onPress: () => launchGallery() },
        { text: t.cancel, style: "cancel" }
      ]
    );
  };

  const launchCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setIdImage(result.assets[0].uri);
  };

  const launchGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setIdImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!fullName || !address || !idNumber || !idImage) {
      Alert.alert(t.incomplete, t.incompleteDesc);
      return;
    }
    if (!uid) return;
    setSubmitting(true);
    try {
      let photoURL = '';
      if (idImage) {
        const base64 = await FileSystem.readAsStringAsync(idImage, {
          encoding: 'base64',
        });
        const mimeType = idImage.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const blob = await new Promise<Blob>((resolve, reject) => {
          const bstr = atob(base64);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);
          resolve(new Blob([u8arr], { type: mimeType }));
        });
        const fileRef = ref(storage, `kyc/${uid}/id_photo`);
        await uploadBytes(fileRef, blob);
        photoURL = `kyc/${uid}/id_photo`;
      }
      await updateDoc(doc(db, 'users', uid), {
        kycStatus: 'pending',
        kycData: {
          fullName,
          address,
          idNumber,
          photoURL,
          submittedAt: Date.now(),
        },
      });
      Alert.alert(t.success, `${t.kycSubmitted} ${t.kycNotification}`, [{
        text: t.ok, onPress: () => router.back(),
      }]);
    } catch (err) {
      console.error('[KYC] Submit failed:', err);
      Alert.alert(t.error, t.kycSubmitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t.kycTitle}</Text>
          <View style={{width: 24}} />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.fullNameLabel}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder={t.fullNamePlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.address}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder={t.addressPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.idNumber}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder={t.idNumberPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={idNumber}
            onChangeText={setIdNumber}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.uploadIdPhoto}</Text>
          <TouchableOpacity style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickImage}>
            {idImage ? (
              <Image source={{ uri: idImage }} style={styles.previewImage} />
            ) : (
              <>
                <Camera size={32} color={colors.textSecondary} />
                <Text style={[styles.uploadText, { color: colors.textSecondary }]}>{t.tapToUpload}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: submitting ? colors.border : colors.primary }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <>
              <ShieldCheck size={20} color="#fff" />
              <Text style={styles.submitText}>{language === 'id' ? 'KIRIM UNTUK REVIEW' : 'SUBMIT FOR REVIEW'}</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  uploadBox: { height: 150, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderRadius: 12 },
  uploadText: { marginTop: 8, fontSize: 14 },
  previewImage: { width: '100%', height: '100%', borderRadius: 10 },
  submitBtn: { flexDirection: 'row', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
