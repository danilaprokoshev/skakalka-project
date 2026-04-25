import { calculateBestStreak, calculateCompletionRate, calculateCurrentStreak, useActiveHabits, useHabitStore } from '../../habits/model/store';

export const StatsDashboard = (): JSX.Element => {
  const activeHabits = useActiveHabits();
  const entries = useHabitStore((state) => state.entries);

  if (activeHabits.length === 0) {
    return <p className="card">Статистика появится, когда вы начнёте отслеживать привычки.</p>;
  }

  return (
    <section className="stack">
      <h2>Статистика прогресса</h2>
      <div className="stats-grid">
        {activeHabits.map((habit) => {
          const streak = calculateCurrentStreak(entries, habit.id);
          const bestStreak = calculateBestStreak(entries, habit.id);
          const rate7 = calculateCompletionRate(entries, habit.id, 7);
          const rate30 = calculateCompletionRate(entries, habit.id, 30);

          return (
            <article className="card" key={habit.id}>
              <div className="habit-title-wrap">
                <span className="dot" style={{ backgroundColor: habit.color }} />
                <strong>{habit.title}</strong>
              </div>
              <ul className="metrics">
                <li>Текущая серия: {streak} {streak % 10 === 1 && streak % 100 !== 11 ? 'день' : [2, 3, 4].includes(streak % 10) && ![12, 13, 14].includes(streak % 100) ? 'дня' : 'дней'}</li>
                <li>Лучшая серия: {bestStreak} {bestStreak % 10 === 1 && bestStreak % 100 !== 11 ? 'день' : [2, 3, 4].includes(bestStreak % 10) && ![12, 13, 14].includes(bestStreak % 100) ? 'дня' : 'дней'}</li>
                <li>Выполнение за 7 дней: {rate7}%</li>
                <li>Выполнение за 30 дней: {rate30}%</li>
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
};
