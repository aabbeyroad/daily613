import { lazy, Suspense, useEffect } from 'react';
import { useRoutineStore } from './stores/routineStore';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import TodayTab from './components/today/TodayTab';
import { Loader2, X, AlertTriangle } from 'lucide-react';
import { Notice } from './components/ui/primitives';

const TrackingTab = lazy(() => import('./components/tracking/TrackingTab'));
const StatsTab = lazy(() => import('./components/stats/StatsTab'));
const ReflectionTab = lazy(() => import('./components/reflection/ReflectionTab'));
const SettingsTab = lazy(() => import('./components/settings/SettingsTab'));
const AuthPage = lazy(() => import('./components/auth/AuthPage'));
const DailyReviewPopup = lazy(() => import('./components/common/DailyReviewPopup'));

function SyncErrorBanner() {
  const syncError = useRoutineStore((s) => s.syncError);
  const clearSyncError = useRoutineStore((s) => s.clearSyncError);

  if (!syncError) return null;

  return (
    <div className="fixed left-1/2 top-4 z-[100] w-[calc(100%-24px)] max-w-[720px] -translate-x-1/2">
      <Notice tone="danger" className="flex items-center gap-3 shadow-[var(--ds-shadow-md)]">
        <AlertTriangle size={16} className="flex-shrink-0" />
        <p className="flex-1 text-[13px] font-medium">{syncError}</p>
        <button onClick={clearSyncError} className="rounded-full p-1 text-current opacity-70 transition-opacity hover:opacity-100">
          <X size={14} />
        </button>
      </Notice>
    </div>
  );
}

function AppSectionFallback() {
  return (
    <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-3">
      <Loader2 size={26} className="animate-spin" style={{ color: 'var(--ds-accent)' }} />
      <p className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>화면 준비 중...</p>
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
      meta.setAttribute('content', document.documentElement.classList.contains('dark') ? '#090c12' : '#f5f6fa');
    }
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--ds-bg)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--ds-accent)' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<AppSectionFallback />}>
        <AuthPage />
      </Suspense>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3" style={{ background: 'var(--ds-bg)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--ds-accent)' }} />
        <p className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>데이터 불러오는 중...</p>
      </div>
    );
  }

  return (
    <>
      <SyncErrorBanner />
      <Suspense fallback={null}>
        <DailyReviewPopup />
      </Suspense>
      <Layout>
        {activeTab === 'today' ? (
          <TodayTab />
        ) : (
          <Suspense fallback={<AppSectionFallback />}>
            {activeTab === 'tracking' && <TrackingTab />}
            {activeTab === 'stats' && <StatsTab />}
            {activeTab === 'reflection' && <ReflectionTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </Suspense>
        )}
      </Layout>
    </>
  );
}
