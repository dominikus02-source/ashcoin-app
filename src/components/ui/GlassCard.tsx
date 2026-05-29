import type { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../../constants';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  colors?: [string, string];
}

export function GlassCard({
  children,
  style,
  gradient = false,
  colors: gradientColors,
}: GlassCardProps) {
  if (gradient) {
    const gColors = gradientColors ?? [colors.glassBg, colors.glassBg];
    return (
      <LinearGradient colors={gColors} style={[styles.card, style]}>
        <View style={styles.glow} />
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <View style={styles.glow} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '10',
  },
});
