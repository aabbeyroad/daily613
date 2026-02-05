import { useState } from 'react';
import { X } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import type { Reflection } from '../../types';

interface Props {
  date: string;
  type: 'daily' | 'weekly';
  existing?: Reflection;
  onClose: () => void;
}

export default function ReflectionForm({ date, type, existing, onClose }: Props) {
  const addReflection = useRoutineStore((s) => s.addReflection);
  const updateReflection = useRoutineStore((s) => s.updateReflection);
  const [keep, setKeep] = useState(existing?.keep || '');
  const [problem, setProblem] = useState(existing?.problem || '');
  const [tryText, setTryText] = useState(existing?.try || '');

  const handleSubmit = () => {
    if (!keep.trim() && !problem.trim() && !tryText.trim()) return;
    if (existing) {
      updateReflection(existing.id, { keep: keep.trim(), problem: problem.trim(), try: tryText.trim() });
    } else {
      addReflection({ date, type, keep: keep.trim(), problem: problem.trim(), try: tryText.trim() });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{existing ? '회고 수정' : '회고 작성'}</h2>
          <button onClick={onClose} className="p-1"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-done mb-1">Keep - 잘한 것</label>
            <textarea value={keep} onChange={(e) => setKeep(e.target.value)} placeholder="오늘 잘한 것, 계속할 것..." rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-red-500 mb-1">Problem - 아쉬운 점</label>
            <textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="아쉬웠던 점, 문제점..." rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-more mb-1">Try - 시도할 것</label>
            <textarea value={tryText} onChange={(e) => setTryText(e.target.value)} placeholder="다음에 시도해볼 것..." rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <button onClick={handleSubmit} className="w-full mt-6 py-3 rounded-xl bg-primary-600 text-white font-semibold active:scale-[0.98] transition-all">{existing ? '수정하기' : '저장하기'}</button>
      </div>
    </div>
  );
}
