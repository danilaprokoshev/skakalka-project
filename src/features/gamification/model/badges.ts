export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const BADGES: Badge[] = [
  { id: 'first-habit', name: 'Первый шаг', description: 'Создана первая привычка', icon: '✦', color: '#9aab8f' },
  { id: 'streak-7', name: 'Неделя', description: '7 дней подряд', icon: '🌱', color: '#9aab8f' },
  { id: 'streak-30', name: 'Месяц', description: '30 дней подряд', icon: '🔥', color: '#e8a850' },
  { id: 'streak-100', name: 'Сотня', description: '100 дней подряд', icon: '💯', color: '#c77dff' },
  { id: 'five-habits', name: 'Коллекция', description: '5 активных привычек', icon: '📚', color: '#9aab8f' },
  { id: 'perfect-week', name: 'Идеальная неделя', description: '100% за 7 дней по любой привычке', icon: '⭐', color: '#e8a850' },
];

const STORAGE_KEY = 'sk-badges';

export function getUnlockedBadges(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored) as string[]);
  } catch {
    return new Set();
  }
}

export function saveUnlockedBadges(badges: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...badges]));
}

interface BadgeCheckInput {
  activeHabitsCount: number;
  maxStreak: number;
  hasPerfectWeek: boolean;
}

export function checkNewBadges(input: BadgeCheckInput): Badge[] {
  const unlocked = getUnlockedBadges();
  const newBadges: Badge[] = [];

  const checks: { id: string; condition: boolean }[] = [
    { id: 'first-habit', condition: input.activeHabitsCount >= 1 },
    { id: 'streak-7', condition: input.maxStreak >= 7 },
    { id: 'streak-30', condition: input.maxStreak >= 30 },
    { id: 'streak-100', condition: input.maxStreak >= 100 },
    { id: 'five-habits', condition: input.activeHabitsCount >= 5 },
    { id: 'perfect-week', condition: input.hasPerfectWeek },
  ];

  for (const check of checks) {
    if (check.condition && !unlocked.has(check.id)) {
      unlocked.add(check.id);
      const badge = BADGES.find((b) => b.id === check.id);
      if (badge) newBadges.push(badge);
    }
  }

  if (newBadges.length > 0) {
    saveUnlockedBadges(unlocked);
  }

  return newBadges;
}
