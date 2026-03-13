import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import { EMOJI_CATEGORIES, SIMPLE_CATEGORIES } from '../../constants/icons';
import SimpleIcon, { isSimpleIcon, getSimpleIconName } from '../common/SimpleIcon';
import type { Routine } from '../../types';
import { Button, Input, Modal, Notice, SectionCard, SegmentedControl } from '../ui/primitives';

type IconStyle = 'emoji' | 'simple';

interface Props {
  routine?: Routine;
  onClose: () => void;
}

function IconDisplay({ icon, size = 20 }: { icon: string; size?: number }) {
  if (!icon) return null;
  if (isSimpleIcon(icon)) {
    return <SimpleIcon name={getSimpleIconName(icon)} size={size} className="text-primary-600" />;
  }
  return <span style={{ fontSize: size }}>{icon}</span>;
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
  const [iconStyle, setIconStyle] = useState<IconStyle>(icon && isSimpleIcon(icon) ? 'simple' : 'emoji');
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) => prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]);
  };

  // 검색 결과
  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results: string[] = [];
    EMOJI_CATEGORIES.forEach((cat) => {
      if (cat.name.toLowerCase().includes(q)) {
        results.push(...cat.icons.slice(0, 10));
      } else {
        results.push(...cat.icons.filter(() => false)); // emoji는 텍스트 검색 어려움
      }
    });
    // 카테고리명 매칭시 해당 카테고리 아이콘 반환
    const matchedCats = EMOJI_CATEGORIES.filter((c) => c.name.includes(q));
    if (matchedCats.length > 0) return matchedCats.flatMap((c) => c.icons);
    return null;
  }, [searchQuery]);

  const filteredSimple = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results: { name: string; label: string }[] = [];
    SIMPLE_CATEGORIES.forEach((cat) => {
      cat.icons.forEach((ic) => {
        if (ic.label.toLowerCase().includes(q) || ic.name.toLowerCase().includes(q) || cat.name.includes(q)) {
          results.push(ic);
        }
      });
    });
    return results.length > 0 ? results : null;
  }, [searchQuery]);

  const currentEmojiCategory = EMOJI_CATEGORIES[categoryIdx] || EMOJI_CATEGORIES[0];
  const currentSimpleCategory = SIMPLE_CATEGORIES[categoryIdx] || SIMPLE_CATEGORIES[0];

  const selectIcon = (value: string) => {
    setIcon(value);
    setShowIconPicker(false);
    setSearchQuery('');
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), icon: icon || '', color: routine?.color || '', doneGoal: doneGoal.trim(), moreGoal: moreGoal.trim(), maxGoal: maxGoal.trim(), keywords: selectedKeywords };
    if (routine) { updateRoutine(routine.id, data); } else { addRoutine(data); }
    onClose();
  };

  return (
    <Modal
      open={true}
      title={routine ? '루틴 수정' : '새 루틴'}
      description="루틴 이름, 단계 목표, 키워드를 한 흐름에서 정리합니다."
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>취소</Button>
          <Button variant="primary" size="lg" fullWidth onClick={handleSubmit}>{routine ? '수정하기' : '추가하기'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <SectionCard title="기본 정보" subtitle="아이콘과 이름을 함께 정하면 리스트에서 더 빠르게 인식할 수 있습니다.">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-[20px] border border-dashed transition-colors"
              style={{ borderColor: showIconPicker ? 'var(--ds-accent)' : 'var(--ds-border)', background: 'var(--ds-bg-secondary)' }}
              aria-label="아이콘 선택"
            >
              {icon ? <IconDisplay icon={icon} size={24} /> : <Plus size={20} style={{ color: 'var(--ds-text-tertiary)' }} />}
            </button>
            <div className="flex-1">
              <Input type="text" label="루틴 이름" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 운동하기" />
            </div>
          </div>

          {showIconPicker ? (
            <div className="mt-4 rounded-[24px] border p-4" style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-bg-secondary)' }}>
              <div className="mb-3">
                <SegmentedControl
                  value={iconStyle}
                  onChange={(value) => { setIconStyle(value); setCategoryIdx(0); setSearchQuery(''); }}
                  options={[
                    { value: 'emoji', label: '이모지' },
                    { value: 'simple', label: '심플' },
                  ]}
                />
              </div>

              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ds-text-tertiary)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="아이콘 검색"
                  className="input pl-9"
                />
              </div>

              {!searchQuery ? (
                <div className="chip-row mb-3">
                  {(iconStyle === 'emoji' ? EMOJI_CATEGORIES : SIMPLE_CATEGORIES).map((cat, idx) => (
                    <button key={cat.name} onClick={() => setCategoryIdx(idx)} className={`chip ${categoryIdx === idx ? 'chip--active' : ''}`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              ) : null}

              {icon ? (
                <div className="mb-3">
                  <Button variant="ghost" size="sm" onClick={() => selectIcon('')}>아이콘 제거</Button>
                </div>
              ) : null}

              {iconStyle === 'emoji' ? (
                <div className="grid max-h-[220px] grid-cols-8 gap-2 overflow-y-auto">
                  {(searchQuery && filteredEmojis ? filteredEmojis : currentEmojiCategory.icons).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => selectIcon(emoji)}
                      className="flex h-10 w-10 items-center justify-center rounded-[14px] text-[18px] transition-all"
                      style={{
                        background: icon === emoji ? 'var(--ds-accent-soft)' : 'transparent',
                        boxShadow: icon === emoji ? 'inset 0 0 0 1px rgba(54, 90, 168, 0.18)' : 'none',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                  {searchQuery && !filteredEmojis ? (
                    <div className="col-span-8 py-4 text-center text-[12px]" style={{ color: 'var(--ds-text-tertiary)' }}>결과 없음</div>
                  ) : null}
                </div>
              ) : (
                <div className="grid max-h-[220px] grid-cols-6 gap-2 overflow-y-auto">
                  {(searchQuery && filteredSimple ? filteredSimple : currentSimpleCategory.icons).map((ic) => {
                    const value = `lucide:${ic.name}`;
                    return (
                      <button
                        key={ic.name}
                        onClick={() => selectIcon(value)}
                        className="flex flex-col items-center gap-1 rounded-[16px] py-2 transition-all"
                        style={{
                          background: icon === value ? 'var(--ds-accent-soft)' : 'transparent',
                          boxShadow: icon === value ? 'inset 0 0 0 1px rgba(54, 90, 168, 0.18)' : 'none',
                        }}
                      >
                        <SimpleIcon name={ic.name} size={20} className={icon === value ? 'text-primary-600' : 'text-text-secondary'} />
                        <span className="text-[9px]" style={{ color: 'var(--ds-text-tertiary)' }}>{ic.label}</span>
                      </button>
                    );
                  })}
                  {searchQuery && !filteredSimple ? (
                    <div className="col-span-6 py-4 text-center text-[12px]" style={{ color: 'var(--ds-text-tertiary)' }}>결과 없음</div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="단계별 목표" subtitle="Done, More, Max의 기준을 동일한 입력 구조로 맞춥니다.">
          <div className="space-y-3">
            <Input label="Done" value={doneGoal} onChange={(e) => setDoneGoal(e.target.value)} placeholder="최소 목표 (예: 10분)" />
            <Input label="More" value={moreGoal} onChange={(e) => setMoreGoal(e.target.value)} placeholder="중간 목표 (예: 30분)" />
            <Input label="Max" value={maxGoal} onChange={(e) => setMaxGoal(e.target.value)} placeholder="최대 목표 (예: 1시간)" />
          </div>
        </SectionCard>

        {keywords.length > 0 ? (
          <SectionCard title="키워드" subtitle="관련 루틴끼리 같은 문맥으로 묶을 수 있습니다.">
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <button key={kw} onClick={() => toggleKeyword(kw)} className={`chip ${selectedKeywords.includes(kw) ? 'chip--active' : ''}`}>
                  {kw}
                </button>
              ))}
            </div>
          </SectionCard>
        ) : (
          <Notice>키워드를 추가하면 루틴을 더 세밀하게 분류할 수 있어요.</Notice>
        )}
      </div>
    </Modal>
  );
}

export { IconDisplay };
