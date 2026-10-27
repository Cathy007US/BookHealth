import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useStore } from '../store';

export default function Login() {
  const [mode, setMode] = useState<'password' | 'code'>('code');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useStore();

  const sendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      alert('请输入正确的手机号');
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
      alert(err.message || '发送失败');
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
      alert(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-500 to-primary-700 flex flex-col items-center justify-center px-6">
      <div className="text-center mb-12">
        <div className="text-5xl mb-3">🏥</div>
        <h1 className="text-2xl font-bold text-white">BookHealth</h1>
        <p className="text-primary-100 mt-2">专业体检预约平台</p>
      </div>

      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
        <div className="flex gap-2 mb-6 border-b border-gray-100">
          <button
            className={`flex-1 py-2 text-sm font-medium ${mode === 'code' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400'}`}
            onClick={() => setMode('code')}
          >
            验证码登录
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${mode === 'password' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400'}`}
            onClick={() => setMode('password')}
          >
            密码登录
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
            />
          </div>

          {mode === 'password' ? (
            <div>
              <input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="验证码"
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
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </button>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
