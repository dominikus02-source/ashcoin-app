// app/(main)/wallet.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDownLeft, ArrowUpRight, Copy, Lock, Minus, Plus, Send, Wifi, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert, Linking, Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useMiningSync } from '../../src/hooks/useMiningSync';
import { PI_CONFIG } from '../../src/lib/piConfig';
import { themes, useSettingsStore, translations } from '../../src/stores/useSettingsStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { db } from '../../src/lib/firebase';

type Transaction = {
  id: string;
  type: string;
  amount: number;
  fee?: number;
  description: string;
  balanceAfter: number;
  createdAt: number;
};

export default function WalletScreen() {
  const { uid, userMeta } = useAuthStore();
  const { miningData, displayBalance, transferAsh, transferToStaking, transferFromStaking, TRANSFER_GAS_FEE, STAKING_UNLOCK_THRESHOLD, STAKING_TRANSFER_PCT } = useMiningSync();
  const { language, theme } = useSettingsStore();
  const colors = themes[theme];
  const t = translations[language];
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  const [showSendModal, setShowSendModal] = useState(false);
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState<string | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showStakingModal, setShowStakingModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [stakingAmount, setStakingAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [stakingTransfer, setStakingTransfer] = useState(false);
  const [withdrawTransfer, setWithdrawTransfer] = useState(false);

  const liquidBalance = displayBalance > 0 ? displayBalance : (miningData?.balance || 0);
  const ashBalance = miningData?.ASHBalance || 0;
  const isKycVerified = miningData?.kycStatus === 'approved';
  const stakingUnlocked = miningData?.stakingUnlocked || false;
  const maxTransferable = stakingUnlocked ? liquidBalance * STAKING_TRANSFER_PCT : 0;
  const progressToUnlock = Math.min((liquidBalance / STAKING_UNLOCK_THRESHOLD) * 100, 100);

  useEffect(() => {
    if (!uid) return;
    setLoadingTx(true);
    const q = query(collection(db, 'users', uid, 'transactions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const txs: Transaction[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(txs);
      setLoadingTx(false);
    });
    return () => unsub();
  }, [uid]);

  const getFiatValue = (ashAmount: number) => {
    if (language === 'id') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(ashAmount * PI_CONFIG.ashPriceIdr);
    } else {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(ashAmount * PI_CONFIG.ashPriceUsd);
    }
  };

  const handleConnectPi = async () => {
    const supported = await Linking.canOpenURL(PI_CONFIG.piBrowserUrl);
    if (supported) {
      await Linking.openURL(PI_CONFIG.piBrowserUrl);
    } else {
      Alert.alert(t.piBrowserNotFound, t.piBrowserNotFoundDesc);
      await Linking.openURL('https://minepi.com');
    }
  };

  const searchRecipient = async (input: string) => {
    setSendRecipient(input);
    if (!input || input.length < 6) { setRecipientPreview(null); return; }
    setSearchingUser(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const found = snap.docs.find((d) => {
        const data = d.data();
        return data.uid === input || data.referralCode === input?.toUpperCase();
      });
      if (found && found.id !== uid) {
        setRecipientPreview(found.data().displayName || found.data().username || found.id);
      } else {
        setRecipientPreview(null);
      }
    } catch {
      setRecipientPreview(null);
    }
    setSearchingUser(false);
  };

  const handleSendAsh = async () => {
    if (!isKycVerified) {
      Alert.alert(t.kycRequired, t.kycRequiredDesc);
      return;
    }
    if (liquidBalance <= 0) {
      Alert.alert(t.insufficientBalance, t.insufficientBalanceDesc);
      return;
    }
    setShowSendModal(true);
  };

  const handleConfirmSend = async () => {
    const amount = parseFloat(sendAmount);
    if (!amount || amount <= 0) {
      Alert.alert(t.invalidAmount, t.invalidAmountDesc);
      return;
    }
    if (!sendRecipient || sendRecipient.length < 6) {
      Alert.alert(t.invalidAddress, t.invalidAddressDesc);
      return;
    }
    setSending(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const recipientDoc = snap.docs.find((d) => {
        const data = d.data();
        return data.uid === sendRecipient || data.referralCode === sendRecipient?.toUpperCase();
      });
      const recipientUid = recipientDoc?.id;
      if (!recipientUid) {
        Alert.alert(t.recipientNotFoundTitle, t.recipientNotFoundDesc);
        setSending(false);
        return;
      }
      const result = await transferAsh(recipientUid, amount);
      if (result === 'SUCCESS') {
        Alert.alert(t.transferSuccessful, `${t.transferSent} ${amount.toFixed(6)} ASH (Fee: ${TRANSFER_GAS_FEE.toFixed(6)} ASH)`);
        setShowSendModal(false);
        setSendRecipient('');
        setSendAmount('');
        setRecipientPreview(null);
      } else if (result === 'INSUFFICIENT_BALANCE') {
        Alert.alert(t.insufficientBalance, t.insufficientBalanceDesc);
      } else if (result === 'CANNOT_SELF') {
        Alert.alert(t.cannotSelfTransfer, t.cannotSelfTransferDesc);
      } else if (result === 'RECIPIENT_NOT_FOUND') {
        Alert.alert(t.recipientNotFoundTitle, t.recipientNotFoundDesc);
      } else {
        Alert.alert(t.error, t.transferFailed);
      }
    } catch (err) {
      console.error('[WALLET] Send error:', err);
      Alert.alert(t.error, t.transferFailed);
    } finally {
      setSending(false);
    }
  };

  const handleConfirmStakingTransfer = async () => {
    const amount = parseFloat(stakingAmount);
    if (!amount || amount <= 0) {
      Alert.alert(t.invalidAmount, t.invalidAmountDesc);
      return;
    }
    if (amount > maxTransferable) {
      Alert.alert(t.exceedsLimit, `${t.exceedsLimitDesc} ${maxTransferable.toFixed(6)} ASH (1% ${t.totalBalance.toLowerCase()}).`);
      return;
    }
    setStakingTransfer(true);
    try {
      const result = await transferToStaking(amount);
      if (result === 'SUCCESS') {
        Alert.alert(t.success, `${amount.toFixed(6)} ASH ${language === 'id' ? 'dipindahkan ke' : 'moved to'} Staking.`);
        setShowStakingModal(false);
        setStakingAmount('');
      } else if (result === 'LOCKED_NEED_10K') {
        Alert.alert(t.locked, `${t.lockedDesc} ${STAKING_UNLOCK_THRESHOLD.toLocaleString()} ASH ${t.toUnlockStaking}.`);
      } else {
        Alert.alert(t.error, t.transferFailed);
      }
    } catch (err) {
      console.error('[WALLET] Staking transfer error:', err);
      Alert.alert(t.error, t.transferFailed);
    } finally {
      setStakingTransfer(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      Alert.alert(t.invalidAmount, t.invalidAmountDesc);
      return;
    }
    if (amount > ashBalance) {
      Alert.alert(t.insufficientBalance, t.insufficientStakingBalance);
      return;
    }
    setWithdrawTransfer(true);
    try {
      const result = await transferFromStaking(amount);
      if (result === 'SUCCESS') {
        Alert.alert(t.success, `${amount.toFixed(6)} ASH ${t.transferFromStakingSuccess}`);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
      } else {
        Alert.alert(t.error, t.transferFailed);
      }
    } catch (err) {
      console.error('[WALLET] Withdraw error:', err);
      Alert.alert(t.error, t.transferFailed);
    } finally {
      setWithdrawTransfer(false);
    }
  };

  const sendAmountNum = parseFloat(sendAmount) || 0;
  const totalCost = sendAmountNum + TRANSFER_GAS_FEE;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t.wallet}</Text>
          <TouchableOpacity onPress={() => setShowReceiveModal(true)}>
            <Text style={[styles.receiveBtn, { color: colors.primary }]}>{t.receive}</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient colors={[colors.card, colors.background]} style={styles.balanceCard}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.availableBalance}</Text>
          <Text style={[styles.balance, { color: colors.text }]}>{liquidBalance.toFixed(6)}</Text>
          <Text style={[styles.currency, { color: colors.primary }]}>ASH</Text>
          <Text style={[styles.fiatValue, { color: colors.textSecondary }]}>{getFiatValue(liquidBalance)}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.border }]}
              onPress={() => Alert.alert(t.deposit, `${t.deposit} via Bank/Card ${language === 'id' ? 'segera hadir' : 'coming soon'}`)}
            >
              <Plus size={18} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>{t.deposit}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.lockedBtn, { backgroundColor: colors.border }]} disabled>
              <Minus size={18} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>{t.withdraw}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, !isKycVerified && styles.kycLockedBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSendAsh}
            >
              <Send size={18} color={isKycVerified ? colors.text : colors.textSecondary} />
              <Text style={[styles.actionText, { color: isKycVerified ? colors.text : colors.textSecondary }]}>
                {isKycVerified ? t.send : 'KYC'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={[styles.stakedCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <Lock size={16} color={colors.primary} />
            <Text style={[styles.stakedLabel, { color: colors.primary }]}>{t.stakingBalance}</Text>
          </View>
          <Text style={[styles.stakedBalance, { color: colors.text }]}>{ashBalance.toFixed(4)} ASH</Text>
          <Text style={[styles.stakedDesc, { color: colors.textSecondary }]}>{t.availableInStaking}</Text>
        </View>

        <TouchableOpacity
          style={[styles.stakingTransferCard, { backgroundColor: colors.card, borderColor: stakingUnlocked ? '#10b981' : colors.border }]}
          onPress={() => stakingUnlocked ? setShowStakingModal(true) : null}
          disabled={!stakingUnlocked}
        >
          <View style={styles.stakingHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              {stakingUnlocked ? (
                <View style={[styles.stakingIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Lock size={20} color="#10b981" />
                </View>
              ) : (
                <View style={[styles.stakingIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                  <Lock size={20} color="#fbbf24" />
                </View>
              )}
              <View style={{flex: 1}}>
                <Text style={[styles.stakingTitle, { color: colors.text }]}>
                  {stakingUnlocked ? t.transferToStaking : t.stakingLocked}
                </Text>
                <Text style={[styles.stakingSubtitle, { color: colors.textSecondary }]}>
                  {stakingUnlocked
                    ? `${t.maxTransfer}: ${maxTransferable.toFixed(6)} ASH (1% ${t.totalBalance.toLowerCase()})`
                    : `${t.needToUnlock} ${STAKING_UNLOCK_THRESHOLD.toLocaleString()} ASH ${t.toUnlock}`}
                </Text>
              </View>
            </View>
          </View>

          {!stakingUnlocked && (
            <>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${progressToUnlock}%`, backgroundColor: '#fbbf24' }]} />
              </View>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                {liquidBalance.toFixed(2)} / {STAKING_UNLOCK_THRESHOLD.toLocaleString()} ASH ({progressToUnlock.toFixed(1)}%)
              </Text>
            </>
          )}
        </TouchableOpacity>

        {stakingUnlocked && ashBalance > 0 && (
          <TouchableOpacity
            style={[styles.stakingTransferCard, { backgroundColor: colors.card, borderColor: '#fbbf24' }]}
            onPress={() => setShowWithdrawModal(true)}
          >
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <View style={[styles.stakingIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <ArrowDownLeft size={20} color="#fbbf24" />
              </View>
              <View style={{flex: 1}}>
                <Text style={[styles.stakingTitle, { color: colors.text }]}>{t.transferFromStaking}</Text>
                <Text style={[styles.stakingSubtitle, { color: colors.textSecondary }]}>
                  {ashBalance.toFixed(6)} ASH {language === 'id' ? 'tersedia' : 'available'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.piCard, { backgroundColor: colors.card, borderColor: '#00ff88' }]} onPress={handleConnectPi}>
          <View style={[styles.piIcon, { backgroundColor: 'rgba(0,255,136,0.1)' }]}><Wifi size={24} color="#00ff88" /></View>
          <View style={{flex: 1}}>
            <Text style={[styles.piTitle, { color: colors.text }]}>{t.connectPiNetwork}</Text>
            <Text style={[styles.piDesc, { color: colors.textSecondary }]}>{t.bridgeAssets}</Text>
          </View>
          <ArrowUpRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{language === 'id' ? 'Transaksi Terakhir' : 'Recent Transactions'}</Text>

          {loadingTx ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : transactions.length === 0 ? (
            <View style={[styles.txItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.txTitle, { color: colors.textSecondary, textAlign: 'center', width: '100%' }]}>
                {language === 'id' ? 'Belum ada transaksi' : 'No transactions yet'}
              </Text>
            </View>
          ) : (
            transactions.slice(0, 20).map((tx) => {
              const isPositive = tx.type === 'mining_reward' || tx.type === 'daily_bonus' || tx.type === 'transfer_received' || tx.amount > 0;
              const dateStr = new Date(tx.createdAt).toLocaleDateString();
              const amountStr = `${isPositive ? '+' : ''}${tx.amount.toFixed(6)} ASH`;
              return (
                <View key={tx.id} style={[styles.txItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.txIcon, { backgroundColor: isPositive ? 'rgba(0,255,136,0.1)' : 'rgba(251, 191, 36, 0.1)' }]}>
                    {isPositive ? <ArrowDownLeft size={20} color="#00ff88" /> : <ArrowUpRight size={20} color="#fbbf24" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txTitle, { color: colors.text }]}>{tx.description}</Text>
                    <Text style={[styles.txDate, { color: colors.textSecondary }]}>{dateStr}</Text>
                    {!!tx.fee && tx.fee > 0 && <Text style={[styles.txDate, { color: colors.textSecondary }]}>Fee: {(tx.fee || 0).toFixed(6)} ASH</Text>}
                  </View>
                  <Text style={[styles.txAmount, { color: isPositive ? '#00ff88' : colors.text }]}>{amountStr}</Text>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* SEND MODAL */}
      <Modal visible={showSendModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.sendAsh}</Text>
              <TouchableOpacity onPress={() => { setShowSendModal(false); setRecipientPreview(null); setSendRecipient(''); setSendAmount(''); }}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.recipientAddress}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={t.recipientPlaceholder}
                placeholderTextColor={colors.textSecondary}
                value={sendRecipient}
                onChangeText={searchRecipient}
                autoCapitalize="none"
              />
              {sendRecipient.length > 0 && (
                <Text style={[styles.recipientHint, { color: searchingUser ? colors.textSecondary : recipientPreview ? '#00ff88' : '#ef4444' }]}>
                  {searchingUser ? t.searching : recipientPreview ? `${language === 'id' ? 'Ke' : 'To'}: ${recipientPreview}` : t.recipientNotFound}
                </Text>
              )}

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>{t.amount}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={t.amountPlaceholder}
                placeholderTextColor={colors.textSecondary}
                value={sendAmount}
                onChangeText={setSendAmount}
                keyboardType="decimal-pad"
              />

              <View style={[styles.feeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>{t.gasFee}</Text>
                  <Text style={[styles.feeValue, { color: colors.text }]}>{TRANSFER_GAS_FEE.toFixed(6)} ASH</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>{t.totalCost}</Text>
                  <Text style={[styles.feeValue, { color: '#fbbf24' }]}>{totalCost.toFixed(6)} ASH</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>{t.available}</Text>
                  <Text style={[styles.feeValue, { color: colors.text }]}>{liquidBalance.toFixed(6)} ASH</Text>
                </View>
                <View style={[styles.feeRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }]}>
                  <Text style={[styles.feeLabel, { color: '#00ff88' }]}>{t.remainingAfterSend}</Text>
                  <Text style={[styles.feeValue, { color: '#00ff88' }]}>
                    {Math.max(0, liquidBalance - totalCost).toFixed(6)} ASH
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { backgroundColor: recipientPreview ? colors.primary : colors.border },
                  (sending || !recipientPreview || !sendAmountNum) && styles.sendBtnDisabled
                ]}
                onPress={handleConfirmSend}
                disabled={sending || !recipientPreview || !sendAmountNum}
              >
                {sending ? <ActivityIndicator size="small" color="#0f172a" /> : (
                  <Text style={{ color: recipientPreview ? '#0f172a' : colors.textSecondary, fontWeight: '800', fontSize: 16 }}>
                    {t.confirmTransfer}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* RECEIVE MODAL */}
      <Modal visible={showReceiveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.receive} ASH</Text>
              <TouchableOpacity onPress={() => setShowReceiveModal(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Text style={[styles.receiveDesc, { color: colors.textSecondary, marginBottom: 20, textAlign: 'center' }]}>
                {language === 'id'
                  ? 'Bagikan alamat atau kode referral Anda di bawah untuk menerima ASH dari orang lain.'
                  : 'Share your address or referral code below to receive ASH from others.'}
              </Text>
              <View style={[styles.addressBox, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>{t.yourUid}</Text>
                <Text style={[styles.addressValue, { color: colors.text }]} selectable>{uid}</Text>
              </View>
              <View style={[styles.addressBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>{t.referralCodeLabel}</Text>
                <Text style={[styles.addressValue, { color: colors.text }]} selectable>
                  {miningData?.referralCode || 'N/A'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.copyBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Alert.alert(t.copied, t.addressCopied);
                }}
              >
                <Copy size={16} color="#0f172a" />
                <Text style={{ color: '#0f172a', fontWeight: '700' }}>{t.copyAddress}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* STAKING TRANSFER MODAL */}
      <Modal visible={showStakingModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.transferToStaking}</Text>
              <TouchableOpacity onPress={() => { setShowStakingModal(false); setStakingAmount(''); }}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.stakingInfoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.stakingInfoRow}>
                  <Text style={[styles.stakingInfoLabel, { color: colors.textSecondary }]}>{t.miningBalance}</Text>
                  <Text style={[styles.stakingInfoValue, { color: colors.text }]}>{liquidBalance.toFixed(6)} ASH</Text>
                </View>
                <View style={styles.stakingInfoRow}>
                  <Text style={[styles.stakingInfoLabel, { color: colors.textSecondary }]}>{t.stakingBalanceLabel}</Text>
                  <Text style={[styles.stakingInfoValue, { color: colors.primary }]}>{ashBalance.toFixed(6)} ASH</Text>
                </View>
                <View style={[styles.stakingInfoRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }]}>
                  <Text style={[styles.stakingInfoLabel, { color: '#fbbf24' }]}>{t.maxTransferLabel}</Text>
                  <Text style={[styles.stakingInfoValue, { color: '#fbbf24' }]}>{maxTransferable.toFixed(6)} ASH</Text>
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>{t.amountToTransfer}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={t.amountPlaceholder}
                placeholderTextColor={colors.textSecondary}
                value={stakingAmount}
                onChangeText={setStakingAmount}
                keyboardType="decimal-pad"
              />

              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: colors.primary }, stakingTransfer && styles.sendBtnDisabled]}
                onPress={handleConfirmStakingTransfer}
                disabled={stakingTransfer}
              >
                {stakingTransfer ? <ActivityIndicator size="small" color="#0f172a" /> : (
                  <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 16 }}>
                    {t.transferToStakingBtn}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* WITHDRAW FROM STAKING MODAL */}
      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.transferFromStaking}</Text>
              <TouchableOpacity onPress={() => { setShowWithdrawModal(false); setWithdrawAmount(''); }}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.stakingInfoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.stakingInfoRow}>
                  <Text style={[styles.stakingInfoLabel, { color: colors.textSecondary }]}>{t.stakingBalanceLabel}</Text>
                  <Text style={[styles.stakingInfoValue, { color: colors.primary }]}>{ashBalance.toFixed(6)} ASH</Text>
                </View>
                <View style={styles.stakingInfoRow}>
                  <Text style={[styles.stakingInfoLabel, { color: colors.textSecondary }]}>{t.miningBalance}</Text>
                  <Text style={[styles.stakingInfoValue, { color: colors.text }]}>{liquidBalance.toFixed(6)} ASH</Text>
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>{t.amountToWithdraw}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={t.amountPlaceholder}
                placeholderTextColor={colors.textSecondary}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                keyboardType="decimal-pad"
              />

              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: '#fbbf24' }, withdrawTransfer && styles.sendBtnDisabled]}
                onPress={handleConfirmWithdraw}
                disabled={withdrawTransfer}
              >
                {withdrawTransfer ? <ActivityIndicator size="small" color="#0f172a" /> : (
                  <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 16 }}>
                    {t.transferFromStakingBtn}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '900' },
  receiveBtn: { fontSize: 14, fontWeight: '700' },
  balanceCard: { borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 1, alignItems: 'center' },
  label: { fontSize: 14, marginBottom: 8 },
  balance: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  currency: { fontSize: 16, fontWeight: '600', marginTop: 4, marginBottom: 4 },
  fiatValue: { fontSize: 14, marginBottom: 20 },
  actionsRow: { flexDirection: 'row', gap: 10, width: '100%' },
  actionBtn: { flex: 1, flexDirection: 'row', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6 },
  lockedBtn: { opacity: 0.5 },
  kycLockedBtn: { borderStyle: 'dashed', borderWidth: 1 },
  actionText: { fontWeight: '700', fontSize: 12 },
  stakedCard: { borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  stakingTransferCard: { borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  stakingHeader: { marginBottom: 0 },
  stakingIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  stakingTitle: { fontSize: 16, fontWeight: '700' },
  stakingSubtitle: { fontSize: 11, marginTop: 2 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, marginTop: 6, textAlign: 'center' },
  stakedLabel: { fontSize: 12, fontWeight: '700' },
  stakedBalance: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  stakedDesc: { fontSize: 11, marginTop: 4 },
  piCard: { flexDirection: 'row', padding: 16, borderRadius: 16, alignItems: 'center', gap: 12, marginBottom: 24, borderWidth: 1 },
  piIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  piTitle: { fontSize: 16, fontWeight: '700' },
  piDesc: { fontSize: 12, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  txItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txTitle: { fontSize: 16, fontWeight: '600' },
  txDate: { fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '700', fontFamily: 'monospace' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderBottomWidth: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalBody: { gap: 4 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 4 },
  recipientHint: { fontSize: 12, marginBottom: 8 },
  feeBox: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 8 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  feeLabel: { fontSize: 13 },
  feeValue: { fontSize: 13, fontWeight: '600' },
  sendBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  sendBtnDisabled: { opacity: 0.6 },
  receiveDesc: { fontSize: 14 },
  addressBox: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  addressLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  addressValue: { fontSize: 13, fontFamily: 'monospace' },
  copyBtn: { flexDirection: 'row', padding: 14, borderRadius: 12, alignItems: 'center', gap: 8, marginTop: 8 },
  stakingInfoBox: { borderWidth: 1, borderRadius: 12, padding: 14 },
  stakingInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  stakingInfoLabel: { fontSize: 13 },
  stakingInfoValue: { fontSize: 13, fontWeight: '600' },
});
