import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pickaxe, PiggyBank, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../constants';
import { LinearGradient } from 'expo-linear-gradient';

interface QuickActionsProps {
  onStake?: () => void;
  onMining?: () => void;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

const ACTIONS = [
  { key: 'stake', label: 'Stake', icon: PiggyBank, gradient: ['#6C5CE7', '#A29BFE'] as [string, string] },
  { key: 'mining', label: 'Start Mining', icon: Pickaxe, gradient: ['#00CEC9', '#55E6C1'] as [string, string] },
  { key: 'deposit', label: 'Deposit', icon: ArrowDownToLine, gradient: ['#0984E3', '#74B9FF'] as [string, string] },
  { key: 'withdraw', label: 'Withdraw', icon: ArrowUpFromLine, gradient: ['#E17055', '#FF7675'] as [string, string] },
];

export function QuickActions({ onStake, onMining, onDeposit, onWithdraw }: QuickActionsProps) {
  const handlers: Record<string, () => void> = {
    stake: onStake || (() => {}),
    mining: onMining || (() => {}),
    deposit: onDeposit || (() => {}),
    withdraw: onWithdraw || (() => {}),
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.grid}>
        {ACTIONS.map(({ key, label, icon: Icon, gradient }) => (
          <TouchableOpacity key={key} onPress={handlers[key]} activeOpacity={0.8} style={styles.actionBtn}>
            <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrap}>
              <Icon size={22} color={colors.text} />
            </LinearGradient>
            <Text style={styles.actionLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  title: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
