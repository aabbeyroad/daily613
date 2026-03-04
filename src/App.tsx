import { useEffect } from 'react';
import { useRoutineStore } from './stores/routineStore';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import TodayTab from './components/today/TodayTab';
import StatsTab from './components/stats/StatsTab';
import ReflectionTab from './components/reflection/ReflectionTab';
import TrackingTab from './components/tracking/TrackingTab';
import SettingsTab from './components/settings/SettingsTab';
import AuthPage from './components/auth/AuthPage';
import DailyReviewPopup from './components/common/DailyReviewPopup';
import { Loader2, X, AlertTriangle } from 'lucide-react';

function SyncErrorBanner() {
  const syncError = useRoutineStore((s) => s.syncError);
  const clearSyncError = useRoutineStore((s) => s.clearSyncError);

  if (!syncError) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white px-4 py-3 flex items-center gap-2 shadow-lg">
      <AlertTriangle size={16} className="flex-shrink-0" />
      <p className="text-[13px] font-medium flex-1">{syncError}</p>
      <button onClick={clearSyncError} className="p-1 rounded hover:bg-red-600 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

export default function App() {
  const activeTab = useRoutineStore((s) => s.activeTab);
  const isLoading = useRoutineStore((s) => s.isLoading);
  const loadUserData = useRoutineStore((s) => s.loadUserData);
  const { user, loading: authLoading } = useAuth();
  useTheme();

  const uid = user?.uid;
  useEffect(() => {
    if (uid) {
      loadUserData(uid);
    }
  }, [uid, loadUserData]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', document.documentElement.classList.contains('dark') ? '#0f172a' : '#6366f1');
    }
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-primary-600" />
        <p className="text-text-secondary text-sm">데이터 불러오는 중...</p>
      </div>
    );
  }

  return (
    <>
      <SyncErrorBanner />
      <DailyReviewPopup />
      <Layout>
        {activeTab === 'today' && <TodayTab />}
        {activeTab === 'tracking' && <TrackingTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'reflection' && <ReflectionTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </Layout>
    </>
  );
}
