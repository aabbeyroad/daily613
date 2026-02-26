// ========================================
// 하단 탭 바 - 대시보드 / 장보기 / 설정
// ========================================

import { useAppStore } from '../../stores/householdStore';
import type { TabType } from '../../types';

const TABS: { id: TabType; label: string; icon: string; activeIcon: string }[] = [
  {
    id: 'dashboard',
    label: '결정',
    icon: '📋',
    activeIcon: '📋',
  },
  {
    id: 'grocery',
    label: '장보기',
    icon: '🛒',
    activeIcon: '🛒',
  },
  {
    id: 'settings',
    label: '설정',
    icon: '⚙️',
    activeIcon: '⚙️',
  },
];

export default function TabBar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface/90 backdrop-blur-lg border-t border-border safe-bottom z-40">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-4 min-w-[64px] transition-all ${
                isActive ? 'text-primary-600' : 'text-text-tertiary'
              }`}
            >
              <span className="text-xl leading-none mb-0.5">
                {isActive ? tab.activeIcon : tab.icon}
              </span>
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
