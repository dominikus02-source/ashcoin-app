import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Diamond, Sparkles } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../constants';

interface TierBadgeProps {
  tier: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  nftStyle?: boolean;
}

const tierColors: Record<string, { bg: string; text: string; glow: string }> = {
  Bronze: { bg: '#CD7F32', text: '#CD7F32', glow: '#CD7F3240' },
  Silver: { bg: '#C0C0C0', text: '#E8E8E8', glow: '#C0C0C040' },
  Gold: { bg: '#FFD700', text: '#FFD700', glow: '#FFD70040' },
  Starter: { bg: '#6C5CE7', text: '#A29BFE', glow: '#6C5CE740' },
  Node: { bg: '#00CEC9', text: '#55E6C1', glow: '#00CEC940' },
  'Super Node': { bg: '#FDCB6E', text: '#FDCB6E', glow: '#FDCB6E40' },
  Genesis: { bg: '#E17055', text: '#FF7675', glow: '#E1705540' },
};

export function TierBadge({ tier, color, size = 'md', nftStyle = true }: TierBadgeProps) {
  const tc = color ? { bg: color, text: color, glow: color + '40' } : (tierColors[tier] || { bg: colors.primary, text: colors.primary, glow: colors.primary + '40' });

  const sizeStyles = {
    sm: { py: 2, px: spacing.sm, fontSize: 9, iconSize: 10, gap: 3 },
    md: { py: spacing.xs, px: spacing.md, fontSize: 11, iconSize: 12, gap: 5 },
    lg: { py: spacing.sm, px: spacing.lg, fontSize: 14, iconSize: 14, gap: 6 },
  };

  const s = sizeStyles[size];

  if (nftStyle) {
    return (
      <LinearGradient
        colors={[tc.bg + '25', tc.bg + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.nftBadge, { paddingVertical: s.py, paddingHorizontal: s.px, gap: s.gap, borderColor: tc.bg + '40' }]}
      >
        <Diamond size={s.iconSize} color={tc.text} fill={tc.text + '40'} />
        <Text style={[styles.nftText, { color: tc.text, fontSize: s.fontSize }]}>{tier}</Text>
        <Sparkles size={s.iconSize - 2} color={tc.text + '80'} />
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: tc.bg + '20', paddingVertical: s.py, paddingHorizontal: s.px }]}>
      <View style={[styles.dot, { backgroundColor: tc.bg }]} />
      <Text style={[styles.text, { color: tc.text, fontSize: s.fontSize }]}>{tier}</Text>
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
  nftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  nftText: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
