import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';

export default function KeywordManager() {
  const keywords = useRoutineStore((s) => s.keywords);
  const addKeyword = useRoutineStore((s) => s.addKeyword);
  const removeKeyword = useRoutineStore((s) => s.removeKeyword);
  const [newKeyword, setNewKeyword] = useState('');

  const handleAdd = () => {
    if (newKeyword.trim()) {
      addKeyword(newKeyword.trim());
      setNewKeyword('');
    }
  };

  return (
    <div className="p-4 rounded-xl bg-surface-secondary border border-border">
      <div className="flex gap-2 mb-3">
        <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="새 키워드" className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <button onClick={handleAdd} className="px-3 py-2 rounded-lg bg-primary-600 text-white active:scale-95 transition-all"><Plus size={18} /></button>
      </div>
      {keywords.length === 0 ? (
        <p className="text-sm text-text-tertiary text-center py-2">등록된 키워드가 없습니다</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span key={kw} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-tertiary text-text-secondary text-sm">
              {kw}
              <button onClick={() => removeKeyword(kw)} className="hover:text-red-500"><X size={14} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
