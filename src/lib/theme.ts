// src/lib/theme.ts

export const themes = {
  dark: {
    background: '#0f172a',
    card: '#1e293b',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    primary: '#fbbf24', // Gold
    success: '#00ff88',
    error: '#ef4444',
    border: '#334155',
  },
  light: {
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    primary: '#d97706', // Darker Gold
    success: '#059669',
    error: '#dc2626',
    border: '#e2e8f0',
  }
};

export type ThemeType = 'dark' | 'light';