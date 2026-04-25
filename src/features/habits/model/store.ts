import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, differenceInCalendarDays, parseISO, subDays } from 'date-fns';
import { useMemo } from 'react';
import { toDayKey } from '../../../lib/date';
import { Habit, HabitEntry, HabitStatus, Reminder } from './types';

interface HabitStoreState {
  habits: Habit[];
  entries: HabitEntry[];
  reminders: Reminder[];
  inAppReminderQueue: string[];
  createHabit: (title: string, color: string) => void;
  updateHabit: (habitId: string, title: string, color: string) => void;
  archiveHabit: (habitId: string) => void;
  restoreHabit: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;
  setEntryStatus: (habitId: string, date: string, status: HabitStatus) => void;
  setEntryNote: (habitId: string, date: string, note: string) => void;
  upsertReminder: (reminder: Reminder) => void;
  clearInAppReminderQueue: () => void;
  enqueueInAppReminder: (habitId: string) => void;
}

const id = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const defaultReminder = (habitId: string): Reminder => ({
  habitId,
  enabled: false,
  time: '09:00',
  daysOfWeek: [1, 2, 3, 4, 5, 6, 0]
});

export const useHabitStore = create<HabitStoreState>()(
  persist(
    (set, get) => ({
      habits: [],
      entries: [],
      reminders: [],
      inAppReminderQueue: [],
      createHabit: (title, color) => {
        const newHabit: Habit = {
          id: id(),
          title,
          color,
          createdAt: new Date().toISOString(),
          isArchived: false
        };

        set((state) => ({
          habits: [...state.habits, newHabit],
          reminders: [...state.reminders, defaultReminder(newHabit.id)]
        }));
      },
      updateHabit: (habitId, title, color) => {
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, title, color } : habit))
        }));
      },
      archiveHabit: (habitId) => {
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, isArchived: true } : habit))
        }));
      },
      restoreHabit: (habitId) => {
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, isArchived: false } : habit))
        }));
      },
      deleteHabit: (habitId) => {
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== habitId),
          entries: state.entries.filter((entry) => entry.habitId !== habitId),
          reminders: state.reminders.filter((reminder) => reminder.habitId !== habitId)
        }));
      },
      setEntryStatus: (habitId, date, status) => {
        set((state) => {
          const existing = state.entries.find((entry) => entry.habitId === habitId && entry.date === date);
          if (existing) {
            return {
              entries: state.entries.map((entry) =>
                entry.id === existing.id
                  ? {
                      ...entry,
                      status
                    }
                  : entry
              )
            };
          }

          return {
            entries: [
              ...state.entries,
              {
                id: id(),
                habitId,
                date,
                status
              }
            ]
          };
        });
      },
      setEntryNote: (habitId, date, note) => {
        set((state) => {
          const existing = state.entries.find((entry) => entry.habitId === habitId && entry.date === date);
          if (existing) {
            return {
              entries: state.entries.map((entry) =>
                entry.id === existing.id
                  ? {
                      ...entry,
                      note
                    }
                  : entry
              )
            };
          }

          return {
            entries: [
              ...state.entries,
              {
                id: id(),
                habitId,
                date,
                status: 'partial',
                note
              }
            ]
          };
        });
      },
      upsertReminder: (reminder) => {
        set((state) => {
          const exists = state.reminders.some((item) => item.habitId === reminder.habitId);
          if (exists) {
            return {
              reminders: state.reminders.map((item) => (item.habitId === reminder.habitId ? reminder : item))
            };
          }

          return { reminders: [...state.reminders, reminder] };
        });
      },
      clearInAppReminderQueue: () => set({ inAppReminderQueue: [] }),
      enqueueInAppReminder: (habitId) => {
        const queue = get().inAppReminderQueue;
        if (queue.includes(habitId)) {
          return;
        }

        set({ inAppReminderQueue: [...queue, habitId] });
      }
    }),
    {
      name: 'habit-tracker-mvp-store',
      partialize: (state) => ({
        habits: state.habits,
        entries: state.entries,
        reminders: state.reminders
      })
    }
  )
);

export const useActiveHabits = (): Habit[] => {
  const habits = useHabitStore((state) => state.habits);
  return useMemo(() => habits.filter((habit) => !habit.isArchived), [habits]);
};

export const useArchivedHabits = (): Habit[] => {
  const habits = useHabitStore((state) => state.habits);
  return useMemo(() => habits.filter((habit) => habit.isArchived), [habits]);
};

export const getEntryByHabitAndDay = (entries: HabitEntry[], habitId: string, dayKey: string): HabitEntry | undefined =>
  entries.find((entry) => entry.habitId === habitId && entry.date === dayKey);

export const calculateCompletionRate = (entries: HabitEntry[], habitId: string, days: number, now = new Date()): number => {
  const fromDay = subDays(now, days - 1);
  let doneDays = 0;

  for (let i = 0; i < days; i += 1) {
    const day = addDays(fromDay, i);
    const entry = getEntryByHabitAndDay(entries, habitId, toDayKey(day));
    if (entry?.status === 'done') {
      doneDays += 1;
    }
  }

  return Math.round((doneDays / days) * 100);
};

export const calculateCurrentStreak = (entries: HabitEntry[], habitId: string, now = new Date()): number => {
  let streak = 0;

  for (let i = 0; i < 365; i += 1) {
    const day = subDays(now, i);
    const entry = getEntryByHabitAndDay(entries, habitId, toDayKey(day));
    if (entry?.status === 'done') {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

export const calculateBestStreak = (entries: HabitEntry[], habitId: string): number => {
  const filtered = entries
    .filter((entry) => entry.habitId === habitId && entry.status === 'done')
    .sort((a, b) => a.date.localeCompare(b.date));

  if (filtered.length === 0) {
    return 0;
  }

  let best = 1;
  let current = 1;

  for (let i = 1; i < filtered.length; i += 1) {
    const prev = parseISO(filtered[i - 1].date);
    const next = parseISO(filtered[i].date);
    if (differenceInCalendarDays(next, prev) === 1) {
      current += 1;
      best = Math.max(best, current);
    } else if (differenceInCalendarDays(next, prev) > 1) {
      current = 1;
    }
  }

  return best;
};
