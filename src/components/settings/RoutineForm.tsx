import { useState } from 'react';
import { X } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import type { Routine } from '../../types';

const ROUTINE_ICONS = [
  '🏃', '💪', '🧘', '📖', '✍️', '💻', '🎵', '🎨',
  '🧹', '💊', '💤', '🥗', '💧', '🧠', '📱', '🙏',
  '🌅', '🚶', '🎯', '⏰', '📝', '🔥', '💡', '🌿',
  '🏠', '👶', '🍳', '🚗', '📞', '🎮', '🛁', '😊',
];

interface Props {
  routine?: Routine;
  onClose: () => void;
}

export default function RoutineForm({ routine, onClose }: Props) {
  const addRoutine = useRoutineStore((s) => s.addRoutine);
  const updateRoutine = useRoutineStore((s) => s.updateRoutine);
  const keywords = useRoutineStore((s) => s.keywords);

  const [name, setName] = useState(routine?.name || '');
  const [icon, setIcon] = useState(routine?.icon || '');
  const [doneGoal, setDoneGoal] = useState(routine?.doneGoal || '');
  const [moreGoal, setMoreGoal] = useState(routine?.moreGoal || '');
  const [maxGoal, setMaxGoal] = useState(routine?.maxGoal || '');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(routine?.keywords || []);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) => prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), icon: icon || undefined, doneGoal: doneGoal.trim(), moreGoal: moreGoal.trim(), maxGoal: maxGoal.trim(), keywords: selectedKeywords };
    if (routine) {
      updateRoutine(routine.id, data);
    } else {
      addRoutine(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" role="dialog" aria-labelledby="routine-form-title" onClick={onClose}>
      <div className="bg-surface rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 id="routine-form-title" className="text-lg font-bold">{routine ? '루틴 수정' : '새 루틴'}</h2>
          <button onClick={onClose} aria-label="닫기" className="p-2.5 rounded-xl hover:bg-surface-secondary transition-colors"><X size={20} className="text-text-tertiary" /></button>
        </div>

        <div className="space-y-4">
          {/* 아이콘 + 이름 */}
          <div>
            <label className="block text-[12px] font-medium text-text-tertiary mb-1.5 ml-0.5">루틴 이름</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-[46px] h-[46px] flex-shrink-0 rounded-xl border-2 border-dashed border-border bg-surface-secondary flex items-center justify-center text-xl hover:border-primary-400 transition-colors"
                aria-label="아이콘 선택"
              >
                {icon || '😀'}
              </button>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 운동하기"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface-secondary text-text-primary text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            {/* 아이콘 피커 */}
            {showIconPicker && (
              <div className="mt-2 p-3 rounded-xl bg-surface-secondary border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-text-tertiary">아이콘 선택</span>
                  {icon && (
                    <button onClick={() => { setIcon(''); setShowIconPicker(false); }} className="text-[11px] text-red-400 font-medium">제거</button>
                  )}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {ROUTINE_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setIcon(emoji); setShowIconPicker(false); }}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all active:scale-90 ${icon === emoji ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' : 'hover:bg-surface-tertiary'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 목표 입력 */}
          <div className="rounded-xl bg-surface-secondary border border-border overflow-hidden divide-y divide-border">
            <div className="flex items-center px-3.5 py-2.5">
              <label className="text-[13px] font-semibold text-done w-16 flex-shrink-0">Done</label>
              <input type="text" value={doneGoal} onChange={(e) => setDoneGoal(e.target.value)} placeholder="최소 목표 (예: 10분)" className="flex-1 text-[14px] text-text-primary bg-transparent focus:outline-none placeholder:text-text-tertiary" />
            </div>
            <div className="flex items-center px-3.5 py-2.5">
              <label className="text-[13px] font-semibold text-more w-16 flex-shrink-0">More</label>
              <input type="text" value={moreGoal} onChange={(e) => setMoreGoal(e.target.value)} placeholder="중간 목표 (예: 30분)" className="flex-1 text-[14px] text-text-primary bg-transparent focus:outline-none placeholder:text-text-tertiary" />
            </div>
            <div className="flex items-center px-3.5 py-2.5">
              <label className="text-[13px] font-semibold text-max w-16 flex-shrink-0">Max</label>
              <input type="text" value={maxGoal} onChange={(e) => setMaxGoal(e.target.value)} placeholder="최대 목표 (예: 1시간)" className="flex-1 text-[14px] text-text-primary bg-transparent focus:outline-none placeholder:text-text-tertiary" />
            </div>
          </div>

          {/* 키워드 */}
          {keywords.length > 0 && (
            <div>
              <label className="block text-[12px] font-medium text-text-tertiary mb-2 ml-0.5">키워드</label>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <button key={kw} onClick={() => toggleKeyword(kw)} className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${selectedKeywords.includes(kw) ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20' : 'bg-surface-tertiary text-text-secondary'}`}>{kw}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={handleSubmit} className="w-full mt-6 py-3.5 rounded-xl bg-primary-600 text-white font-semibold text-[15px] active:scale-[0.98] transition-all shadow-sm shadow-primary-600/20">{routine ? '수정하기' : '추가하기'}</button>
      </div>
    </div>
  );
}
