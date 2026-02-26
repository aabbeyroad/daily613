import { useEffect } from 'react';
import { useAppStore } from '../stores/householdStore';
import type { ColorTheme } from '../types';

export const useTheme = () => {
  const settings = useAppStore((s) => s.userProfile?.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const darkMode = settings?.darkMode ?? false;
  const colorTheme = settings?.colorTheme ?? 'indigo';

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-rose', 'theme-emerald', 'theme-amber', 'theme-sky', 'theme-violet');
    if (colorTheme !== 'indigo') {
      root.classList.add(`theme-${colorTheme}`);
    }
  }, [colorTheme]);

  const toggleDarkMode = () => updateSettings({ darkMode: !darkMode });
  const setColorTheme = (theme: ColorTheme) => updateSettings({ colorTheme: theme });

  return { darkMode, toggleDarkMode, colorTheme, setColorTheme };
};
