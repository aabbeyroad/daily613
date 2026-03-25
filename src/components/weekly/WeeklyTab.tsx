import { useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X, Check } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import type { ScheduleBlock } from '../../types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const CELL_H = 28; // px per hour row
const TIME_COL_W = 32; // px for time label column
const COLOR_PRESETS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#A855F7', '#EC4899', '#14B8A6',
];

type SelectState = { day: number; startHour: number } | null;
type ModalState = { day: number; startHour: number; endHour: number; editId?: string } | null;

export default function WeeklyTab() {
  const routines = useRoutineStore(s => s.routines.filter(r => !r.archived));
  const scheduleBlocks = useRoutineStore(s => s.scheduleBlocks);
  const addScheduleBlock = useRoutineStore(s => s.addScheduleBlock);
  const updateScheduleBlock = useRoutineStore(s => s.updateScheduleBlock);
  const deleteScheduleBlock = useRoutineStore(s => s.deleteScheduleBlock);

  const [selectStart, setSelectStart] = useState<SelectState>(null);
  const [hoverHour, setHoverHour] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [formColor, setFormColor] = useState(COLOR_PRESETS[4]);
  const [formLabel, setFormLabel] = useState('');
  const [formRoutines, setFormRoutines] = useState<string[]>([]);
  const [detailBlock, setDetailBlock] = useState<ScheduleBlock | null>(null);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `${format(weekDays[0], 'M월 d일', { locale: ko })} – ${format(weekDays[6], 'M월 d일', { locale: ko })}`;

  const getBlockAtCell = (day: number, hour: number) =>
    scheduleBlocks.find(b => b.dayOfWeek === day && hour >= b.startHour && hour < b.endHour);

  const handleCellClick = (day: number, hour: number) => {
    const existing = getBlockAtCell(day, hour);
    if (existing) {
      setDetailBlock(existing);
      setSelectStart(null);
      setHoverHour(null);
      return;
    }
    if (!selectStart) {
      setSelectStart({ day, startHour: hour });
    } else if (selectStart.day === day) {
      const start = Math.min(selectStart.startHour, hour);
      const end = Math.max(selectStart.startHour, hour) + 1;
      setModal({ day, startHour: start, endHour: end });
      setSelectStart(null);
      setHoverHour(null);
      setFormColor(COLOR_PRESETS[4]);
      setFormLabel('');
      setFormRoutines([]);
    } else {
      setSelectStart({ day, startHour: hour });
      setHoverHour(null);
    }
  };

  const isSelected = (day: number, hour: number) => {
    if (!selectStart || selectStart.day !== day) return false;
    const endH = hoverHour !== null ? hoverHour : selectStart.startHour;
    const start = Math.min(selectStart.startHour, endH);
    const end = Math.max(selectStart.startHour, endH);
    return hour >= start && hour <= end;
  };

  const saveBlock = () => {
    if (!modal) return;
    if (modal.editId) {
      updateScheduleBlock(modal.editId, {
        color: formColor,
        label: formLabel,
        routineIds: formRoutines,
        startHour: modal.startHour,
        endHour: modal.endHour,
      });
    } else {
      addScheduleBlock({
        dayOfWeek: modal.day,
        startHour: modal.startHour,
        endHour: modal.endHour,
        color: formColor,
        label: formLabel,
        routineIds: formRoutines,
      });
    }
    setModal(null);
  };

  const openEdit = (block: ScheduleBlock) => {
    setDetailBlock(null);
    setModal({ day: block.dayOfWeek, startHour: block.startHour, endHour: block.endHour, editId: block.id });
    setFormColor(block.color);
    setFormLabel(block.label);
    setFormRoutines(block.routineIds);
  };

  return (
    <div onMouseLeave={() => setHoverHour(null)}>
      {/* Header */}
      <div className="px-1 pt-2 pb-2">
        <h1 className="text-xl font-bold" style={{ color: 'var(--ds-text-primary)' }}>주간 일정표</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-tertiary)' }}>{weekLabel}</p>
      </div>

      {/* Day headers — sticky at top */}
      <div
        className="flex sticky z-10"
        style={{
          top: 0,
          background: 'var(--ds-bg)',
          borderBottom: '1px solid var(--ds-border)',
          paddingLeft: TIME_COL_W,
        }}
      >
        {weekDays.map((day, i) => (
          <div key={i} className="flex-1 text-center py-1.5">
            <div
              className="text-[11px] font-semibold leading-tight"
              style={{ color: i >= 5 ? '#EF4444' : 'var(--ds-text-secondary)' }}
            >
              {DAY_LABELS[i]}
            </div>
            <div className="text-[10px] leading-tight" style={{ color: 'var(--ds-text-tertiary)' }}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Timetable grid */}
      <div className="flex" style={{ paddingBottom: 8 }}>
        {/* Time labels */}
        <div style={{ width: TIME_COL_W, flexShrink: 0 }}>
          {HOURS.map(h => (
            <div
              key={h}
              style={{ height: CELL_H }}
              className="flex items-start justify-end pr-1 pt-0.5"
            >
              <span className="text-[9px] leading-none" style={{ color: 'var(--ds-text-tertiary)' }}>
                {String(h).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {Array.from({ length: 7 }, (_, day) => (
          <div
            key={day}
            className="flex-1 relative"
            style={{ borderLeft: '1px solid var(--ds-border)' }}
          >
            {/* Hour cells */}
            {HOURS.map(h => (
              <div
                key={h}
                style={{
                  height: CELL_H,
                  background: isSelected(day, h) ? 'rgba(54,90,168,0.18)' : 'transparent',
                  borderBottom:
                    h % 6 === 5
                      ? '1px dashed var(--ds-border)'
                      : h % 3 === 2
                        ? '1px solid rgba(122,136,164,0.07)'
                        : 'none',
                }}
                onClick={() => handleCellClick(day, h)}
                onMouseEnter={() => {
                  if (selectStart?.day === day) setHoverHour(h);
                }}
              />
            ))}

            {/* Schedule blocks */}
            {scheduleBlocks
              .filter(b => b.dayOfWeek === day)
              .map(block => {
                const span = block.endHour - block.startHour;
                return (
                  <div
                    key={block.id}
                    style={{
                      position: 'absolute',
                      top: block.startHour * CELL_H + 1,
                      height: span * CELL_H - 2,
                      left: 1,
                      right: 1,
                      backgroundColor: block.color + 'BB',
                      borderLeft: `3px solid ${block.color}`,
                      borderRadius: 4,
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      setDetailBlock(block);
                    }}
                  >
                    {span >= 1 && (
                      <p
                        className="text-[9px] font-bold px-1 mt-0.5 truncate leading-tight"
                        style={{ color: '#fff' }}
                      >
                        {block.label || '─'}
                      </p>
                    )}
                    {span >= 2 &&
                      block.routineIds.slice(0, 3).map(id => {
                        const r = routines.find(r => r.id === id);
                        return r ? (
                          <p
                            key={id}
                            className="text-[8px] px-1 truncate leading-tight"
                            style={{ color: 'rgba(255,255,255,0.85)' }}
                          >
                            {r.icon} {r.name}
                          </p>
                        ) : null;
                      })}
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {/* Selection hint toast */}
      {selectStart && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-20">
          <div
            className="text-xs px-4 py-2 rounded-full"
            style={{ background: 'rgba(0,0,0,0.72)', color: '#fff' }}
          >
            종료 셀을 탭하여 범위 완성
          </div>
        </div>
      )}

      {/* Block detail panel */}
      {detailBlock && (
        <div className="modal-backdrop" onClick={() => setDetailBlock(null)}>
          <div className="modal-sheet w-full" onClick={e => e.stopPropagation()}>
            <div
              className="modal-sheet__header"
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <div
                style={{
                  width: 14, height: 14, borderRadius: '50%',
                  backgroundColor: detailBlock.color, flexShrink: 0,
                }}
              />
              <h3 className="modal-sheet__title flex-1" style={{ fontSize: 18 }}>
                {detailBlock.label || '(제목 없음)'}
              </h3>
              <button onClick={() => setDetailBlock(null)} style={{ color: 'var(--ds-text-tertiary)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-sheet__content" style={{ paddingTop: 0 }}>
              <p className="text-xs mb-3" style={{ color: 'var(--ds-text-secondary)' }}>
                {DAY_LABELS[detailBlock.dayOfWeek]}요일&nbsp;
                {String(detailBlock.startHour).padStart(2, '0')}:00 –{' '}
                {String(detailBlock.endHour).padStart(2, '0')}:00
              </p>
              {detailBlock.routineIds.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ds-text-tertiary)' }}>
                    배치된 루틴
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailBlock.routineIds.map(id => {
                      const r = routines.find(r => r.id === id);
                      return r ? (
                        <span
                          key={id}
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ background: 'var(--ds-bg-secondary)', color: 'var(--ds-text-primary)' }}
                        >
                          {r.icon} {r.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-sheet__footer">
              <button
                className="button button--secondary button--md flex-1"
                onClick={() => openEdit(detailBlock)}
              >
                수정
              </button>
              <button
                className="button button--danger button--md"
                onClick={() => {
                  deleteScheduleBlock(detailBlock.id);
                  setDetailBlock(null);
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block create / edit modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-sheet w-full" onClick={e => e.stopPropagation()}>
            <div
              className="modal-sheet__header"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <h3 className="modal-sheet__title" style={{ fontSize: 18 }}>
                {modal.editId ? '일정 수정' : '일정 추가'}
              </h3>
              <button onClick={() => setModal(null)} style={{ color: 'var(--ds-text-tertiary)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-sheet__content" style={{ paddingTop: 0 }}>
              <p className="text-xs mb-4" style={{ color: 'var(--ds-text-secondary)' }}>
                {DAY_LABELS[modal.day]}요일&nbsp;
                {String(modal.startHour).padStart(2, '0')}:00 –{' '}
                {String(modal.endHour).padStart(2, '0')}:00
              </p>

              {/* Label input */}
              <div className="field" style={{ marginBottom: 16 }}>
                <label className="field__label">키워드 / 제목</label>
                <input
                  className="input"
                  type="text"
                  value={formLabel}
                  onChange={e => setFormLabel(e.target.value)}
                  placeholder="예: 운동, 공부, 휴식..."
                />
              </div>

              {/* Color picker */}
              <div className="field" style={{ marginBottom: 16 }}>
                <label className="field__label">색상</label>
                <div className="flex gap-2 flex-wrap" style={{ marginTop: 6 }}>
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        backgroundColor: c,
                        border: '2px solid transparent',
                        boxShadow: formColor === c
                          ? `0 0 0 2px var(--ds-bg), 0 0 0 4px ${c}`
                          : 'none',
                        transition: 'box-shadow 0.15s',
                      }}
                      onClick={() => setFormColor(c)}
                    />
                  ))}
                </div>
              </div>

              {/* Routine assignment */}
              {routines.length > 0 && (
                <div className="field">
                  <label className="field__label">루틴 배치</label>
                  <div className="flex flex-wrap gap-1.5" style={{ marginTop: 6 }}>
                    {routines.map(r => {
                      const sel = formRoutines.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          className="flex items-center gap-1 text-xs font-medium"
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            background: sel ? formColor + '22' : 'var(--ds-bg-secondary)',
                            color: sel ? formColor : 'var(--ds-text-secondary)',
                            border: `1px solid ${sel ? formColor + '88' : 'var(--ds-border)'}`,
                          }}
                          onClick={() =>
                            setFormRoutines(prev =>
                              sel ? prev.filter(id => id !== r.id) : [...prev, r.id]
                            )
                          }
                        >
                          <span>{r.icon}</span>
                          <span>{r.name}</span>
                          {sel && <Check size={10} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-sheet__footer">
              <button
                className="button button--primary button--md button--full"
                onClick={saveBlock}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
