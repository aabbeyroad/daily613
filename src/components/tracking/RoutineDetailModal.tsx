import { useState } from 'react';
import { Trash2, Check, Plus, Clock } from 'lucide-react';
import type { Routine, TimeEntry } from '../../types';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate } from '../../utils/date';
import { IconDisplay } from '../settings/RoutineForm';
import { Button, IconButton, Modal, SectionCard } from '../ui/primitives';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function isoToTimeStr(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeStrToIso(dateStr: string, timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

interface Props {
  routine: Routine;
  entries: TimeEntry[];
  totalMs: number;
  color: string;
  onClose: () => void;
}

export default function RoutineDetailModal({ routine, entries, totalMs, color, onClose }: Props) {
  const updateTimeEntry = useRoutineStore((s) => s.updateTimeEntry);
  const deleteTimeEntry = useRoutineStore((s) => s.deleteTimeEntry);
  const addTimeEntry = useRoutineStore((s) => s.addTimeEntry);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  const today = formatDate(new Date());

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const startEditing = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setEditStart(isoToTimeStr(entry.startTime));
    setEditEnd(entry.endTime ? isoToTimeStr(entry.endTime) : '');
  };

  const handleSave = () => {
    if (!editingId || !editStart) return;
    const updates: Partial<Pick<TimeEntry, 'startTime' | 'endTime'>> = {
      startTime: timeStrToIso(today, editStart),
    };
    if (editEnd) {
      updates.endTime = timeStrToIso(today, editEnd);
    }
    updateTimeEntry(editingId, updates);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteTimeEntry(id);
  };

  const handleAdd = () => {
    if (!newStart || !newEnd) return;
    addTimeEntry({
      routineId: routine.id,
      date: today,
      startTime: timeStrToIso(today, newStart),
      endTime: timeStrToIso(today, newEnd),
    });
    setNewStart('');
    setNewEnd('');
    setShowAddForm(false);
  };

  return (
    <Modal
      open={true}
      title={routine.name}
      description="시간 블록을 직접 편집하고 오늘의 누적 시간을 조정합니다."
      onClose={onClose}
      footer={null}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
        {routine.icon && <IconDisplay icon={routine.icon} size={20} />}
      </div>

      <SectionCard>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-text-tertiary" />
          <span className="text-[13px]" style={{ color: 'var(--ds-text-secondary)' }}>오늘 총 시간</span>
          <span className="ml-auto text-[15px] font-bold font-mono" style={{ color: 'var(--ds-text-primary)' }}>
            {totalMs > 0 ? formatDuration(totalMs) : '--'}
          </span>
        </div>
      </SectionCard>

      <div className="mb-4 mt-4 space-y-2">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ds-text-tertiary)' }}>시간 블록</h3>

        {sortedEntries.length === 0 && (
          <p className="py-4 text-center text-[13px]" style={{ color: 'var(--ds-text-tertiary)' }}>기록된 시간 블록이 없습니다.</p>
        )}

        {sortedEntries.map((entry) => {
          const isEditing = editingId === entry.id;
          const entryMs = entry.endTime
            ? new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()
            : Date.now() - new Date(entry.startTime).getTime();

          return (
            <div key={entry.id} className="list-row">
              {isEditing ? (
                <>
                  <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="input w-[100px] px-3 font-mono text-[13px]" />
                  <span style={{ color: 'var(--ds-text-tertiary)' }}>~</span>
                  <input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="input w-[100px] px-3 font-mono text-[13px]" placeholder={!entry.endTime ? '진행 중' : ''} />
                  <IconButton onClick={handleSave} aria-label="저장" variant="secondary"><Check size={16} /></IconButton>
                  <IconButton onClick={() => setEditingId(null)} aria-label="취소"><Plus size={16} className="rotate-45" /></IconButton>
                </>
              ) : (
                <>
                  <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-2" onClick={() => startEditing(entry)}>
                    <span className="text-[13px] font-mono" style={{ color: 'var(--ds-text-primary)' }}>{isoToTimeStr(entry.startTime)}</span>
                    <span style={{ color: 'var(--ds-text-tertiary)' }}>~</span>
                    <span className="text-[13px] font-mono" style={{ color: 'var(--ds-text-primary)' }}>{entry.endTime ? isoToTimeStr(entry.endTime) : '진행 중'}</span>
                    <span className="ml-auto text-[11px] font-mono" style={{ color: 'var(--ds-text-tertiary)' }}>{formatDuration(entryMs)}</span>
                  </div>
                  <IconButton onClick={() => handleDelete(entry.id)} aria-label="삭제" variant="danger"><Trash2 size={14} /></IconButton>
                </>
              )}
            </div>
          );
        })}
      </div>

      {showAddForm ? (
        <SectionCard title="시간 블록 추가">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="input w-[110px] px-3 font-mono text-[13px]" />
              <span style={{ color: 'var(--ds-text-tertiary)' }}>~</span>
              <input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="input w-[110px] px-3 font-mono text-[13px]" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!newStart || !newEnd} variant="primary" size="md" fullWidth>추가</Button>
              <Button onClick={() => { setShowAddForm(false); setNewStart(''); setNewEnd(''); }} variant="secondary" size="md">취소</Button>
            </div>
          </div>
        </SectionCard>
      ) : (
        <Button onClick={() => setShowAddForm(true)} variant="secondary" size="lg" fullWidth>
          <Plus size={14} />
          시간 블록 추가
        </Button>
      )}
    </Modal>
  );
}
