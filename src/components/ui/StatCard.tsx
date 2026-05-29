import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../constants';

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}

export function StatCard({
  label,
  value,
  sublabel,
  trend,
  trendValue,
  icon,
  delay = 0,
  style,
}: StatCardProps) {
  const trendColors = {
    up: colors.chartGreen,
    down: colors.chartRed,
    neutral: colors.textSecondary,
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay).springify()}
      style={[styles.card, style]}
    >
      <LinearGradient
        colors={[colors.surface + 'F2', colors.card + 'F2']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.label}>{label}</Text>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
        </View>
        <Text style={styles.value}>{value}</Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        {trend && trendValue && (
          <View style={styles.trendRow}>
            <View
              style={[
                styles.trendDot,
                { backgroundColor: trendColors[trend] },
              ]}
            />
            <Text style={[styles.trendText, { color: trendColors[trend] }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder + '80',
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sublabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  trendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
