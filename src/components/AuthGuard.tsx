import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../features/auth/ui/AuthProvider';
import { useHabitStore } from '../features/habits/model/store';

export const AuthGuard = (): JSX.Element => {
  const { user, loading } = useAuth();
  const loadUserData = useHabitStore((state) => state.loadUserData);
  const clearData = useHabitStore((state) => state.clearData);
  const storedUserId = useHabitStore((state) => state.userId);
  const loadError = useHabitStore((state) => state.loadError);

  useEffect(() => {
    if (user && user.id !== storedUserId) {
      loadUserData(user.id);
    }

    if (!user && storedUserId) {
      clearData();
    }
  }, [user, storedUserId, loadUserData, clearData]);

  if (loading) {
    return (
      <div className="app-shell">
        <div className="card stack">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loadError) {
    return (
      <div className="app-shell">
        <div className="card stack">
          <p>{loadError}</p>
          <button type="button" className="primary" onClick={() => loadUserData(user.id)}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
