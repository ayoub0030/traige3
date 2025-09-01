import { create } from "zustand";
import { getLocalStorage, setLocalStorage } from "../localStorage";

export type Theme = 'pink' | 'blue' | 'purple' | 'green';

interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
  gradient: string;
}

const themeColors: Record<Theme, ThemeColors> = {
  pink: {
    primary: '#FF69B4',
    primaryForeground: '#ffffff',
    secondary: '#FFB6C1',
    accent: '#FF1493',
    gradient: 'linear-gradient(135deg, #FF69B4, #FF1493)'
  },
  blue: {
    primary: '#3B82F6',
    primaryForeground: '#ffffff',
    secondary: '#93C5FD',
    accent: '#1D4ED8',
    gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
  },
  purple: {
    primary: '#8B5CF6',
    primaryForeground: '#ffffff',
    secondary: '#C4B5FD',
    accent: '#7C3AED',
    gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
  },
  green: {
    primary: '#10B981',
    primaryForeground: '#ffffff',
    secondary: '#6EE7B7',
    accent: '#059669',
    gradient: 'linear-gradient(135deg, #10B981, #059669)'
  }
};

export const themeOptions = [
  { id: 'pink' as Theme, name: 'Pink Paradise', color: '#FF69B4' },
  { id: 'blue' as Theme, name: 'Ocean Blue', color: '#3B82F6' },
  { id: 'purple' as Theme, name: 'Royal Purple', color: '#8B5CF6' },
  { id: 'green' as Theme, name: 'Forest Green', color: '#10B981' }
];

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const applyTheme = (theme: Theme) => {
  const colors = themeColors[theme];
  const root = document.documentElement;
  
  // Convert hex to HSL for CSS variables (the existing format)
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  // Update the primary color in the existing CSS format
  const primaryHsl = hexToHsl(colors.primary);
  root.style.setProperty('--primary', primaryHsl);
  root.style.setProperty('--ring', primaryHsl);
  
  console.log('Applied theme colors:', theme, primaryHsl);
};

export const useTheme = create<ThemeState>((set, get) => {
  const initialTheme = (getLocalStorage('mirage_theme') as Theme) || 'pink';
  
  // Apply initial theme
  applyTheme(initialTheme);
  
  return {
    theme: initialTheme,
    
    setTheme: (theme) => {
      console.log('Setting theme to:', theme);
      setLocalStorage('mirage_theme', theme);
      applyTheme(theme);
      set({ theme });
    }
  };
});

// Initialize theme on app load
const initialTheme = (getLocalStorage('mirage_theme') as Theme) || 'pink';
applyTheme(initialTheme);