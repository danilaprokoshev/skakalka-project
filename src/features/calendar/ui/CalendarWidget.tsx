import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  isAfter,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { toDayKey } from '../../../lib/date';
import { useHabitStore, useActiveHabits, getEntryByHabitAndDay } from '../../habits/model/store';

interface Props {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function CalendarWidget({ selectedDate, onDateSelect }: Props) {
  const entries = useHabitStore((s) => s.entries);
  const activeHabits = useActiveHabits();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const monthLabel = format(currentMonth, 'LLLL yyyy', { locale: ru });

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const today = new Date();
  const todayKey = toDayKey(today);

  const habit = useMemo(
    () => activeHabits.find((h) => h.id === selectedHabitId),
    [activeHabits, selectedHabitId],
  );

  const getDayStatus = (day: Date): 'done' | 'missed' | 'future' | null => {
    const dayKey = toDayKey(day);
    if (dayKey > todayKey) return 'future';
    if (!selectedHabitId) return null;
    const entry = getEntryByHabitAndDay(entries, selectedHabitId, dayKey);
    if (entry?.status === 'done') return 'done';
    return 'missed';
  };

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <span className="calendar-month">{monthLabel}</span>
        <div className="calendar-controls">
          <button
            className="date-nav-arrow"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            style={{ width: 32, height: 32, fontSize: 14 }}
          >
            ◀
          </button>
          <button
            className="date-nav-arrow"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            style={{ width: 32, height: 32, fontSize: 14 }}
          >
            ▶
          </button>
        </div>
      </div>

      <select
        className="calendar-habit-select"
        value={selectedHabitId ?? ''}
        onChange={(e) => setSelectedHabitId(e.target.value || null)}
      >
        <option value="">Все привычки</option>
        {activeHabits.map((h) => (
          <option key={h.id} value={h.id}>
            {h.title}
          </option>
        ))}
      </select>

      <div className="calendar-grid">
        {DAY_NAMES.map((name) => (
          <div key={name} className="calendar-day-name">
            {name}
          </div>
        ))}
        {days.map((day) => {
          const dayKey = toDayKey(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          const isFuture = isAfter(day, today);
          const isSelected = dayKey === selectedDate;
          const status = getDayStatus(day);

          const cellClasses = [
            'calendar-cell',
            isTodayDate && 'today',
            isSelected && 'selected',
            !isCurrentMonth && 'other-month',
            isFuture && 'future-date',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={dayKey}
              className={cellClasses}
              onClick={() => {
                if (!isFuture || dayKey <= todayKey) {
                  onDateSelect(dayKey);
                }
              }}
            >
              <span>{format(day, 'd')}</span>
              {selectedHabitId && status && status !== 'future' && (
                <span className={`calendar-dot ${status}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
