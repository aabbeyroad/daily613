import { CalendarCheck, BarChart3, BookOpen, Settings } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import type { TabType } from '../../types';

const tabs: { id: TabType; label: string; icon: typeof CalendarCheck }[] = [
  { id: 'today', label: '오늘', icon: CalendarCheck },
  { id: 'stats', label: '통계', icon: BarChart3 },
  { id: 'reflection', label: '회고', icon: BookOpen },
  { id: 'settings', label: '설정', icon: Settings },
];

export default function TabBar() {
  const activeTab = useRoutineStore((s) => s.activeTab);
  const setActiveTab = useRoutineStore((s) => s.setActiveTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-border/50 safe-bottom" aria-label="메인 탭 네비게이션">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-label={`${label} 탭`}
            aria-current={activeTab === id ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center py-2 pt-2.5 min-h-[50px] transition-colors ${
              activeTab === id ? 'text-primary-600' : 'text-text-tertiary'
            }`}
          >
            <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.8} />
            <span className={`text-[10px] mt-0.5 ${activeTab === id ? 'font-bold' : 'font-medium'}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
