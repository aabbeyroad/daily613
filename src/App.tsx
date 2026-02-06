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
  const isLoading = useRoutineStore((s) => s.isLoading);
  const loadUserData = useRoutineStore((s) => s.loadUserData);
  const { user, loading: authLoading } = useAuth();
  useTheme();

  // 사용자 로그인 시 Firestore에서 데이터 로드
  useEffect(() => {
    if (user) {
      loadUserData(user.uid);
    }
  }, [user, loadUserData]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', document.documentElement.classList.contains('dark') ? '#0f172a' : '#6366f1');
    }
  }, []);

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  // 로그인 안됨
  if (!user) {
    return <AuthPage />;
  }

  // 데이터 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-primary-600" />
        <p className="text-text-secondary text-sm">데이터 불러오는 중...</p>
      </div>
    );
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
