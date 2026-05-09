import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { requestNotificationPermission, supportsNotifications } from '../features/reminders/lib/notifications';
import { useActiveHabits, useHabitStore } from '../features/habits/model/store';
import { useWorkoutStore } from '../features/workouts/model/store';
import { useAuth } from '../features/auth/ui/AuthProvider';
import { useProfileStore } from '../features/profile/model/store';
import { useTheme } from '../lib/theme';
import { usePwaInstall } from '../lib/pwa';

const TELEGRAM_URL = 'https://t.me/Wwork_on_yourself';

const weekdays = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 0, label: 'Вс' },
];

export const SettingsPage = (): JSX.Element => {
  const { user, logout } = useAuth();
  const activeHabits = useActiveHabits();
  const reminders = useHabitStore((s) => s.reminders);
  const upsertReminder = useHabitStore((s) => s.upsertReminder);

  const trainerProfile = useWorkoutStore((s) => s.trainerProfile);
  const upsertTrainerProfile = useWorkoutStore((s) => s.upsertTrainerProfile);
  const isTrainer = trainerProfile?.isTrainer === true;

  const [profileForm, setProfileForm] = useState({
    displayName: trainerProfile?.displayName ?? '',
    bio: trainerProfile?.bio ?? '',
    specialization: trainerProfile?.specialization ?? '',
    photoUrl: trainerProfile?.photoUrl ?? '',
  });
  const [profileExpanded, setProfileExpanded] = useState(false);

  const profile = useProfileStore((s) => s.profile);
  const upsertProfile = useProfileStore((s) => s.upsertProfile);

  const [userProfileForm, setUserProfileForm] = useState({
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    aboutMe: profile?.aboutMe ?? '',
    biggestGoal: profile?.biggestGoal ?? '',
  });
  const [userProfileEditing, setUserProfileEditing] = useState(false);
  const [profileNameError, setProfileNameError] = useState('');

  const syncUserProfileForm = () => {
    const p = useProfileStore.getState().profile;
    setUserProfileForm({
      firstName: p?.firstName ?? '',
      lastName: p?.lastName ?? '',
      aboutMe: p?.aboutMe ?? '',
      biggestGoal: p?.biggestGoal ?? '',
    });
    setProfileNameError('');
  };

  const handleSaveUserProfile = async () => {
    const firstName = userProfileForm.firstName.trim();
    if (!firstName) {
      setProfileNameError('Имя обязательно для заполнения');
      return;
    }
    if (!user) return;
    await upsertProfile({
      userId: user.id,
      firstName,
      lastName: userProfileForm.lastName.trim() || undefined,
      aboutMe: userProfileForm.aboutMe.trim() || undefined,
      biggestGoal: userProfileForm.biggestGoal.trim() || undefined,
    });
    setUserProfileEditing(false);
    setProfileNameError('');
  };

  const syncProfileForm = () => {
    const p = useWorkoutStore.getState().trainerProfile;
    setProfileForm({
      displayName: p?.displayName ?? '',
      bio: p?.bio ?? '',
      specialization: p?.specialization ?? '',
      photoUrl: p?.photoUrl ?? '',
    });
  };

  const exportAllData = useHabitStore((s) => s.exportAllData);
  const importAllData = useHabitStore((s) => s.importAllData);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, isStandalone, install } = usePwaInstall();

  const reminderMap = useMemo(
    () => new Map(reminders.map((r) => [r.habitId, r])),
    [reminders],
  );

  const handleSaveProfile = async () => {
    if (!user || !profileForm.displayName.trim()) return;
    await upsertTrainerProfile({
      userId: user.id,
      displayName: profileForm.displayName.trim(),
      bio: profileForm.bio || undefined,
      specialization: profileForm.specialization || undefined,
      photoUrl: profileForm.photoUrl || undefined,
      isTrainer: trainerProfile?.isTrainer ?? false,
    });
    setProfileExpanded(false);
  };

  return (
    <div className="stack-lg">
      <h2>Настройки</h2>

      {/* Profile */}
      <div className="settings-section">
        <h3 className="settings-section-title">Профиль</h3>

        {userProfileEditing || !profile ? (
          <div className="card">
            <div className="form-group">
              <label className="form-label">Имя *</label>
              <input
                className="form-input"
                value={userProfileForm.firstName}
                onChange={(e) => {
                  setUserProfileForm((p) => ({ ...p, firstName: e.target.value }));
                  if (profileNameError) setProfileNameError('');
                }}
                placeholder="Ваше имя"
                maxLength={100}
              />
              {profileNameError && (
                <span style={{ color: 'var(--danger)', fontSize: 12 }}>{profileNameError}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Фамилия</label>
              <input
                className="form-input"
                value={userProfileForm.lastName}
                onChange={(e) =>
                  setUserProfileForm((p) => ({ ...p, lastName: e.target.value }))
                }
                placeholder="Ваша фамилия"
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label className="form-label">О себе</label>
              <textarea
                className="form-input"
                rows={3}
                value={userProfileForm.aboutMe}
                onChange={(e) =>
                  setUserProfileForm((p) => ({ ...p, aboutMe: e.target.value }))
                }
                placeholder="Расскажите о себе..."
                maxLength={500}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Самая большая цель</label>
              <textarea
                className="form-input"
                rows={3}
                value={userProfileForm.biggestGoal}
                onChange={(e) =>
                  setUserProfileForm((p) => ({ ...p, biggestGoal: e.target.value }))
                }
                placeholder="Ваша главная цель..."
                maxLength={500}
              />
            </div>

            <div className="button-row">
              <button className="btn btn-primary" onClick={handleSaveUserProfile}>
                Сохранить
              </button>
              {profile && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    syncUserProfileForm();
                    setUserProfileEditing(false);
                  }}
                >
                  Отмена
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 16 }}>{profile.firstName} {profile.lastName}</strong>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  syncUserProfileForm();
                  setUserProfileEditing(true);
                }}
              >
                Редактировать
              </button>
            </div>
            {profile.aboutMe ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
                {profile.aboutMe}
              </p>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
                О себе не указано
              </p>
            )}
            {profile.biggestGoal ? (
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Цель:</span>
                <p style={{ fontSize: 14, marginTop: 2 }}>{profile.biggestGoal}</p>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Цель не указана
              </p>
            )}
          </div>
        )}
      </div>

      {/* Account */}
      <div className="settings-section">
        <h3 className="settings-section-title">Аккаунт</h3>

        <div className="card" style={{ marginBottom: 'var(--gap-stack)' }}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Email</label>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {user?.email ?? '—'}
            </div>
          </div>

          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span>Тема: {theme === 'dark' ? 'Тёмная' : 'Светлая'}</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={theme === 'light'}
                onChange={toggleTheme}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <p style={{ marginBottom: 12 }}>
            Браузерные уведомления:{' '}
            {supportsNotifications() ? 'Поддерживаются' : 'Не поддерживаются'}
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => requestNotificationPermission()}
          >
            Запросить разрешение
          </button>
          {isInstallable && (
            <button
              className="btn btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => install()}
            >
              Установить приложение
            </button>
          )}
          {isStandalone && (
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--primary)' }}>
              Приложение установлено ✓
            </p>
          )}
        </div>

        <div className="card" style={{ marginBottom: 'var(--gap-stack)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
            Сохраните все данные в JSON-файл или восстановите из резервной копии.
            При импорте текущие данные будут заменены.
          </p>

          {importError && <div className="auth-error">{importError}</div>}
          {importSuccess && <div className="banner">Данные успешно импортированы</div>}

          <div className="button-row">
            <button
              className="btn btn-primary"
              onClick={() => {
                const json = exportAllData();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sagestudio-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Экспорт JSON
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    setImportError('');
                    setImportSuccess(false);
                    await importAllData(text);
                    setImportSuccess(true);
                    setTimeout(() => setImportSuccess(false), 3000);
                  } catch (err: unknown) {
                    setImportError(err instanceof Error ? err.message : 'Ошибка импорта');
                  }
                };
                input.click();
              }}
            >
              Импорт JSON
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--gap-stack)' }}>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
          >
            Telegram-канал
          </a>
        </div>

        <button
          className="btn btn-secondary"
          onClick={logout}
          style={{ width: '100%' }}
        >
          Выйти из аккаунта
        </button>
      </div>

      {/* Reminders */}
      <div className="settings-section">
        <h3 className="settings-section-title">Напоминания</h3>

        {activeHabits.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>
            Сначала добавьте привычки, чтобы настроить напоминания.
          </p>
        )}

        {activeHabits.map((habit) => {
          const reminder = reminderMap.get(habit.id) ?? {
            habitId: habit.id,
            enabled: false,
            time: '09:00',
            daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
          };

          return (
            <div key={habit.id} className="reminder-card">
              <div className="reminder-header">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: habit.color,
                      display: 'inline-block',
                    }}
                  />
                  <span className="reminder-title">{habit.title}</span>
                </span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={reminder.enabled}
                    onChange={(e) =>
                      upsertReminder({ ...reminder, enabled: e.target.checked })
                    }
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {reminder.enabled && (
                <div className="stack-sm">
                  <div>
                    <label className="form-label">Время</label>
                    <input
                      type="time"
                      className="time-input"
                      value={reminder.time}
                      onChange={(e) =>
                        upsertReminder({ ...reminder, time: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <div className="form-label">Дни недели</div>
                    <div className="day-toggle-row">
                      {weekdays.map((day) => {
                        const active = reminder.daysOfWeek.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            className={`day-btn${active ? ' active' : ''}`}
                            onClick={() => {
                              const next = active
                                ? reminder.daysOfWeek.filter((v) => v !== day.value)
                                : [...reminder.daysOfWeek, day.value].sort(
                                    (a, b) => a - b,
                                  );
                              upsertReminder({ ...reminder, daysOfWeek: next });
                            }}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trainer-only: Content management */}
      {isTrainer && (
        <div className="settings-section">
          <h3 className="settings-section-title">Управление контентом</h3>

          <Link
            to="/workouts"
            className="card"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              marginBottom: 'var(--gap-stack)',
            }}
          >
            <span>Управление тренировками</span>
            <span style={{ color: 'var(--primary)' }}>→</span>
          </Link>

          <div className="section-header">
            <h4 style={{ margin: 0 }}>Профиль тренера</h4>
            {trainerProfile && !profileExpanded && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  syncProfileForm();
                  setProfileExpanded(true);
                }}
              >
                Изменить
              </button>
            )}
          </div>

          {profileExpanded || !trainerProfile ? (
            <div className="card">
              <div className="form-group">
                <label className="form-label">Имя</label>
                <input
                  className="form-input"
                  value={profileForm.displayName}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, displayName: e.target.value }))
                  }
                  placeholder="Ваше имя"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Специализация</label>
                <input
                  className="form-input"
                  value={profileForm.specialization}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, specialization: e.target.value }))
                  }
                  placeholder="Например: Пилатес, йога, функциональный тренинг"
                />
              </div>

              <div className="form-group">
                <label className="form-label">О себе</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder="Расскажите о себе и своём подходе..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Фото (URL)</label>
                <input
                  className="form-input"
                  value={profileForm.photoUrl}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, photoUrl: e.target.value }))
                  }
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="button-row">
                <button className="btn btn-primary" onClick={handleSaveProfile}>
                  Сохранить
                </button>
                {trainerProfile && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setProfileExpanded(false)}
                  >
                    Отмена
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              {trainerProfile.photoUrl && (
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <img
                    src={trainerProfile.photoUrl}
                    alt={trainerProfile.displayName}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--primary)',
                    }}
                  />
                </div>
              )}
              <h3 style={{ textAlign: 'center', marginBottom: 4 }}>
                {trainerProfile.displayName}
              </h3>
              {trainerProfile.specialization && (
                <p
                  style={{
                    textAlign: 'center',
                    color: 'var(--primary)',
                    fontSize: 13,
                    marginBottom: 8,
                  }}
                >
                  {trainerProfile.specialization}
                </p>
              )}
              {trainerProfile.bio && (
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 14,
                    textAlign: 'center',
                  }}
                >
                  {trainerProfile.bio}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
