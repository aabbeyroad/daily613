import { useEffect } from 'react';
import { useRoutineStore } from '../stores/routineStore';
import type { ColorTheme } from '../types';

const THEME_COLORS: Record<ColorTheme, { light: string; dark: string }> = {
  indigo:  { light: '#4f46e5', dark: '#1a1a2e' },
  rose:    { light: '#e11d48', dark: '#1a1a2e' },
  emerald: { light: '#059669', dark: '#1a1a2e' },
  amber:   { light: '#d97706', dark: '#1a1a2e' },
  sky:     { light: '#0284c7', dark: '#1a1a2e' },
  violet:  { light: '#7c3aed', dark: '#1a1a2e' },
};

export const useTheme = () => {
  const darkMode = useRoutineStore((s) => s.settings.darkMode);
  const colorTheme = useRoutineStore((s) => s.settings.colorTheme) || 'indigo';
  const updateSettings = useRoutineStore((s) => s.updateSettings);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // theme-color 메타태그 동기화 (브라우저 상단바 색상)
    const colors = THEME_COLORS[colorTheme] || THEME_COLORS.indigo;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', darkMode ? colors.dark : colors.light);
    }
  }, [darkMode, colorTheme]);

  // 색상 테마 클래스 적용
  useEffect(() => {
    const root = document.documentElement;
    // 기존 테마 클래스 제거
    root.classList.remove('theme-rose', 'theme-emerald', 'theme-amber', 'theme-sky', 'theme-violet');
    // indigo는 기본값이므로 클래스 불필요, 나머지만 추가
    if (colorTheme !== 'indigo') {
      root.classList.add(`theme-${colorTheme}`);
    }
  }, [colorTheme]);

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !darkMode });
  };

  const setColorTheme = (theme: ColorTheme) => {
    updateSettings({ colorTheme: theme });
  };

  return { darkMode, toggleDarkMode, colorTheme, setColorTheme };
};
