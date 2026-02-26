// ========================================
// 미리정해 (PreDecide) - 메인 앱 컴포넌트
// 인증 상태 → 온보딩 → 메인 앱 분기
// ========================================

import { useEffect } from 'react';
import { useAppStore } from './stores/householdStore';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import AuthPage from './components/auth/AuthPage';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import DashboardPage from './components/dashboard/DashboardPage';
import GroceryPage from './components/grocery/GroceryPage';
import SettingsPage from './components/settings/SettingsPage';

// 동기화 에러 배너
function SyncErrorBanner() {
  const syncError = useAppStore((s) => s.syncError);
  const clearSyncError = useAppStore((s) => s.clearSyncError);

  if (!syncError) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white px-4 py-3 flex items-center gap-2 shadow-lg">
      <span className="text-sm flex-shrink-0">⚠️</span>
      <p className="text-[13px] font-medium flex-1">{syncError}</p>
      <button onClick={clearSyncError} className="p-1 rounded hover:bg-red-600 transition-colors text-sm">
        ✕
      </button>
    </div>
  );
}

// 로딩 스피너
function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p className="text-text-secondary text-sm">{message}</p>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const activeTab = useAppStore((s) => s.activeTab);
  const isLoading = useAppStore((s) => s.isLoading);
  const onboardingStep = useAppStore((s) => s.onboardingStep);
  const loadData = useAppStore((s) => s.loadData);

  // 테마 적용
  useTheme();

  // 로그인 후 데이터 로드
  const uid = user?.uid;
  useEffect(() => {
    if (uid) {
      loadData(uid);
    }
  }, [uid, loadData]);

  // 1. Firebase 인증 로딩 중
  if (authLoading) {
    return <LoadingScreen message="로딩 중..." />;
  }

  // 2. 미로그인 → 로그인 페이지
  if (!user) {
    return <AuthPage />;
  }

  // 3. 데이터 로딩 중
  if (isLoading) {
    return <LoadingScreen message="데이터 불러오는 중..." />;
  }

  // 4. 온보딩 미완료 → 온보딩 플로우
  if (onboardingStep !== 'done') {
    return (
      <>
        <SyncErrorBanner />
        <OnboardingFlow />
      </>
    );
  }

  // 5. 메인 앱
  return (
    <>
      <SyncErrorBanner />
      <Layout>
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'grocery' && <GroceryPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </Layout>
    </>
  );
}
