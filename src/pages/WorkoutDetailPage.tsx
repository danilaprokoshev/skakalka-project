import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useWorkoutStore } from '../features/workouts/model/store';
import { Workout, WorkoutDifficulty } from '../features/workouts/model/types';
import { parseVideoUrl } from '../features/workouts/model/video';
import { useHabitStore } from '../features/habits/model/store';

const DIFFICULTY_LABELS: Record<WorkoutDifficulty, string> = {
  beginner: 'Начинающий',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

const DIFFICULTY_CLASSES: Record<WorkoutDifficulty, string> = {
  beginner: 'pill-beginner',
  intermediate: 'pill-intermediate',
  advanced: 'pill-advanced',
};

export function WorkoutDetailPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const workouts = useWorkoutStore((s) => s.workouts);
  const publicWorkouts = useWorkoutStore((s) => s.publicWorkouts);
  const loadPublicWorkouts = useWorkoutStore((s) => s.loadPublicWorkouts);
  const [completed, setCompleted] = useState(false);
  const [directWorkout, setDirectWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);

  const workout = useMemo(() => {
    const stored = [...workouts, ...publicWorkouts].find((w) => w.id === workoutId);
    return stored ?? directWorkout;
  }, [workouts, publicWorkouts, workoutId, directWorkout]);

  const userId = useHabitStore((s) => s.userId);
  const isOwner = !!userId && workout?.trainerId === userId;

  useEffect(() => {
    if (!workoutId) return;
    const stored = [...workouts, ...publicWorkouts].find((w) => w.id === workoutId);
    if (stored) return;

    if (publicWorkouts.length === 0) {
      loadPublicWorkouts();
    }

    setLoading(true);
    supabase
      .from('workouts')
      .select('id, trainer_id, title, description, video_url, thumbnail_url, duration_minutes, difficulty, created_at, is_published')
      .eq('id', workoutId)
      .maybeSingle()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) return;
        const row = data as Record<string, unknown>;
        setDirectWorkout({
          id: row.id as string,
          trainerId: row.trainer_id as string,
          title: row.title as string,
          description: (row.description as string) ?? undefined,
          videoUrl: row.video_url as string,
          thumbnailUrl: (row.thumbnail_url as string) ?? undefined,
          durationMinutes: row.duration_minutes as number | undefined,
          difficulty: (row.difficulty as WorkoutDifficulty) ?? undefined,
          createdAt: row.created_at as string,
          isPublished: row.is_published as boolean,
        });
      });
  }, [workoutId, workouts, publicWorkouts, loadPublicWorkouts]);

  const videoInfo = useMemo(
    () => (workout ? parseVideoUrl(workout.videoUrl) : { type: 'unknown' as const }),
    [workout],
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-muted)' }}>
        Загрузка...
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚡</div>
        <h3 className="empty-title">Тренировка не найдена</h3>
        <Link to="/workouts" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
          ← Назад
        </Link>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <button
        className="btn btn-ghost"
        onClick={() => navigate('/workouts')}
        style={{ alignSelf: 'flex-start', padding: '8px 0' }}
      >
        ← Назад к тренировкам
      </button>

      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {videoInfo.type === 'youtube' || videoInfo.type === 'vimeo' || videoInfo.type === 'rutube' ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={videoInfo.embedUrl}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0,
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={workout.title}
            />
          </div>
        ) : videoInfo.type === 'mp4' ? (
          <video
            controls
            style={{ width: '100%', display: 'block' }}
            src={videoInfo.directUrl}
          />
        ) : (
          <div className="workout-thumb-placeholder" style={{ aspectRatio: '16/9' }}>
            <span>▶</span>
          </div>
        )}
      </div>

      <div>
        <h2 style={{ marginBottom: 8 }}>{workout.title}</h2>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {workout.difficulty && (
            <span className={`pill ${DIFFICULTY_CLASSES[workout.difficulty]}`}>
              {DIFFICULTY_LABELS[workout.difficulty]}
            </span>
          )}
          {workout.durationMinutes && (
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {workout.durationMinutes} мин
            </span>
          )}
        </div>

        {workout.description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {workout.description}
          </p>
        )}

        {!isOwner && (
          <button
            className={`btn ${completed ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setCompleted((prev) => !prev)}
            style={{ width: '100%' }}
          >
            {completed ? '✓ Выполнено' : 'Отметить как выполненную'}
          </button>
        )}
      </div>
    </div>
  );
}
