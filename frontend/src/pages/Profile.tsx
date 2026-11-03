import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useI18n } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useStore();
  const { t } = useI18n();

  const menu = [
    { label: t('profile.myOrders'), icon: '📅', path: '/orders' },
    { label: t('profile.myReports'), icon: '📄', path: '/reports' },
    { label: t('profile.examineeManage'), icon: '👥', path: '/examinees' },
    { label: t('profile.reportInterpret'), icon: '💬', path: '/consultations' },
    { label: t('profile.contactService'), icon: '📞', path: '' },
    { label: t('profile.aboutUs'), icon: 'ℹ️', path: '' },
  ];

  return (
    <div className="pb-16">
      <div className="bg-gradient-to-b from-primary-500 to-primary-600 px-4 pt-8 pb-12 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <LanguageToggle />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
            {user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full" /> : '👤'}
          </div>
          <div className="text-white">
            <div className="text-lg font-medium">{user?.nickname || t('profile.notLoggedIn')}</div>
            <div className="text-sm text-primary-100">{user?.phone || ''}</div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-sm">
          {menu.map((item, idx) => (
            <button
              key={idx}
              onClick={() => item.path && navigate(item.path)}
              className={`w-full flex items-center justify-between px-4 py-4 ${idx < menu.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <span className="text-gray-300">›</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full mt-4 py-3 text-sm text-red-500 bg-white rounded-xl shadow-sm"
        >
          {t('profile.logout')}
        </button>
      </div>
    </div>
  );
}
