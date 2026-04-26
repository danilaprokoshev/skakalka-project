import { useMemo, useState } from 'react';
import { addDays, format, isToday, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toDayKey } from '../../../lib/date';
import { HabitStatus } from '../../habits/model/types';
import { getEntryByHabitAndDay, useActiveHabits, useHabitStore } from '../../habits/model/store';

const statuses: HabitStatus[] = ['done', 'partial', 'missed'];

export const DailyCheckin = (): JSX.Element => {
  const activeHabits = useActiveHabits();
  const entries = useHabitStore((state) => state.entries);
  const setEntryStatus = useHabitStore((state) => state.setEntryStatus);
  const setEntryNote = useHabitStore((state) => state.setEntryNote);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dayKey = toDayKey(selectedDate);

  const goBack = () => setSelectedDate((prev) => subDays(prev, 1));
  const goForward = () => setSelectedDate((prev) => addDays(prev, 1));

  if (activeHabits.length === 0) {
    return <p className="card">Создайте хотя бы одну привычку, чтобы начать ежедневный чек-ин.</p>;
  }

  return (
    <section className="stack">
      <div className="date-nav">
        <button type="button" className="ghost date-nav-arrow" onClick={goBack} aria-label="Предыдущий день">
          ◀
        </button>
        <h2>{format(selectedDate, 'EEEE, d MMMM', { locale: ru })}</h2>
        <button
          type="button"
          className="ghost date-nav-arrow"
          onClick={goForward}
          disabled={isToday(selectedDate)}
          aria-label="Следующий день"
        >
          ▶
        </button>
      </div>
      {activeHabits.map((habit) => {
        const todayEntry = getEntryByHabitAndDay(entries, habit.id, dayKey);
        return (
          <article className="card" key={habit.id}>
            <div className="habit-row">
              <div className="habit-title-wrap">
                <span className="dot" style={{ backgroundColor: habit.color }} />
                <strong>{habit.title}</strong>
              </div>
              <span className="pill">{todayEntry?.status === 'done' ? 'выполнено' : todayEntry?.status === 'partial' ? 'частично' : todayEntry?.status === 'missed' ? 'пропущено' : 'не задано'}</span>
            </div>
            <div className="button-row">
                {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={todayEntry?.status === status ? 'active-status' : 'ghost'}
                  onClick={() => setEntryStatus(habit.id, dayKey, status)}
                >
                  {status === 'done' ? 'Выполнено' : status === 'partial' ? 'Частично' : 'Пропущено'}
                </button>
              ))}
            </div>
            <label>
              Заметка дня
              <textarea
                rows={3}
                placeholder="Как прошёл день?"
                value={todayEntry?.note ?? ''}
                onChange={(event) => setEntryNote(habit.id, dayKey, event.target.value)}
              />
            </label>
          </article>
        );
      })}
    </section>
  );
};
