import { useState } from 'react';
import { Smartphone, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { SectionCard, Button, Notice } from '../ui/primitives';

const WIDGET_SCRIPT_URL = '/daily613-widget.js';

const STEPS = [
  {
    num: '1',
    title: 'Scriptable 설치',
    desc: 'App Store에서 "Scriptable" 앱을 설치합니다.',
  },
  {
    num: '2',
    title: '스크립트 복사',
    desc: '아래 버튼으로 스크립트를 복사한 뒤 Scriptable에 새 스크립트를 만들어 붙여넣고 저장합니다.',
  },
  {
    num: '3',
    title: '홈 화면에 위젯 추가',
    desc: '홈 화면을 길게 눌러 편집 모드로 진입 → + 버튼 → Scriptable 선택 → 원하는 크기의 위젯 추가',
  },
  {
    num: '4',
    title: '계정 정보 입력',
    desc: '추가된 위젯을 길게 누른 뒤 "위젯 편집" 선택 → Script에서 저장한 스크립트 선택 → Parameter에 이메일|비밀번호 형식으로 입력 (예: user@email.com|mypassword)',
  },
  {
    num: '5',
    title: '완료',
    desc: '첫 실행 후 계정 정보가 기기에 안전하게 저장되며, 이후 자동으로 오늘의 루틴을 표시합니다.',
  },
];

export default function WidgetSetup() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const res = await fetch(WIDGET_SCRIPT_URL);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: open file in new tab
      window.open(WIDGET_SCRIPT_URL, '_blank');
    }
  };

  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="아이폰 홈 위젯 설정 열기/닫기"
        className="list-row w-full"
      >
        <span className="flex items-center gap-2.5 text-[15px] font-medium" style={{ color: 'var(--ds-text-primary)' }}>
          <Smartphone size={17} style={{ color: 'var(--ds-text-tertiary)' }} />
          아이폰 홈 위젯
        </span>
        {open
          ? <ChevronUp size={17} style={{ color: 'var(--ds-text-tertiary)' }} />
          : <ChevronDown size={17} style={{ color: 'var(--ds-text-tertiary)' }} />}
      </button>

      {open && (
        <div className="mt-2">
          <SectionCard>
            <div className="space-y-4">
              <p className="text-[13px]" style={{ color: 'var(--ds-text-secondary)' }}>
                <strong>Scriptable</strong> 앱을 이용해 아이폰 홈 화면에 오늘의 루틴 완료 현황을 위젯으로 표시할 수 있습니다.
              </p>

              {/* 설치 단계 */}
              <ol className="space-y-3">
                {STEPS.map((step) => (
                  <li key={step.num} className="flex gap-3">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold mt-0.5"
                      style={{ background: 'var(--ds-accent)', color: '#fff' }}
                    >
                      {step.num}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>{step.title}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* 복사 버튼 */}
              <Button onClick={handleCopy} variant="primary" size="lg" fullWidth>
                {copied
                  ? <><Check size={15} />복사 완료!</>
                  : <><Copy size={15} />위젯 스크립트 복사</>}
              </Button>

              {copied && (
                <Notice tone="success">
                  클립보드에 복사됐습니다. Scriptable 앱에 붙여넣기 하세요.
                </Notice>
              )}

              {/* 위젯 크기 안내 */}
              <div className="rounded-xl p-3 space-y-1" style={{ background: 'var(--ds-bg-secondary)' }}>
                <p className="text-[12px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>지원 위젯 크기</p>
                <p className="text-[12px]" style={{ color: 'var(--ds-text-secondary)' }}>
                  Small — 최대 5개 루틴<br />
                  Medium — 최대 7개 루틴<br />
                  Large — 최대 12개 루틴
                </p>
              </div>

              {/* 보안 안내 */}
              <Notice tone="default">
                비밀번호는 기기의 Keychain에만 저장되며 외부로 전송되지 않습니다.
              </Notice>
            </div>
          </SectionCard>
        </div>
      )}
    </section>
  );
}
