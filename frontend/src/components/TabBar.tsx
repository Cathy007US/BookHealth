import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n';
import Icon from './Icon';

const tabs = [
  { to: '/', labelKey: 'tab.home', icon: 'shouye', path: '/' },
  { to: '/institutions', labelKey: 'tab.institutions', icon: 'tijianzhongxin', path: '/institutions' },
  { to: '/orders', labelKey: 'tab.orders', icon: 'yuyuezhuanjia-', path: '/orders' },
  { to: '/profile', labelKey: 'tab.profile', icon: 'wodetijian1', path: '/profile' },
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
          <Icon name={tab.icon} className="nav-icon" />
          <span>{t(tab.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
