import { useEffect } from 'react';
import { DailyCheckin } from '../features/checkin/ui/DailyCheckin';
import { StatsDashboard } from '../features/stats/ui/StatsDashboard';
import { useHabitStore } from '../features/habits/model/store';
import { dispatchReminder, markReminderAsDelivered, shouldShowInAppReminder } from '../features/reminders/lib/notifications';

export const DashboardPage = (): JSX.Element => {
  const reminders = useHabitStore((state) => state.reminders);
  const habits = useHabitStore((state) => state.habits);
  const queue = useHabitStore((state) => state.inAppReminderQueue);
  const enqueueInAppReminder = useHabitStore((state) => state.enqueueInAppReminder);
  const clearInAppReminderQueue = useHabitStore((state) => state.clearInAppReminderQueue);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = new Date();
      reminders.forEach((reminder) => {
        if (shouldShowInAppReminder(reminder, now)) {
          const habit = habits.find((item) => item.id === reminder.habitId);
          if (!habit || habit.isArchived) {
            return;
          }

          dispatchReminder(habit.title);
          enqueueInAppReminder(habit.id);
          markReminderAsDelivered(habit.id, now);
        }
      });
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [reminders, habits, enqueueInAppReminder]);

  return (
    <section className="stack">
      <h2>Ежедневный дашборд</h2>
      {queue.length > 0 ? (
        <div className="banner">
          У вас {queue.length} {queue.length === 1 ? 'напоминание' : queue.length < 5 ? 'напоминания' : 'напоминаний'} прямо сейчас. Откройте сегодняшние чек-ины и отметьте прогресс.
          <button type="button" onClick={clearInAppReminderQueue} className="ghost">
            Скрыть
          </button>
        </div>
      ) : null}
      <DailyCheckin />
      <StatsDashboard />
    </section>
  );
};
