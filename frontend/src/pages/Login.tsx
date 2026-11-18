import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useStore } from '../store';
import { useI18n } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';
import Icon from '../components/Icon';

// 手机号：允许国际格式（+8613800138000 / 13800138000 / +14151234567）
const PHONE_RE = /^\+?\d{6,15}$/;

export default function Login() {
  const [mode, setMode] = useState<'password' | 'code'>('code');
  // 密码登录用 account（手机号或用户名），验证码登录用 phone
  const [account, setAccount] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugCode, setDebugCode] = useState('');
  const timerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const { setAuth } = useStore();
  const { t } = useI18n();

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const sendCode = async () => {
    const p = phone.trim();
    if (!PHONE_RE.test(p)) {
      setError(t('login.invalidPhone'));
      return;
    }
    setError('');
    try {
      const res: any = await authApi.sendCode(p);
      // 开发/测试环境后端会回传验证码，方便联调；生产环境不会返回
      setDebugCode(res?.data?.code || '');
      startCountdown();
    } catch (err: any) {
      setError(err?.message || t('login.sendFailed'));
    }
  };

  const handleLogin = async () => {
    if (loading) return;
    setError('');

    if (mode === 'password') {
      const acc = account.trim();
      if (!acc) {
        setError(t('login.accountRequired'));
        return;
      }
      if (password.length < 6) {
        setError(t('login.invalidPassword'));
        return;
      }
      setLoading(true);
      try {
        const res: any = await authApi.login({ account: acc, password });
        setAuth(res.data.token, res.data.user);
        navigate('/');
      } catch (err: any) {
        const status = err?.code ?? err?.status;
        let msg = err?.message || t('login.loginFailed');
        if (status === 404) msg = t('login.userNotFound');
        else if (status === 401) msg = t('login.wrongPassword');
        else if (status === 400) msg = t('login.invalidPassword');
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    const p = phone.trim();
    if (!PHONE_RE.test(p)) {
      setError(t('login.invalidPhone'));
      return;
    }
    if (code.trim().length !== 6) {
      setError(t('login.invalidCode'));
      return;
    }
    setLoading(true);
    try {
      const res: any = await authApi.loginByCode({ phone: p, code: code.trim() });
      setAuth(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      const status = err?.code ?? err?.status;
      let msg = err?.message || t('login.loginFailed');
      if (status === 400) msg = t('login.invalidCode');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-primary-500 to-primary-700 flex flex-col items-center justify-center px-6">
      <div className="absolute top-6 right-4">
        <LanguageToggle />
      </div>
      <div className="text-center mb-12">
        <div className="mb-3">
          <Icon name="tijianzhongxin" style={{ width: 48, height: 48, fill: '#ffffff' }} />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('app.name')}</h1>
        <p className="text-primary-100 mt-2">{t('app.tagline')}</p>
      </div>

      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
        <div className="flex gap-2 mb-6 border-b border-gray-100">
          <button
            className={`flex-1 py-2 text-sm font-medium ${mode === 'code' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400'}`}
            onClick={() => {
              setMode('code');
              setError('');
            }}
          >
            {t('login.codeMode')}
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${mode === 'password' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400'}`}
            onClick={() => {
              setMode('password');
              setError('');
            }}
          >
            {t('login.passwordMode')}
          </button>
        </div>

        <div className="space-y-4">
          {mode === 'password' ? (
            <div>
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={t('login.accountPlaceholder')}
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
          ) : (
            <div>
              <input
                type="text"
                inputMode="tel"
                placeholder={t('login.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
          )}

          {mode === 'password' ? (
            <div>
              <input
                type="password"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                placeholder={t('login.codePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                maxLength={6}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
              />
              <button
                onClick={sendCode}
                disabled={countdown > 0}
                className="px-4 py-3 text-sm text-primary-600 border border-primary-200 rounded-xl whitespace-nowrap disabled:text-gray-400 disabled:border-gray-200"
              >
                {countdown > 0 ? `${countdown}s` : t('login.sendCode')}
              </button>
            </div>
          )}

          {debugCode && mode === 'code' && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {t('login.debugCode')}: <span className="font-mono font-semibold">{debugCode}</span>
            </div>
          )}

          {error && <div className="text-xs text-red-500 px-1">{error}</div>}

          <button onClick={handleLogin} disabled={loading} className="w-full btn-primary">
            {loading ? t('login.loggingIn') : t('login.login')}
          </button>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            {t('login.passwordHint')}
          </p>
        </div>
      </div>
    </div>
  );
}
