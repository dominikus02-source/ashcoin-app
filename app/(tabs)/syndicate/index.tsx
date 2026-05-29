import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Shapes, Play, Square, Activity, Cpu, Thermometer, Clock, DollarSign, Share2, Users, Award, ChevronDown, ChevronUp, Gauge } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../src/constants';
import { StatsCard, Card, Button, ConfirmationModal, TierBadge } from '../../../src/components/ui';
import { useNodeStore, NODE_TIERS } from '../../../src/store/useNodeStore';
import { useUserStore } from '../../../src/store/useUserStore';
import { formatBalance, parseHashrate, formatDuration } from '../../../src/utils';
import { notifyNodeStarted, notifyNodeDown } from '../../../src/lib/notifications';

export default function SyndicateScreen() {
  const insets = useSafeAreaInsets();
  const { status, hashrate, dailyReward, totalEarned, uptime, temperature, tier, sessionEarned, startNode, stopNode, tickEarnings } = useNodeStore();
  const { balance } = useUserStore();

  const [showStartModal, setShowStartModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcHash, setCalcHash] = useState('');
  const [showTiers, setShowTiers] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [referralBonus, setReferralBonus] = useState('0');

  const currentTier = NODE_TIERS.find((t) => t.name === tier) || NODE_TIERS[0];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (status === 'active') {
      interval = setInterval(() => {
        const node = useNodeStore.getState();
        if (node.startTime) {
          const sec = Math.floor((Date.now() - node.startTime) / 1000);
          setElapsed(sec);
          tickEarnings(sec / 3600);
        }
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [status, tickEarnings]);

  const handleStart = useCallback(() => {
    startNode();
    setShowStartModal(false);
    notifyNodeStarted();
  }, [startNode]);

  const handleStop = useCallback(() => {
    stopNode();
    setShowStopModal(false);
    notifyNodeDown();
  }, [stopNode]);

  const estimatedDaily = calcHash ? parseFloat(calcHash) * 24 : currentTier.hourlyRate * 24;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Shapes size={24} color={colors.primary} />
          <Text style={styles.title}>Syndicate</Text>
        </View>

        <Card gradient={['#1A1A35', '#141428']} style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: status === 'active' ? colors.chartGreen : status === 'starting' ? colors.warning : colors.chartRed }]} />
              <Text style={styles.statusTitle}>Node {status.charAt(0).toUpperCase() + status.slice(1)}</Text>
            </View>
            <TierBadge tier={tier} color={currentTier.color} size="md" />
          </View>

          <View style={styles.statsGrid}>
            <StatsCard label="Hashrate" value={parseHashrate(hashrate)} color={colors.primary} icon={<Cpu size={16} color={colors.primary} />} style={styles.stat} />
            <StatsCard label="Uptime" value={`${uptime.toFixed(1)}%`} color={colors.info} icon={<Activity size={16} color={colors.info} />} style={styles.stat} />
            <StatsCard label="Temperature" value={`${temperature}°C`} color={temperature > 75 ? colors.danger : colors.secondary} icon={<Thermometer size={16} color={temperature > 75 ? colors.danger : colors.secondary} />} style={styles.stat} />
            <StatsCard label="Daily Reward" value={`+${formatBalance(dailyReward)}`} color={colors.chartGreen} icon={<DollarSign size={16} color={colors.chartGreen} />} style={styles.stat} />
          </View>

          {status === 'active' && (
            <View style={styles.sessionCard}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.sessionLabel}>Session Duration</Text>
              <Text style={styles.sessionValue}>{formatDuration(elapsed)}</Text>
              <Text style={styles.sessionEarned}>Earned: +{formatBalance(sessionEarned)} ASH</Text>
            </View>
          )}
        </Card>

        <View style={styles.actionsRow}>
          {(status !== 'active' && status !== 'starting') ? (
            <Button
              title="Start Node"
              icon={<Play size={18} color={colors.text} />}
              onPress={() => setShowStartModal(true)}
              style={styles.actionBtn}
              size="lg"
              loading={status === 'starting' as any}
            />
          ) : (
            <Button
              title="Stop Node"
              icon={<Square size={18} color={colors.text} />}
              variant="danger"
              onPress={() => setShowStopModal(true)}
              style={styles.actionBtn}
              size="lg"
            />
          )}
        </View>

        <TouchableOpacity style={styles.sectionToggle} onPress={() => setShowCalculator(!showCalculator)} activeOpacity={0.7}>
          <Gauge size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Earning Calculator</Text>
          {showCalculator ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
        </TouchableOpacity>

        {showCalculator && (
          <Card style={styles.calculatorCard}>
            <Text style={styles.inputLabel}>Hashrate (ASH/h)</Text>
            <TextInput
              style={styles.input}
              value={calcHash}
              onChangeText={setCalcHash}
              keyboardType="decimal-pad"
              placeholder={`${currentTier.hourlyRate}`}
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.calcResults}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Hourly</Text>
                <Text style={styles.calcValue}>{formatBalance(estimatedDaily / 24)} ASH</Text>
              </View>
              <View style={styles.calcDivider} />
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Daily</Text>
                <Text style={styles.calcValue}>{formatBalance(estimatedDaily)} ASH</Text>
              </View>
              <View style={styles.calcDivider} />
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Monthly</Text>
                <Text style={styles.calcValue}>{formatBalance(estimatedDaily * 30)} ASH</Text>
              </View>
              <View style={styles.calcDivider} />
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Yearly</Text>
                <Text style={[styles.calcValue, { color: colors.chartGreen }]}>{formatBalance(estimatedDaily * 365)} ASH</Text>
              </View>
            </View>
          </Card>
        )}

        <TouchableOpacity style={styles.sectionToggle} onPress={() => setShowTiers(!showTiers)} activeOpacity={0.7}>
          <Award size={20} color={colors.accent} />
          <Text style={styles.sectionTitle}>Node Tiers</Text>
          {showTiers ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
        </TouchableOpacity>

        {showTiers && (
          <View style={styles.tiersContainer}>
            {NODE_TIERS.map((t, i) => {
              const isCurrent = t.name === tier;
              const isLocked = balance < t.minASH;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.tierRow, isCurrent && { borderColor: t.color, borderWidth: 2 }]}
                  activeOpacity={0.7}
                >
                  <View style={styles.tierHeader}>
                    <View style={[styles.tierColorDot, { backgroundColor: t.color }]} />
                    <Text style={styles.tierName}>{t.name}</Text>
                    {isCurrent && <View style={[styles.currentBadge, { backgroundColor: t.color + '30' }]}><Text style={[styles.currentText, { color: t.color }]}>Active</Text></View>}
                    {isLocked && !isCurrent && <View style={styles.lockedBadge}><Text style={styles.lockedText}>Locked</Text></View>}
                  </View>
                  <View style={styles.tierStats}>
                    <Text style={styles.tierStat}>{parseHashrate(t.hashrate)}</Text>
                    <Text style={styles.tierStatLabel}>Hashrate</Text>
                  </View>
                  <View style={styles.tierStats}>
                    <Text style={[styles.tierStat, { color: colors.chartGreen }]}>+{formatBalance(t.dailyReward)}</Text>
                    <Text style={styles.tierStatLabel}>Daily</Text>
                  </View>
                  {t.minASH > 0 && (
                    <View style={styles.tierStats}>
                      <Text style={styles.tierStat}>{formatBalance(t.minASH)}</Text>
                      <Text style={styles.tierStatLabel}>Min ASH</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.sectionToggle}>
          <Share2 size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Referral Program</Text>
        </View>

        <Card style={styles.referralCard}>
          <View style={styles.refHeader}>
            <Users size={20} color={colors.secondary} />
            <Text style={styles.refTitle}>Invite Friends, Earn Together</Text>
          </View>
          <Text style={styles.refDesc}>Share your referral link and earn {tier === 'Gold' ? '10%' : tier === 'Silver' ? '5%' : '3%'} of their rewards forever!</Text>
          <View style={styles.refLinkRow}>
            <Text style={styles.refLinkText}>https://ashcoin.app/ref/ASH{balance.toFixed(0)}</Text>
            <TouchableOpacity style={styles.copyBtn}>
              <Share2 size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.refStats}>
            <View style={styles.refStat}>
              <Text style={styles.refStatValue}>0</Text>
              <Text style={styles.refStatLabel}>Referrals</Text>
            </View>
            <View style={styles.refDivider} />
            <View style={styles.refStat}>
              <Text style={styles.refStatValue}>0 ASH</Text>
              <Text style={styles.refStatLabel}>Bonus Earned</Text>
            </View>
          </View>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmationModal
        visible={showStartModal}
        title="Start Node"
        message="Your node will begin mining ASH tokens immediately. Make sure your app stays connected."
        confirmLabel="Start Mining"
        onConfirm={handleStart}
        onCancel={() => setShowStartModal(false)}
        details={[
          { label: 'Hashrate', value: parseHashrate(currentTier.hashrate) },
          { label: 'Daily Reward', value: `+${formatBalance(currentTier.dailyReward)} ASH` },
          { label: 'Tier', value: currentTier.name },
        ]}
      />

      <ConfirmationModal
        visible={showStopModal}
        title="Stop Node"
        message="Your node will stop mining. Any unclaimed rewards will be saved."
        confirmLabel="Stop Node"
        variant="danger"
        onConfirm={handleStop}
        onCancel={() => setShowStopModal(false)}
        details={sessionEarned > 0 ? [{ label: 'Unclaimed Reward', value: `${formatBalance(sessionEarned)} ASH` }] : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.text },
  statusCard: { marginBottom: spacing.lg },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusTitle: { ...typography.h3, color: colors.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: { width: '48%' as any },
  sessionCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' as any },
  sessionLabel: { ...typography.micro, color: colors.textMuted, flex: 1 },
  sessionValue: { ...typography.captionBold, color: colors.text },
  sessionEarned: { ...typography.captionBold, color: colors.chartGreen, width: '100%' as any, textAlign: 'center' as any, marginTop: spacing.xs },
  actionsRow: { marginBottom: spacing.xl },
  actionBtn: { width: '100%' as any },
  sectionToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { ...typography.bodyBold, color: colors.text, flex: 1 },
  calculatorCard: { marginBottom: spacing.sm },
  inputLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, color: colors.text, fontSize: 16, fontWeight: '600' },
  calcResults: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  calcRow: { flex: 1, alignItems: 'center' },
  calcLabel: { ...typography.micro, color: colors.textMuted },
  calcValue: { ...typography.captionBold, color: colors.text, marginTop: 2 },
  calcDivider: { width: 1, backgroundColor: colors.cardBorder, marginVertical: 4 },
  tiersContainer: { gap: spacing.sm, marginBottom: spacing.sm },
  tierRow: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tierHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, width: 80 },
  tierColorDot: { width: 10, height: 10, borderRadius: 5 },
  tierName: { ...typography.captionBold, color: colors.text },
  currentBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.full },
  currentText: { fontSize: 9, fontWeight: '700' },
  lockedBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.full, backgroundColor: colors.textMuted + '20' },
  lockedText: { fontSize: 9, fontWeight: '600', color: colors.textMuted },
  tierStats: { flex: 1, alignItems: 'center' },
  tierStat: { ...typography.captionBold, color: colors.text },
  tierStatLabel: { ...typography.micro, color: colors.textMuted, marginTop: 1 },
  referralCard: { marginTop: spacing.sm },
  refHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  refTitle: { ...typography.bodyBold, color: colors.text, flex: 1 },
  refDesc: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  refLinkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  refLinkText: { ...typography.caption, color: colors.primary, flex: 1 },
  copyBtn: { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  refStats: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.md },
  refStat: { flex: 1, alignItems: 'center' },
  refStatValue: { ...typography.captionBold, color: colors.text },
  refStatLabel: { ...typography.micro, color: colors.textMuted },
  refDivider: { width: 1, backgroundColor: colors.cardBorder, marginVertical: 4 },
});
