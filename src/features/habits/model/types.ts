export type HabitStatus = 'done';

export type HabitCategory = 'fitness' | 'nutrition' | 'sleep' | 'mental' | 'other';

export const CATEGORIES: { value: HabitCategory | ''; label: string; icon: string }[] = [
  { value: '', label: 'Без категории', icon: '' },
  { value: 'fitness', label: 'Фитнес', icon: '' },
  { value: 'nutrition', label: 'Питание', icon: '' },
  { value: 'sleep', label: 'Сон', icon: '' },
  { value: 'mental', label: 'Ментальное', icon: '' },
  { value: 'other', label: 'Другое', icon: '' },
];

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  fitness: 'Фитнес',
  nutrition: 'Питание',
  sleep: 'Сон',
  mental: 'Ментальное',
  other: 'Другое',
};

export interface Habit {
  id: string;
  title: string;
  color: string;
  category?: HabitCategory;
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

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  aboutMe: string;
  biggestGoal: string;
  createdAt: string;
}
