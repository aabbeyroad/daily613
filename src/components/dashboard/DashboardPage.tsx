// ========================================
// 대시보드 - 오늘의 결정 & 주간 뷰
// 핵심 화면: 이미 정해진 것들을 한눈에 보기
// ========================================

import { useState } from 'react';
import { useAppStore } from '../../stores/householdStore';
import { DAY_NAMES, TIME_SLOT_NAMES } from '../../data/templates';
import type { DayOfWeek, Decision } from '../../types';
import DecisionCard from './DecisionCard';
import DecisionEditModal from './DecisionEditModal';

export default function DashboardPage() {
  const household = useAppStore((s) => s.household);
  const getTodayDecisions = useAppStore((s) => s.getTodayDecisions);
  const getWeekDecisions = useAppStore((s) => s.getWeekDecisions);
  const getUndecidedCount = useAppStore((s) => s.getUndecidedCount);
  const [view, setView] = useState<'today' | 'week'>('today');
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);

  if (!household) return null;

  const todayDecisions = getTodayDecisions();
  const undecidedCount = getUndecidedCount();
  const today = new Date().getDay() as DayOfWeek;
  const todayName = DAY_NAMES[today];

  // 시간대별 그룹핑
  const groupByTimeSlot = (decisions: Decision[]) => {
    const groups: Record<string, Decision[]> = { morning: [], afternoon: [], evening: [] };
    for (const d of decisions) {
      const slot = d.schedule.timeSlot || 'evening';
      if (!groups[slot]) groups[slot] = [];
      groups[slot].push(d);
    }
    return groups;
  };

  return (
    <div className="pb-4">
      {/* 인사 & 가정 정보 */}
      <div className="mb-5">
        <h1 className="text-lg font-bold text-text-primary">
          {household.name}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          {household.members.map((m) => (
            <span key={m.userId} className="inline-flex items-center gap-1 text-sm text-text-secondary">
              <span>{m.emoji}</span> {m.name}
            </span>
          ))}
          {household.members.length === 1 && (
            <span className="text-xs text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">
              초대코드: {household.inviteCode}
            </span>
          )}
        </div>
      </div>

      {/* 미결정 알림 */}
      {undecidedCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4 flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            오늘 <strong>{undecidedCount}건</strong>의 미결정 항목이 있어요
          </p>
        </div>
      )}

      {/* 뷰 전환 탭 */}
      <div className="flex gap-1 p-1 bg-surface-secondary rounded-xl mb-5">
        <button
          onClick={() => setView('today')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'today'
              ? 'bg-white dark:bg-surface shadow-sm text-text-primary'
              : 'text-text-tertiary'
          }`}
        >
          오늘 ({todayName})
        </button>
        <button
          onClick={() => setView('week')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'week'
              ? 'bg-white dark:bg-surface shadow-sm text-text-primary'
              : 'text-text-tertiary'
          }`}
        >
          이번 주
        </button>
      </div>

      {/* 오늘의 결정 */}
      {view === 'today' && (
        <div>
          {todayDecisions.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary">
              <p className="text-3xl mb-3">🎉</p>
              <p className="text-sm">오늘은 정해진 항목이 없어요</p>
            </div>
          ) : (
            <>
              {Object.entries(groupByTimeSlot(todayDecisions)).map(([slot, decisions]) => {
                if (decisions.length === 0) return null;
                return (
                  <div key={slot} className="mb-5">
                    <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-1">
                      {TIME_SLOT_NAMES[slot] || slot}
                    </h3>
                    <div className="space-y-2">
                      {decisions.map((d) => (
                        <DecisionCard
                          key={d.id}
                          decision={d}
                          members={household.members}
                          onEdit={() => setEditingDecision(d)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* 주간 뷰 */}
      {view === 'week' && (
        <div className="space-y-4">
          {([1, 2, 3, 4, 5, 6, 0] as DayOfWeek[]).map((day) => {
            const decisions = getWeekDecisions(day);
            if (decisions.length === 0) return null;
            const isToday = day === today;
            return (
              <div key={day}>
                <h3 className={`text-sm font-semibold mb-2 px-1 ${
                  isToday ? 'text-primary-600' : 'text-text-secondary'
                }`}>
                  {DAY_NAMES[day]}요일 {isToday && '(오늘)'}
                </h3>
                <div className="space-y-2">
                  {decisions.map((d) => (
                    <DecisionCard
                      key={d.id}
                      decision={d}
                      members={household.members}
                      compact
                      onEdit={() => setEditingDecision(d)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 결정 수정 모달 */}
      {editingDecision && (
        <DecisionEditModal
          decision={editingDecision}
          members={household.members}
          onClose={() => setEditingDecision(null)}
        />
      )}
    </div>
  );
}
