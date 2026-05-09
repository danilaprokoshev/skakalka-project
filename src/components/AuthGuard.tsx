import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../features/auth/ui/AuthProvider';
import { useHabitStore } from '../features/habits/model/store';
import { useWorkoutStore } from '../features/workouts/model/store';
import { useProfileStore } from '../features/profile/model/store';

export const AuthGuard = (): JSX.Element => {
  const { user, loading } = useAuth();
  const loadUserData = useHabitStore((s) => s.loadUserData);
  const clearData = useHabitStore((s) => s.clearData);
  const storedUserId = useHabitStore((s) => s.userId);
  const habitError = useHabitStore((s) => s.loadError);

  const loadTrainerProfile = useWorkoutStore((s) => s.loadTrainerProfile);
  const loadWorkouts = useWorkoutStore((s) => s.loadWorkouts);
  const clearWorkouts = useWorkoutStore((s) => s.clearWorkouts);
  const workoutError = useWorkoutStore((s) => s.loadError);

  const loadProfile = useProfileStore((s) => s.loadProfile);
  const clearProfile = useProfileStore((s) => s.clearProfile);
  const profileError = useProfileStore((s) => s.loadError);

  useEffect(() => {
    if (user && user.id !== storedUserId) {
      loadUserData(user.id);
      loadTrainerProfile(user.id);
      loadWorkouts(user.id);
      loadProfile(user.id);
    }
    if (!user && storedUserId) {
      clearData();
      clearWorkouts();
      clearProfile();
    }
  }, [user, storedUserId, loadUserData, clearData, loadTrainerProfile, loadWorkouts, clearWorkouts, loadProfile, clearProfile]);

  const loadError = habitError || workoutError || profileError;

  if (loading) {
    return (
      <div className="auth-page">
        <p style={{ color: 'var(--text-muted)' }}>Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loadError) {
    return (
      <div className="auth-page">
        <div className="error-card">
          <p className="error-text">{loadError}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (user) {
                loadUserData(user.id);
                loadTrainerProfile(user.id);
                loadWorkouts(user.id);
                loadProfile(user.id);
              }
            }}
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
