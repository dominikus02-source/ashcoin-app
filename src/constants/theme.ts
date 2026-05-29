import { useColorScheme } from 'react-native';

// ─── Web3 Premium Design System ──────────────────────────────────────────────
// Trust Wallet x MetaMask inspired | Dark-first | Blue-purple gradient accent

export const palette = {
  // Brand
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#4A3DB5',
  secondary: '#00CEC9',
  accent: '#FDCB6E',
  danger: '#E17055',
  success: '#00B894',
  warning: '#F39C12',
  info: '#0984E3',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#FAFAFA',
  gray100: '#F0F0F5',
  gray200: '#E0E0EC',
  gray300: '#C0C0D0',
  gray400: '#9090B0',
  gray500: '#707090',
  gray600: '#505070',
  gray700: '#303050',
  gray800: '#1E1E38',
  gray900: '#12122A',
  gray950: '#0A0A1A',

  // Crypto chain colors
  bnb: '#F0B90B',
  eth: '#627EEA',
  polygon: '#8247E5',
  solana: '#9945FF',
  btc: '#F7931A',
} as const;

export type ColorScheme = 'dark' | 'light';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  danger: string;
  success: string;
  warning: string;
  info: string;

  background: string;
  surface: string;
  surfaceLight: string;
  card: string;
  cardBorder: string;
  cardElevated: string;

  text: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  tabBar: string;
  tabBorder: string;
  tabActive: string;
  tabInactive: string;

  chartGreen: string;
  chartRed: string;
  chartLine: string;
  chartGrid: string;

  glassBg: string;
  glassBorder: string;
  overlay: string;

  // Token colors
  tokenAsh: string;
  tokenBnb: string;
  tokenEth: string;
}

export const darkTheme: ThemeColors = {
  primary: '#7C6CF0',
  primaryLight: '#A29BFE',
  primaryDark: '#4A3DB5',
  secondary: '#00CEC9',
  accent: '#FDCB6E',
  danger: '#FF6B6B',
  success: '#00D68F',
  warning: '#FFA726',
  info: '#5B8DEF',

  background: '#0A0A1A',
  surface: '#12122A',
  surfaceLight: '#1A1A3E',
  card: '#16163A',
  cardBorder: '#2A2A5A',
  cardElevated: '#1E1E48',

  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#9090C0',
  textMuted: '#606090',

  tabBar: '#0A0A1A',
  tabBorder: '#2A2A5A',
  tabActive: '#7C6CF0',
  tabInactive: '#606090',

  chartGreen: '#00D68F',
  chartRed: '#FF6B6B',
  chartLine: '#7C6CF0',
  chartGrid: '#2A2A5A',

  glassBg: 'rgba(18,18,42,0.85)',
  glassBorder: 'rgba(42,42,90,0.5)',
  overlay: 'rgba(0,0,0,0.6)',

  tokenAsh: '#7C6CF0',
  tokenBnb: '#F0B90B',
  tokenEth: '#627EEA',
};

export const lightTheme: ThemeColors = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#4A3DB5',
  secondary: '#00CEC9',
  accent: '#F39C12',
  danger: '#E17055',
  success: '#00B894',
  warning: '#F39C12',
  info: '#0984E3',

  background: '#F5F5FA',
  surface: '#FFFFFF',
  surfaceLight: '#F0F0F5',
  card: '#FFFFFF',
  cardBorder: '#E0E0EC',
  cardElevated: '#FFFFFF',

  text: '#1A1A2E',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B6B8D',
  textMuted: '#A0A0C0',

  tabBar: '#FFFFFF',
  tabBorder: '#E0E0EC',
  tabActive: '#6C5CE7',
  tabInactive: '#A0A0C0',

  chartGreen: '#00B894',
  chartRed: '#E17055',
  chartLine: '#6C5CE7',
  chartGrid: '#E0E0EC',

  glassBg: 'rgba(255,255,255,0.85)',
  glassBorder: 'rgba(224,224,236,0.5)',
  overlay: 'rgba(0,0,0,0.3)',

  tokenAsh: '#6C5CE7',
  tokenBnb: '#F0B90B',
  tokenEth: '#627EEA',
};

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

// ─── Shadow / Elevation ───────────────────────────────────────────────────────

export interface ShadowTokens {
  sm: Record<string, any>;
  md: Record<string, any>;
  lg: Record<string, any>;
  glow: Record<string, any>;
}

export const shadows: ShadowTokens = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#7C6CF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ─── Typography (Trust Wallet Inspired) ───────────────────────────────────────

import { TextStyle } from 'react-native';

type FontWeight = TextStyle['fontWeight'];

const fw = (w: FontWeight) => w;

export const typography = {
  hero: { fontSize: 42, fontWeight: fw('800'), lineHeight: 48, letterSpacing: -1.5 },
  hero2: { fontSize: 34, fontWeight: fw('800'), lineHeight: 40, letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: fw('700'), lineHeight: 34, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: fw('700'), lineHeight: 28, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: fw('600'), lineHeight: 24 },
  h4: { fontSize: 16, fontWeight: fw('600'), lineHeight: 22 },
  body: { fontSize: 14, fontWeight: fw('400'), lineHeight: 20 },
  bodyBold: { fontSize: 14, fontWeight: fw('600'), lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: fw('400'), lineHeight: 16 },
  captionBold: { fontSize: 12, fontWeight: fw('600'), lineHeight: 16 },
  micro: { fontSize: 10, fontWeight: fw('500'), lineHeight: 14 },
  mono: { fontSize: 13, fontWeight: fw('500'), lineHeight: 18, fontFamily: 'monospace' as const },
  price: { fontSize: 24, fontWeight: fw('700'), lineHeight: 30, letterSpacing: -0.5 },
  priceLarge: { fontSize: 32, fontWeight: fw('800'), lineHeight: 38, letterSpacing: -1 },
  priceChange: { fontSize: 14, fontWeight: fw('700'), lineHeight: 18 },
} as const;

// ─── Animation Tokens ─────────────────────────────────────────────────────────

export const animations = {
  spring: { damping: 14, stiffness: 100 },
  springLight: { damping: 18, stiffness: 120 },
  springSnap: { damping: 10, stiffness: 150 },
  timing: { duration: 300 },
  fast: { duration: 150 },
  slow: { duration: 500 },
  stagger: 80,
} as const;

// ─── Network Config ───────────────────────────────────────────────────────────

export const NETWORKS = [
  { id: 'bnb', name: 'BNB Smart Chain', symbol: 'BNB', color: '#F0B90B', icon: 'B' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', icon: 'E' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: '#8247E5', icon: 'P' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945FF', icon: 'S' },
] as const;

// ─── Theme Hook ───────────────────────────────────────────────────────────────

export function useThemeTokens(scheme?: ColorScheme) {
  const system = useColorScheme() ?? 'dark';
  const resolved = scheme ?? system;
  const colors: ThemeColors = resolved === 'light' ? lightTheme : darkTheme;
  return { colors, scheme: resolved as ColorScheme, isDark: resolved === 'dark' };
}
