export const colors = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  secondary: '#00CEC9',
  accent: '#FDCB6E',
  danger: '#E17055',
  success: '#00B894',
  warning: '#F39C12',
  info: '#0984E3',

  background: '#0A0A1A',
  surface: '#141428',
  surfaceLight: '#1E1E3A',
  card: '#1A1A35',
  cardBorder: '#2A2A4A',

  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#8888AA',
  textMuted: '#555577',

  tabBar: '#0D0D20',
  tabBorder: '#1E1E3A',
  tabActive: '#6C5CE7',
  tabInactive: '#555577',

  chartGreen: '#00B894',
  chartRed: '#E17055',
  chartLine: '#6C5CE7',
  chartGrid: '#1E1E3A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodyBold: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  captionBold: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  micro: { fontSize: 10, fontWeight: '500' as const, lineHeight: 14 },
};
