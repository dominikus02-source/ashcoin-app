import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { Shapes, Play, Square, Activity, Cpu, Thermometer, Clock, DollarSign, Share2, Users, Award, ChevronDown, ChevronUp, Gauge, Plus, ArrowUp } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../src/constants';
import { StatsCard, Card, Button, ConfirmationModal, TierBadge } from '../../../src/components/ui';
import { SyndicateCard } from '../../../src/components/common/SyndicateCard';
import { useNodeStore, NODE_TIERS } from '../../../src/store/useNodeStore';
import { useUserStore } from '../../../src/store/useUserStore';
import { formatBalance, parseHashrate, formatDuration } from '../../../src/utils';
import { notifyNodeStarted, notifyNodeDown } from '../../../src/lib/notifications';
import { SyndicateNode } from '../../../src/types';

interface MultiNode {
  id: string;
  label: string;
  hashrate: number;
  dailyReward: number;
  totalEarned: number;
  uptime: number;
  temperature: number;
  status: SyndicateNode['status'];
  tier: string;
  hourlyRate: number;
  startTime: number | null;
  sessionEarned: number;
}

export default function SyndicateScreen() {
  const insets = useSafeAreaInsets();
  const { balance, displayName } = useUserStore();
  const nodeStore = useNodeStore();

  const [nodes, setNodes] = useState<MultiNode[]>([
    {
      id: 'primary',
      label: 'Primary Node',
      hashrate: nodeStore.hashrate,
      dailyReward: nodeStore.dailyReward,
      totalEarned: nodeStore.totalEarned,
      uptime: nodeStore.uptime,
      temperature: nodeStore.temperature,
      status: nodeStore.status as SyndicateNode['status'],
      tier: nodeStore.tier,
      hourlyRate: nodeStore.hourlyRate,
      startTime: nodeStore.startTime,
      sessionEarned: nodeStore.sessionEarned,
    },
  ]);

  const [activeId, setActiveId] = useState('primary');
  const [showStartModal, setShowStartModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showTiers, setShowTiers] = useState(false);
  const [calcHash, setCalcHash] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const activeNode = nodes.find((n) => n.id === activeId) || nodes[0];
  const currentTier = NODE_TIERS.find((t) => t.name === activeNode.tier) || NODE_TIERS[0];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (activeNode.status === 'active') {
      interval = setInterval(() => {
        if (activeNode.startTime) {
          const sec = Math.floor((Date.now() - activeNode.startTime) / 1000);
          setElapsed(sec);
        }
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeNode.status, activeNode.startTime]);

  const handleNodeSelect = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleStart = useCallback(() => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === activeId
          ? { ...n, status: 'active' as const, startTime: Date.now(), temperature: 42 }
          : n
      )
    );
    nodeStore.setNode({ status: 'active', startTime: Date.now(), temperature: 42 });
    setShowStartModal(false);
    notifyNodeStarted();
  }, [activeId, nodeStore]);

  const handleStop = useCallback(() => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === activeId
          ? { ...n, status: 'offline' as const, startTime: null, totalEarned: n.totalEarned + n.sessionEarned, sessionEarned: 0 }
          : n
      )
    );
    nodeStore.stopNode();
    setShowStopModal(false);
    notifyNodeDown();
  }, [activeId, nodeStore]);

  const handleAddNode = useCallback(() => {
    const idx = nodes.length + 1;
    const newNode: MultiNode = {
      id: `node-${idx}`,
      label: `Node #${idx}`,
      hashrate: currentTier.hashrate,
      dailyReward: currentTier.dailyReward,
      totalEarned: 0,
      uptime: 0,
      temperature: 35,
      status: 'offline',
      tier: currentTier.name,
      hourlyRate: currentTier.hourlyRate,
      startTime: null,
      sessionEarned: 0,
    };
    setNodes((prev) => [...prev, newNode]);
    setActiveId(newNode.id);
  }, [nodes, currentTier]);

  const handleTierUpgrade = useCallback((tierName: string) => {
    const tier = NODE_TIERS.find((t) => t.name === tierName);
    if (!tier) return;
    if (balance < tier.minASH) {
      Alert.alert('Insufficient Balance', `Need ${formatBalance(tier.minASH)} ASH to unlock ${tierName}`);
      return;
    }
    setNodes((prev) =>
      prev.map((n) =>
        n.id === activeId
          ? { ...n, tier: tierName as any, hashrate: tier.hashrate, dailyReward: tier.dailyReward, hourlyRate: tier.hourlyRate }
          : n
      )
    );
    nodeStore.setNode({ tier: tierName as any, hashrate: tier.hashrate, dailyReward: tier.dailyReward, hourlyRate: tier.hourlyRate });
    setShowTiers(false);
    Alert.alert('Upgraded!', `Node upgraded to ${tierName} tier`);
  }, [activeId, balance, nodeStore]);

  const estimatedDaily = calcHash ? parseFloat(calcHash) * 24 : currentTier.hourlyRate * 24;

  const syndicateNode: SyndicateNode = {
    hashrate: activeNode.hashrate,
    dailyReward: activeNode.dailyReward,
    totalEarned: activeNode.totalEarned,
    uptime: activeNode.uptime,
    temperature: activeNode.temperature,
    status: activeNode.status,
    tier: activeNode.tier as SyndicateNode['tier'],
    hourlyRate: activeNode.hourlyRate,
    startTime: activeNode.startTime,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Shapes size={24} color={colors.primary} />
            <Text style={styles.title}>Syndicate</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddNode} activeOpacity={0.7}>
            <Plus size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {nodes.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nodeSelector}>
            {nodes.map((n) => (
              <TouchableOpacity
                key={n.id}
                style={[styles.nodeTab, activeId === n.id && { borderColor: currentTier.color, backgroundColor: currentTier.color + '15' }]}
                onPress={() => handleNodeSelect(n.id)}
              >
                <View style={[styles.nodeTabDot, { backgroundColor: n.status === 'active' ? colors.chartGreen : colors.chartRed }]} />
                <Text style={[styles.nodeTabLabel, activeId === n.id && { color: colors.text }]}>{n.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <SyndicateCard node={syndicateNode} />

        <Card gradient={['#1A1A35', '#141428']} style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <StatsCard label="Hashrate" value={parseHashrate(activeNode.hashrate)} color={colors.primary} icon={<Cpu size={16} color={colors.primary} />} style={styles.stat} />
            <StatsCard label="Uptime" value={`${activeNode.uptime.toFixed(1)}%`} color={colors.info} icon={<Activity size={16} color={colors.info} />} style={styles.stat} />
            <StatsCard label="Temperature" value={`${activeNode.temperature}°C`} color={activeNode.temperature > 75 ? colors.danger : colors.secondary} icon={<Thermometer size={16} color={activeNode.temperature > 75 ? colors.danger : colors.secondary} />} style={styles.stat} />
            <StatsCard label="Daily Reward" value={`+${formatBalance(activeNode.dailyReward)}`} color={colors.chartGreen} icon={<DollarSign size={16} color={colors.chartGreen} />} style={styles.stat} />
          </View>

          {activeNode.status === 'active' && (
            <View style={styles.sessionCard}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.sessionLabel}>Session</Text>
              <Text style={styles.sessionValue}>{formatDuration(elapsed)}</Text>
              <Text style={styles.sessionEarned}>+{formatBalance(activeNode.sessionEarned)} ASH earned</Text>
            </View>
          )}
        </Card>

        <View style={styles.actionsRow}>
          {activeNode.status !== 'active' ? (
            <Button title="Start Node" icon={<Play size={18} color={colors.text} />} onPress={() => setShowStartModal(true)} style={styles.actionBtn} size="lg" />
          ) : (
            <Button title="Stop Node" icon={<Square size={18} color={colors.text} />} variant="danger" onPress={() => setShowStopModal(true)} style={styles.actionBtn} size="lg" />
          )}
        </View>

        <TouchableOpacity style={styles.sectionToggle} onPress={() => setShowTiers(!showTiers)} activeOpacity={0.7}>
          <Award size={20} color={colors.accent} />
          <Text style={styles.sectionTitle}>Tier Upgrade</Text>
          <Text style={styles.currentTierBadge}>{currentTier.name}</Text>
          {showTiers ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
        </TouchableOpacity>

        {showTiers && (
          <View style={styles.tiersContainer}>
            {NODE_TIERS.map((t, i) => {
              const isCurrent = t.name === activeNode.tier;
              const canUpgrade = balance >= t.minASH && !isCurrent;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.tierRow, isCurrent && { borderColor: t.color, borderWidth: 2 }]}
                  onPress={() => canUpgrade && handleTierUpgrade(t.name)}
                  disabled={!canUpgrade && !isCurrent}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tierIcon, { backgroundColor: t.color + '20' }]}>
                    <ArrowUp size={16} color={t.color} />
                  </View>
                  <View style={styles.tierInfo}>
                    <Text style={styles.tierName}>{t.name}</Text>
                    <Text style={styles.tierDetail}>{parseHashrate(t.hashrate)} · +{formatBalance(t.dailyReward)}/day</Text>
                  </View>
                  {isCurrent ? (
                    <TierBadge tier={t.name} color={t.color} size="sm" />
                  ) : (
                    <Text style={[styles.tierMinASH, { color: canUpgrade ? colors.chartGreen : colors.textMuted }]}>
                      {canUpgrade ? 'Upgrade' : `${formatBalance(t.minASH)} ASH`}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.sectionToggle} onPress={() => setShowCalculator(!showCalculator)} activeOpacity={0.7}>
          <Gauge size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Earning Calculator</Text>
          {showCalculator ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
        </TouchableOpacity>

        {showCalculator && (
          <Card style={styles.calculatorCard}>
            <Text style={styles.inputLabel}>Hashrate (ASH/h)</Text>
            <TextInput style={styles.input} value={calcHash} onChangeText={setCalcHash} keyboardType="decimal-pad" placeholder={`${currentTier.hourlyRate}`} placeholderTextColor={colors.textMuted} />
            <View style={styles.calcResults}>
              <View style={styles.calcRow}><Text style={styles.calcLabel}>Hourly</Text><Text style={styles.calcValue}>{formatBalance(estimatedDaily / 24)} ASH</Text></View>
              <View style={styles.calcDivider} />
              <View style={styles.calcRow}><Text style={styles.calcLabel}>Daily</Text><Text style={styles.calcValue}>{formatBalance(estimatedDaily)} ASH</Text></View>
              <View style={styles.calcDivider} />
              <View style={styles.calcRow}><Text style={styles.calcLabel}>Monthly</Text><Text style={styles.calcValue}>{formatBalance(estimatedDaily * 30)} ASH</Text></View>
              <View style={styles.calcDivider} />
              <View style={styles.calcRow}><Text style={styles.calcLabel}>Yearly</Text><Text style={[styles.calcValue, { color: colors.chartGreen }]}>{formatBalance(estimatedDaily * 365)} ASH</Text></View>
            </View>
          </Card>
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
          <Text style={styles.refDesc}>
            Share your referral link and earn {currentTier.name === 'Gold' ? '10%' : currentTier.name === 'Silver' ? '5%' : '3%'} of their rewards forever!
          </Text>
          <View style={styles.refLinkRow}>
            <Text style={styles.refLinkText}>https://ashcoin.app/ref/{displayName || balance.toFixed(0)}</Text>
            <TouchableOpacity style={styles.copyBtn}>
              <Share2 size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.refStats}>
            <View style={styles.refStat}><Text style={styles.refStatValue}>0</Text><Text style={styles.refStatLabel}>Referrals</Text></View>
            <View style={styles.refDivider} />
            <View style={styles.refStat}><Text style={styles.refStatValue}>0 ASH</Text><Text style={styles.refStatLabel}>Bonus Earned</Text></View>
          </View>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmationModal
        visible={showStartModal}
        title="Start Node"
        message="Your node will begin mining ASH tokens immediately."
        confirmLabel="Start Mining"
        onConfirm={handleStart}
        onCancel={() => setShowStartModal(false)}
        details={[
          { label: 'Node', value: activeNode.label },
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
        details={activeNode.sessionEarned > 0 ? [{ label: 'Unclaimed Reward', value: `${formatBalance(activeNode.sessionEarned)} ASH` }] : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.h2, color: colors.text },
  addBtn: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  nodeSelector: { marginBottom: spacing.md },
  nodeTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.cardBorder, marginRight: spacing.sm },
  nodeTabDot: { width: 8, height: 8, borderRadius: 4 },
  nodeTabLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  statsCard: { marginTop: spacing.md, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: { width: '48%' as any },
  sessionCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' as any },
  sessionLabel: { ...typography.micro, color: colors.textMuted, flex: 1 },
  sessionValue: { ...typography.captionBold, color: colors.text },
  sessionEarned: { ...typography.captionBold, color: colors.chartGreen, width: '100%' as any, textAlign: 'center' as any, marginTop: spacing.xs },
  actionsRow: { marginBottom: spacing.lg },
  actionBtn: { width: '100%' as any },
  sectionToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { ...typography.bodyBold, color: colors.text, flex: 1 },
  currentTierBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.primary + '20', color: colors.primary, fontSize: 11, fontWeight: '700', overflow: 'hidden' as any },
  tiersContainer: { gap: spacing.sm, marginBottom: spacing.sm },
  tierRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, gap: spacing.md },
  tierIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tierInfo: { flex: 1 },
  tierName: { ...typography.bodyBold, color: colors.text },
  tierDetail: { ...typography.micro, color: colors.textMuted, marginTop: 1 },
  tierMinASH: { ...typography.captionBold },
  calculatorCard: { marginBottom: spacing.sm },
  inputLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, color: colors.text, fontSize: 16, fontWeight: '600' },
  calcResults: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  calcRow: { flex: 1, alignItems: 'center' },
  calcLabel: { ...typography.micro, color: colors.textMuted },
  calcValue: { ...typography.captionBold, color: colors.text, marginTop: 2 },
  calcDivider: { width: 1, backgroundColor: colors.cardBorder, marginVertical: 4 },
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
