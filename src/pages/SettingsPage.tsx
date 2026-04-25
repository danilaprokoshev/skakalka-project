import { useMemo } from 'react';
import { requestNotificationPermission, supportsNotifications } from '../features/reminders/lib/notifications';
import { useActiveHabits, useHabitStore } from '../features/habits/model/store';

const weekdays = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 0, label: 'Вс' }
];

export const SettingsPage = (): JSX.Element => {
  const activeHabits = useActiveHabits();
  const reminders = useHabitStore((state) => state.reminders);
  const upsertReminder = useHabitStore((state) => state.upsertReminder);

  const reminderMap = useMemo(() => new Map(reminders.map((reminder) => [reminder.habitId, reminder])), [reminders]);

  return (
    <section className="stack">
      <h2>Настройки и напоминания</h2>
      <div className="card">
        <p>Браузерные уведомления: {supportsNotifications() ? 'Поддерживаются' : 'Не поддерживаются'}</p>
        <button type="button" onClick={() => requestNotificationPermission()}>
          Запросить разрешение на уведомления
        </button>
      </div>

      {activeHabits.length === 0 ? <p className="card">Сначала добавьте привычки, чтобы настроить напоминания.</p> : null}

      {activeHabits.map((habit) => {
        const reminder = reminderMap.get(habit.id) ?? {
          habitId: habit.id,
          enabled: false,
          time: '09:00',
          daysOfWeek: [1, 2, 3, 4, 5, 6, 0]
        };

        return (
          <article key={habit.id} className="card stack">
            <div className="habit-title-wrap">
              <span className="dot" style={{ backgroundColor: habit.color }} />
              <strong>{habit.title}</strong>
            </div>

            <label className="inline-row">
              <input
                type="checkbox"
                checked={reminder.enabled}
                onChange={(event) => upsertReminder({ ...reminder, enabled: event.target.checked })}
              />
              Включить напоминание
            </label>

            <label>
              Время напоминания
              <input
                type="time"
                value={reminder.time}
                onChange={(event) => upsertReminder({ ...reminder, time: event.target.value })}
              />
            </label>

            <div>
              <p className="label">Дни недели</p>
              <div className="button-row wrap">
                {weekdays.map((day) => {
                  const selected = reminder.daysOfWeek.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      className={selected ? 'active-status' : 'ghost'}
                      onClick={() => {
                        const nextDays = selected
                          ? reminder.daysOfWeek.filter((value) => value !== day.value)
                          : [...reminder.daysOfWeek, day.value].sort((a, b) => a - b);

                        upsertReminder({ ...reminder, daysOfWeek: nextDays });
                      }}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
};
