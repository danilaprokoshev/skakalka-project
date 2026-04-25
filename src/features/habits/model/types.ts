export type HabitStatus = 'done' | 'partial' | 'missed';

export interface Habit {
  id: string;
  title: string;
  color: string;
  createdAt: string;
  isArchived: boolean;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string;
  status: HabitStatus;
  note?: string;
}

export interface Reminder {
  habitId: string;
  enabled: boolean;
  time: string;
  daysOfWeek: number[];
}
