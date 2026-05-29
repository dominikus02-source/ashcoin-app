import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Cpu, Clock, TrendingUp } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../constants';
import { SyndicateNode } from '../../types';
import { formatBalance, parseHashrate, formatDuration } from '../../utils';

interface SyndicateCardProps {
  node: SyndicateNode;
}

export function SyndicateCard({ node }: SyndicateCardProps) {
  const statusColors: Record<string, string> = {
    active: colors.chartGreen,
    paused: colors.warning,
    offline: colors.chartRed,
    starting: colors.warning,
    stopping: colors.warning,
  };

  return (
    <LinearGradient colors={['#1A1A35', '#141428']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.badge}>
            <Activity size={14} color={statusColors[node.status]} />
          </View>
          <View>
            <Text style={styles.title}>Syndicate Node</Text>
            <Text style={styles.tier}>{node.tier} Tier</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[node.status] + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColors[node.status] }]} />
          <Text style={[styles.statusText, { color: statusColors[node.status] }]}>
            {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.stat}>
          <Cpu size={14} color={colors.textSecondary} />
          <Text style={styles.statLabel}>Hashrate</Text>
          <Text style={styles.statValue}>{parseHashrate(node.hashrate)}</Text>
        </View>
        <View style={styles.stat}>
          <TrendingUp size={14} color={colors.textSecondary} />
          <Text style={styles.statLabel}>Daily Reward</Text>
          <Text style={[styles.statValue, { color: colors.chartGreen }]}>+{formatBalance(node.dailyReward)}</Text>
        </View>
        <View style={styles.stat}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={styles.statLabel}>Uptime</Text>
          <Text style={styles.statValue}>{node.uptime.toFixed(1)}%</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.bodyBold,
    color: colors.text,
  },
  tier: {
    ...typography.micro,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    ...typography.micro,
    color: colors.textMuted,
  },
  statValue: {
    ...typography.captionBold,
    color: colors.text,
  },
});
