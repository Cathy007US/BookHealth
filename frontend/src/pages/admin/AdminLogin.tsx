import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api';
import { useI18n } from '../../i18n';
import LanguageToggle from '../../components/LanguageToggle';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return;
    setLoading(true);
    try {
      const res: any = await adminApi.login({ username, password });
      if (res.code === 0 && res.data?.token) {
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('adminUser', JSON.stringify(res.data.admin));
        navigate('/admin/exam-items');
      } else {
        alert(res.message || t('admin.loginFailed'));
      }
    } catch (err: any) {
      alert(err.message || t('admin.loginFailed'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-primary-500 to-primary-700 flex flex-col items-center justify-center px-6">
      <div className="absolute top-6 right-6">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-primary-600 mb-2">BookHealth</h1>
        <p className="text-center text-sm text-gray-400 mb-8">{t('admin.login')}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">{t('admin.username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
              placeholder="test01"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">{t('admin.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
              placeholder="******"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary-500 text-white rounded-lg py-3 text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? '...' : t('admin.loginBtn')}
          </button>
        </div>
        <div className="mt-6 text-center">
          <button onClick={() => navigate('/')} className="text-sm text-gray-400">
            {t('admin.backToSite')}
          </button>
        </div>
      </div>
    </div>
  );
}
