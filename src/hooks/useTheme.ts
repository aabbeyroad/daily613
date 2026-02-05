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
  }, [darkMode]);

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !darkMode });
  };

  return { darkMode, toggleDarkMode };
};
