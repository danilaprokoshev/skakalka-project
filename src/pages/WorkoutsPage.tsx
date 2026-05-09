import { useState, useEffect, useCallback } from 'react';
import { useWorkoutStore } from '../features/workouts/model/store';
import { useAuth } from '../features/auth/ui/AuthProvider';
import { Workout, WorkoutDifficulty } from '../features/workouts/model/types';
import { Link } from 'react-router-dom';

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

const DIFFICULTY_FILTERS: { value: WorkoutDifficulty | ''; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'beginner', label: 'Начинающий' },
  { value: 'intermediate', label: 'Средний' },
  { value: 'advanced', label: 'Продвинутый' },
];

export function WorkoutsPage() {
  const { user } = useAuth();
  const trainerProfile = useWorkoutStore((s) => s.trainerProfile);
  const workouts = useWorkoutStore((s) => s.workouts);
  const publicWorkouts = useWorkoutStore((s) => s.publicWorkouts);
  const loadPublicWorkouts = useWorkoutStore((s) => s.loadPublicWorkouts);
  const createWorkout = useWorkoutStore((s) => s.createWorkout);
  const updateWorkout = useWorkoutStore((s) => s.updateWorkout);
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);
  const toggleWorkoutPublished = useWorkoutStore((s) => s.toggleWorkoutPublished);

  const isTrainer = trainerProfile?.isTrainer === true;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<WorkoutDifficulty | ''>('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    durationMinutes: '',
    difficulty: '' as WorkoutDifficulty | '',
    isPublished: true,
  });

  useEffect(() => {
    if (!user?.id) return;
    if (!isTrainer) {
      loadPublicWorkouts();
    }
  }, [isTrainer, user?.id, loadPublicWorkouts]);

  const resetForm = useCallback(() => {
    setForm({
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      durationMinutes: '',
      difficulty: '',
      isPublished: true,
    });
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleEdit = (w: Workout) => {
    setForm({
      title: w.title,
      description: w.description ?? '',
      videoUrl: w.videoUrl,
      thumbnailUrl: w.thumbnailUrl ?? '',
      durationMinutes: w.durationMinutes?.toString() ?? '',
      difficulty: w.difficulty ?? '',
      isPublished: w.isPublished,
    });
    setEditingId(w.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!user || !form.title.trim() || !form.videoUrl.trim()) return;

    const payload = {
      title: form.title.trim(),
      description: form.description || undefined,
      videoUrl: form.videoUrl.trim(),
      thumbnailUrl: form.thumbnailUrl || undefined,
      durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes, 10) : undefined,
      difficulty: (form.difficulty || undefined) as WorkoutDifficulty | undefined,
      isPublished: form.isPublished,
    };

    if (editingId) {
      await updateWorkout(editingId, payload);
    } else {
      await createWorkout({
        trainerId: user.id,
        ...payload,
        videoUrl: form.videoUrl.trim(),
      });
    }

    resetForm();
  };

  const displayedWorkouts = isTrainer ? workouts : publicWorkouts;

  const filtered = difficultyFilter
    ? displayedWorkouts.filter((w) => w.difficulty === difficultyFilter)
    : displayedWorkouts;

  if (isTrainer) {
    return (
      <div className="stack-lg">
        <div className="section-header">
          <h2>Управление тренировками</h2>
          {!showForm && (
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
              + Добавить
            </button>
          )}
        </div>

        {showForm && (
          <WorkoutForm
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isEditing={!!editingId}
          />
        )}

        {workouts.length === 0 && !showForm ? (
          <div className="empty-state">
            <div className="empty-icon">⚡</div>
            <h3 className="empty-title">Нет тренировок</h3>
            <p className="empty-text">
              Добавь первую тренировку для своих клиентов
            </p>
          </div>
        ) : (
          <div className="workout-grid">
            {workouts.map((w) => (
              <Link
                key={w.id}
                to={`/workouts/${w.id}`}
                className={`workout-card-placeholder ${!w.isPublished ? 'workout-unpublished' : ''}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div className="workout-thumb-placeholder">
                  {w.thumbnailUrl ? (
                    <img src={w.thumbnailUrl} alt={w.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>▶</span>
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <h4 style={{ fontSize: 14, marginBottom: 4, color: 'var(--text-primary)' }}>{w.title}</h4>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {w.difficulty && (
                      <span className={`pill ${DIFFICULTY_CLASSES[w.difficulty]}`}>
                        {DIFFICULTY_LABELS[w.difficulty]}
                      </span>
                    )}
                    {w.durationMinutes && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {w.durationMinutes} мин
                      </span>
                    )}
                    {!w.isPublished && (
                      <span style={{ fontSize: 11, color: 'var(--danger)', background: 'rgba(168,122,122,0.15)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                        Черновик
                      </span>
                    )}
                  </div>
                  <div className="button-row" style={{ gap: 4 }}>
                    <button
                      className="btn btn-ghost"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(w); }}
                      style={{ fontSize: 12, padding: '4px 10px' }}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWorkoutPublished(w.id); }}
                      style={{ fontSize: 12, padding: '4px 10px' }}
                    >
                      {w.isPublished ? '👁' : '📢'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm(`Удалить «${w.title}»?`)) deleteWorkout(w.id);
                      }}
                      style={{ fontSize: 12, padding: '4px 10px', color: 'var(--danger)' }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <div className="section-header">
        <h2>Тренировки</h2>
      </div>

      {publicWorkouts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚡</div>
          <h3 className="empty-title">Скоро здесь будут тренировки</h3>
          <p className="empty-text">
            Видео-тренировки с твоим тренером появятся здесь.
            Следи за анонсами!
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {DIFFICULTY_FILTERS.map((f) => (
              <button
                key={f.value}
                className={`btn ${difficultyFilter === f.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDifficultyFilter(f.value)}
                style={{ padding: '6px 14px', fontSize: 13 }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="workout-grid">
            {filtered.map((w) => (
              <Link
                key={w.id}
                to={`/workouts/${w.id}`}
                className="workout-card-placeholder"
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div className="workout-thumb-placeholder">
                  {w.thumbnailUrl ? (
                    <img src={w.thumbnailUrl} alt={w.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>▶</span>
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <h4 style={{ fontSize: 14, marginBottom: 4, color: 'var(--text-primary)' }}>{w.title}</h4>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {w.difficulty && (
                      <span className={`pill ${DIFFICULTY_CLASSES[w.difficulty]}`}>
                        {DIFFICULTY_LABELS[w.difficulty]}
                      </span>
                    )}
                    {w.durationMinutes && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {w.durationMinutes} мин
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface WorkoutFormProps {
  form: {
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    durationMinutes: string;
    difficulty: WorkoutDifficulty | '';
    isPublished: boolean;
  };
  onChange: (form: WorkoutFormProps['form']) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

function WorkoutForm({ form, onChange, onSubmit, onCancel, isEditing }: WorkoutFormProps) {
  return (
    <div className="card" style={{ marginBottom: 'var(--gap-stack)' }}>
      <div className="form-group">
        <label className="form-label">Название</label>
        <input
          className="form-input"
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="Название тренировки"
          maxLength={200}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Описание</label>
        <textarea
          className="form-input"
          rows={2}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Опишите тренировку..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Ссылка на видео</label>
        <input
          className="form-input"
          value={form.videoUrl}
          onChange={(e) => onChange({ ...form, videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=... или https://vimeo.com/..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Обложка (URL)</label>
        <input
          className="form-input"
          value={form.thumbnailUrl}
          onChange={(e) => onChange({ ...form, thumbnailUrl: e.target.value })}
          placeholder="https://example.com/thumb.jpg"
        />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
          <label className="form-label">Длительность (мин)</label>
          <input
            className="form-input"
            type="number"
            value={form.durationMinutes}
            onChange={(e) => onChange({ ...form, durationMinutes: e.target.value })}
            placeholder="30"
            min={1}
          />
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
          <label className="form-label">Сложность</label>
          <select
            className="form-input"
            value={form.difficulty}
            onChange={(e) => onChange({ ...form, difficulty: e.target.value as WorkoutDifficulty | '' })}
          >
            <option value="">Не указана</option>
            <option value="beginner">Начинающий</option>
            <option value="intermediate">Средний</option>
            <option value="advanced">Продвинутый</option>
          </select>
        </div>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          cursor: 'pointer',
        }}
      >
        <div className="toggle">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => onChange({ ...form, isPublished: e.target.checked })}
          />
          <span className="toggle-slider" />
        </div>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Опубликовать</span>
      </label>

      <div className="button-row">
        <button className="btn btn-primary" onClick={onSubmit}>
          {isEditing ? 'Сохранить' : 'Создать'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}
