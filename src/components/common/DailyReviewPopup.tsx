import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { subDays } from 'date-fns';
import { useRoutineStore } from '../../stores/routineStore';
import { formatDate, formatDisplayDate } from '../../utils/date';
import { Button, Modal, Notice } from '../ui/primitives';

const STORAGE_KEY = 'lastReviewPopupDate';

export default function DailyReviewPopup() {
  const reflections = useRoutineStore((s) => s.reflections);
  const [visible, setVisible] = useState(false);
  const [yesterdayReflection, setYesterdayReflection] = useState<{
    keep: string; problem: string; try: string; date: string; displayDate: string;
  } | null>(null);

  useEffect(() => {
    const today = formatDate(new Date());
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === today) return;
    const yesterday = subDays(new Date(), 1);
    const yesterdayStr = formatDate(yesterday);
    const ref = reflections.find((r) => r.date === yesterdayStr && r.type === 'daily');
    if (ref && (ref.keep || ref.problem || ref.try)) {
      setYesterdayReflection({ keep: ref.keep, problem: ref.problem, try: ref.try, date: yesterdayStr, displayDate: formatDisplayDate(yesterday) });
      setVisible(true);
    }
  }, [reflections]);

  const handleClose = () => { setVisible(false); localStorage.setItem(STORAGE_KEY, formatDate(new Date())); };
  if (!visible || !yesterdayReflection) return null;

  return (
    <Modal
      open={true}
      title="어제의 회고"
      description={yesterdayReflection.displayDate}
      onClose={handleClose}
      size="sm"
      footer={<Button onClick={handleClose} variant="primary" size="lg" fullWidth>확인</Button>}
    >
      <div className="mb-4 flex items-center gap-2 text-[13px] font-semibold" style={{ color: 'var(--ds-accent)' }}>
        <BookOpen size={16} />
        어제 남긴 생각을 오늘 다시 확인합니다
      </div>
      <div className="space-y-2.5">
        {yesterdayReflection.keep && <Notice tone="success"><strong className="mr-1">Keep</strong>{yesterdayReflection.keep}</Notice>}
        {yesterdayReflection.problem && <Notice tone="danger"><strong className="mr-1">Problem</strong>{yesterdayReflection.problem}</Notice>}
        {yesterdayReflection.try && <Notice><strong className="mr-1">Try</strong>{yesterdayReflection.try}</Notice>}
      </div>
    </Modal>
  );
}
