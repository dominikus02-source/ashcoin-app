import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Pickaxe, Gift, ArrowUpRight, ArrowDownRight, Lock, Unlock } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../constants';
import { Transaction } from '../../types';
import { formatTimeAgo, formatBalance } from '../../utils';

interface ActivityListProps {
  transactions: Transaction[];
}

const ICONS: Record<string, React.ReactNode> = {
  mining_reward: <Pickaxe size={16} color={colors.chartGreen} />,
  daily_bonus: <Gift size={16} color={colors.accent} />,
  transfer_sent: <ArrowUpRight size={16} color={colors.chartRed} />,
  transfer_received: <ArrowDownRight size={16} color={colors.chartGreen} />,
  transfer_to_staking: <Lock size={16} color={colors.primary} />,
  transfer_from_staking: <Unlock size={16} color={colors.info} />,
};

export function ActivityList({ transactions }: ActivityListProps) {
  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recent Activity</Text>
        <Text style={styles.emptyText}>No activity yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>
      <FlatList
        data={transactions.slice(0, 10)}
        keyExtractor={(_, i) => String(i)}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              {ICONS[item.type] || <ArrowUpRight size={16} color={colors.textSecondary} />}
            </View>
            <View style={styles.info}>
              <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
              <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
            </View>
            <View style={styles.amountWrap}>
              <Text style={[styles.amount, { color: item.amount >= 0 ? colors.chartGreen : colors.chartRed }]}>
                {item.amount >= 0 ? '+' : ''}{formatBalance(item.amount)}
              </Text>
              <Text style={styles.status}>{item.status || 'completed'}</Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  title: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  desc: {
    ...typography.caption,
    color: colors.text,
  },
  time: {
    ...typography.micro,
    color: colors.textMuted,
    marginTop: 2,
  },
  amountWrap: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.captionBold,
  },
  status: {
    ...typography.micro,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  separator: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: spacing.sm,
  },
});
