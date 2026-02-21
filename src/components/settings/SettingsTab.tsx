import { useState } from 'react';
import { Plus, Edit3, Trash2, Moon, Sun, Download, Send, Tag, ChevronRight, ChevronLeft, User, FileText, LogOut, Palette, Check, Calendar } from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import { useRoutineStore } from '../../stores/routineStore';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import type { ColorTheme, Routine } from '../../types';
import { exportJSON, exportCSV, exportMarkdown } from '../../utils/export';
import { sendDiscordReport } from '../../utils/discord';
import { formatDate, formatDisplayDate } from '../../utils/date';
import RoutineForm, { IconDisplay } from './RoutineForm';
import KeywordManager from './KeywordManager';
import ConfirmDialog from '../common/ConfirmDialog';

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
    const result = await sendDiscordReport(settings.discordWebhookUrl, {
      date: reportDateStr, routines, checks: record?.checks || {}, reflection,
      username: settings.username || user?.displayName || '', records,
    });
    if (result.ok) { setSendResult(result.hasImage ? 'success' : 'success-noimage'); }
    else { setSendResult('error'); }
    setSending(false);
    setTimeout(() => setSendResult(null), 3000);
  };

  const handleLogout = () => { setConfirmTarget({ type: 'logout' }); };
  const activeRoutines = routines.filter((r) => !r.archived).sort((a, b) => a.order - b.order);

  return (
    <div className="px-4 pt-5 pb-4">
      {/* 사용자 프로필 카드 */}
      <section className="mb-5">
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-lg">
              {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[15px] text-text-primary">{user?.displayName || '사용자'}</div>
              <div className="text-[13px] text-text-tertiary truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              aria-label="로그아웃"
              className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 루틴 관리 */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide">루틴 관리</h2>
          <button onClick={() => { setEditingRoutine(undefined); setShowForm(true); }} aria-label="루틴 추가" className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary-600 text-white text-[13px] font-semibold active:scale-95 transition-all shadow-sm shadow-primary-600/20"><Plus size={15} />추가</button>
        </div>
        {activeRoutines.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary text-[13px]">루틴을 추가해보세요</div>
        ) : (
          <div className="rounded-2xl bg-surface-secondary border border-border overflow-hidden divide-y divide-border">
            {activeRoutines.map((routine) => (
              <div key={routine.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {routine.icon && <IconDisplay icon={routine.icon} size={20} />}
                  <div className="min-w-0">
                    <div className="font-medium text-[15px] text-text-primary truncate">{routine.name}</div>
                    <div className="text-[11px] text-text-tertiary mt-0.5"><span className="text-done">D:{routine.doneGoal}</span>{' · '}<span className="text-more">M:{routine.moreGoal}</span>{' · '}<span className="text-max">X:{routine.maxGoal}</span></div>
                  </div>
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  <button onClick={() => handleEdit(routine)} aria-label={`${routine.name} 수정`} className="p-2.5 rounded-xl hover:bg-surface-tertiary transition-colors"><Edit3 size={15} className="text-text-tertiary" /></button>
                  <button onClick={() => handleDelete(routine)} aria-label={`${routine.name} 삭제`} className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={15} className="text-red-400" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 키워드 관리 */}
      <section className="mb-5">
        <button onClick={() => setShowKeywords(!showKeywords)} aria-label="키워드 관리 열기/닫기" aria-expanded={showKeywords} className="flex items-center justify-between w-full p-4 rounded-2xl bg-surface-secondary border border-border">
          <span className="flex items-center gap-2.5 font-medium text-[15px] text-text-primary"><Tag size={17} className="text-text-tertiary" />키워드 관리</span>
          <ChevronRight size={17} className={`text-text-tertiary transition-transform duration-200 ${showKeywords ? 'rotate-90' : ''}`} />
        </button>
        {showKeywords && <div className="mt-2"><KeywordManager /></div>}
      </section>

      {/* 외관 설정 */}
      <section className="mb-5">
        <h2 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide mb-3">외관</h2>
        <div className="rounded-2xl bg-surface-secondary border border-border overflow-hidden divide-y divide-border">
          {/* 다크모드 */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              {darkMode ? <Moon size={17} className="text-text-tertiary" /> : <Sun size={17} className="text-text-tertiary" />}
              <span className="font-medium text-[15px]">다크모드</span>
            </div>
            <button
              onClick={toggleDarkMode}
              role="switch"
              aria-checked={darkMode}
              aria-label="다크모드 전환"
              className={`w-[51px] h-[31px] rounded-full transition-colors relative ${darkMode ? 'bg-primary-600' : 'bg-surface-tertiary'}`}
            >
              <div className={`w-[27px] h-[27px] bg-white rounded-full absolute top-[2px] transition-transform shadow-sm ${darkMode ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
            </button>
          </div>
          {/* 색상 테마 */}
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-2.5 mb-3">
              <Palette size={17} className="text-text-tertiary" />
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
                  <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center transition-all ${colorTheme === key ? 'ring-2 ring-offset-2 ring-offset-surface-secondary ring-text-primary scale-110' : 'opacity-50 hover:opacity-75'}`}>
                    {colorTheme === key && <Check size={16} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-[9px] ${colorTheme === key ? 'text-text-primary font-bold' : 'text-text-tertiary'}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Discord */}
      <section className="mb-5">
        <h2 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide mb-3">Discord 연동</h2>
        <div className="rounded-2xl bg-surface-secondary border border-border p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-text-tertiary mb-1.5 ml-0.5 flex items-center gap-1"><User size={12} />표시 이름</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="예: 홍길동" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-[14px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-tertiary mb-1.5 ml-0.5">Webhook URL</label>
              <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-[14px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
            </div>
            <button onClick={handleSaveWebhook} className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-[13px] font-semibold active:scale-[0.98] transition-all shadow-sm shadow-primary-600/20">저장</button>
            {settings.discordWebhookUrl && (
              <>
                {/* 날짜 선택 */}
                <div className="pt-2 border-t border-border/50">
                  <label className="block text-[12px] font-medium text-text-tertiary mb-1.5 ml-0.5 flex items-center gap-1"><Calendar size={12} />리포트 날짜</label>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-1 py-1">
                    <button onClick={() => setReportDate((d) => subDays(d, 1))} aria-label="이전 날짜" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                      <ChevronLeft size={16} className="text-text-tertiary" />
                    </button>
                    <button onClick={() => setReportDate(new Date())} className={`text-[13px] font-medium transition-colors ${isReportToday ? 'text-text-primary' : 'text-primary-600'}`}>
                      {formatDisplayDate(reportDate)}
                    </button>
                    <button onClick={() => setReportDate((d) => addDays(d, 1))} aria-label="다음 날짜" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                      <ChevronRight size={16} className="text-text-tertiary" />
                    </button>
                  </div>
                </div>
                <button onClick={handleSendReport} disabled={sending} aria-label="Discord 리포트 전송" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#5865F2] text-white font-semibold text-[13px] disabled:opacity-50 active:scale-[0.98] transition-all">
                  <Send size={15} />{sending ? '전송 중...' : `${isReportToday ? '오늘의' : reportDateStr} 리포트 전송`}
                </button>
              </>
            )}
            {sendResult === 'success' && <p className="text-done text-[13px] text-center font-medium" role="status">이미지 포함 전송 완료!</p>}
            {sendResult === 'success-noimage' && <p className="text-yellow-500 text-[13px] text-center font-medium" role="status">텍스트만 전송됨</p>}
            {sendResult === 'error' && <p className="text-red-500 text-[13px] text-center font-medium" role="alert">전송 실패. URL을 확인해주세요.</p>}
          </div>
        </div>
      </section>

      {/* 데이터 내보내기 */}
      <section className="mb-5">
        <h2 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide mb-3">데이터 내보내기</h2>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={handleExportJSON} aria-label="JSON으로 내보내기" className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl border border-border bg-surface-secondary text-text-primary font-semibold text-[13px] active:scale-[0.98] transition-all">
            <Download size={17} className="text-text-tertiary" /><span>JSON</span>
          </button>
          <button onClick={handleExportCSV} aria-label="CSV로 내보내기" className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl border border-border bg-surface-secondary text-text-primary font-semibold text-[13px] active:scale-[0.98] transition-all">
            <Download size={17} className="text-text-tertiary" /><span>CSV</span>
          </button>
          <button onClick={handleExportMarkdown} aria-label="Markdown으로 내보내기" className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl border border-border bg-surface-secondary text-text-primary font-semibold text-[13px] active:scale-[0.98] transition-all">
            <FileText size={17} className="text-text-tertiary" /><span>MD</span>
          </button>
        </div>
      </section>

      {showForm && <RoutineForm routine={editingRoutine} onClose={() => { setShowForm(false); setEditingRoutine(undefined); }} />}
      {confirmTarget && confirmTarget.type === 'routine' && (
        <ConfirmDialog title="루틴 삭제" message={`"${confirmTarget.routine.name}" 루틴을 삭제하시겠습니까?`} confirmLabel="삭제" variant="danger" onConfirm={() => { deleteRoutine(confirmTarget.routine.id); setConfirmTarget(null); }} onCancel={() => setConfirmTarget(null)} />
      )}
      {confirmTarget && confirmTarget.type === 'logout' && (
        <ConfirmDialog title="로그아웃" message="로그아웃 하시겠습니까?" confirmLabel="로그아웃" variant="default" onConfirm={async () => { setConfirmTarget(null); await logout(); }} onCancel={() => setConfirmTarget(null)} />
      )}
    </div>
  );
}
