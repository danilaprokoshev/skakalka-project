import { useMemo } from 'react';
import { toDayKey } from '../../../lib/date';
import {
  useActiveHabits,
  useHabitStore,
  calculateCompletionRate,
  calculateCurrentStreak,
} from '../../habits/model/store';

export function StatsRow() {
  const activeHabits = useActiveHabits();
  const entries = useHabitStore((s) => s.entries);

  const stats = useMemo(() => {
    const today = toDayKey(new Date());
    const todayDone = entries.filter(
      (e) => e.date === today && e.status === 'done',
    ).length;
    const total = activeHabits.length;

    const bestStreak = Math.max(
      0,
      ...activeHabits.map((h) => calculateCurrentStreak(entries, h.id)),
    );

    const weekRate =
      total > 0
        ? Math.round(
            activeHabits.reduce(
              (sum, h) => sum + calculateCompletionRate(entries, h.id, 7),
              0,
            ) / total,
          )
        : 0;

    return { todayDone, total, bestStreak, weekRate };
  }, [activeHabits, entries]);

  const streakDays = (days: number) => {
    if (days % 10 === 1 && days % 100 !== 11) return 'день';
    if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return 'дня';
    return 'дней';
  };

  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-value">
          {stats.todayDone}/{stats.total}
        </div>
        <div className="stat-label">Сегодня</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{stats.bestStreak}</div>
        <div className="stat-label">
          {streakDays(stats.bestStreak)} подряд
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{stats.weekRate}%</div>
        <div className="stat-label">За 7 дней</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{stats.total}</div>
        <div className="stat-label">
          {stats.total === 1
            ? 'привычка'
            : stats.total < 5
              ? 'привычки'
              : 'привычек'}
        </div>
      </div>
    </div>
  );
}
