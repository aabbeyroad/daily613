import { useState } from 'react';
import { X, Trash2, Check, Plus, Clock } from 'lucide-react';
import type { Routine, TimeEntry } from '../../types';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate } from '../../utils/date';
import { IconDisplay } from '../settings/RoutineForm';

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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface rounded-t-3xl sm:rounded-2xl p-5 w-full sm:max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {routine.icon && <IconDisplay icon={routine.icon} size={20} />}
            <h2 className="font-bold text-[15px] text-text-primary">{routine.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-secondary transition-colors">
            <X size={18} className="text-text-tertiary" />
          </button>
        </div>

        {/* Total time */}
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-surface-secondary border border-border">
          <Clock size={16} className="text-text-tertiary" />
          <span className="text-[13px] text-text-secondary">오늘 총 시간</span>
          <span className="text-[15px] font-bold font-mono text-text-primary ml-auto">
            {totalMs > 0 ? formatDuration(totalMs) : '--'}
          </span>
        </div>

        {/* Time blocks */}
        <div className="space-y-2 mb-4">
          <h3 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wide">시간 블록</h3>

          {sortedEntries.length === 0 && (
            <p className="text-[13px] text-text-tertiary text-center py-4">기록된 시간 블록이 없습니다.</p>
          )}

          {sortedEntries.map((entry) => {
            const isEditing = editingId === entry.id;
            const entryMs = entry.endTime
              ? new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()
              : Date.now() - new Date(entry.startTime).getTime();

            return (
              <div
                key={entry.id}
                className="flex items-center gap-2 p-3 rounded-xl bg-surface-secondary border border-border"
              >
                {isEditing ? (
                  <>
                    <input
                      type="time"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-[13px] font-mono w-[90px]"
                    />
                    <span className="text-text-tertiary text-[12px]">~</span>
                    <input
                      type="time"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-[13px] font-mono w-[90px]"
                      placeholder={!entry.endTime ? '진행 중' : ''}
                    />
                    <button onClick={handleSave} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                      <Check size={16} className="text-done" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors">
                      <X size={16} className="text-text-tertiary" />
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
                      onClick={() => startEditing(entry)}
                    >
                      <span className="text-[13px] font-mono text-text-primary">
                        {isoToTimeStr(entry.startTime)}
                      </span>
                      <span className="text-text-tertiary text-[12px]">~</span>
                      <span className="text-[13px] font-mono text-text-primary">
                        {entry.endTime ? isoToTimeStr(entry.endTime) : '진행 중'}
                      </span>
                      <span className="text-[11px] font-mono text-text-tertiary ml-auto">
                        {formatDuration(entryMs)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Add new entry */}
        {showAddForm ? (
          <div className="p-3 rounded-xl bg-surface-secondary border border-border space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-[13px] font-mono w-[90px]"
              />
              <span className="text-text-tertiary text-[12px]">~</span>
              <input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-[13px] font-mono w-[90px]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newStart || !newEnd}
                className="flex-1 py-2 rounded-xl bg-primary-600 text-white text-[13px] font-semibold disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                추가
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewStart(''); setNewEnd(''); }}
                className="px-4 py-2 rounded-xl bg-surface-tertiary text-text-secondary text-[13px] font-medium active:scale-[0.98] transition-all"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-text-tertiary text-[13px] hover:bg-surface-secondary transition-colors active:scale-[0.98]"
          >
            <Plus size={14} />
            시간 블록 추가
          </button>
        )}
      </div>
    </div>
  );
}
