import { useEffect } from 'react';
import { useRoutineStore } from './stores/routineStore';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import TodayTab from './components/today/TodayTab';
import StatsTab from './components/stats/StatsTab';
import ReflectionTab from './components/reflection/ReflectionTab';
import SettingsTab from './components/settings/SettingsTab';
import AuthPage from './components/auth/AuthPage';
import { Loader2 } from 'lucide-react';

export default function App() {
  const activeTab = useRoutineStore((s) => s.activeTab);
  const { user, loading } = useAuth();
  useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', document.documentElement.classList.contains('dark') ? '#0f172a' : '#6366f1');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Layout>
      {activeTab === 'today' && <TodayTab />}
      {activeTab === 'stats' && <StatsTab />}
      {activeTab === 'reflection' && <ReflectionTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </Layout>
  );
}
