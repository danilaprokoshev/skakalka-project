import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/ui/AuthProvider';

const links = [
  { to: '/', label: 'Дашборд' },
  { to: '/habits', label: 'Привычки' },
  { to: '/calendar', label: 'Календарь' },
  { to: '/settings', label: 'Настройки' }
];

export const AppLayout = (): JSX.Element => {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Трекер привычек</h1>
            <p>Стройте последовательность день за днём.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{user?.email}</p>
            <button type="button" className="ghost" onClick={() => logout()}>
              Выйти
            </button>
          </div>
        </div>
      </header>
      <nav className="tabs">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};
