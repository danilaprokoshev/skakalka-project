import { create } from 'zustand';
import { addDays, differenceInCalendarDays, parseISO, subDays } from 'date-fns';
import { useMemo } from 'react';
import { toDayKey } from '../../../lib/date';
import { supabase } from '../../../lib/supabase';
import { Habit, HabitCategory, HabitEntry, HabitStatus, Reminder } from './types';

const ONBOARDING_KEY = 'sk-onboarding-done';

interface HabitStoreState {
  habits: Habit[];
  entries: HabitEntry[];
  reminders: Reminder[];
  inAppReminderQueue: string[];
  userId: string | null;
  loadError: string | null;
  onboardingDone: boolean;
  createHabit: (title: string, color: string, category?: HabitCategory) => Promise<void>;
  updateHabit: (habitId: string, title: string, color: string, category?: HabitCategory) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  restoreHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleHabitDone: (habitId: string, date: string) => Promise<void>;
  setEntryNote: (habitId: string, date: string, note: string) => Promise<void>;
  upsertReminder: (reminder: Reminder) => Promise<void>;
  clearInAppReminderQueue: () => void;
  enqueueInAppReminder: (habitId: string) => void;
  completeOnboarding: () => void;
  exportAllData: () => string;
  importAllData: (json: string) => Promise<void>;
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
  loadError: null,
  onboardingDone: localStorage.getItem(ONBOARDING_KEY) === '1',

  loadUserData: async (userId: string) => {
    set({ userId, loadError: null });

    const [habitsRes, entriesRes, remindersRes] = await Promise.all([
      supabase.from('habits').select('id, title, color, category, created_at, is_archived').eq('user_id', userId),
      supabase.from('habit_entries').select('id, habit_id, date, status, note').eq('user_id', userId),
      supabase.from('reminders').select('habit_id, enabled, time, days_of_week').eq('user_id', userId)
    ]);

    if (habitsRes.error) {
      set({ loadError: `Ошибка загрузки привычек: ${habitsRes.error.message}` });
      return;
    }
    if (entriesRes.error) {
      set({ loadError: `Ошибка загрузки записей: ${entriesRes.error.message}` });
      return;
    }
    if (remindersRes.error) {
      set({ loadError: `Ошибка загрузки напоминаний: ${remindersRes.error.message}` });
      return;
    }

    const habits: Habit[] = (habitsRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      title: row.title as string,
      color: row.color as string,
      category: (row.category as HabitCategory) ?? undefined,
      createdAt: row.created_at as string,
      isArchived: row.is_archived as boolean
    }));

    const entries: HabitEntry[] = (entriesRes.data ?? [])
      .filter((row: Record<string, unknown>) => row.status === 'done')
      .map((row: Record<string, unknown>) => ({
        id: row.id as string,
        habitId: row.habit_id as string,
        date: row.date as string,
        status: 'done' as HabitStatus,
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
    set({ habits: [], entries: [], reminders: [], inAppReminderQueue: [], userId: null, loadError: null });
  },

  createHabit: async (title, color, category) => {
    const userId = get().userId;
    if (!userId) { throw new Error('Пользователь не авторизован'); }

    const habitId = id();
    const now = new Date().toISOString();

    const { error } = await supabase.from('habits').insert({
      id: habitId, user_id: userId, title, color, category: category ?? null, created_at: now, is_archived: false
    });

    if (error) { throw new Error(error.message); }

    const reminder = defaultReminder(habitId);
    await supabase.from('reminders').insert({
      user_id: userId,
      habit_id: reminder.habitId,
      enabled: reminder.enabled,
      time: reminder.time,
      days_of_week: reminder.daysOfWeek
    });

    const newHabit: Habit = { id: habitId, title, color, category, createdAt: now, isArchived: false };

    set((state) => ({
      habits: [...state.habits, newHabit],
      reminders: [...state.reminders, reminder]
    }));
  },

  updateHabit: async (habitId, title, color, category) => {
    const userId = get().userId;
    if (!userId) { return; }

    const previous = get().habits.find((h) => h.id === habitId);
    set((state) => ({
      habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, title, color, category } : habit))
    }));

    const { error } = await supabase.from('habits').update({ title, color, category: category ?? null }).eq('id', habitId).eq('user_id', userId);
    if (error && previous) {
      set((state) => ({
        habits: state.habits.map((habit) => (habit.id === habitId ? previous : habit))
      }));
    }
  },

  archiveHabit: async (habitId) => {
    const userId = get().userId;
    if (!userId) { return; }

    const previous = get().habits.find((h) => h.id === habitId);
    set((state) => ({
      habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, isArchived: true } : habit))
    }));

    const { error } = await supabase.from('habits').update({ is_archived: true }).eq('id', habitId).eq('user_id', userId);
    if (error && previous) {
      set((state) => ({
        habits: state.habits.map((habit) => (habit.id === habitId ? previous : habit))
      }));
    }
  },

  restoreHabit: async (habitId) => {
    const userId = get().userId;
    if (!userId) { return; }

    const previous = get().habits.find((h) => h.id === habitId);
    set((state) => ({
      habits: state.habits.map((habit) => (habit.id === habitId ? { ...habit, isArchived: false } : habit))
    }));

    const { error } = await supabase.from('habits').update({ is_archived: false }).eq('id', habitId).eq('user_id', userId);
    if (error && previous) {
      set((state) => ({
        habits: state.habits.map((habit) => (habit.id === habitId ? previous : habit))
      }));
    }
  },

  deleteHabit: async (habitId) => {
    const userId = get().userId;
    if (!userId) { return; }

    const previousHabit = get().habits.find((h) => h.id === habitId);
    const previousEntries = get().entries.filter((e) => e.habitId === habitId);
    const previousReminders = get().reminders.filter((r) => r.habitId === habitId);

    set((state) => ({
      habits: state.habits.filter((habit) => habit.id !== habitId),
      entries: state.entries.filter((entry) => entry.habitId !== habitId),
      reminders: state.reminders.filter((reminder) => reminder.habitId !== habitId)
    }));

    const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', userId);
    if (error && previousHabit) {
      set((state) => ({
        habits: [...state.habits, previousHabit],
        entries: [...state.entries, ...previousEntries],
        reminders: [...state.reminders, ...previousReminders]
      }));
    }
  },

  toggleHabitDone: async (habitId, date) => {
    const userId = get().userId;
    if (!userId) { return; }

    const existing = get().entries.find((entry) => entry.habitId === habitId && entry.date === date);

    if (existing) {
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== existing.id)
      }));

      const { error } = await supabase.from('habit_entries').delete().eq('id', existing.id).eq('user_id', userId);
      if (error) {
        set((state) => ({ entries: [...state.entries, existing] }));
      }
      return;
    }

    const entryId = id();
    const newEntry: HabitEntry = { id: entryId, habitId, date, status: 'done' };
    set((state) => ({ entries: [...state.entries, newEntry] }));

    const { error } = await supabase.from('habit_entries').insert({ id: entryId, user_id: userId, habit_id: habitId, date, status: 'done' });
    if (error) {
      set((state) => ({ entries: state.entries.filter((e) => e.id !== entryId) }));
    }
  },

  setEntryNote: async (habitId, date, note) => {
    const userId = get().userId;
    if (!userId) { return; }

    const existing = get().entries.find((entry) => entry.habitId === habitId && entry.date === date);

    if (existing) {
      const previousNote = existing.note;
      set((state) => ({
        entries: state.entries.map((entry) => (entry.id === existing.id ? { ...entry, note } : entry))
      }));

      const { error } = await supabase.from('habit_entries').update({ note }).eq('id', existing.id).eq('user_id', userId);
      if (error) {
        set((state) => ({
          entries: state.entries.map((entry) => (entry.id === existing.id ? { ...entry, note: previousNote } : entry))
        }));
      }
      return;
    }

    const entryId = id();
    const newEntry: HabitEntry = { id: entryId, habitId, date, status: 'done', note };
    set((state) => ({ entries: [...state.entries, newEntry] }));

    const { error } = await supabase.from('habit_entries').insert({ id: entryId, user_id: userId, habit_id: habitId, date, status: 'done', note });
    if (error) {
      set((state) => ({ entries: state.entries.filter((e) => e.id !== entryId) }));
    }
  },

  upsertReminder: async (reminder) => {
    const userId = get().userId;
    if (!userId) { return; }

    const exists = get().reminders.some((item) => item.habitId === reminder.habitId);

    if (exists) {
      const previous = get().reminders.find((r) => r.habitId === reminder.habitId);
      set((state) => ({
        reminders: state.reminders.map((item) => (item.habitId === reminder.habitId ? reminder : item))
      }));

      const { error } = await supabase.from('reminders').update({
        enabled: reminder.enabled,
        time: reminder.time,
        days_of_week: reminder.daysOfWeek
      }).eq('habit_id', reminder.habitId).eq('user_id', userId);

      if (error && previous) {
        set((state) => ({
          reminders: state.reminders.map((item) => (item.habitId === reminder.habitId ? previous : item))
        }));
      }
      return;
    }

    set((state) => ({ reminders: [...state.reminders, reminder] }));

    const { error } = await supabase.from('reminders').insert({
      user_id: userId,
      habit_id: reminder.habitId,
      enabled: reminder.enabled,
      time: reminder.time,
      days_of_week: reminder.daysOfWeek
    });

    if (error) {
      set((state) => ({
        reminders: state.reminders.filter((r) => r.habitId !== reminder.habitId)
      }));
    }
  },

  clearInAppReminderQueue: () => set({ inAppReminderQueue: [] }),

  enqueueInAppReminder: (habitId) => {
    const queue = get().inAppReminderQueue;
    if (queue.includes(habitId)) { return; }
    set({ inAppReminderQueue: [...queue, habitId] });
  },

  completeOnboarding: () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    set({ onboardingDone: true });
  },

  exportAllData: () => {
    const state = get();
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits: state.habits,
      entries: state.entries,
      reminders: state.reminders,
    };
    return JSON.stringify(data, null, 2);
  },

  importAllData: async (json: string) => {
    const userId = get().userId;
    if (!userId) { throw new Error('Пользователь не авторизован'); }

    let data: { version: number; habits: Habit[]; entries: HabitEntry[]; reminders: Reminder[] };
    try {
      data = JSON.parse(json);
    } catch {
      throw new Error('Неверный формат JSON');
    }

    if (!data.version || !Array.isArray(data.habits) || !Array.isArray(data.entries) || !Array.isArray(data.reminders)) {
      throw new Error('Неверная структура данных');
    }

    await supabase.from('habit_entries').delete().eq('user_id', userId);
    await supabase.from('reminders').delete().eq('user_id', userId);
    await supabase.from('habits').delete().eq('user_id', userId);

    for (const h of data.habits) {
      await supabase.from('habits').insert({
        id: h.id, user_id: userId, title: h.title, color: h.color,
        category: (h as unknown as Record<string, unknown>).category ?? null,
        created_at: h.createdAt, is_archived: h.isArchived,
      });
    }

    for (const e of data.entries) {
      await supabase.from('habit_entries').insert({
        id: e.id, user_id: userId, habit_id: e.habitId, date: e.date,
        status: e.status, note: e.note ?? null,
      });
    }

    for (const r of data.reminders) {
      await supabase.from('reminders').insert({
        user_id: userId, habit_id: r.habitId,
        enabled: r.enabled, time: r.time, days_of_week: r.daysOfWeek,
      });
    }

    await get().loadUserData(userId);
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
