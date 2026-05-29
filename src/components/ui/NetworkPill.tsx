import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../constants';
import { NETWORKS } from '../../constants/theme';

interface NetworkPillProps {
  networkId?: string;
  onPress?: () => void;
  small?: boolean;
}

export function NetworkPill({ networkId = 'bnb', onPress, small }: NetworkPillProps) {
  const network = NETWORKS.find((n) => n.id === networkId) || NETWORKS[0];

  return (
    <TouchableOpacity
      style={[styles.pill, small && styles.pillSmall]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.dot, { backgroundColor: network.color }]}>
        <Text style={styles.dotText}>{network.icon}</Text>
      </View>
      <Text style={[styles.label, small && styles.labelSmall]}>{network.symbol}</Text>
      {!small && <ChevronDown size={12} color={colors.textSecondary} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pillSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  label: {
    ...typography.captionBold,
    color: colors.text,
  },
  labelSmall: {
    ...typography.micro,
    fontWeight: '700',
  },
});
