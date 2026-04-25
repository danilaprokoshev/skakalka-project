import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/ui/AuthProvider';

export const LoginPage = (): JSX.Element => {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="app-shell">
        <div className="card stack">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    }
  };

  return (
    <div className="app-shell">
      <div style={{ maxWidth: 400, margin: '4rem auto 0' }}>
        <header className="topbar">
          <h1>Трекер привычек</h1>
          <p>Войдите, чтобы продолжить</p>
        </header>

        <form className="card stack form" onSubmit={handleSubmit}>
          {error ? <div className="banner">{error}</div> : null}

          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>

          <button type="submit">Войти</button>

          <p style={{ textAlign: 'center', margin: 0 }}>
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </form>
      </div>
    </div>
  );
};
