import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns';
import { useMemo, useState } from 'react';
import { getEntryByHabitAndDay, useActiveHabits, useHabitStore } from '../../habits/model/store';

const statusClass = {
  done: 'cell done',
  partial: 'cell partial',
  missed: 'cell missed',
  none: 'cell'
};

export const ProgressCalendar = (): JSX.Element => {
  const activeHabits = useActiveHabits();
  const entries = useHabitStore((state) => state.entries);
  const [selectedHabitId, setSelectedHabitId] = useState<string | undefined>(activeHabits[0]?.id);

  const selectedHabit = useMemo(
    () => activeHabits.find((habit) => habit.id === selectedHabitId) ?? activeHabits[0],
    [activeHabits, selectedHabitId]
  );

  const monthDays = useMemo(() => {
    const now = new Date();
    return eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
  }, []);

  if (activeHabits.length === 0) {
    return <p className="card">Календарь появится после добавления привычек.</p>;
  }

  return (
    <section className="stack">
      <h2>Календарь прогресса за месяц</h2>
      <label>
        Привычка
        <select value={selectedHabit?.id} onChange={(event) => setSelectedHabitId(event.target.value)}>
          {activeHabits.map((habit) => (
            <option key={habit.id} value={habit.id}>
              {habit.title}
            </option>
          ))}
        </select>
      </label>

      <div className="calendar-grid">
        {monthDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const entry = selectedHabit ? getEntryByHabitAndDay(entries, selectedHabit.id, key) : undefined;
          const cls = entry?.status ? statusClass[entry.status] : statusClass.none;

          return (
            <div key={key} className={cls} title={`${key}: ${entry?.status === 'done' ? 'выполнено' : entry?.status === 'partial' ? 'частично' : entry?.status === 'missed' ? 'пропущено' : 'не задано'}`}>
              <small>{format(day, 'd')}</small>
            </div>
          );
        })}
      </div>
      <p className="legend">выполнено = зелёный, частично = жёлтый, пропущено = красный</p>
    </section>
  );
};
