import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useStore } from '../store';
import { useI18n } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';

export default function Login() {
  const [mode, setMode] = useState<'password' | 'code'>('code');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useStore();
  const { t } = useI18n();

  const sendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      alert(t('login.invalidPhone'));
      return;
    }
    try {
      await authApi.sendCode(phone);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err: any) {
      alert(err.message || t('login.sendFailed'));
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      let res: any;
      if (mode === 'password') {
        res = await authApi.login({ account: phone, password });
      } else {
        res = await authApi.loginByCode({ phone, code });
      }
      setAuth(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      alert(err.message || t('login.loginFailed'));
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
        <div className="text-5xl mb-3">🏥</div>
        <h1 className="text-2xl font-bold text-white">{t('app.name')}</h1>
        <p className="text-primary-100 mt-2">{t('app.tagline')}</p>
      </div>

      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
        <div className="flex gap-2 mb-6 border-b border-gray-100">
          <button
            className={`flex-1 py-2 text-sm font-medium ${mode === 'code' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400'}`}
            onClick={() => setMode('code')}
          >
            {t('login.codeMode')}
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${mode === 'password' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400'}`}
            onClick={() => setMode('password')}
          >
            {t('login.passwordMode')}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="tel"
              placeholder={t('login.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
            />
          </div>

          {mode === 'password' ? (
            <div>
              <input
                type="password"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                type="text"
                placeholder={t('login.codePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
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

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? t('login.loggingIn') : t('login.login')}
          </button>
        </div>
      </div>
    </div>
  );
}
