import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import { Button, IconButton, Input } from '../ui/primitives';

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
    <div className="card p-4">
      <div className="mb-3 flex gap-2">
        <Input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="새 키워드"
        />
        <Button onClick={handleAdd} variant="primary" size="icon" aria-label="키워드 추가">
          <Plus size={18} />
        </Button>
      </div>
      {keywords.length === 0 ? (
        <p className="py-2 text-center text-sm" style={{ color: 'var(--ds-text-tertiary)' }}>등록된 키워드가 없습니다</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span key={kw} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm" style={{ background: 'var(--ds-bg-secondary)', color: 'var(--ds-text-secondary)' }}>
              {kw}
              <IconButton onClick={() => removeKeyword(kw)} className="h-5 w-5" aria-label={`${kw} 삭제`} variant="ghost">
                <X size={12} />
              </IconButton>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
