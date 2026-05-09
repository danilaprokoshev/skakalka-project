import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/ui/AuthProvider';
import { useProfileStore } from '../features/profile/model/store';

export function AppLayout() {
  const { user, logout } = useAuth();
  const profile = useProfileStore((s) => s.profile);

  const tabs = [
    { to: '/', label: 'Главная', icon: '\u25C9' },
    { to: '/workouts', label: 'Тренировки', icon: '\u26A1' },
    { to: '/settings', label: 'Настройки', icon: '\u2699' },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="topbar-brand">Puls</span>
        <div className="topbar-right">
          <span className="topbar-user">{profile?.firstName || user?.email}</span>
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
