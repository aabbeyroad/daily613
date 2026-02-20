import { useEffect } from 'react';
import { useRoutineStore } from '../stores/routineStore';

export const useTheme = () => {
  const darkMode = useRoutineStore((s) => s.settings.darkMode);
  const updateSettings = useRoutineStore((s) => s.updateSettings);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // theme-color 메타태그 동기화 (브라우저 상단바 색상)
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', darkMode ? '#1a1a2e' : '#6366f1');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !darkMode });
  };

  return { darkMode, toggleDarkMode };
};
