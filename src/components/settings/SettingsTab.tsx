import { useState } from 'react';
import { Plus, Edit3, Trash2, Moon, Sun, Download, Send, Tag, ChevronRight, User, FileText } from 'lucide-react';
import { useRoutineStore } from '../../stores/routineStore';
import { useTheme } from '../../hooks/useTheme';
import { exportJSON, exportCSV, exportMarkdown } from '../../utils/export';
import { sendDiscordReport } from '../../utils/discord';
import { formatDate } from '../../utils/date';
import RoutineForm from './RoutineForm';
import KeywordManager from './KeywordManager';
import type { Routine } from '../../types';

export default function SettingsTab() {
  const routines = useRoutineStore((s) => s.routines);
  const records = useRoutineStore((s) => s.records);
  const reflections = useRoutineStore((s) => s.reflections);
  const settings = useRoutineStore((s) => s.settings);
  const updateSettings = useRoutineStore((s) => s.updateSettings);
  const deleteRoutine = useRoutineStore((s) => s.deleteRoutine);
  const { darkMode, toggleDarkMode } = useTheme();

  const [showForm, setShowForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>();
  const [showKeywords, setShowKeywords] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(settings.discordWebhookUrl);
  const [username, setUsername] = useState(settings.username);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null);

  const handleEdit = (routine: Routine) => { setEditingRoutine(routine); setShowForm(true); };
  const handleDelete = (routine: Routine) => { if (confirm(`"${routine.name}" 루틴을 삭제하시겠습니까?`)) deleteRoutine(routine.id); };
  
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
    const ok = await sendDiscordReport(settings.discordWebhookUrl, { 
      date: today, 
      routines, 
      checks: record?.checks || {}, 
      reflection,
      username: settings.username 
    });
    setSendResult(ok ? 'success' : 'error');
    setSending(false);
    setTimeout(() => setSendResult(null), 3000);
  };

  const activeRoutines = routines.filter((r) => !r.archived).sort((a, b) => a.order - b.order);

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold text-text-primary mb-6">설정</h1>
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">루틴 관리</h2>
          <button onClick={() => { setEditingRoutine(undefined); setShowForm(true); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium active:scale-95 transition-all"><Plus size={16} />추가</button>
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
                  <button onClick={() => handleEdit(routine)} className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors"><Edit3 size={16} className="text-text-secondary" /></button>
                  <button onClick={() => handleDelete(routine)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={16} className="text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="mb-6">
        <button onClick={() => setShowKeywords(!showKeywords)} className="flex items-center justify-between w-full mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Tag size={18} />키워드 관리</h2>
          <ChevronRight size={18} className={`text-text-tertiary transition-transform ${showKeywords ? 'rotate-90' : ''}`} />
        </button>
        {showKeywords && <KeywordManager />}
      </section>
      <section className="mb-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary border border-border">
          <div className="flex items-center gap-3">{darkMode ? <Moon size={20} /> : <Sun size={20} />}<span className="font-medium">다크모드</span></div>
          <button onClick={toggleDarkMode} className={`w-12 h-7 rounded-full transition-colors relative ${darkMode ? 'bg-primary-600' : 'bg-surface-tertiary'}`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </section>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Discord 연동</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-secondary mb-1 flex items-center gap-1"><User size={14} />사용자 이름</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="예: 홍길동" className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Webhook URL</label>
            <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={handleSaveWebhook} className="w-full py-2 rounded-lg bg-primary-600 text-white text-sm font-medium active:scale-95 transition-all">저장</button>
          {settings.discordWebhookUrl && (
            <button onClick={handleSendReport} disabled={sending} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#5865F2] text-white font-medium text-sm disabled:opacity-50 active:scale-[0.98] transition-all"><Send size={16} />{sending ? '전송 중...' : '오늘의 리포트 전송'}</button>
          )}
          {sendResult === 'success' && <p className="text-done text-sm text-center">전송 완료!</p>}
          {sendResult === 'error' && <p className="text-red-500 text-sm text-center">전송 실패. URL을 확인해주세요.</p>}
        </div>
      </section>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">데이터 내보내기</h2>
        <p className="text-xs text-text-tertiary mb-3">루틴 기록과 회고를 날짜별로 정리하여 내보냅니다</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={handleExportJSON} className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl border border-border bg-surface-secondary text-text-primary font-medium text-sm active:scale-[0.98] transition-all">
            <Download size={18} />
            <span>JSON</span>
          </button>
          <button onClick={handleExportCSV} className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl border border-border bg-surface-secondary text-text-primary font-medium text-sm active:scale-[0.98] transition-all">
            <Download size={18} />
            <span>CSV</span>
          </button>
          <button onClick={handleExportMarkdown} className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl border border-border bg-surface-secondary text-text-primary font-medium text-sm active:scale-[0.98] transition-all">
            <FileText size={18} />
            <span>MD</span>
          </button>
        </div>
      </section>
      {showForm && <RoutineForm routine={editingRoutine} onClose={() => { setShowForm(false); setEditingRoutine(undefined); }} />}
    </div>
  );
}
