import { useState, useRef } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X, Check, ChevronLeft, ChevronRight, ChevronLeft as Back, ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import { IconDisplay } from '../settings/RoutineForm';
import type { ScheduleBlock } from '../../types';

// 오전 3시부터 23:30까지 30분 단위: 42 슬롯
// slot 0 = 3:00, slot 1 = 3:30, ..., slot 41 = 23:30
const SLOT_COUNT  = 42;
const SLOTS       = Array.from({ length: SLOT_COUNT }, (_, i) => i);
const slotToHour  = (slot: number) => slot * 0.5 + 3;   // 0→3.0, 1→3.5, ...
const hourToSlot  = (hour: number) => (hour - 3) * 2;   // 3→0, 3.5→1, ...

// 모달 시간 옵션: 3:00 ~ 24:00
const TIME_OPTIONS = Array.from({ length: 43 }, (_, i) => i * 0.5 + 3);

const formatHour = (h: number) => {
  if (h === 24) return '24:00';
  const hh = Math.floor(h);
  const mm = h % 1 !== 0 ? '30' : '00';
  return `${String(hh).padStart(2, '0')}:${mm}`;
};

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const CELL_H     = 12;    // px per 30-min slot
const TIME_COL_W = 32;

const MODES = [
  { label: '육아', color: '#EC4899' },
  { label: '일',   color: '#3B82F6' },
  { label: '내 삶', color: '#22C55E' },
  { label: '기타', color: '#A855F7' },
];

const COLOR_PRESETS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#A855F7', '#EC4899', '#14B8A6',
];

const REPEAT_OPTIONS = [
  { key: 'daily',   label: '매일 (1일 단위)',      days: [0, 1, 2, 3, 4, 5, 6] },
  { key: 'weekday', label: '평일마다 (월~금)',      days: [0, 1, 2, 3, 4] },
  { key: 'weekend', label: '주말마다 (토~일)',      days: [5, 6] },
  { key: 'weekly',  label: '매주 (이 요일만 유지)', days: [] },
];

const SCOPE_OPTIONS = [
  { key: 'today', label: '오늘만',   desc: '이번 주에만 적용' },
  { key: 'from',  label: '오늘부터', desc: '오늘 이후로 계속 적용' },
  { key: 'all',   label: '전체기간', desc: '모든 주에 적용' },
];

type EvalVal      = 'good' | 'soso' | 'bad';
type ClickSelect  = { day: number; startSlot: number } | null;
type ModalState   = { day: number; startHour: number; endHour: number; editId?: string } | null;
type RepeatModal  = { dayOfWeek: number; pendingOptionKey?: string } | null;

const loadEvals = (): Record<string, EvalVal> => {
  try { return JSON.parse(localStorage.getItem('blockEvals') || '{}'); }
  catch { return {}; }
};

export default function WeeklyTab() {
  const allRoutines         = useRoutineStore(s => s.routines);
  const routines            = (allRoutines ?? []).filter(r => !r.archived);
  const scheduleBlocks      = useRoutineStore(s => s.scheduleBlocks) ?? [];
  const addScheduleBlock    = useRoutineStore(s => s.addScheduleBlock);
  const updateScheduleBlock = useRoutineStore(s => s.updateScheduleBlock);
  const deleteScheduleBlock = useRoutineStore(s => s.deleteScheduleBlock);

  // ── 평가 데이터 (localStorage) ──────────────────────
  const [evaluations, setEvaluations] = useState<Record<string, EvalVal>>(loadEvals);

  // ── 일별 메모 (localStorage) ─────────────────────────
  const [memos, setMemosState] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('dayMemos') || '{}'); }
    catch { return {}; }
  });
  const saveMemo = (dateStr: string, text: string) => {
    const next = { ...memos, [dateStr]: text };
    setMemosState(next);
    localStorage.setItem('dayMemos', JSON.stringify(next));
  };

  const setEval = (blockId: string, dateStr: string, val: EvalVal) => {
    const key  = `${blockId}-${dateStr}`;
    const next = { ...evaluations, [key]: val };
    setEvaluations(next);
    localStorage.setItem('blockEvals', JSON.stringify(next));
  };

  const getEval = (blockId: string, dateStr: string): EvalVal | null =>
    evaluations[`${blockId}-${dateStr}`] ?? null;

  // ── 오늘 정보 ───────────────────────────────────────
  const today = new Date();

  // ── 일별 배치표 날짜 탐색 ────────────────────────────
  const [dayOffset, setDayOffset] = useState(0);
  const selectedDate       = addDays(today, dayOffset);
  const selectedDateStr    = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayOfWeek  = (selectedDate.getDay() + 6) % 7; // Mon=0 … Sun=6
  const selectedDayBlocks  = [...scheduleBlocks]
    .filter(b => b.dayOfWeek === selectedDayOfWeek)
    .sort((a, b) => a.startHour - b.startHour);
  const isSelectedToday    = dayOffset === 0;

  // ── 주간 탐색 ──────────────────────────────────────
  const [weekOffset, setWeekOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStart        = addDays(currentWeekStart, weekOffset * 7);
  const weekDays         = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel        = `${format(weekDays[0], 'M월 d일', { locale: ko })} – ${format(weekDays[6], 'M월 d일', { locale: ko })}`;

  const goWeek = (delta: number) => {
    setWeekOffset(prev => prev + delta);
    setClickSelectStart(null);
    cancelDrag();
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > 60) goWeek(delta < 0 ? 1 : -1);
  };

  // ── 드래그 선택 ─────────────────────────────────────
  const dragOriginRef    = useRef<{ day: number; slot: number } | null>(null);
  const isDraggingRef    = useRef(false);
  const justFinishedDrag = useRef(false);
  const [dragHighlight, setDragHighlight] = useState<{ day: number; lo: number; hi: number } | null>(null);

  const cancelDrag = () => {
    dragOriginRef.current = null;
    isDraggingRef.current = false;
    setDragHighlight(null);
  };

  const getBlockAtSlot = (day: number, slot: number) => {
    const h = slotToHour(slot);
    return scheduleBlocks.find(b => b.dayOfWeek === day && h >= b.startHour && h < b.endHour);
  };

  const handleCellMouseDown = (day: number, slot: number) => {
    if (getBlockAtSlot(day, slot)) return;
    dragOriginRef.current = { day, slot };
    isDraggingRef.current = false;
    setDragHighlight({ day, lo: slot, hi: slot });
  };

  const handleCellMouseEnter = (day: number, slot: number) => {
    const origin = dragOriginRef.current;
    if (!origin || origin.day !== day) return;
    isDraggingRef.current = true;
    setDragHighlight({ day, lo: Math.min(origin.slot, slot), hi: Math.max(origin.slot, slot) });
  };

  const handleCellMouseUp = (day: number, slot: number) => {
    const origin = dragOriginRef.current;
    if (!origin) return;
    if (isDraggingRef.current && origin.day === day) {
      const startH = slotToHour(Math.min(origin.slot, slot));
      const endH   = slotToHour(Math.max(origin.slot, slot)) + 0.5;
      cancelDrag();
      justFinishedDrag.current = true;
      openModal(day, startH, endH);
      setTimeout(() => { justFinishedDrag.current = false; }, 100);
    } else {
      cancelDrag();
    }
  };

  // ── 클릭 2탭 선택 ─────────────────────────────────
  const [clickSelectStart, setClickSelectStart] = useState<ClickSelect>(null);

  const handleCellClick = (day: number, slot: number) => {
    if (justFinishedDrag.current) return;
    const existing = getBlockAtSlot(day, slot);
    if (existing) { setDetailBlock(existing); setClickSelectStart(null); return; }
    if (!clickSelectStart) {
      setClickSelectStart({ day, startSlot: slot });
    } else if (clickSelectStart.day === day) {
      const lo = Math.min(clickSelectStart.startSlot, slot);
      const hi = Math.max(clickSelectStart.startSlot, slot);
      openModal(day, slotToHour(lo), slotToHour(hi) + 0.5);
    } else {
      setClickSelectStart({ day, startSlot: slot });
    }
  };

  const isCellHighlighted = (day: number, slot: number) => {
    if (dragHighlight && dragHighlight.day === day)
      return slot >= dragHighlight.lo && slot <= dragHighlight.hi;
    if (clickSelectStart?.day === day && slot === clickSelectStart.startSlot) return true;
    return false;
  };

  // ── 블록 생성/수정 모달 ──────────────────────────────
  const [modal,         setModal]         = useState<ModalState>(null);
  const [formColor,     setFormColor]     = useState(MODES[0].color);
  const [formLabel,     setFormLabel]     = useState('');
  const [formRoutines,  setFormRoutines]  = useState<string[]>([]);
  const [formStartHour, setFormStartHour] = useState(3);
  const [formEndHour,   setFormEndHour]   = useState(3.5);
  const [detailBlock,   setDetailBlock]   = useState<ScheduleBlock | null>(null);

  const openModal = (day: number, startH: number, endH: number, editBlock?: ScheduleBlock) => {
    setModal({ day, startHour: startH, endHour: endH, editId: editBlock?.id });
    setFormStartHour(startH);
    setFormEndHour(endH);
    setFormColor(editBlock?.color ?? MODES[0].color);
    setFormLabel(editBlock?.label ?? '');
    setFormRoutines(editBlock?.routineIds ?? []);
    setClickSelectStart(null);
  };

  const saveBlock = () => {
    if (!modal) return;
    const payload = { color: formColor, label: formLabel, routineIds: formRoutines, startHour: formStartHour, endHour: formEndHour };
    if (modal.editId) updateScheduleBlock(modal.editId, payload);
    else addScheduleBlock({ dayOfWeek: modal.day, ...payload });
    setModal(null);
  };

  const openEdit = (block: ScheduleBlock) => {
    setDetailBlock(null);
    openModal(block.dayOfWeek, block.startHour, block.endHour, block);
  };

  // ── 반복 복사 모달 ──────────────────────────────────
  const [repeatModal, setRepeatModal] = useState<RepeatModal>(null);

  const applyRepeat = (dayOfWeek: number, optionKey: string) => {
    const opt = REPEAT_OPTIONS.find(o => o.key === optionKey);
    if (!opt) return;
    const targetDays = opt.days.filter(d => d !== dayOfWeek);
    const source     = scheduleBlocks.filter(b => b.dayOfWeek === dayOfWeek);
    for (const targetDay of targetDays) {
      scheduleBlocks.filter(b => b.dayOfWeek === targetDay).forEach(b => deleteScheduleBlock(b.id));
      source.forEach(b => addScheduleBlock({ dayOfWeek: targetDay, startHour: b.startHour, endHour: b.endHour, color: b.color, label: b.label, routineIds: b.routineIds }));
    }
    setRepeatModal(null);
  };

  // ── 렌더 ────────────────────────────────────────────
  return (
    <div onMouseLeave={cancelDrag} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      {/* ━━━ 섹션 1: 오늘의 모드 배치표 ━━━ */}
      <div className="mx-3 mt-3 mb-1 p-4 rounded-2xl" style={{ background: 'var(--ds-bg-secondary)', border: '1px solid var(--ds-border)' }}>

        {/* 헤더: 제목 + 날짜 이동 버튼 */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--ds-text-primary)' }}>
            오늘의 모드 배치표
          </h2>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setDayOffset(prev => prev - 1)}
              className="rounded-full p-1.5"
              style={{ color: 'var(--ds-text-secondary)', background: 'var(--ds-bg-tertiary)' }}
            >
              <ChevronLeft size={15} />
            </button>
            <span
              className="text-[12px] font-medium px-1.5 text-center"
              style={{ color: isSelectedToday ? 'var(--ds-accent)' : 'var(--ds-text-primary)', minWidth: 88 }}
            >
              {format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}
            </span>
            <button
              onClick={() => setDayOffset(prev => prev + 1)}
              className="rounded-full p-1.5"
              style={{ color: 'var(--ds-text-secondary)', background: 'var(--ds-bg-tertiary)' }}
            >
              <ChevronRight size={15} />
            </button>
            {!isSelectedToday && (
              <button
                onClick={() => setDayOffset(0)}
                className="text-[11px] font-semibold px-2 py-1 rounded-full ml-1"
                style={{ color: 'var(--ds-accent)', background: 'var(--ds-bg-tertiary)' }}
              >
                오늘
              </button>
            )}
          </div>
        </div>

        {selectedDayBlocks.length === 0 ? (
          <p className="text-xs py-3 text-center" style={{ color: 'var(--ds-text-tertiary)' }}>
            {isSelectedToday
              ? '오늘 배치된 일정이 없습니다. 아래 주간 배치표에서 추가하세요.'
              : '이 날 배치된 일정이 없습니다.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedDayBlocks.map(block => {
              const ev = getEval(block.id, selectedDateStr);
              return (
                <div
                  key={block.id}
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{
                    background: block.color + '18',
                    border: `1.5px solid ${block.color}44`,
                  }}
                >
                  {/* 색상 바 */}
                  <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, backgroundColor: block.color, flexShrink: 0 }} />

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--ds-text-primary)' }}>
                      {block.label || '(제목 없음)'}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--ds-text-tertiary)' }}>
                      {formatHour(block.startHour)} – {formatHour(block.endHour)}
                    </p>
                  </div>

                  {/* 평가 버튼 */}
                  <div className="flex gap-1 flex-shrink-0">
                    {([
                      { val: 'good' as EvalVal, icon: <ThumbsUp size={14} />,   color: '#22C55E' },
                      { val: 'soso' as EvalVal, icon: <Minus size={14} />,       color: '#F59E0B' },
                      { val: 'bad'  as EvalVal, icon: <ThumbsDown size={14} />, color: '#EF4444' },
                    ]).map(({ val, icon, color }) => (
                      <button
                        key={val}
                        onClick={() => setEval(block.id, selectedDateStr, val)}
                        style={{
                          width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: ev === val ? color + '22' : 'var(--ds-bg-secondary)',
                          color:      ev === val ? color       : 'var(--ds-text-tertiary)',
                          border:     `1.5px solid ${ev === val ? color + '88' : 'var(--ds-border)'}`,
                          transition: 'all 0.15s',
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 메모 */}
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--ds-border)' }}>
          <textarea
            value={memos[selectedDateStr] ?? ''}
            onChange={e => saveMemo(selectedDateStr, e.target.value)}
            placeholder="이 날의 메모를 남겨보세요..."
            rows={2}
            className="w-full text-sm resize-none rounded-xl px-3 py-2 outline-none"
            style={{
              background: 'var(--ds-bg)',
              border: '1px solid var(--ds-border)',
              color: 'var(--ds-text-primary)',
              lineHeight: 1.6,
            }}
          />
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: 'var(--ds-border)', margin: '14px 0 0' }} />

      {/* ━━━ 섹션 2: 주간 모드 배치표 ━━━ */}
      <div className="px-1 pt-2 pb-1 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--ds-text-primary)' }}>주간 모드 배치표</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-tertiary)' }}>{weekLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => goWeek(-1)} className="rounded-full p-1.5" style={{ color: 'var(--ds-text-secondary)', background: 'var(--ds-bg-secondary)' }}>
            <ChevronLeft size={16} />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => { setWeekOffset(0); setClickSelectStart(null); }} className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: 'var(--ds-accent)', background: 'var(--ds-bg-secondary)' }}>
              오늘
            </button>
          )}
          <button onClick={() => goWeek(1)} className="rounded-full p-1.5" style={{ color: 'var(--ds-text-secondary)', background: 'var(--ds-bg-secondary)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 요일 헤더 (sticky) */}
      <div className="flex sticky z-10" style={{ top: 0, background: 'var(--ds-bg)', borderBottom: '1px solid var(--ds-border)', paddingLeft: TIME_COL_W }}>
        {weekDays.map((day, i) => (
          <div key={i} className="flex-1 text-center py-1.5" style={{ cursor: 'pointer' }} onClick={() => setRepeatModal({ dayOfWeek: i })}>
            <div className="text-[11px] font-semibold leading-tight" style={{ color: i >= 5 ? '#EF4444' : 'var(--ds-text-secondary)' }}>{DAY_LABELS[i]}</div>
            <div className="text-[10px] leading-tight" style={{ color: 'var(--ds-text-tertiary)' }}>{format(day, 'd')}</div>
          </div>
        ))}
      </div>

      {/* 시간표 그리드 */}
      <div className="flex" style={{ paddingBottom: 8 }} onMouseUp={() => { if (dragOriginRef.current) cancelDrag(); }}>
        {/* 시간 레이블 */}
        <div style={{ width: TIME_COL_W, flexShrink: 0 }}>
          {SLOTS.map(slot => (
            <div key={slot} style={{ height: CELL_H }} className="flex items-start justify-end pr-1">
              {slot % 2 === 0 && (
                <span className="text-[9px] leading-none pt-0.5" style={{ color: 'var(--ds-text-tertiary)' }}>
                  {String(Math.floor(slotToHour(slot))).padStart(2, '0')}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 요일 컬럼 */}
        {Array.from({ length: 7 }, (_, day) => (
          <div key={day} className="flex-1 relative" style={{ borderLeft: '1px solid var(--ds-border)' }}>
            {/* 셀 */}
            {SLOTS.map((slot, i) => (
              <div
                key={slot}
                style={{
                  height: CELL_H,
                  background: isCellHighlighted(day, slot) ? 'rgba(54,90,168,0.22)' : 'transparent',
                  borderBottom:
                    i % 12 === 11 ? '1px dashed var(--ds-border)' :  // 6시간마다
                    i % 2  === 1  ? '1px solid rgba(122,136,164,0.1)' : 'none', // 정시마다
                  userSelect: 'none',
                  cursor: 'crosshair',
                }}
                onMouseDown={() => handleCellMouseDown(day, slot)}
                onMouseEnter={() => handleCellMouseEnter(day, slot)}
                onMouseUp={() => handleCellMouseUp(day, slot)}
                onClick={() => handleCellClick(day, slot)}
              />
            ))}

            {/* 스케줄 블록 */}
            {scheduleBlocks.filter(b => b.dayOfWeek === day).map(block => {
              const topSlot  = hourToSlot(block.startHour);
              const spanSlots = (block.endHour - block.startHour) * 2;
              return (
                <div
                  key={block.id}
                  style={{
                    position: 'absolute',
                    top: topSlot * CELL_H + 1,
                    height: spanSlots * CELL_H - 2,
                    left: 1, right: 1,
                    backgroundColor: block.color + '55',
                    borderLeft: `3px solid ${block.color + 'CC'}`,
                    borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
                  }}
                  onClick={e => { e.stopPropagation(); setDetailBlock(block); }}
                >
                  {spanSlots >= 2 && (
                    <p className="text-[9px] font-bold px-1 mt-0.5 truncate leading-tight" style={{ color: '#fff' }}>
                      {block.label || '─'}
                    </p>
                  )}
                  {spanSlots >= 4 && block.routineIds.slice(0, 2).map(id => {
                    const r = routines.find(r => r.id === id);
                    return r ? (
                      <p key={id} className="text-[8px] px-1 truncate leading-tight" style={{ color: 'rgba(255,255,255,0.85)' }}>{r.name}</p>
                    ) : null;
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 범위 선택 안내 토스트 */}
      {clickSelectStart && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-20">
          <div className="text-xs px-4 py-2 rounded-full" style={{ background: 'rgba(0,0,0,0.72)', color: '#fff' }}>
            종료 셀을 탭하거나 드래그하여 범위 완성
          </div>
        </div>
      )}

      {/* 반복 설정 모달 */}
      {repeatModal && (
        <div className="modal-backdrop" onClick={() => setRepeatModal(null)}>
          <div className="modal-sheet w-full" onClick={e => e.stopPropagation()}>
            <div className="modal-sheet__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {repeatModal.pendingOptionKey && (
                  <button onClick={() => setRepeatModal({ dayOfWeek: repeatModal.dayOfWeek })} style={{ color: 'var(--ds-text-tertiary)', marginRight: 2 }}>
                    <Back size={18} />
                  </button>
                )}
                <h3 className="modal-sheet__title" style={{ fontSize: 18 }}>
                  {repeatModal.pendingOptionKey ? `${DAY_LABELS[repeatModal.dayOfWeek]}요일 적용 범위` : `${DAY_LABELS[repeatModal.dayOfWeek]}요일 반복 설정`}
                </h3>
              </div>
              <button onClick={() => setRepeatModal(null)} style={{ color: 'var(--ds-text-tertiary)' }}><X size={18} /></button>
            </div>
            <div className="modal-sheet__content" style={{ paddingTop: 0 }}>
              {!repeatModal.pendingOptionKey && (
                <>
                  <p className="text-xs mb-4" style={{ color: 'var(--ds-text-secondary)' }}>{DAY_LABELS[repeatModal.dayOfWeek]}요일의 일정을 아래 단위로 복사합니다.</p>
                  <div className="flex flex-col gap-2">
                    {REPEAT_OPTIONS.map(opt => (
                      <button key={opt.key} className="text-sm font-medium text-left px-4 py-3 rounded-xl"
                        style={{ background: 'var(--ds-bg-secondary)', color: 'var(--ds-text-primary)', border: '1px solid var(--ds-border)' }}
                        onClick={() => setRepeatModal({ dayOfWeek: repeatModal.dayOfWeek, pendingOptionKey: opt.key })}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {repeatModal.pendingOptionKey && (
                <>
                  <p className="text-xs mb-4" style={{ color: 'var(--ds-text-secondary)' }}>
                    「{REPEAT_OPTIONS.find(o => o.key === repeatModal.pendingOptionKey)?.label}」을 어느 기간에 적용할까요?
                  </p>
                  <div className="flex flex-col gap-2">
                    {SCOPE_OPTIONS.map(scope => (
                      <button key={scope.key} className="text-left px-4 py-3 rounded-xl"
                        style={{ background: 'var(--ds-bg-secondary)', border: '1px solid var(--ds-border)' }}
                        onClick={() => applyRepeat(repeatModal.dayOfWeek, repeatModal.pendingOptionKey!)}>
                        <div className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>{scope.label}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--ds-text-tertiary)' }}>{scope.desc}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 블록 상세 패널 */}
      {detailBlock && (
        <div className="modal-backdrop" onClick={() => setDetailBlock(null)}>
          <div className="modal-sheet w-full" onClick={e => e.stopPropagation()}>
            <div className="modal-sheet__header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: detailBlock.color, flexShrink: 0 }} />
              <h3 className="modal-sheet__title flex-1" style={{ fontSize: 18 }}>{detailBlock.label || '(제목 없음)'}</h3>
              <button onClick={() => setDetailBlock(null)} style={{ color: 'var(--ds-text-tertiary)' }}><X size={18} /></button>
            </div>
            <div className="modal-sheet__content" style={{ paddingTop: 0 }}>
              <p className="text-xs mb-3" style={{ color: 'var(--ds-text-secondary)' }}>
                {DAY_LABELS[detailBlock.dayOfWeek]}요일&nbsp;{formatHour(detailBlock.startHour)} – {formatHour(detailBlock.endHour)}
              </p>
              {detailBlock.routineIds.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ds-text-tertiary)' }}>배치된 루틴</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailBlock.routineIds.map(id => {
                      const r = routines.find(r => r.id === id);
                      return r ? (
                        <span key={id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: 'var(--ds-bg-secondary)', color: 'var(--ds-text-primary)' }}>
                          <IconDisplay icon={r.icon} size={12} />{r.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-sheet__footer">
              <button className="button button--secondary button--md flex-1" onClick={() => openEdit(detailBlock)}>수정</button>
              <button className="button button--danger button--md" onClick={() => { deleteScheduleBlock(detailBlock.id); setDetailBlock(null); }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 블록 생성/수정 모달 */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-sheet w-full" onClick={e => e.stopPropagation()}>
            <div className="modal-sheet__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="modal-sheet__title" style={{ fontSize: 18 }}>{modal.editId ? '일정 수정' : '일정 추가'}</h3>
              <button onClick={() => setModal(null)} style={{ color: 'var(--ds-text-tertiary)' }}><X size={18} /></button>
            </div>
            <div className="modal-sheet__content" style={{ paddingTop: 0 }}>

              {/* 시간 선택 */}
              <div className="field" style={{ marginBottom: 16 }}>
                <label className="field__label">시간</label>
                <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
                  <select value={formStartHour}
                    onChange={e => { const h = Number(e.target.value); setFormStartHour(h); if (h >= formEndHour) setFormEndHour(h + 0.5); }}
                    className="text-sm rounded-lg px-2 py-1.5 flex-1"
                    style={{ background: 'var(--ds-bg-secondary)', color: 'var(--ds-text-primary)', border: '1px solid var(--ds-border)' }}>
                    {TIME_OPTIONS.filter(h => h < 24).map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                  </select>
                  <span className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>~</span>
                  <select value={formEndHour}
                    onChange={e => { const h = Number(e.target.value); setFormEndHour(h); if (h <= formStartHour) setFormStartHour(h - 0.5); }}
                    className="text-sm rounded-lg px-2 py-1.5 flex-1"
                    style={{ background: 'var(--ds-bg-secondary)', color: 'var(--ds-text-primary)', border: '1px solid var(--ds-border)' }}>
                    {TIME_OPTIONS.filter(h => h > formStartHour).map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                  </select>
                </div>
              </div>

              {/* 모드 선택 */}
              <div className="field" style={{ marginBottom: 16 }}>
                <label className="field__label">모드</label>
                <div className="flex gap-2 flex-wrap" style={{ marginTop: 6 }}>
                  {MODES.map(m => {
                    const sel = formLabel === m.label;
                    return (
                      <button key={m.label} className="text-sm font-medium"
                        style={{ padding: '5px 14px', borderRadius: 999, background: sel ? m.color : 'var(--ds-bg-secondary)', color: sel ? '#fff' : 'var(--ds-text-secondary)', border: `1.5px solid ${sel ? m.color : 'var(--ds-border)'}`, transition: 'all 0.15s' }}
                        onClick={() => { setFormLabel(m.label); setFormColor(m.color); }}>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 색상 선택 */}
              <div className="field" style={{ marginBottom: 16 }}>
                <label className="field__label">색상</label>
                <div className="flex gap-2 flex-wrap" style={{ marginTop: 6 }}>
                  {COLOR_PRESETS.map(c => (
                    <button key={c} style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: c, border: '2px solid transparent', boxShadow: formColor === c ? `0 0 0 2px var(--ds-bg), 0 0 0 4px ${c}` : 'none', transition: 'box-shadow 0.15s' }}
                      onClick={() => setFormColor(c)} />
                  ))}
                </div>
              </div>

              {/* 루틴 배치 */}
              {routines.length > 0 && (
                <div className="field">
                  <label className="field__label">루틴 배치</label>
                  <div className="flex flex-wrap gap-1.5" style={{ marginTop: 6 }}>
                    {routines.map(r => {
                      const sel = formRoutines.includes(r.id);
                      return (
                        <button key={r.id} className="flex items-center gap-1 text-xs font-medium"
                          style={{ padding: '4px 10px', borderRadius: 999, background: sel ? formColor + '22' : 'var(--ds-bg-secondary)', color: sel ? formColor : 'var(--ds-text-secondary)', border: `1px solid ${sel ? formColor + '88' : 'var(--ds-border)'}` }}
                          onClick={() => setFormRoutines(prev => sel ? prev.filter(id => id !== r.id) : [...prev, r.id])}>
                          <IconDisplay icon={r.icon} size={12} />
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
              <button className="button button--primary button--md button--full" onClick={saveBlock}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
