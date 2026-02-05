import { useState } from 'react';
import { X } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import type { Routine } from '../../types';

interface Props {
  routine?: Routine;
  onClose: () => void;
}

export default function RoutineForm({ routine, onClose }: Props) {
  const addRoutine = useRoutineStore((s) => s.addRoutine);
  const updateRoutine = useRoutineStore((s) => s.updateRoutine);
  const keywords = useRoutineStore((s) => s.keywords);

  const [name, setName] = useState(routine?.name || '');
  const [doneGoal, setDoneGoal] = useState(routine?.doneGoal || '');
  const [moreGoal, setMoreGoal] = useState(routine?.moreGoal || '');
  const [maxGoal, setMaxGoal] = useState(routine?.maxGoal || '');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(routine?.keywords || []);

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) => prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (routine) {
      updateRoutine(routine.id, { name: name.trim(), doneGoal: doneGoal.trim(), moreGoal: moreGoal.trim(), maxGoal: maxGoal.trim(), keywords: selectedKeywords });
    } else {
      addRoutine({ name: name.trim(), doneGoal: doneGoal.trim(), moreGoal: moreGoal.trim(), maxGoal: maxGoal.trim(), keywords: selectedKeywords });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{routine ? '루틴 수정' : '새 루틴'}</h2>
          <button onClick={onClose} className="p-1"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">루틴 이름</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 운동하기" className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-done mb-1">Done 목표 (최소)</label>
            <input type="text" value={doneGoal} onChange={(e) => setDoneGoal(e.target.value)} placeholder="예: 10분" className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-more mb-1">More 목표 (중간)</label>
            <input type="text" value={moreGoal} onChange={(e) => setMoreGoal(e.target.value)} placeholder="예: 30분" className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-max mb-1">Max 목표 (최대)</label>
            <input type="text" value={maxGoal} onChange={(e) => setMaxGoal(e.target.value)} placeholder="예: 1시간" className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {keywords.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">키워드</label>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <button key={kw} onClick={() => toggleKeyword(kw)} className={`px-3 py-1 rounded-full text-sm transition-all ${selectedKeywords.includes(kw) ? 'bg-primary-600 text-white' : 'bg-surface-tertiary text-text-secondary'}`}>{kw}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={handleSubmit} className="w-full mt-6 py-3 rounded-xl bg-primary-600 text-white font-semibold active:scale-[0.98] transition-all">{routine ? '수정하기' : '추가하기'}</button>
      </div>
    </div>
  );
}
