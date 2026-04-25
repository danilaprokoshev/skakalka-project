import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Дашборд' },
  { to: '/habits', label: 'Привычки' },
  { to: '/calendar', label: 'Календарь' },
  { to: '/settings', label: 'Настройки' }
];

export const AppLayout = (): JSX.Element => {
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Трекер привычек</h1>
        <p>Стройте последовательность день за днём.</p>
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
