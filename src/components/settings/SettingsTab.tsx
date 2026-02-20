import { useState } from 'react';
import { Plus, Edit3, Trash2, Moon, Sun, Download, Send, Tag, ChevronRight, User, FileText, LogOut, Palette, Check } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import type { ColorTheme } from '../../types';
import { exportJSON, exportCSV, exportMarkdown } from '../../utils/export';
import { sendDiscordReport } from '../../utils/discord';
import { formatDate } from '../../utils/date';
import RoutineForm from './RoutineForm';
import KeywordManager from './KeywordManager';
import ConfirmDialog from '../common/ConfirmDialog';
import type { Routine } from '../../types';

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

  const handleEdit = (routine: Routine) => { setEditingRoutine(routine); setShowForm(true); };
  const handleDelete = (routine: Routine) => { setConfirmTarget({ type: 'routine', routine }); };

  const handleExportJSON = () => {
    exportJSON({ routines, records, reflections });
  };
  const handleExportCSV = () => {
    exportCSV(routines, records, reflections);
  };
  const handleExportMarkdown = () => {
    exportMarkdown({ routines, records, reflections });
  };

  const handleSaveWebhook = () => { updateSettings({ discordWebhookUrl: webhookUrl.trim(), username: username.trim() }); };

  const handleSendReport = async () => {
    if (!settings.discordWebhookUrl) return;
    setSending(true); setSendResult(null);
    const today = formatDate(new Date());
    const record = records.find((r) => r.date === today);
    const reflection = reflections.find((r) => r.date === today && r.type === 'daily');
    const result = await sendDiscordReport(settings.discordWebhookUrl, {
      date: today,
      routines,
      checks: record?.checks || {},
      reflection,
      username: settings.username || user?.displayName || '',
      records, // 월간 통계용
    });
    if (result.ok) {
      setSendResult(result.hasImage ? 'success' : 'success-noimage');
    } else {
      setSendResult('error');
    }
    setSending(false);
    setTimeout(() => setSendResult(null), 3000);
  };

  const handleLogout = () => { setConfirmTarget({ type: 'logout' }); };

  const activeRoutines = routines.filter((r) => !r.archived).sort((a, b) => a.order - b.order);

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold text-text-primary mb-6">설정</h1>

      {/* 사용자 정보 */}
      <section className="mb-6">
        <div className="p-4 rounded-xl bg-surface-secondary border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-lg">
              {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-text-primary">{user?.displayName || '사용자'}</div>
              <div className="text-sm text-text-tertiary">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              aria-label="로그아웃"
              className="p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">루틴 관리</h2>
          <button onClick={() => { setEditingRoutine(undefined); setShowForm(true); }} aria-label="루틴 추가" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium active:scale-95 transition-all"><Plus size={16} />추가</button>
        </div>
        {activeRoutines.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary">루틴을 추가해보세요</div>
        ) : (
          <div className="space-y-2">
            {activeRoutines.map((routine) => (
              <div key={routine.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border">
                <div>
                  <div className="font-medium text-text-primary">{routine.name}</div>
                  <div className="text-xs text-text-tertiary mt-0.5"><span className="text-done">Done: {routine.doneGoal}</span>{' / '}<span className="text-more">More: {routine.moreGoal}</span>{' / '}<span className="text-max">Max: {routine.maxGoal}</span></div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(routine)} aria-label={`${routine.name} 수정`} className="p-2.5 rounded-lg hover:bg-surface-tertiary transition-colors"><Edit3 size={16} className="text-text-secondary" /></button>
                  <button onClick={() => handleDelete(routine)} aria-label={`${routine.name} 삭제`} className="p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={16} className="text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="mb-6">
        <button onClick={() => setShowKeywords(!showKeywords)} aria-label="키워드 관리 열기/닫기" aria-expanded={showKeywords} className="flex items-center justify-between w-full mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Tag size={18} />키워드 관리</h2>
          <ChevronRight size={18} className={`text-text-tertiary transition-transform ${showKeywords ? 'rotate-90' : ''}`} />
        </button>
        {showKeywords && <KeywordManager />}
      </section>
      <section className="mb-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary border border-border">
          <div className="flex items-center gap-3">{darkMode ? <Moon size={20} /> : <Sun size={20} />}<span className="font-medium">다크모드</span></div>
          <button
            onClick={toggleDarkMode}
            role="switch"
            aria-checked={darkMode}
            aria-label="다크모드 전환"
            className={`w-12 h-7 rounded-full transition-colors relative ${darkMode ? 'bg-primary-600' : 'bg-surface-tertiary'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </section>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Palette size={18} />색상 테마</h2>
        <div className="grid grid-cols-6 gap-2">
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
              <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center transition-all ${colorTheme === key ? 'ring-2 ring-offset-2 ring-offset-surface ring-text-primary scale-110' : 'opacity-60 hover:opacity-80'}`}>
                {colorTheme === key && <Check size={18} className="text-white" strokeWidth={3} />}
              </div>
              <span className={`text-[10px] ${colorTheme === key ? 'text-text-primary font-semibold' : 'text-text-tertiary'}`}>{label}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Discord 연동</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-secondary mb-1 flex items-center gap-1"><User size={14} />리포트 표시 이름</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="예: 홍길동" className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Webhook URL</label>
            <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={handleSaveWebhook} className="w-full py-2 rounded-lg bg-primary-600 text-white text-sm font-medium active:scale-95 transition-all">저장</button>
          {settings.discordWebhookUrl && (
            <button onClick={handleSendReport} disabled={sending} aria-label="Discord 리포트 전송" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#5865F2] text-white font-medium text-sm disabled:opacity-50 active:scale-[0.98] transition-all"><Send size={16} />{sending ? '전송 중...' : '오늘의 리포트 전송'}</button>
          )}
          {sendResult === 'success' && <p className="text-done text-sm text-center" role="status">이미지 포함 전송 완료!</p>}
          {sendResult === 'success-noimage' && <p className="text-yellow-500 text-sm text-center" role="status">텍스트만 전송됨 (이미지 생성 실패)</p>}
          {sendResult === 'error' && <p className="text-red-500 text-sm text-center" role="alert">전송 실패. URL을 확인해주세요.</p>}
        </div>
      </section>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">데이터 내보내기</h2>
        <p className="text-xs text-text-tertiary mb-3">루틴 기록과 회고를 날짜별로 정리하여 내보냅니다</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={handleExportJSON} aria-label="JSON으로 내보내기" className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl border border-border bg-surface-secondary text-text-primary font-medium text-sm active:scale-[0.98] transition-all">
            <Download size={18} />
            <span>JSON</span>
          </button>
          <button onClick={handleExportCSV} aria-label="CSV로 내보내기" className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl border border-border bg-surface-secondary text-text-primary font-medium text-sm active:scale-[0.98] transition-all">
            <Download size={18} />
            <span>CSV</span>
          </button>
          <button onClick={handleExportMarkdown} aria-label="Markdown으로 내보내기" className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl border border-border bg-surface-secondary text-text-primary font-medium text-sm active:scale-[0.98] transition-all">
            <FileText size={18} />
            <span>MD</span>
          </button>
        </div>
      </section>
      {showForm && <RoutineForm routine={editingRoutine} onClose={() => { setShowForm(false); setEditingRoutine(undefined); }} />}
      {confirmTarget && confirmTarget.type === 'routine' && (
        <ConfirmDialog
          title="루틴 삭제"
          message={`"${confirmTarget.routine.name}" 루틴을 삭제하시겠습니까?`}
          confirmLabel="삭제"
          variant="danger"
          onConfirm={() => { deleteRoutine(confirmTarget.routine.id); setConfirmTarget(null); }}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
      {confirmTarget && confirmTarget.type === 'logout' && (
        <ConfirmDialog
          title="로그아웃"
          message="로그아웃 하시겠습니까?"
          confirmLabel="로그아웃"
          variant="default"
          onConfirm={async () => { setConfirmTarget(null); await logout(); }}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}
