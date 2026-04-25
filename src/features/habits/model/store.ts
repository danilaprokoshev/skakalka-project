import { create } from 'zustand';
import { addDays, differenceInCalendarDays, parseISO, subDays } from 'date-fns';
import { useMemo } from 'react';
import { toDayKey } from '../../../lib/date';
import { supabase } from '../../../lib/supabase';
import { Habit, HabitEntry, HabitStatus, Reminder } from './types';

interface HabitStoreState {
  habits: Habit[];
  entries: HabitEntry[];
  reminders: Reminder[];
  inAppReminderQueue: string[];
  userId: string | null;
  createHabit: (title: string, color: string) => Promise<void>;
  updateHabit: (habitId: string, title: string, color: string) => void;
  archiveHabit: (habitId: string) => void;
  restoreHabit: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;
  setEntryStatus: (habitId: string, date: string, status: HabitStatus) => void;
  setEntryNote: (habitId: string, date: string, note: string) => void;
  upsertReminder: (reminder: Reminder) => void;
  clearInAppReminderQueue: () => void;
  enqueueInAppReminder: (habitId: string) => void;
  loadUserData: (userId: string) => Promise<void>;
  clearData: () => void;
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

export const useHabitStore = create<HabitStoreState>()((set, get) => ({
  habits: [],
  entries: [],
  reminders: [],
  inAppReminderQueue: [],
  userId: null,

  loadUserData: async (userId: string) => {
    set({ userId });

    const [habitsRes, entriesRes, remindersRes] = await Promise.all([
      supabase.from('habits').select('id, title, color, created_at, is_archived').eq('user_id', userId),
      supabase.from('habit_entries').select('id, habit_id, date, status, note').eq('user_id', userId),
      supabase.from('reminders').select('habit_id, enabled, time, days_of_week').eq('user_id', userId)
    ]);

    if (habitsRes.error) { return; }
    if (entriesRes.error) { return; }
    if (remindersRes.error) { return; }

    const habits: Habit[] = (habitsRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      title: row.title as string,
      color: row.color as string,
      createdAt: row.created_at as string,
      isArchived: row.is_archived as boolean
    }));

    const entries: HabitEntry[] = (entriesRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      habitId: row.habit_id as string,
      date: row.date as string,
      status: row.status as HabitStatus,
      note: (row.note as string) ?? undefined
    }));

    const reminders: Reminder[] = (remindersRes.data ?? []).map((row: Record<string, unknown>) => ({
      habitId: row.habit_id as string,
      enabled: row.enabled as boolean,
      time: row.time as string,
      daysOfWeek: row.days_of_week as number[]
    }));

    set({ habits, entries, reminders });
  },

  clearData: () => {
    set({ habits: [], entries: [], reminders: [], inAppReminderQueue: [], userId: null });
  },

  createHabit: async (title, color) => {
    const userId = get().userId;
    if (!userId) { return; }

    const habitId = id();
    const now = new Date().toISOString();

    const { error } = await supabase.from('habits').insert({
      id: habitId, user_id: userId, title, color, created_at: now, is_archived: false
    });

    if (error) { return; }

    const newHabit: Habit = { id: habitId, title, color, createdAt: now, isArchived: false };

    set((state) => ({
      habits: [...state.habits, newHabit],
      reminders: [...state.reminders, defaultReminder(habitId)]
    }));
  },

  updateHabit: (habitId, title, color) => {
    const userId = get().userId;
    if (!userId) { return; }

    supabase.from('habits').update({ title, color }).eq('id', habitId).eq('user_id', userId);

    set((state) => ({
      habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, title, color } : habit))
    }));
  },

  archiveHabit: (habitId) => {
    const userId = get().userId;
    if (!userId) { return; }

    supabase.from('habits').update({ is_archived: true }).eq('id', habitId).eq('user_id', userId);

    set((state) => ({
      habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, isArchived: true } : habit))
    }));
  },

  restoreHabit: (habitId) => {
    const userId = get().userId;
    if (!userId) { return; }

    supabase.from('habits').update({ is_archived: false }).eq('id', habitId).eq('user_id', userId);

    set((state) => ({
      habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, isArchived: false } : habit))
    }));
  },

  deleteHabit: (habitId) => {
    const userId = get().userId;
    if (!userId) { return; }

    supabase.from('habits').delete().eq('id', habitId).eq('user_id', userId);

    set((state) => ({
      habits: state.habits.filter((habit) => habit.id !== habitId),
      entries: state.entries.filter((entry) => entry.habitId !== habitId),
      reminders: state.reminders.filter((reminder) => reminder.habitId !== habitId)
    }));
  },

  setEntryStatus: (habitId, date, status) => {
    const userId = get().userId;
    if (!userId) { return; }

    set((state) => {
      const existing = state.entries.find((entry) => entry.habitId === habitId && entry.date === date);

      if (existing) {
        supabase.from('habit_entries').update({ status }).eq('id', existing.id).eq('user_id', userId);

        return {
          entries: state.entries.map((entry) =>
            entry.id === existing.id ? { ...entry, status } : entry
          )
        };
      }

      const entryId = id();
      supabase.from('habit_entries').insert({ id: entryId, user_id: userId, habit_id: habitId, date, status });

      return { entries: [...state.entries, { id: entryId, habitId, date, status }] };
    });
  },

  setEntryNote: (habitId, date, note) => {
    const userId = get().userId;
    if (!userId) { return; }

    set((state) => {
      const existing = state.entries.find((entry) => entry.habitId === habitId && entry.date === date);

      if (existing) {
        supabase.from('habit_entries').update({ note }).eq('id', existing.id).eq('user_id', userId);

        return {
          entries: state.entries.map((entry) => (entry.id === existing.id ? { ...entry, note } : entry))
        };
      }

      const entryId = id();
      supabase.from('habit_entries').insert({ id: entryId, user_id: userId, habit_id: habitId, date, status: 'partial', note });

      return { entries: [...state.entries, { id: entryId, habitId, date, status: 'partial', note }] };
    });
  },

  upsertReminder: (reminder) => {
    const userId = get().userId;
    if (!userId) { return; }

    set((state) => {
      const exists = state.reminders.some((item) => item.habitId === reminder.habitId);

      if (exists) {
        supabase.from('reminders').update({
          enabled: reminder.enabled,
          time: reminder.time,
          days_of_week: reminder.daysOfWeek
        }).eq('habit_id', reminder.habitId).eq('user_id', userId);

        return {
          reminders: state.reminders.map((item) => (item.habitId === reminder.habitId ? reminder : item))
        };
      }

      supabase.from('reminders').insert({
        user_id: userId,
        habit_id: reminder.habitId,
        enabled: reminder.enabled,
        time: reminder.time,
        days_of_week: reminder.daysOfWeek
      });

      return { reminders: [...state.reminders, reminder] };
    });
  },

  clearInAppReminderQueue: () => set({ inAppReminderQueue: [] }),

  enqueueInAppReminder: (habitId) => {
    const queue = get().inAppReminderQueue;
    if (queue.includes(habitId)) { return; }
    set({ inAppReminderQueue: [...queue, habitId] });
  }
}));

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
    if (entry?.status === 'done') { doneDays += 1; }
  }

  return Math.round((doneDays / days) * 100);
};

export const calculateCurrentStreak = (entries: HabitEntry[], habitId: string, now = new Date()): number => {
  let streak = 0;

  for (let i = 0; i < 365; i += 1) {
    const day = subDays(now, i);
    const entry = getEntryByHabitAndDay(entries, habitId, toDayKey(day));
    if (entry?.status === 'done') { streak += 1; } else { break; }
  }

  return streak;
};

export const calculateBestStreak = (entries: HabitEntry[], habitId: string): number => {
  const filtered = entries
    .filter((entry) => entry.habitId === habitId && entry.status === 'done')
    .sort((a, b) => a.date.localeCompare(b.date));

  if (filtered.length === 0) { return 0; }

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
