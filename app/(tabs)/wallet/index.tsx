import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Copy, Check, ExternalLink, QrCode, RepeatIcon, Wifi, WifiOff, ChevronRight, Search } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../src/constants';
import { Card, Button, ConfirmationModal, BalanceDisplay } from '../../../src/components/ui';
import { useUserStore } from '../../../src/store/useUserStore';
import { formatBalance, formatUSD, formatTimeAgo, shortenAddress } from '../../../src/utils';
import { Transaction } from '../../../src/types';

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx1', type: 'deposit', amount: 100, description: 'Deposit via Midtrans', balanceAfter: 1250, createdAt: Date.now() - 3600000, status: 'completed' },
  { id: 'tx2', type: 'withdraw', amount: -50, description: 'Withdraw to external wallet', balanceAfter: 1150, createdAt: Date.now() - 7200000, status: 'completed' },
  { id: 'tx3', type: 'transfer_sent', amount: -25, description: 'Sent to 0x7421...9f3e', balanceAfter: 1200, createdAt: Date.now() - 14400000, status: 'completed' },
  { id: 'tx4', type: 'transfer_received', amount: 10, description: 'Received from 0x3d92...ab71', balanceAfter: 1225, createdAt: Date.now() - 86400000, status: 'completed' },
  { id: 'tx5', type: 'deposit', amount: 200, description: 'Deposit via Bank Transfer', balanceAfter: 1215, createdAt: Date.now() - 172800000, status: 'completed' },
  { id: 'tx6', type: 'stake', amount: -100, description: 'Staked in 30-Day Lock', balanceAfter: 1015, createdAt: Date.now() - 259200000, status: 'completed' },
];

const MOCK_WALLETS = [
  { address: '0x7421a8b4c5d6e7f890123456789abcdef9876543', chain: 'Ethereum', balance: 0.05, symbol: 'BNB', connected: true },
  { address: '0x8f3e2a1b4c5d6e7f890123456789abcdef0123456', chain: 'BNB Chain', balance: 1.2, symbol: 'BNB', connected: false },
];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { balance, ashBalance, fundingBalance, tradingBalance } = useUserStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [activeTab, setActiveTab] = useState<'ash' | 'bnb'>('ash');

  const userAddress = '0x1234abcd5678efgh9012ijkl3456mnop7890qrst';

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      const Clipboard = require('expo-clipboard');
      await Clipboard.setStringAsync(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      Alert.alert('Copied', text);
    }
  }, []);

  const handleWithdraw = useCallback(() => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { Alert.alert('Invalid', 'Enter a valid amount'); return; }
    if (amount > fundingBalance) { Alert.alert('Insufficient', `You have ${formatBalance(fundingBalance)} ASH available`); return; }
    if (!withdrawAddress || withdrawAddress.length < 10) { Alert.alert('Invalid', 'Enter a valid wallet address'); return; }
    Alert.alert('Withdrawal Submitted', `${formatBalance(amount)} ASH → ${shortenAddress(withdrawAddress)}`);
    setShowWithdraw(false);
    setWithdrawAmount('');
    setWithdrawAddress('');
  }, [withdrawAmount, withdrawAddress, fundingBalance]);

  const renderTxIcon = (type: string) => {
    const iconColor = { deposit: colors.chartGreen, withdraw: colors.chartRed, transfer_sent: colors.warning, transfer_received: colors.chartGreen, stake: colors.primary }[type] || colors.textSecondary;
    const iconLabel = { deposit: '↓', withdraw: '↑', transfer_sent: '→', transfer_received: '←', stake: '◆' }[type] || '•';
    return <View style={[styles.txIcon, { backgroundColor: iconColor + '20' }]}><Text style={[styles.txIconText, { color: iconColor }]}>{iconLabel}</Text></View>;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Wallet size={24} color={colors.primary} />
        <Text style={styles.title}>Wallet</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'ash' && styles.tabBtnActive]} onPress={() => setActiveTab('ash')}>
          <Text style={[styles.tabText, activeTab === 'ash' && styles.tabTextActive]}>ASH</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'bnb' && styles.tabBtnActive]} onPress={() => setActiveTab('bnb')}>
          <Text style={[styles.tabText, activeTab === 'bnb' && styles.tabTextActive]}>BNB</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'ash' ? (
          <>
            <BalanceDisplay
              balance={balance}
              usdValue={balance * 0.42}
              title="Total ASH Balance"
              variant="large"
              gradient={['#6C5CE7', '#A29BFE']}
            />

            <View style={styles.walletRow}>
              <Card style={styles.walletCard}>
                <Text style={styles.walletLabel}>Funding</Text>
                <Text style={styles.walletValue}>{formatBalance(fundingBalance)} ASH</Text>
                <Text style={styles.walletUSD}>{formatUSD(fundingBalance * 0.42)}</Text>
              </Card>
              <Card style={styles.walletCard}>
                <Text style={styles.walletLabel}>Trading</Text>
                <Text style={styles.walletValue}>{formatBalance(tradingBalance)} ASH</Text>
                <Text style={styles.walletUSD}>{formatUSD(tradingBalance * 0.42)}</Text>
              </Card>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowDeposit(true)}>
                <View style={[styles.actionIcon, { backgroundColor: colors.chartGreen + '20' }]}>
                  <ArrowDownToLine size={22} color={colors.chartGreen} />
                </View>
                <Text style={styles.actionLabel}>Deposit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowWithdraw(true)}>
                <View style={[styles.actionIcon, { backgroundColor: colors.danger + '20' }]}>
                  <ArrowUpFromLine size={22} color={colors.danger} />
                </View>
                <Text style={styles.actionLabel}>Withdraw</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowReceive(true)}>
                <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                  <QrCode size={22} color={colors.primary} />
                </View>
                <Text style={styles.actionLabel}>Receive</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <BalanceDisplay
              balance={MOCK_WALLETS[0].balance}
              usdValue={MOCK_WALLETS[0].balance * 580}
              title="BNB Balance"
              symbol="BNB"
              variant="large"
              gradient={['#F0B90B', '#F8D12F']}
            />

            <Text style={styles.sectionTitle}>Connected Wallets</Text>
            {MOCK_WALLETS.map((w, i) => (
              <TouchableOpacity key={i} style={styles.walletCard2} onPress={() => handleCopy(w.address, `wallet-${i}`)} activeOpacity={0.7}>
                <View style={styles.walletCardTop}>
                  <View style={[styles.chainDot, { backgroundColor: w.connected ? colors.chartGreen : colors.chartRed }]} />
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletName}>{w.chain}</Text>
                    <Text style={styles.walletAddress}>{shortenAddress(w.address)}</Text>
                  </View>
                  {w.connected ? <Wifi size={16} color={colors.chartGreen} /> : <WifiOff size={16} color={colors.textMuted} />}
                </View>
                <View style={styles.walletBalanceRow}>
                  <Text style={styles.walletBalanceBNB}>{w.balance.toFixed(4)} {w.symbol}</Text>
                  <View style={styles.copyBadge}>
                    {copied === `wallet-${i}` ? <Check size={12} color={colors.chartGreen} /> : <Copy size={12} color={colors.textSecondary} />}
                    <Text style={styles.copyText}>{copied === `wallet-${i}` ? 'Copied' : 'Copy'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.connectWalletBtn}>
              <Wifi size={18} color={colors.primary} />
              <Text style={styles.connectWalletText}>Connect Wallet</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Transaction History</Text>
        {MOCK_TRANSACTIONS.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            {renderTxIcon(tx.type)}
            <View style={styles.txInfo}>
              <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
              <Text style={styles.txTime}>{formatTimeAgo(tx.createdAt)}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.amount >= 0 ? colors.chartGreen : colors.chartRed }]}>
              {tx.amount >= 0 ? '+' : ''}{formatBalance(tx.amount)}
            </Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmationModal
        visible={showDeposit}
        title="Deposit ASH"
        message="Enter the amount you want to deposit to your funding wallet."
        confirmLabel="Continue to Payment"
        onConfirm={() => { Alert.alert('Deposit', `Deposit ${depositAmount} ASH initiated`); setShowDeposit(false); setDepositAmount(''); }}
        onCancel={() => { setShowDeposit(false); setDepositAmount(''); }}
      >
        <View style={styles.modalInputContainer}>
          <Text style={styles.inputLabel}>Amount (ASH)</Text>
          <TextInput
            style={styles.input}
            value={depositAmount}
            onChangeText={setDepositAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.inputHint}>Min: 10 ASH via Midtrans</Text>
        </View>
      </ConfirmationModal>

      <ConfirmationModal
        visible={showWithdraw}
        title="Withdraw ASH"
        message="Enter the amount and destination address."
        confirmLabel="Submit Withdrawal"
        variant="danger"
        onConfirm={handleWithdraw}
        onCancel={() => { setShowWithdraw(false); setWithdrawAmount(''); setWithdrawAddress(''); }}
      >
        <View style={styles.modalInputContainer}>
          <Text style={styles.inputLabel}>Amount (ASH)</Text>
          <TextInput style={styles.input} value={withdrawAmount} onChangeText={setWithdrawAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.textMuted} />
          <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Wallet Address</Text>
          <TextInput style={styles.input} value={withdrawAddress} onChangeText={setWithdrawAddress} placeholder="0x..." placeholderTextColor={colors.textMuted} autoCapitalize="none" />
          <Text style={styles.inputHint}>Available: {formatBalance(fundingBalance)} ASH</Text>
        </View>
      </ConfirmationModal>

      <ConfirmationModal
        visible={showReceive}
        title="Receive ASH"
        message="Share this address to receive ASH tokens."
        confirmLabel="Share Address"
        onConfirm={() => { Share.share({ message: `My ASH Finance wallet address:\n${userAddress}` }); setShowReceive(false); }}
        onCancel={() => setShowReceive(false)}
      >
        <TouchableOpacity style={styles.addressCard} onPress={() => handleCopy(userAddress, 'receive-addr')}>
          <Text style={styles.addressLabel}>Your ASH Wallet Address</Text>
          <Text style={styles.addressValue}>{userAddress}</Text>
          <View style={styles.addressCopyRow}>
            {copied === 'receive-addr' ? <Check size={14} color={colors.chartGreen} /> : <Copy size={14} color={colors.primary} />}
            <Text style={[styles.addressCopyText, { color: copied === 'receive-addr' ? colors.chartGreen : colors.primary }]}>
              {copied === 'receive-addr' ? 'Copied!' : 'Tap to copy'}
            </Text>
          </View>
        </TouchableOpacity>
      </ConfirmationModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.text },
  tabRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 3, marginBottom: spacing.lg },
  tabBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.primary },
  tabText: { ...typography.captionBold, color: colors.textMuted },
  tabTextActive: { color: colors.text },
  scroll: { paddingBottom: spacing.lg },
  walletRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  walletCard: { flex: 1, alignItems: 'center' },
  walletLabel: { ...typography.caption, color: colors.textMuted },
  walletValue: { ...typography.h3, color: colors.text, marginTop: spacing.xs },
  walletUSD: { ...typography.micro, color: colors.textSecondary, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  actionBtn: { flex: 1, alignItems: 'center', gap: spacing.sm },
  actionIcon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { ...typography.captionBold, color: colors.text },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.md, marginTop: spacing.lg },
  walletCard2: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, marginBottom: spacing.sm },
  walletCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  chainDot: { width: 8, height: 8, borderRadius: 4 },
  walletInfo: { flex: 1 },
  walletName: { ...typography.captionBold, color: colors.text },
  walletAddress: { ...typography.micro, color: colors.textMuted, fontFamily: 'monospace' },
  walletBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletBalanceBNB: { ...typography.bodyBold, color: colors.text },
  copyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full },
  copyText: { ...typography.micro, color: colors.textSecondary },
  connectWalletBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary + '40', borderStyle: 'dashed', marginTop: spacing.sm },
  connectWalletText: { ...typography.bodyBold, color: colors.primary },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  txIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  txIconText: { fontSize: 14, fontWeight: '800' },
  txInfo: { flex: 1 },
  txDesc: { ...typography.caption, color: colors.text },
  txTime: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  txAmount: { ...typography.captionBold },
  modalInputContainer: { marginBottom: spacing.md },
  inputLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, color: colors.text, fontSize: 18, fontWeight: '700' },
  inputHint: { ...typography.micro, color: colors.textMuted, marginTop: spacing.xs },
  addressCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md },
  addressLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  addressValue: { ...typography.caption, color: colors.primary, fontFamily: 'monospace', textAlign: 'center', marginBottom: spacing.md },
  addressCopyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  addressCopyText: { ...typography.captionBold },
});
