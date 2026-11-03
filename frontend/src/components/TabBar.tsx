import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n';

const tabs = [
  { to: '/', labelKey: 'tab.home', icon: '🏠', path: '/' },
  { to: '/institutions', labelKey: 'tab.institutions', icon: '🏥', path: '/institutions' },
  { to: '/packages', labelKey: 'tab.packages', icon: '📋', path: '/packages' },
  { to: '/orders', labelKey: 'tab.orders', icon: '📅', path: '/orders' },
  { to: '/profile', labelKey: 'tab.profile', icon: '👤', path: '/profile' },
];

export default function TabBar() {
  const { t } = useI18n();
  return (
    <nav className="nav-bar">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.to}
          end={tab.path === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span>{t(tab.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
