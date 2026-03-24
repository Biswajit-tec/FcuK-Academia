'use client';

import React, { createContext, startTransition, useContext, useEffect, useState } from 'react';

import { defaultTheme, getThemeCssVariables, isDarkTheme, themeOptions, themes } from '@/lib/theme';
import { ThemeDefinition, ThemeType } from '@/lib/types';

interface ThemeContextType {
  theme: ThemeType;
  themeConfig: ThemeDefinition;
  availableThemes: ThemeDefinition[];
  isDark: boolean;
  showIntro: boolean;
  setTheme: (theme: ThemeType) => void;
  dismissIntro: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = 'fcuk-academia-theme';
const INTRO_STORAGE_KEY = 'fcuk-academia-intro-seen';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeType | null;
    return savedTheme && themes[savedTheme] ? savedTheme : defaultTheme;
  });
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(INTRO_STORAGE_KEY) !== 'true';
  });
  const themeConfig = themes[theme];

  const setTheme = (newTheme: ThemeType) => {
    if (!themes[newTheme]) return;

    startTransition(() => {
      setThemeState(newTheme);
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const variables = getThemeCssVariables(themeConfig);

    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    root.dataset.theme = theme;
    root.dataset.themeMode = themeConfig.mode;
    root.style.colorScheme = themeConfig.mode;
    root.classList.toggle('dark', isDarkTheme(theme));
    body.dataset.theme = theme;
  }, [theme, themeConfig]);

  function dismissIntro() {
    setShowIntro(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(INTRO_STORAGE_KEY, 'true');
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeConfig,
        availableThemes: themeOptions,
        isDark: isDarkTheme(theme),
        showIntro,
        setTheme,
        dismissIntro,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
