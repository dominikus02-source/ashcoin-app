import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '../../constants';
import { formatBalance, formatUSD } from '../../utils';

interface BalanceDisplayProps {
  balance: number;
  usdValue?: number;
  symbol?: string;
  title?: string;
  variant?: 'large' | 'medium' | 'small';
  gradient?: [string, string];
}

export function BalanceDisplay({ balance, usdValue, symbol = 'ASH', title, variant = 'medium', gradient }: BalanceDisplayProps) {
  const sizeStyles = {
    large: { balanceSize: 36, usdSize: 16, titleSize: 13, spacing: 8 },
    medium: { balanceSize: 28, usdSize: 14, titleSize: 11, spacing: 4 },
    small: { balanceSize: 20, usdSize: 12, titleSize: 10, spacing: 2 },
  };

  const s = sizeStyles[variant];
  const content = (
    <View style={styles.container}>
      {title && <Text style={[styles.title, { fontSize: s.titleSize }]}>{title}</Text>}
      <Text style={[styles.balance, { fontSize: s.balanceSize }]}>{formatBalance(balance)} {symbol}</Text>
      {usdValue !== undefined && (
        <Text style={[styles.usd, { fontSize: s.usdSize, marginTop: s.spacing }]}>
          {formatUSD(usdValue)}
        </Text>
      )}
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientWrap}>
        {content}
      </LinearGradient>
    );
  }

  return <View style={styles.wrap}>{content}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
  },
  gradientWrap: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  container: {
    alignItems: 'center',
  },
  title: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  balance: {
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  usd: {
    color: colors.textMuted,
    fontWeight: '500',
  },
});
