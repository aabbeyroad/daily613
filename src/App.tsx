import { useEffect } from 'react';
import { useRoutineStore } from './stores/routineStore';
import { useTheme } from './hooks/useTheme';
import Layout from './components/layout/Layout';
import TodayTab from './components/today/TodayTab';
import StatsTab from './components/stats/StatsTab';
import ReflectionTab from './components/reflection/ReflectionTab';
import SettingsTab from './components/settings/SettingsTab';

export default function App() {
  const activeTab = useRoutineStore((s) => s.activeTab);
  useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', document.documentElement.classList.contains('dark') ? '#0f172a' : '#6366f1');
    }
  }, []);

  return (
    <Layout>
      {activeTab === 'today' && <TodayTab />}
      {activeTab === 'stats' && <StatsTab />}
      {activeTab === 'reflection' && <ReflectionTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </Layout>
  );
}
