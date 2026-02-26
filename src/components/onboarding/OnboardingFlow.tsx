// ========================================
// 온보딩 플로우
// 가정 생성/참여 → 카테고리 선택 → 결정 설정
// ========================================

import { useState } from 'react';
import { useAppStore } from '../../stores/householdStore';
import { categoryTemplates } from '../../data/templates';
import type { Decision } from '../../types';
import CategorySetup from '../setup/CategorySetup';
import DecisionSetup from '../setup/DecisionSetup';

// 구성원 이모지 선택지
const MEMBER_EMOJIS = ['🧑', '👩', '👨', '🙋‍♂️', '🙋‍♀️', '🦸‍♂️', '🦸‍♀️', '🐻', '🐰'];

export default function OnboardingFlow() {
  const step = useAppStore((s) => s.onboardingStep);
  const setStep = useAppStore((s) => s.setOnboardingStep);
  const createHousehold = useAppStore((s) => s.createHousehold);
  const joinHousehold = useAppStore((s) => s.joinHousehold);
  const addCategory = useAppStore((s) => s.addCategory);
  const addDecision = useAppStore((s) => s.addDecision);
  const household = useAppStore((s) => s.household);

  // 가정 생성 폼
  const [householdName, setHouseholdName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberEmoji, setMemberEmoji] = useState('🧑');
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 카테고리 선택 (어떤 카테고리를 설정할지)
  const [selectedCategories, setSelectedCategories] = useState<number[]>([0, 1, 2, 3]);
  // 현재 설정 중인 카테고리 인덱스
  const [setupIndex, setSetupIndex] = useState(0);

  // ── Step 1: 가정 생성 or 참여 선택 ──
  if (step === 'create-or-join') {
    return (
      <div className="min-h-dvh bg-surface flex flex-col items-center justify-center px-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏠</div>
          <h1 className="text-xl font-bold text-text-primary">우리 가정 만들기</h1>
          <p className="text-text-secondary text-sm mt-2">
            부부가 함께 사용할 공간을 만들어주세요
          </p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => setStep('create-household')}
            className="w-full py-4 px-5 rounded-xl bg-primary-600 text-white font-semibold text-[15px] hover:bg-primary-700 active:scale-[0.98] transition-all"
          >
            새 가정 만들기
          </button>
          <button
            onClick={() => setStep('join-household')}
            className="w-full py-4 px-5 rounded-xl bg-white dark:bg-surface-secondary border border-border text-text-primary font-semibold text-[15px] hover:bg-surface-tertiary active:scale-[0.98] transition-all"
          >
            초대 코드로 참여하기
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2a: 가정 생성 ──
  if (step === 'create-household') {
    const handleCreate = async () => {
      if (!householdName.trim() || !memberName.trim()) {
        setError('모든 항목을 입력해주세요');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const code = await createHousehold(householdName.trim(), memberName.trim(), memberEmoji);
        setInviteCode(code);
        // step은 createHousehold 내에서 select-categories로 변경됨
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '생성에 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-dvh bg-surface flex flex-col px-6 pt-safe-top">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <button onClick={() => setStep('create-or-join')} className="text-primary-600 text-sm font-medium mb-6 self-start">
            ← 뒤로
          </button>
          <h1 className="text-xl font-bold text-text-primary mb-6">가정 만들기</h1>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">가정 이름</label>
              <input
                type="text"
                placeholder="예: 김수동 가정"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary text-[15px] outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">내 이름 (닉네임)</label>
              <input
                type="text"
                placeholder="예: 수동"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary text-[15px] outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">내 아이콘</label>
              <div className="flex gap-2 flex-wrap">
                {MEMBER_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setMemberEmoji(emoji)}
                    className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                      memberEmoji === emoji
                        ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500 scale-110'
                        : 'bg-surface-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-[15px] hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {loading ? '만드는 중...' : '가정 만들기'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2b: 초대 코드로 참여 ──
  if (step === 'join-household') {
    const handleJoin = async () => {
      if (!joinCode.trim() || !memberName.trim()) {
        setError('모든 항목을 입력해주세요');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const success = await joinHousehold(joinCode.trim(), memberName.trim(), memberEmoji);
        if (!success) {
          setError('초대 코드가 잘못되었거나 이미 가정이 꽉 찼습니다');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '참여에 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-dvh bg-surface flex flex-col px-6 pt-safe-top">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <button onClick={() => setStep('create-or-join')} className="text-primary-600 text-sm font-medium mb-6 self-start">
            ← 뒤로
          </button>
          <h1 className="text-xl font-bold text-text-primary mb-2">초대 코드로 참여</h1>
          <p className="text-text-secondary text-sm mb-6">배우자가 공유한 초대 코드를 입력해주세요</p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">초대 코드</label>
              <input
                type="text"
                placeholder="6자리 코드 입력"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary text-[15px] outline-none focus:ring-2 focus:ring-primary-400 text-center tracking-[0.3em] font-mono text-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">내 이름 (닉네임)</label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="예: 지영"
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary text-[15px] outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">내 아이콘</label>
              <div className="flex gap-2 flex-wrap">
                {MEMBER_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setMemberEmoji(emoji)}
                    className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                      memberEmoji === emoji
                        ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500 scale-110'
                        : 'bg-surface-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-[15px] hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {loading ? '참여 중...' : '참여하기'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: 카테고리 선택 ──
  if (step === 'select-categories') {
    // 초대 코드 표시 (방금 생성한 경우)
    const showInviteCode = inviteCode && household?.members.length === 1;

    const handleContinue = () => {
      // 선택한 카테고리들을 가정에 추가
      for (const idx of selectedCategories) {
        const tmpl = categoryTemplates[idx];
        addCategory({
          name: tmpl.category.name,
          icon: tmpl.category.icon,
          description: tmpl.category.description,
          isDefault: tmpl.category.isDefault,
          order: tmpl.category.order,
          isSetup: false,
        });
      }
      setSetupIndex(0);
      setStep('setup-decisions');
    };

    const toggleCategory = (idx: number) => {
      setSelectedCategories((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      );
    };

    return (
      <div className="min-h-dvh bg-surface flex flex-col px-6 py-8">
        <div className="max-w-sm mx-auto w-full">
          {/* 초대 코드 안내 */}
          {showInviteCode && (
            <div className="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-4 mb-6 text-center">
              <p className="text-sm text-text-secondary mb-1">배우자에게 이 코드를 공유해주세요</p>
              <p className="text-2xl font-bold text-primary-600 tracking-[0.2em] font-mono">{inviteCode}</p>
              <button
                onClick={() => navigator.clipboard.writeText(inviteCode)}
                className="text-xs text-primary-600 mt-2 underline"
              >
                코드 복사하기
              </button>
            </div>
          )}

          <h1 className="text-xl font-bold text-text-primary mb-2">어떤 결정을 미리 정할까요?</h1>
          <p className="text-text-secondary text-sm mb-6">
            원하는 카테고리를 선택하세요. 나중에 추가하거나 변경할 수 있어요.
          </p>

          <CategorySetup
            templates={categoryTemplates}
            selected={selectedCategories}
            onToggle={toggleCategory}
          />

          <button
            onClick={handleContinue}
            disabled={selectedCategories.length === 0}
            className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-[15px] hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
          >
            {selectedCategories.length}개 카테고리로 시작하기
          </button>
        </div>
      </div>
    );
  }

  // ── Step 4: 카테고리별 결정 설정 (Q&A) ──
  if (step === 'setup-decisions') {
    const categoriesToSetup = selectedCategories.map((idx) => categoryTemplates[idx]);
    const current = categoriesToSetup[setupIndex];

    if (!current || !household) {
      // 모든 카테고리 설정 완료
      setStep('done');
      return null;
    }

    // 현재 카테고리에 해당하는 household category 찾기
    const householdCategory = household.categories.find((c) => c.name === current.category.name);

    const handleDecisionsComplete = (decisions: Omit<Decision, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>[]) => {
      // 결정들을 저장
      for (const d of decisions) {
        addDecision(d);
      }
      // 카테고리를 설정 완료로 표시
      if (householdCategory) {
        useAppStore.getState().updateCategory(householdCategory.id, { isSetup: true });
      }
      // 다음 카테고리로
      if (setupIndex < categoriesToSetup.length - 1) {
        setSetupIndex(setupIndex + 1);
      } else {
        setStep('done');
      }
    };

    const handleSkip = () => {
      if (setupIndex < categoriesToSetup.length - 1) {
        setSetupIndex(setupIndex + 1);
      } else {
        setStep('done');
      }
    };

    return (
      <DecisionSetup
        template={current}
        categoryId={householdCategory?.id ?? ''}
        members={household.members}
        currentStep={setupIndex + 1}
        totalSteps={categoriesToSetup.length}
        onComplete={handleDecisionsComplete}
        onSkip={handleSkip}
      />
    );
  }

  return null;
}
