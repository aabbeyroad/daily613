import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, Input, Notice, Screen, SegmentedControl } from '../ui/primitives';

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
    <div className="min-h-dvh flex items-center justify-center px-4 py-10" style={{ background: 'var(--ds-bg)' }}>
      <Screen className="max-w-[460px]">
        <div className="text-center px-4">
          <div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px]"
            style={{ background: 'linear-gradient(180deg, var(--ds-accent), rgba(109, 133, 201, 0.88))', boxShadow: 'var(--ds-shadow-md)' }}
          >
            <span className="text-2xl font-bold tracking-tight text-white">613</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>데일리613</h1>
          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
            맞벌이 육아인의 하루를 더 조용하고 명확하게 정리하는 루틴 컴패니언
          </p>
        </div>

        <Card className="p-5 sm:p-6">
          <div className="mb-6">
            <SegmentedControl
              value={isLogin ? 'login' : 'signup'}
              onChange={(value) => {
                setIsLogin(value === 'login');
                setError('');
              }}
              options={[
                { value: 'login', label: '로그인' },
                { value: 'signup', label: '회원가입' },
              ]}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="이름"
                type="text"
                placeholder="홍길동"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}

            <Input
              label="이메일"
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <label className="field">
              <span className="field__label">비밀번호</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="6자 이상"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1"
                  style={{ color: 'var(--ds-text-tertiary)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <Button type="submit" disabled={loading} variant="primary" size="lg" fullWidth>
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {isLogin ? '로그인' : '가입하기'}
            </Button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1" style={{ background: 'var(--ds-border)' }} />
            <span className="text-xs" style={{ color: 'var(--ds-text-tertiary)' }}>또는</span>
            <div className="h-px flex-1" style={{ background: 'var(--ds-border)' }} />
          </div>

          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            variant="secondary"
            size="lg"
            fullWidth
            className="justify-center gap-3"
          >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google로 계속하기
          </Button>
        </Card>

        <p className="mt-2 text-center text-[13px]" style={{ color: 'var(--ds-text-tertiary)' }}>
          Daily613으로 매일의 루틴을 기록하세요
        </p>
      </Screen>
    </div>
  );
}
