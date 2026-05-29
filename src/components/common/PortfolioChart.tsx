import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Path, Skia, useCanvasRef } from '@shopify/react-native-skia';
import { colors, radius, spacing, typography } from '../../constants';
import { PortfolioAsset } from '../../types';

interface PortfolioChartProps {
  assets: PortfolioAsset[];
  totalValue: number;
}

export function PortfolioChart({ assets, totalValue }: PortfolioChartProps) {
  if (assets.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Portfolio</Text>
        <Text style={styles.emptyText}>No assets yet</Text>
      </View>
    );
  }

  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  let currentAngle = -Math.PI / 2;

  const slicePath = (startAngle: number, endAngle: number, color: string) => {
    const path = Skia.Path.Make();
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    path.moveTo(cx, cy);
    path.lineTo(x1, y1);
    path.arcToOval(
      { x: cx - r, y: cy - r, width: r * 2, height: r * 2 },
      (startAngle * 180) / Math.PI,
      ((endAngle - startAngle) * 180) / Math.PI,
      false
    );
    path.close();
    return path;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portfolio</Text>
      <View style={styles.content}>
        <Canvas style={{ width: size, height: size }}>
          {assets.map((asset, i) => {
            const angle = (asset.valueUSD / totalValue) * 2 * Math.PI;
            const endAngle = currentAngle + angle;
            const p = slicePath(currentAngle, endAngle, asset.color);
            currentAngle = endAngle;
            return <Path key={i} path={p} color={asset.color} />;
          })}
        </Canvas>
        <View style={styles.legend}>
          {assets.map((asset, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: asset.color }]} />
              <Text style={styles.legendLabel}>{asset.symbol}</Text>
              <Text style={styles.legendValue}>
                {(asset.valueUSD / totalValue * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  title: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  legend: {
    flex: 1,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  legendValue: {
    ...typography.captionBold,
    color: colors.text,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
