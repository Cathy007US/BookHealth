import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n';
import LanguageToggle from '../../components/LanguageToggle';
import Icon from '../../components/Icon';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useI18n();
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setAdminToken(token);
  }, []);

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminToken(null);
    navigate('/admin/login');
  };

  const menuItems = [
    { key: 'exam-items', label: t('admin.examItems'), path: '/admin/exam-items', iconClass: 'icon-tijianxiangmu' },
    { key: 'examinees', label: t('admin.examinees'), path: '/admin/examinees', iconClass: 'icon-tianjiarenyuan' },
  ];

  if (!adminToken) {
    navigate('/admin/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-primary-600">BookHealth</h1>
          <span className="text-xs text-gray-400">{t('admin.title')}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button onClick={() => navigate('/')} className="text-sm text-gray-500">
            {t('admin.backToSite')}
          </button>
          <button onClick={logout} className="text-sm text-red-400">{t('profile.logout')}</button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-48 bg-white border-r border-gray-200 min-h-[calc(100vh-3.5rem)]">
          <nav className="py-4">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-left ${
                  pathname === item.path
                    ? 'bg-primary-50 text-primary-600 font-medium border-r-2 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon name={item.iconClass} style={{ width: 16, height: 16, fill: pathname === item.path ? '#3a8e59' : '#6b7280' }} />
                <span>{t(item.label)}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
