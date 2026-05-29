import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Canvas, Path, Skia, useCanvasRef } from '@shopify/react-native-skia';
import { colors, radius, spacing, typography } from '../../constants';
import { PricePoint } from '../../types';

interface PriceChartProps {
  data: PricePoint[];
  timeframe: string;
  onTimeframeChange?: (tf: string) => void;
  width?: number;
  height?: number;
}

const TIMEFRAMES = ['1H', '24H', '7D', '30D'];

export function PriceChart({ data, timeframe, onTimeframeChange, width, height = 180 }: PriceChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = width || screenWidth - spacing.lg * 2;

  if (data.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>No price data available</Text>
      </View>
    );
  }

  const prices = data.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const padding = 20;
  const drawWidth = chartWidth - padding * 2;
  const drawHeight = height - padding * 2;

  const path = Skia.Path.Make();
  data.forEach((point, i) => {
    const x = padding + (i / (data.length - 1)) * drawWidth;
    const y = padding + drawHeight - ((point.price - min) / range) * drawHeight;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });

  const isUp = prices[prices.length - 1] >= prices[0];
  const lineColor = isUp ? colors.chartGreen : colors.chartRed;

  const changePercent = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Price Chart</Text>
        <View style={styles.changeRow}>
          <Text style={[styles.changeText, { color: isUp ? colors.chartGreen : colors.chartRed }]}>
            {isUp ? '+' : ''}{changePercent.toFixed(2)}%
          </Text>
          <View style={[styles.dot, { backgroundColor: isUp ? colors.chartGreen : colors.chartRed }]} />
        </View>
      </View>

      <Canvas style={[{ width: chartWidth, height }]}>
        <Path path={path} color={lineColor} style="stroke" strokeWidth={2} />
        <Path
          path={path}
          color={lineColor}
          style="stroke"
          strokeWidth={4}
          opacity={0.15}
        />
      </Canvas>

      <View style={styles.timeframeRow}>
        {TIMEFRAMES.map((tf) => (
          <TouchableOpacity
            key={tf}
            onPress={() => onTimeframeChange?.(tf)}
            style={[styles.timeBtn, timeframe === tf && styles.timeBtnActive]}
          >
            <Text style={[styles.timeText, timeframe === tf && styles.timeTextActive]}>{tf}</Text>
          </TouchableOpacity>
        ))}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodyBold,
    color: colors.text,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: 60,
  },
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  timeBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  timeBtnActive: {
    backgroundColor: colors.primary,
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  timeTextActive: {
    color: colors.text,
  },
});
