import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Settings } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../constants';
import { formatBalance, formatUSD } from '../../utils';

interface HeaderProps {
  ashBalance: number;
  ashPrice: number;
  avatarUrl?: string | null;
  onNotificationPress?: () => void;
  onSettingsPress?: () => void;
}

export function Header({ ashBalance, ashPrice, avatarUrl, onNotificationPress, onSettingsPress }: HeaderProps) {
  const totalUSD = ashBalance * ashPrice;

  return (
    <LinearGradient colors={['#141428', '#1A1A35']} style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.logoRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>ASH</Text>
          </View>
          <Text style={styles.brandName}>ASH Finance</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onNotificationPress} style={styles.iconBtn}>
            <Bell size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSettingsPress} style={styles.iconBtn}>
            <Settings size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>A</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>{formatBalance(ashBalance)} ASH</Text>
        <Text style={styles.balanceUSD}>{formatUSD(totalUSD)}</Text>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>ASH Price</Text>
          <Text style={styles.priceValue}>{formatUSD(ashPrice)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>24h Change</Text>
          <Text style={[styles.priceValue, { color: colors.chartGreen }]}>+5.23%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Market Cap</Text>
          <Text style={styles.priceValue}>{formatUSD(ashBalance * ashPrice * 100000)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xxl + 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  brandName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  balanceLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  balanceUSD: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  priceValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.cardBorder,
  },
});
