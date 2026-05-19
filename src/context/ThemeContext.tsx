import React, { createContext, useContext, useMemo } from 'react';
import { useSettingsStore, themes } from '../stores/useSettingsStore';

// Tambahkan 'Required' atau pastikan tipe menangkap struktur dari themes
// Kita ambil tipe dari salah satu keys (light/dark)
type ThemeColors = typeof themes['light']; 

interface ThemeContextType {
  // Gunakan tipe yang sama persis dengan yang ada di themes
  colors: ThemeColors; 
  theme: 'dark' | 'light';
}

// Inisialisasi context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useSettingsStore();
  
  // TypeScript terkadang butuh penegasan bahwa 'themes[theme]' 
  // sesuai dengan interface ThemeColors
  const colors = themes[theme] as ThemeColors;

  const value = useMemo(() => ({
    colors,
    theme
  }), [colors, theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};