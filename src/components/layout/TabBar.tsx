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
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center py-2 pt-3 transition-colors ${
              activeTab === id ? 'text-primary-600' : 'text-text-tertiary'
            }`}
          >
            <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
