import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import {
  Shapes, Play, Square, Activity, Cpu, Thermometer, Clock, DollarSign,
  Share2, Users, Award, ChevronDown, ChevronUp, Gauge, Plus, ArrowUp,
  Zap, Sparkles, Flame, Check, ChevronRight, Cpu as CpuIcon,
} from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../src/constants';
import { Button, Card, StatsCard, ConfirmationModal, TierBadge, GlassCard, StatCard } from '../../../src/components/ui';
import { SyndicateCard } from '../../../src/components/common/SyndicateCard';
import { useNodeStore, NODE_TIERS } from '../../../src/store/useNodeStore';
import { useUserStore } from '../../../src/store/useUserStore';
import { formatBalance, parseHashrate, formatDuration, formatCompact } from '../../../src/utils';
import { notifyNodeStarted, notifyNodeDown } from '../../../src/lib/notifications';
import { SyndicateNode as SyndicateNodeType } from '../../../src/types';

const screenWidth = Dimensions.get('window').width;

interface MultiNode {
  id: string;
  label: string;
  hashrate: number;
  dailyReward: number;
  totalEarned: number;
  uptime: number;
  temperature: number;
  status: SyndicateNodeType['status'];
  tier: string;
  hourlyRate: number;
  startTime: number | null;
  sessionEarned: number;
}

const MOCK_HASHRATE_HISTORY = Array.from({ length: 24 }, (_, i) => ({
  timestamp: Date.now() - (23 - i) * 3600000,
  value: 0.04 + Math.sin(i / 4) * 0.015 + Math.random() * 0.01,
}));

function MiniHashrateChart({ data }: { data: typeof MOCK_HASHRATE_HISTORY }) {
  const width = screenWidth - spacing.lg * 2 - 32;
  const height = 60;
  const padding = 4;

  const prices = data.map((d) => d.value);
  const min = Math.min(...prices) * 0.9;
  const max = Math.max(...prices) * 1.1;
  const range = max - min || 1;
  const drawW = width - padding * 2;
  const drawH = height - padding * 2;

  const path = Skia.Path.Make();
  data.forEach((point, i) => {
    const x = padding + (i / (data.length - 1)) * drawW;
    const y = padding + drawH - ((point.value - min) / range) * drawH;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });

  const fillPath = Skia.Path.Make();
  fillPath.addPath(path);
  fillPath.lineTo(padding + drawW, padding + drawH);
  fillPath.lineTo(padding, padding + drawH);
  fillPath.close();

  return (
    <Canvas style={{ width, height }}>
      <Path path={fillPath} color={colors.primary + '20'} />
      <Path path={path} color={colors.primary} style="stroke" strokeWidth={2} />
    </Canvas>
  );
}

function TierProgressBar({ currentTier }: { currentTier: typeof NODE_TIERS[0] }) {
  const tierIndex = NODE_TIERS.findIndex((t) => t.name === currentTier.name);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1000 });
  }, []);

  return (
    <View style={styles.tierProgressWrap}>
      <View style={styles.tierProgressBg}>
        {NODE_TIERS.map((t, i) => {
          const isActive = i <= tierIndex;
          const segProgress = useMemo(
            () => ({ width: interpolate(progress.value, [0, 1], [0, isActive ? 100 : 0]) }),
            [isActive],
          );
          const segStyle = useAnimatedStyle(() => ({
            width: `${segProgress.width}%` as any,
          }));

          return (
            <View key={i} style={[styles.tierSeg, { borderColor: isActive ? t.color : colors.cardBorder }]}>
              <Animated.View
                style={[
                  styles.tierSegFill,
                  { backgroundColor: t.color },
                  isActive && segStyle,
                ]}
              />
              <Text style={[styles.tierSegLabel, { color: isActive ? t.color : colors.textMuted }]}>
                {t.name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function EfficiencyScore({ score }: { score: number }) {
  const color = score >= 90 ? colors.chartGreen : score >= 70 ? colors.warning : colors.chartRed;
  const radiusVal = 28;
  const circumference = 2 * Math.PI * radiusVal;
  const filled = (score / 100) * circumference;

  const path = Skia.Path.Make();
  path.addCircle(32, 32, radiusVal);

  return (
    <View style={styles.efficiencyWrap}>
      <Canvas style={{ width: 64, height: 64 }}>
        <Path
          path={path}
          color={colors.cardBorder}
          style="stroke"
          strokeWidth={6}
        />
        <Path
          path={path}
          color={color}
          style="stroke"
          strokeWidth={6}
          start={0}
          end={score / 100}
        />
      </Canvas>
      <View style={styles.efficiencyCenter}>
        <Text style={[styles.efficiencyScore, { color }]}>{score}</Text>
      </View>
      <Text style={styles.efficiencyLabel}>Efficiency</Text>
    </View>
  );
}

function SwipeableNodeControl({
  label,
  gradientColors,
  icon,
  onTrigger,
  swipeThreshold = 0.5,
}: {
  label: string;
  gradientColors: [string, string];
  icon: React.ReactNode;
  onTrigger: () => void;
  swipeThreshold?: number;
}) {
  const translateX = useSharedValue(0);
  const isTriggered = useSharedValue(false);
  const width = Dimensions.get('window').width - spacing.lg * 2;

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = Math.max(0, Math.min(e.translationX, width - 80));
    })
    .onEnd(() => {
      if (translateX.value > width * swipeThreshold) {
        isTriggered.value = true;
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(onTrigger)();
      }
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, width * 0.3], [0, 1]),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[swipeStyles.track, { width }]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={swipeStyles.bg}
        />
        <Animated.View style={[swipeStyles.progress, progressStyle]} />
        <Text style={swipeStyles.label}>{label}</Text>
        <Animated.View style={[swipeStyles.thumb, thumbStyle]}>
          <LinearGradient
            colors={['#FFFFFF', '#E0E0E0']}
            style={swipeStyles.thumbInner}
          >
            {icon}
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const swipeStyles = StyleSheet.create({
  track: {
    height: 56,
    borderRadius: radius.lg,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
  },
  progress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
  },
  label: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  thumb: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    width: 72,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbInner: {
    width: 64,
    height: 48,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

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
      status: nodeStore.status as SyndicateNodeType['status'],
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

  const efficiency = useMemo(() => {
    const base = activeNode.uptime >= 99 ? 95 : 70;
    const tempPenalty = Math.max(0, (activeNode.temperature - 40) * 0.5);
    return Math.round(Math.min(100, base - tempPenalty + Math.random() * 8));
  }, [activeNode.uptime, activeNode.temperature]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (activeNode.status === 'active') {
      interval = setInterval(() => {
        if (activeNode.startTime) {
          setElapsed(Math.floor((Date.now() - activeNode.startTime) / 1000));
        }
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeNode.status, activeNode.startTime]);

  const handleNodeSelect = useCallback((id: string) => {
    setActiveId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleStart = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNodes((prev) =>
      prev.map((n) =>
        n.id === activeId
          ? { ...n, status: 'active' as const, startTime: Date.now(), temperature: 42 }
          : n,
      ),
    );
    nodeStore.setNode({ status: 'active', startTime: Date.now(), temperature: 42 });
    setShowStartModal(false);
    notifyNodeStarted();
  }, [activeId, nodeStore]);

  const handleStop = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setNodes((prev) =>
      prev.map((n) =>
        n.id === activeId
          ? {
              ...n,
              status: 'offline' as const,
              startTime: null,
              totalEarned: n.totalEarned + n.sessionEarned,
              sessionEarned: 0,
            }
          : n,
      ),
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [nodes, currentTier]);

  const handleTierUpgrade = useCallback(
    (tierName: string) => {
      const tier = NODE_TIERS.find((t) => t.name === tierName);
      if (!tier) return;
      if (balance < tier.minASH) {
        Alert.alert(
          'Insufficient Balance',
          `Need ${formatBalance(tier.minASH)} ASH to unlock ${tierName}`,
        );
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNodes((prev) =>
        prev.map((n) =>
          n.id === activeId
            ? {
                ...n,
                tier: tierName as any,
                hashrate: tier.hashrate,
                dailyReward: tier.dailyReward,
                hourlyRate: tier.hourlyRate,
              }
            : n,
        ),
      );
      nodeStore.setNode({
        tier: tierName as any,
        hashrate: tier.hashrate,
        dailyReward: tier.dailyReward,
        hourlyRate: tier.hourlyRate,
      });
      setShowTiers(false);
      Alert.alert('Upgraded!', `Node upgraded to ${tierName} tier`);
    },
    [activeId, balance, nodeStore],
  );

  const estimatedDaily = calcHash
    ? parseFloat(calcHash) * 24
    : currentTier.hourlyRate * 24;

  const syndicateNode: SyndicateNodeType = {
    hashrate: activeNode.hashrate,
    dailyReward: activeNode.dailyReward,
    totalEarned: activeNode.totalEarned,
    uptime: activeNode.uptime,
    temperature: activeNode.temperature,
    status: activeNode.status,
    tier: activeNode.tier as SyndicateNodeType['tier'],
    hourlyRate: activeNode.hourlyRate,
    startTime: activeNode.startTime,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.headerRow}>
          <View style={styles.header}>
            <View style={styles.headerIconWrap}>
              <Shapes size={22} color={colors.text} />
            </View>
            <Text style={styles.title}>Syndicate</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddNode} activeOpacity={0.7}>
            <Plus size={20} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

        {nodes.length > 1 && (
          <Animated.View entering={FadeInDown.duration(400).delay(50).springify()}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nodeSelector}>
              {nodes.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[
                    styles.nodeTab,
                    activeId === n.id && {
                      borderColor: currentTier.color,
                      backgroundColor: currentTier.color + '15',
                    },
                  ]}
                  onPress={() => handleNodeSelect(n.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.nodeTabDot,
                      { backgroundColor: n.status === 'active' ? colors.chartGreen : colors.chartRed },
                    ]}
                  />
                  <Text
                    style={[
                      styles.nodeTabLabel,
                      activeId === n.id && { color: colors.text },
                    ]}
                  >
                    {n.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(500).delay(100).springify()}>
          <SyndicateCard node={syndicateNode} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(150).springify()}>
          <GlassCard gradient style={styles.statsCard}>
            <View style={styles.statsTopRow}>
              <StatCard
                label="Hashrate"
                value={parseHashrate(activeNode.hashrate)}
                icon={<Cpu size={16} color={colors.primary} />}
                delay={0}
                style={styles.statCard}
              />
              <StatCard
                label="Uptime"
                value={`${activeNode.uptime.toFixed(1)}%`}
                icon={<Activity size={16} color={colors.info} />}
                delay={50}
                style={styles.statCard}
              />
            </View>
            <View style={styles.statsBottomRow}>
              <StatCard
                label="Temperature"
                value={`${activeNode.temperature}°C`}
                trend={activeNode.temperature > 75 ? 'down' : 'up'}
                trendValue={activeNode.temperature > 75 ? 'High' : 'Normal'}
                delay={100}
                style={styles.statCard}
              />
              <StatCard
                label="Daily Reward"
                value={`+${formatBalance(activeNode.dailyReward)}`}
                trend="up"
                trendValue="Estimate"
                delay={150}
                style={styles.statCard}
              />
            </View>

            {activeNode.status === 'active' && (
              <View style={styles.sessionRow}>
                <View style={styles.sessionLeft}>
                  <Clock size={14} color={colors.textSecondary} />
                  <Text style={styles.sessionLabel}>Session</Text>
                  <Text style={styles.sessionValue}>{formatDuration(elapsed)}</Text>
                </View>
                <Text style={styles.sessionEarned}>
                  +{formatBalance(activeNode.sessionEarned)} ASH
                </Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200).springify()}>
          <GlassCard gradient style={styles.advancedStatsCard}>
            <Text style={styles.advancedTitle}>Node Performance</Text>
            <View style={styles.advancedRow}>
              <EfficiencyScore score={efficiency} />
              <View style={styles.advancedStats}>
                <View style={styles.advancedStat}>
                  <Zap size={14} color={colors.accent} />
                  <Text style={styles.advancedStatLabel}>Node Power</Text>
                  <Text style={styles.advancedStatValue}>
                    {activeNode.status === 'active' ? 'Full' : 'Idle'}
                  </Text>
                </View>
                <View style={styles.advancedStat}>
                  <Flame size={14} color={colors.danger} />
                  <Text style={styles.advancedStatLabel}>Heat Output</Text>
                  <Text style={styles.advancedStatValue}>
                    {activeNode.temperature > 70 ? 'Warning' : 'Normal'}
                  </Text>
                </View>
                <View style={styles.advancedStat}>
                  <Sparkles size={14} color={colors.chartGreen} />
                  <Text style={styles.advancedStatLabel}>Total Earned</Text>
                  <Text style={styles.advancedStatValue}>
                    +{formatCompact(activeNode.totalEarned)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.miniChartWrap}>
              <Text style={styles.miniChartLabel}>Hashrate (24h)</Text>
              <MiniHashrateChart data={MOCK_HASHRATE_HISTORY} />
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(250).springify()} style={styles.actionsRow}>
          {activeNode.status !== 'active' ? (
            <SwipeableNodeControl
              label="Swipe to Start Node"
              gradientColors={['#6C5CE7', '#A29BFE']}
              icon={<Play size={18} color={colors.text} />}
              onTrigger={() => setShowStartModal(true)}
            />
          ) : (
            <SwipeableNodeControl
              label="Swipe to Stop Node"
              gradientColors={['#E17055', '#FF7675']}
              icon={<Square size={18} color={colors.text} />}
              onTrigger={() => setShowStopModal(true)}
              swipeThreshold={0.6}
            />
          )}
        </Animated.View>

        <TouchableOpacity
          style={styles.sectionToggle}
          onPress={() => setShowTiers(!showTiers)}
          activeOpacity={0.7}
        >
          <Award size={20} color={colors.accent} />
          <Text style={styles.sectionTitle}>Tier Upgrade</Text>
          <View style={[styles.tierBadge, { backgroundColor: currentTier.color + '20' }]}>
            <Text style={[styles.tierBadgeText, { color: currentTier.color }]}>
              {currentTier.name}
            </Text>
          </View>
          {showTiers ? (
            <ChevronUp size={18} color={colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        <TierProgressBar currentTier={currentTier} />

        {showTiers && (
          <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.tiersContainer}>
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
                    {isCurrent ? (
                      <Check size={16} color={t.color} />
                    ) : (
                      <ArrowUp size={16} color={t.color} />
                    )}
                  </View>
                  <View style={styles.tierInfo}>
                    <Text style={styles.tierName}>
                      {t.name}
                      {t.benefits.length > 0 && (
                        <Text style={styles.tierBenefitPreview}>
                          {' · '}{t.benefits[0]}
                        </Text>
                      )}
                    </Text>
                    <Text style={styles.tierDetail}>
                      {parseHashrate(t.hashrate)} · +{formatBalance(t.dailyReward)}/day
                    </Text>
                  </View>
                  {isCurrent ? (
                    <TierBadge tier={t.name} color={t.color} size="sm" />
                  ) : (
                    <Text
                      style={[
                        styles.tierMinASH,
                        { color: canUpgrade ? colors.chartGreen : colors.textMuted },
                      ]}
                    >
                      {canUpgrade ? 'Upgrade' : `${formatBalance(t.minASH)} ASH`}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}

        <TouchableOpacity
          style={styles.sectionToggle}
          onPress={() => setShowCalculator(!showCalculator)}
          activeOpacity={0.7}
        >
          <Gauge size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Earning Calculator</Text>
          {showCalculator ? (
            <ChevronUp size={18} color={colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        {showCalculator && (
          <Animated.View entering={FadeInDown.duration(300).springify()}>
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
                <View style={styles.calcCol}>
                  <Text style={styles.calcLabel}>Hourly</Text>
                  <Text style={styles.calcValue}>{formatBalance(estimatedDaily / 24)} ASH</Text>
                </View>
                <View style={styles.calcCol}>
                  <Text style={styles.calcLabel}>Daily</Text>
                  <Text style={styles.calcValue}>{formatBalance(estimatedDaily)} ASH</Text>
                </View>
              </View>
              <View style={styles.calcResults}>
                <View style={styles.calcCol}>
                  <Text style={styles.calcLabel}>Monthly</Text>
                  <Text style={styles.calcValue}>{formatBalance(estimatedDaily * 30)} ASH</Text>
                </View>
                <View style={styles.calcCol}>
                  <Text style={styles.calcLabel}>Yearly</Text>
                  <Text style={[styles.calcValue, { color: colors.chartGreen }]}>
                    {formatBalance(estimatedDaily * 365)} ASH
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
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
            Share your referral link and earn{' '}
            {currentTier.name === 'Gold'
              ? '10%'
              : currentTier.name === 'Silver'
                ? '5%'
                : '3%'}{' '}
            of their rewards forever!
          </Text>
          <View style={styles.refLinkRow}>
            <Text style={styles.refLinkText}>
              https://ashcoin.app/ref/{displayName || balance.toFixed(0)}
            </Text>
            <TouchableOpacity style={styles.copyBtn} activeOpacity={0.7}>
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
        details={
          activeNode.sessionEarned > 0
            ? [{ label: 'Unclaimed Reward', value: `${formatBalance(activeNode.sessionEarned)} ASH` }]
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h2, color: colors.text },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeSelector: { marginBottom: spacing.md },
  nodeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: spacing.sm,
  },
  nodeTabDot: { width: 8, height: 8, borderRadius: 4 },
  nodeTabLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  statsCard: { marginTop: spacing.md, marginBottom: spacing.sm },
  statsTopRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statsBottomRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sessionLabel: { ...typography.micro, color: colors.textMuted },
  sessionValue: { ...typography.captionBold, color: colors.text },
  sessionEarned: { ...typography.captionBold, color: colors.chartGreen },
  advancedStatsCard: { marginBottom: spacing.md, marginTop: spacing.sm },
  advancedTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  advancedRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  advancedStats: { flex: 1, gap: spacing.sm },
  advancedStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  advancedStatLabel: { ...typography.micro, color: colors.textMuted, flex: 1 },
  advancedStatValue: { ...typography.captionBold, color: colors.text },
  efficiencyWrap: { alignItems: 'center' },
  efficiencyCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  efficiencyScore: { fontSize: 16, fontWeight: '800' },
  efficiencyLabel: { ...typography.micro, color: colors.textMuted, marginTop: 4 },
  miniChartWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  miniChartLabel: { ...typography.micro, color: colors.textMuted, marginBottom: spacing.xs },
  actionsRow: { marginBottom: spacing.lg },
  actionBtn: { width: '100%' },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.text, flex: 1 },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tierBadgeText: { fontSize: 11, fontWeight: '700' },
  tierProgressWrap: { marginBottom: spacing.sm },
  tierProgressBg: {
    flexDirection: 'row',
    borderRadius: radius.full,
    overflow: 'hidden',
    height: 28,
    backgroundColor: colors.surface,
  },
  tierSeg: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tierSegFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    opacity: 0.2,
  },
  tierSegLabel: { fontSize: 10, fontWeight: '700', zIndex: 1 },
  tiersContainer: { gap: spacing.sm, marginBottom: spacing.sm },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.md,
  },
  tierIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierInfo: { flex: 1 },
  tierName: { ...typography.bodyBold, color: colors.text },
  tierBenefitPreview: { ...typography.caption, color: colors.textMuted },
  tierDetail: { ...typography.micro, color: colors.textMuted, marginTop: 1 },
  tierMinASH: { ...typography.captionBold },
  calculatorCard: { marginBottom: spacing.sm },
  inputLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  calcResults: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  calcCol: { flex: 1, alignItems: 'center' },
  calcLabel: { ...typography.micro, color: colors.textMuted },
  calcValue: { ...typography.captionBold, color: colors.text, marginTop: 2 },
  calcDivider: { width: 1, backgroundColor: colors.cardBorder, marginVertical: 4 },
  referralCard: { marginTop: spacing.sm },
  refHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  refTitle: { ...typography.bodyBold, color: colors.text, flex: 1 },
  refDesc: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  refLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  refLinkText: { ...typography.caption, color: colors.primary, flex: 1 },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refStats: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.md },
  refStat: { flex: 1, alignItems: 'center' },
  refStatValue: { ...typography.captionBold, color: colors.text },
  refStatLabel: { ...typography.micro, color: colors.textMuted },
  refDivider: { width: 1, backgroundColor: colors.cardBorder, marginVertical: 4 },
});
