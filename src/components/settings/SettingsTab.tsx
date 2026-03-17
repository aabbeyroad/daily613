import { useState } from 'react';
import { Plus, Edit3, Trash2, Moon, Sun, Download, Send, Tag, ChevronRight, ChevronLeft, FileText, LogOut, Palette, Check, Calendar, BookOpen } from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import { useRoutineStore } from '../../stores/routineStore';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import type { ColorTheme, Routine } from '../../types';
import { exportJSON, exportCSV, exportMarkdown, exportObsidianNote } from '../../utils/export';
import { sendDiscordReport } from '../../utils/discord';
import { formatDate, formatDisplayDate, getWeekKey } from '../../utils/date';
import RoutineForm, { IconDisplay } from './RoutineForm';
import KeywordManager from './KeywordManager';
import ConfirmDialog from '../common/ConfirmDialog';
import { Button, Card, IconButton, Input, Notice, Screen, ScreenHeader, SectionCard } from '../ui/primitives';

export default function SettingsTab() {
  const routines = useRoutineStore((s) => s.routines);
  const records = useRoutineStore((s) => s.records);
  const reflections = useRoutineStore((s) => s.reflections);
  const settings = useRoutineStore((s) => s.settings);
  const updateSettings = useRoutineStore((s) => s.updateSettings);
  const deleteRoutine = useRoutineStore((s) => s.deleteRoutine);
  const { darkMode, toggleDarkMode, colorTheme, setColorTheme } = useTheme();
  const { user, logout } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>();
  const [showKeywords, setShowKeywords] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(settings.discordWebhookUrl);
  const [username, setUsername] = useState(settings.username || user?.displayName || '');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'success' | 'success-noimage' | 'error' | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ type: 'routine'; routine: Routine } | { type: 'logout' } | null>(null);
  const [reportDate, setReportDate] = useState(new Date());

  const reportDateStr = formatDate(reportDate);
  const isReportToday = reportDateStr === formatDate(new Date());

  const handleEdit = (routine: Routine) => { setEditingRoutine(routine); setShowForm(true); };
  const handleDelete = (routine: Routine) => { setConfirmTarget({ type: 'routine', routine }); };

  const handleExportJSON = () => { exportJSON({ routines, records, reflections }); };
  const handleExportCSV = () => { exportCSV(routines, records, reflections); };
  const handleExportMarkdown = () => { exportMarkdown({ routines, records, reflections }); };

  const handleSaveWebhook = () => { updateSettings({ discordWebhookUrl: webhookUrl.trim(), username: username.trim() }); };

  const handleSendReport = async () => {
    if (!settings.discordWebhookUrl) return;
    setSending(true); setSendResult(null);
    const record = records.find((r) => r.date === reportDateStr);
    const reflection = reflections.find((r) => r.date === reportDateStr && r.type === 'daily');
    const weekKey = getWeekKey(reportDate);
    const weeklyReflection = reflections.find((r) => r.date === weekKey && r.type === 'weekly');
    const result = await sendDiscordReport(settings.discordWebhookUrl, {
      date: reportDateStr, routines, checks: record?.checks || {}, reflection, weeklyReflection,
      username: settings.username || user?.displayName || '', records,
    });
    if (result.ok) { setSendResult(result.hasImage ? 'success' : 'success-noimage'); }
    else { setSendResult('error'); }
    setSending(false);
    setTimeout(() => setSendResult(null), 3000);
  };

  const handleExportObsidian = () => {
    const record = records.find((r) => r.date === reportDateStr);
    const reflection = reflections.find((r) => r.date === reportDateStr && r.type === 'daily');
    const weekKey = getWeekKey(reportDate);
    const weeklyReflection = reflections.find((r) => r.date === weekKey && r.type === 'weekly');
    exportObsidianNote(reportDateStr, routines, record?.checks || {}, reflection, weeklyReflection);
  };

  const handleLogout = () => { setConfirmTarget({ type: 'logout' }); };
  const activeRoutines = routines.filter((r) => !r.archived).sort((a, b) => a.order - b.order);

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Settings"
        title="환경과 데이터 정리"
        description="기능보다 질서를 먼저 두는 설정 화면으로, 관리 작업을 한 톤으로 맞췄습니다."
      />

      <section>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold" style={{ background: 'var(--ds-accent-soft)', color: 'var(--ds-accent)' }}>
              {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>{user?.displayName || '사용자'}</div>
              <div className="truncate text-[13px]" style={{ color: 'var(--ds-text-tertiary)' }}>{user?.email}</div>
            </div>
            <IconButton
              onClick={handleLogout}
              aria-label="로그아웃"
              variant="danger"
            >
              <LogOut size={18} />
            </IconButton>
          </div>
        </Card>
      </section>

      <section>
        <SectionCard
          title="루틴 관리"
          subtitle="핵심 루틴을 한 리스트 안에서 정리하고 수정합니다."
          action={<Button onClick={() => { setEditingRoutine(undefined); setShowForm(true); }} variant="primary" size="sm"><Plus size={15} />추가</Button>}
        >
        {activeRoutines.length === 0 ? (
          <div className="py-8 text-center text-[13px]" style={{ color: 'var(--ds-text-tertiary)' }}>루틴을 추가해보세요</div>
        ) : (
          <div className="space-y-2">
            {activeRoutines.map((routine) => (
              <div key={routine.id} className="list-row">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {routine.icon && <IconDisplay icon={routine.icon} size={20} />}
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-medium" style={{ color: 'var(--ds-text-primary)' }}>{routine.name}</div>
                    <div className="mt-0.5 text-[11px]" style={{ color: 'var(--ds-text-tertiary)' }}><span className="text-done">D:{routine.doneGoal}</span>{' · '}<span className="text-more">M:{routine.moreGoal}</span>{' · '}<span className="text-max">X:{routine.maxGoal}</span></div>
                  </div>
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  <IconButton onClick={() => handleEdit(routine)} aria-label={`${routine.name} 수정`}><Edit3 size={15} /></IconButton>
                  <IconButton onClick={() => handleDelete(routine)} aria-label={`${routine.name} 삭제`} variant="danger"><Trash2 size={15} /></IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
        </SectionCard>
      </section>

      <section>
        <button onClick={() => setShowKeywords(!showKeywords)} aria-label="키워드 관리 열기/닫기" aria-expanded={showKeywords} className="list-row w-full">
          <span className="flex items-center gap-2.5 text-[15px] font-medium" style={{ color: 'var(--ds-text-primary)' }}><Tag size={17} style={{ color: 'var(--ds-text-tertiary)' }} />키워드 관리</span>
          <ChevronRight size={17} className={`transition-transform duration-200 ${showKeywords ? 'rotate-90' : ''}`} style={{ color: 'var(--ds-text-tertiary)' }} />
        </button>
        {showKeywords && <div className="mt-2"><KeywordManager /></div>}
      </section>

      <section>
        <SectionCard title="외관" subtitle="Apple식 절제감을 유지하면서 컬러와 명암을 바꿀 수 있습니다.">
          <div className="space-y-4">
          <div className="list-row">
            <div className="flex items-center gap-2.5">
              {darkMode ? <Moon size={17} style={{ color: 'var(--ds-text-tertiary)' }} /> : <Sun size={17} style={{ color: 'var(--ds-text-tertiary)' }} />}
              <span className="font-medium text-[15px]">다크모드</span>
            </div>
            <button
              onClick={toggleDarkMode}
              role="switch"
              aria-checked={darkMode}
              aria-label="다크모드 전환"
              className={`pill-switch ${darkMode ? 'pill-switch--on' : ''}`}
            />
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <Palette size={17} style={{ color: 'var(--ds-text-tertiary)' }} />
              <span className="font-medium text-[15px]">색상 테마</span>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {([
                { key: 'indigo' as ColorTheme, color: 'bg-indigo-500', label: '인디고' },
                { key: 'rose' as ColorTheme, color: 'bg-rose-500', label: '로즈' },
                { key: 'emerald' as ColorTheme, color: 'bg-emerald-500', label: '에메랄드' },
                { key: 'amber' as ColorTheme, color: 'bg-amber-500', label: '앰버' },
                { key: 'sky' as ColorTheme, color: 'bg-sky-500', label: '스카이' },
                { key: 'violet' as ColorTheme, color: 'bg-violet-500', label: '바이올렛' },
              ]).map(({ key, color, label }) => (
                <button
                  key={key}
                  onClick={() => setColorTheme(key)}
                  aria-label={`${label} 테마 선택`}
                  aria-pressed={colorTheme === key}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`w-9 h-9 rounded-full ${color} flex items-center justify-center transition-all ${colorTheme === key ? 'scale-110' : 'opacity-50 hover:opacity-75'}`}
                    style={colorTheme === key ? { boxShadow: '0 0 0 2px var(--ds-bg), 0 0 0 4px var(--ds-text-primary)' } : undefined}
                  >
                    {colorTheme === key && <Check size={16} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-[9px]" style={{ color: colorTheme === key ? 'var(--ds-text-primary)' : 'var(--ds-text-tertiary)', fontWeight: colorTheme === key ? 700 : 500 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          </div>
        </SectionCard>
      </section>

      <section>
        <SectionCard title="Discord 연동" subtitle="리포트를 보내는 흐름도 같은 입력 규칙과 버튼 체계로 정리했습니다.">
          <div className="space-y-3">
            <Input label="표시 이름" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="예: 홍길동" />
            <Input label="Webhook URL" type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/..." />
            <Button onClick={handleSaveWebhook} variant="primary" size="lg" fullWidth>저장</Button>
            {settings.discordWebhookUrl && (
              <>
                <div className="card p-3">
                  <label className="mb-1.5 ml-0.5 flex items-center gap-1 text-[12px] font-medium" style={{ color: 'var(--ds-text-tertiary)' }}><Calendar size={12} />리포트 날짜</label>
                  <div className="flex items-center justify-between rounded-[18px] border px-1 py-1" style={{ borderColor: 'var(--ds-border)', background: 'var(--ds-bg-secondary)' }}>
                    <IconButton onClick={() => setReportDate((d) => subDays(d, 1))} aria-label="이전 날짜">
                      <ChevronLeft size={16} />
                    </IconButton>
                    <button onClick={() => setReportDate(new Date())} className="text-[13px] font-medium transition-colors" style={{ color: isReportToday ? 'var(--ds-text-primary)' : 'var(--ds-accent)' }}>
                      {formatDisplayDate(reportDate)}
                    </button>
                    <IconButton onClick={() => setReportDate((d) => addDays(d, 1))} aria-label="다음 날짜">
                      <ChevronRight size={16} />
                    </IconButton>
                  </div>
                </div>
                <Button onClick={handleSendReport} disabled={sending} aria-label="Discord 리포트 전송" variant="primary" size="lg" fullWidth>
                  <Send size={15} />{sending ? '전송 중...' : `${isReportToday ? '오늘의' : reportDateStr} 리포트 전송`}
                </Button>
                <Button onClick={handleExportObsidian} aria-label="Obsidian 노트로 내보내기" variant="secondary" size="lg" fullWidth>
                  <BookOpen size={15} />{`${isReportToday ? '오늘의' : reportDateStr} 옵시디언 노트 저장`}
                </Button>
              </>
            )}
            {sendResult === 'success' && <Notice tone="success">이미지 포함 전송 완료!</Notice>}
            {sendResult === 'success-noimage' && <Notice tone="warning">텍스트만 전송됨</Notice>}
            {sendResult === 'error' && <Notice tone="danger">전송 실패. URL을 확인해주세요.</Notice>}
          </div>
        </SectionCard>
      </section>

      <section>
        <SectionCard title="데이터 내보내기" subtitle="형식에 따라 동일한 버튼 규칙과 카드 구조를 사용합니다.">
        <div className="grid grid-cols-3 gap-2">
          <button onClick={handleExportJSON} aria-label="JSON으로 내보내기" className="card flex flex-col items-center justify-center gap-1.5 py-3.5 text-[13px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
            <Download size={17} className="text-text-tertiary" /><span>JSON</span>
          </button>
          <button onClick={handleExportCSV} aria-label="CSV로 내보내기" className="card flex flex-col items-center justify-center gap-1.5 py-3.5 text-[13px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
            <Download size={17} className="text-text-tertiary" /><span>CSV</span>
          </button>
          <button onClick={handleExportMarkdown} aria-label="Markdown으로 내보내기" className="card flex flex-col items-center justify-center gap-1.5 py-3.5 text-[13px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
            <FileText size={17} className="text-text-tertiary" /><span>MD</span>
          </button>
        </div>
        </SectionCard>
      </section>

      {showForm && <RoutineForm routine={editingRoutine} onClose={() => { setShowForm(false); setEditingRoutine(undefined); }} />}
      {confirmTarget && confirmTarget.type === 'routine' && (
        <ConfirmDialog title="루틴 삭제" message={`"${confirmTarget.routine.name}" 루틴을 삭제하시겠습니까?`} confirmLabel="삭제" variant="danger" onConfirm={() => { deleteRoutine(confirmTarget.routine.id); setConfirmTarget(null); }} onCancel={() => setConfirmTarget(null)} />
      )}
      {confirmTarget && confirmTarget.type === 'logout' && (
        <ConfirmDialog title="로그아웃" message="로그아웃 하시겠습니까?" confirmLabel="로그아웃" variant="default" onConfirm={async () => { setConfirmTarget(null); await logout(); }} onCancel={() => setConfirmTarget(null)} />
      )}
    </Screen>
  );
}
