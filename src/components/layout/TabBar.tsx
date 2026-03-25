import { CalendarCheck, CalendarDays, Timer, BarChart3, BookOpen, Settings } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import type { TabType } from '../../types';

const tabs: { id: TabType; label: string; icon: typeof CalendarCheck }[] = [
  { id: 'today', label: '오늘', icon: CalendarCheck },
  { id: 'weekly', label: '주간', icon: CalendarDays },
  { id: 'tracking', label: '트래킹', icon: Timer },
  { id: 'stats', label: '통계', icon: BarChart3 },
  { id: 'reflection', label: '회고', icon: BookOpen },
  { id: 'settings', label: '설정', icon: Settings },
];

export default function TabBar() {
  const activeTab = useRoutineStore((s) => s.activeTab);
  const setActiveTab = useRoutineStore((s) => s.setActiveTab);

  return (
    <nav className="bottom-nav safe-bottom" aria-label="메인 탭 네비게이션">
      <div className="bottom-nav__grid">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-label={`${label} 탭`}
            aria-current={activeTab === id ? 'page' : undefined}
            className={`bottom-nav__button ${activeTab === id ? 'bottom-nav__button--active' : ''}`}
          >
            <Icon size={18} strokeWidth={activeTab === id ? 2.5 : 1.8} />
            <span className="bottom-nav__label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
