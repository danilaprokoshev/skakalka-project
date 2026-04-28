import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/ui/AuthProvider';

export function AppLayout() {
  const { user, logout } = useAuth();

  const tabs = [
    { to: '/', label: 'Главная', icon: '\u25C9' },
    { to: '/workouts', label: 'Тренировки', icon: '\u26A1' },
    { to: '/settings', label: 'Настройки', icon: '\u2699' },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="topbar-brand">Sage Studio</span>
        <div className="topbar-right">
          <span className="topbar-user">{user?.email}</span>
          <button className="btn-logout" onClick={logout}>Выйти</button>
        </div>
      </header>

      <nav className="desktop-tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `tab-link${isActive ? ' active' : ''}`
            }
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <main className="content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="nav-icon">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
