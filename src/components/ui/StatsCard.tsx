import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants';

interface StatsCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  style?: ViewStyle;
}

export function StatsCard({ label, value, sublabel, icon, color = colors.primary, trend, style }: StatsCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 3 }, style]}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderLeftWidth: 3,
    padding: spacing.md,
  },
  iconWrap: {
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.micro,
    color: colors.textMuted,
    marginBottom: 2,
  },
  value: {
    ...typography.h3,
    fontWeight: '700',
  },
  sublabel: {
    ...typography.micro,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
