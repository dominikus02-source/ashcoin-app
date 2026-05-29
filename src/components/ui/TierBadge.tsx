import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants';
import { NodeTier, StakingProduct } from '../../types';

interface TierBadgeProps {
  tier: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tier, color, size = 'md' }: TierBadgeProps) {
  const tierColors: Record<string, string> = {
    Bronze: '#CD7F32',
    Silver: '#C0C0C0',
    Gold: '#FFD700',
    Starter: '#6C5CE7',
    Node: '#00CEC9',
    'Super Node': '#FDCB6E',
    Genesis: '#E17055',
  };

  const bgColor = color || tierColors[tier] || colors.primary;
  const sizeStyles = {
    sm: { py: 2, px: spacing.sm, fontSize: 9 },
    md: { py: spacing.xs, px: spacing.md, fontSize: 11 },
    lg: { py: spacing.sm, px: spacing.lg, fontSize: 13 },
  };

  const s = sizeStyles[size];

  return (
    <View style={[styles.badge, { backgroundColor: bgColor + '20', paddingVertical: s.py, paddingHorizontal: s.px }]}>
      <View style={[styles.dot, { backgroundColor: bgColor }]} />
      <Text style={[styles.text, { color: bgColor, fontSize: s.fontSize }]}>{tier}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontWeight: '700',
  },
});
