// ========================================
// 로그인 / 회원가입 페이지
// Firebase Auth 기반 이메일 + 구글 로그인
// ========================================

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthPage() {
  const { login, signup, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('이름을 입력해주세요'); setLoading(false); return; }
        await signup(email, password, name.trim());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setError('이메일 또는 비밀번호가 틀렸습니다');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('이미 사용 중인 이메일입니다');
      } else if (msg.includes('auth/weak-password')) {
        setError('비밀번호는 6자 이상이어야 합니다');
      } else if (msg.includes('auth/invalid-email')) {
        setError('올바른 이메일 형식이 아닙니다');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      if (err instanceof Error && !err.message.includes('popup-closed')) {
        setError('구글 로그인에 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-primary-50 to-white dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center px-6">
      {/* 로고 & 브랜딩 */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white text-xl font-bold">미리</span>
        </div>
        <h1 className="text-xl font-bold text-text-primary">미리정해</h1>
        <p className="text-text-secondary mt-1 text-sm">반복되는 결정을 미리 정해두세요</p>
      </div>

      {/* 로그인 폼 */}
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-border text-text-primary text-[15px] outline-none focus:ring-2 focus:ring-primary-400"
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-border text-text-primary text-[15px] outline-none focus:ring-2 focus:ring-primary-400"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-border text-text-primary text-[15px] outline-none focus:ring-2 focus:ring-primary-400"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {error && (
            <p className="text-red-500 text-sm px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-[15px] hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
          </button>
        </form>

        {/* 구분선 */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-tertiary text-xs">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* 구글 로그인 */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white dark:bg-slate-700 border border-border text-text-primary font-medium text-[15px] hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 계속하기
        </button>

        {/* 전환 */}
        <p className="text-center text-sm text-text-secondary mt-5">
          {isLogin ? '아직 계정이 없나요?' : '이미 계정이 있나요?'}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-primary-600 font-semibold ml-1"
          >
            {isLogin ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  );
}
