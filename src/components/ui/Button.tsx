import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, typography, spacing } from '../../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, icon, style }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const gradients: Record<string, [string, string]> = {
    primary: ['#6C5CE7', '#A29BFE'],
    secondary: ['#00CEC9', '#55E6C1'],
    danger: ['#E17055', '#FF7675'],
  };

  const sizeStyles = {
    sm: { py: spacing.sm, px: spacing.lg, fs: typography.caption.fontSize },
    md: { py: spacing.md, px: spacing.xl, fs: typography.body.fontSize },
    lg: { py: spacing.lg, px: spacing.xxl, fs: typography.bodyBold.fontSize },
  };

  const s = sizeStyles[size];

  if (isPrimary || variant === 'secondary' || variant === 'danger') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8} style={style}>
        <LinearGradient
          colors={gradients[variant] || gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { paddingVertical: s.py, paddingHorizontal: s.px, opacity: disabled ? 0.5 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.text, { fontSize: s.fs, marginLeft: icon ? spacing.sm : 0 }]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.ghost,
        {
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          opacity: disabled ? 0.5 : 1,
          borderColor: colors.cardBorder,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textSecondary} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.ghostText, { fontSize: s.fs, marginLeft: icon ? spacing.sm : 0 }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  text: {
    color: colors.text,
    fontWeight: '700',
  },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  ghostText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
