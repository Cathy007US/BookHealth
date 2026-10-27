import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: '首页', icon: '🏠', path: '/' },
  { to: '/institutions', label: '机构', icon: '🏥', path: '/institutions' },
  { to: '/packages', label: '体检', icon: '📋', path: '/packages' },
  { to: '/orders', label: '预约', icon: '📅', path: '/orders' },
  { to: '/profile', label: '我的', icon: '👤', path: '/profile' },
];

export default function TabBar() {
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
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
