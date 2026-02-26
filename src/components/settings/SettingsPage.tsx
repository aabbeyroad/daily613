// ========================================
// 설정 페이지
// 가정 관리, 테마, 로그아웃
// ========================================

import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../stores/householdStore';
import { useTheme } from '../../hooks/useTheme';
import type { ColorTheme } from '../../types';

const THEMES: { id: ColorTheme; name: string; color: string }[] = [
  { id: 'indigo', name: '인디고', color: '#6366f1' },
  { id: 'rose', name: '로즈', color: '#f43f5e' },
  { id: 'emerald', name: '에메랄드', color: '#10b981' },
  { id: 'amber', name: '앰버', color: '#f59e0b' },
  { id: 'sky', name: '스카이', color: '#0ea5e9' },
  { id: 'violet', name: '바이올렛', color: '#8b5cf6' },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const household = useAppStore((s) => s.household);
  const { darkMode, toggleDarkMode, colorTheme, setColorTheme } = useTheme();

  return (
    <div className="pb-4">
      <h1 className="text-lg font-bold text-text-primary mb-5">설정</h1>

      {/* 계정 정보 */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 px-1">계정</h2>
        <div className="bg-white dark:bg-surface-secondary rounded-xl border border-border divide-y divide-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-text-secondary">이메일</span>
            <span className="text-sm text-text-primary">{user?.email || '-'}</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-text-secondary">이름</span>
            <span className="text-sm text-text-primary">{user?.displayName || '-'}</span>
          </div>
        </div>
      </section>

      {/* 가정 정보 */}
      {household && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 px-1">가정</h2>
          <div className="bg-white dark:bg-surface-secondary rounded-xl border border-border divide-y divide-border">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-text-secondary">가정 이름</span>
              <span className="text-sm text-text-primary">{household.name}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-text-secondary">초대 코드</span>
              <button
                onClick={() => navigator.clipboard.writeText(household.inviteCode)}
                className="text-sm font-mono text-primary-600 tracking-wider"
              >
                {household.inviteCode} 📋
              </button>
            </div>
            <div className="px-4 py-3">
              <span className="text-sm text-text-secondary block mb-2">구성원</span>
              <div className="flex gap-3">
                {household.members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-tertiary">
                    <span>{m.emoji}</span>
                    <span className="text-sm text-text-primary">{m.name}</span>
                    <span className="text-xs text-text-tertiary">
                      {m.role === 'owner' ? '관리자' : '구성원'}
                    </span>
                  </div>
                ))}
              </div>
              {household.members.length === 1 && (
                <p className="text-xs text-primary-600 mt-2">
                  배우자를 초대하려면 초대 코드를 공유해주세요
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 테마 */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 px-1">화면</h2>
        <div className="bg-white dark:bg-surface-secondary rounded-xl border border-border divide-y divide-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-text-secondary">다크 모드</span>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                darkMode ? 'bg-primary-600' : 'bg-surface-tertiary'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all ${
                  darkMode ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
          <div className="px-4 py-3">
            <span className="text-sm text-text-secondary block mb-3">색상 테마</span>
            <div className="flex gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setColorTheme(t.id)}
                  className={`w-9 h-9 rounded-full transition-all ${
                    colorTheme === t.id ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: t.color }}
                  title={t.name}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 로그아웃 */}
      <button
        onClick={logout}
        className="w-full py-3 rounded-xl bg-surface-secondary text-red-500 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
      >
        로그아웃
      </button>

      <p className="text-center text-text-tertiary text-xs mt-6">
        미리정해 PreDecide v1.0
      </p>
    </div>
  );
}
