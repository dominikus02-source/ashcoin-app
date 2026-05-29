import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Settings } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../constants';
import { formatBalance, formatUSD, formatCompact } from '../../utils';

interface PremiumHeaderProps {
  ashBalance: number;
  ashPrice: number;
  earningToday: number;
  earningChange: number;
  avatarUrl?: string | null;
  onNotificationPress?: () => void;
  onSettingsPress?: () => void;
}

export function PremiumHeader({
  ashBalance,
  ashPrice,
  earningToday,
  earningChange,
  avatarUrl,
  onNotificationPress,
  onSettingsPress,
}: PremiumHeaderProps) {
  const totalUSD = ashBalance * ashPrice;
  const isEarningUp = earningChange >= 0;

  return (
    <LinearGradient
      colors={['#1A1A40', '#141428', '#0A0A1A']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <Animated.View entering={FadeInDown.duration(600).springify()}>
        <View style={styles.topRow}>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              style={styles.logo}
            >
              <Text style={styles.logoText}>ASH</Text>
            </LinearGradient>
            <Text style={styles.brandName}>ASH Finance</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onNotificationPress} style={styles.iconBtn}>
              <View style={styles.notifDot} />
              <Bell size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onSettingsPress} style={styles.iconBtn}>
              <Settings size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                style={[styles.avatar, styles.avatarPlaceholder]}
              >
                <Text style={styles.avatarText}>A</Text>
              </LinearGradient>
            )}
          </View>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(600).delay(100).springify()}
        style={styles.balanceSection}
      >
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>{formatBalance(ashBalance)} ASH</Text>
        <Text style={styles.balanceUSD}>{formatUSD(totalUSD)}</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(600).delay(200).springify()}
        style={styles.statsRow}
      >
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Earning Today</Text>
          <Text style={styles.statValue}>{formatCompact(earningToday)} ASH</Text>
          <View style={styles.statChangeRow}>
            <View
              style={[
                styles.statChangeDot,
                { backgroundColor: isEarningUp ? colors.chartGreen : colors.chartRed },
              ]}
            />
            <Text
              style={[
                styles.statChangeText,
                { color: isEarningUp ? colors.chartGreen : colors.chartRed },
              ]}
            >
              {isEarningUp ? '+' : ''}{earningChange.toFixed(2)}%
            </Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>ASH Price</Text>
          <Text style={styles.statValue}>{formatUSD(ashPrice)}</Text>
          <Text style={styles.statSubtext}>24h • +5.23%</Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(600).delay(300).springify()}
        style={styles.priceRow}
      >
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Market Cap</Text>
          <Text style={styles.priceValue}>{formatUSD(totalUSD * 100000)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Circulating</Text>
          <Text style={styles.priceValue}>{formatCompact(ashBalance * 1000)} ASH</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Volume 24h</Text>
          <Text style={styles.priceValue}>{formatUSD(totalUSD * 5000)}</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xxl + 24,
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
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    zIndex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
  },
  avatarPlaceholder: {
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
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  balanceUSD: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface + 'CC',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder + '60',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  statChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  statChangeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statChangeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statSubtext: {
    color: colors.chartGreen,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.cardBorder,
    marginHorizontal: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface + '99',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder + '40',
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: colors.cardBorder,
  },
});
