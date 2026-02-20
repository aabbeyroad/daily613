import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthPage() {
  const { login, signup, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) {
          setError('이름을 입력해주세요');
          setLoading(false);
          return;
        }
        await signup(form.email, form.password, form.name);
      }
    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다');
      } else if (code === 'auth/invalid-email') {
        setError('올바른 이메일 형식이 아닙니다');
      } else if (code === 'auth/weak-password') {
        setError('비밀번호는 6자 이상이어야 합니다');
      } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다');
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // 사용자가 팝업을 닫음 - 에러 표시 안함
      } else {
        setError('Google 로그인에 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[22px] bg-primary-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-600/25">
            <span className="text-white font-bold text-2xl tracking-tight">613</span>
          </div>
          <h1 className="text-[28px] font-bold text-text-primary tracking-tight">데일리613</h1>
          <p className="text-text-tertiary text-[15px] mt-1.5 leading-relaxed">맞벌이 육아인의 주체적인 일상</p>
        </div>

        {/* Auth Toggle */}
        <div className="flex p-1 rounded-xl bg-surface-secondary mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              isLogin
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-tertiary'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              !isLogin
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-tertiary'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">이름</label>
              <input
                type="text"
                placeholder="홍길동"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface-secondary text-text-primary text-[15px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">이메일</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-secondary text-text-primary text-[15px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="6자 이상"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface-secondary text-text-primary text-[15px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center py-1" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-semibold text-[15px] disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 shadow-sm shadow-primary-600/20"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
            {isLogin ? '로그인' : '가입하기'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-7">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-tertiary text-xs">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3.5 rounded-xl border border-border bg-surface text-text-primary font-medium text-[15px] disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google로 계속하기
        </button>

        {/* Footer */}
        <p className="text-center mt-8 text-[13px] text-text-tertiary">
          Daily613으로 매일의 루틴을 기록하세요
        </p>
      </div>
    </div>
  );
}
