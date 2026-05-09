import { useState, useEffect, useCallback, useMemo } from 'react';
import { addDays, isToday, subDays, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toDayKey } from '../lib/date';
import { useHabitStore, useActiveHabits, useArchivedHabits, calculateCurrentStreak, calculateCompletionRate } from '../features/habits/model/store';
import { HabitCategory, CATEGORIES, CATEGORY_LABELS } from '../features/habits/model/types';
import { useAuth } from '../features/auth/ui/AuthProvider';
import { useProfileStore } from '../features/profile/model/store';
import { HabitForm } from '../features/habits/ui/HabitForm';
import { DailyCheckin } from '../features/checkin/ui/DailyCheckin';
import { CalendarWidget } from '../features/calendar/ui/CalendarWidget';
import { StatsRow } from '../features/stats/ui/StatsRow';
import {
  shouldShowInAppReminder,
  dispatchReminder,
  markReminderAsDelivered,
  supportsNotifications,
} from '../features/reminders/lib/notifications';
import { getUnlockedBadges, checkNewBadges, Badge, BADGES } from '../features/gamification/model/badges';
import { OnboardingWizard } from '../features/gamification/ui/OnboardingWizard';

const REMINDER_INTERVAL_MS = 30_000;

export function DashboardPage() {
  const { user } = useAuth();
  const activeHabits = useActiveHabits();
  const archivedHabits = useArchivedHabits();
  const reminders = useHabitStore((s) => s.reminders);
  const entries = useHabitStore((s) => s.entries);
  const createHabit = useHabitStore((s) => s.createHabit);
  const restoreHabit = useHabitStore((s) => s.restoreHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const inAppReminderQueue = useHabitStore((s) => s.inAppReminderQueue);
  const clearInAppReminderQueue = useHabitStore((s) => s.clearInAppReminderQueue);
  const enqueueInAppReminder = useHabitStore((s) => s.enqueueInAppReminder);
  const onboardingDone = useHabitStore((s) => s.onboardingDone);
  const profile = useProfileStore((s) => s.profile);
  const completeOnboarding = useHabitStore((s) => s.completeOnboarding);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<'none' | 'create' | 'tap' | 'done'>('none');
  const [categoryFilter, setCategoryFilter] = useState<HabitCategory | ''>('');
  const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>(() =>
    BADGES.filter((b) => getUnlockedBadges().has(b.id)),
  );
  const [newBadge, setNewBadge] = useState<Badge | null>(null);

  const dayKey = toDayKey(selectedDate);
  const todayEntries = useMemo(
    () => entries.filter((e) => e.date === toDayKey(new Date())),
    [entries],
  );

  const filteredHabits = useMemo(
    () => (categoryFilter ? activeHabits.filter((h) => h.category === categoryFilter) : activeHabits),
    [activeHabits, categoryFilter],
  );

  const noHabits = activeHabits.length === 0 && archivedHabits.length === 0;

  const firstHabitName = profile?.firstName || user?.email?.split('@')[0] || 'друг';

  useEffect(() => {
    if (onboardingDone) {
      setOnboardingStep('done');
      return;
    }
    if (noHabits) {
      setOnboardingStep('create');
    } else if (todayEntries.length === 0) {
      setOnboardingStep('tap');
    } else {
      setOnboardingStep('done');
    }
  }, [onboardingDone, noHabits, todayEntries.length]);

  useEffect(() => {
    const habitMap = new Map(activeHabits.map((h) => [h.id, h.title]));

    const intervalId = setInterval(() => {
      const now = new Date();
      const hasSupport = supportsNotifications();

      reminders.forEach((reminder) => {
        if (shouldShowInAppReminder(reminder, now)) {
          const title = habitMap.get(reminder.habitId);
          if (title) {
            enqueueInAppReminder(reminder.habitId);
            if (hasSupport) {
              dispatchReminder(title);
            }
            markReminderAsDelivered(reminder.habitId, now);
          }
        }
      });
    }, REMINDER_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [activeHabits, reminders, enqueueInAppReminder]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleCreateHabit = useCallback(
    async (title: string, color: string, category?: HabitCategory) => {
      await createHabit(title, color, category);
      setShowAddForm(false);

      if (!onboardingDone && activeHabits.length === 0) {
        setOnboardingStep('tap');
      }
    },
    [createHabit, onboardingDone, activeHabits.length],
  );

  const handleFirstCheckin = useCallback(() => {
    if (!onboardingDone && todayEntries.length === 0) {
      showToast('Отлично! Так держать');
      completeOnboarding();
    }
  }, [onboardingDone, todayEntries.length, showToast, completeOnboarding]);

  const goBack = () => setSelectedDate((prev) => subDays(prev, 1));
  const goForward = () => setSelectedDate((prev) => addDays(prev, 1));

  const checkBadges = useCallback(() => {
    const maxStreak = Math.max(0, ...activeHabits.map((h) => calculateCurrentStreak(entries, h.id)));
    const hasPerfectWeek = activeHabits.some((h) => calculateCompletionRate(entries, h.id, 7) === 100);
    const newBadges = checkNewBadges({ activeHabitsCount: activeHabits.length, maxStreak, hasPerfectWeek });
    if (newBadges.length > 0) {
      setUnlockedBadges((prev) => [...prev, ...newBadges]);
      setNewBadge(newBadges[0]);
      setTimeout(() => setNewBadge(null), 4000);
    }
  }, [activeHabits, entries]);

  useEffect(() => {
    if (activeHabits.length > 0) checkBadges();
  }, [activeHabits.length, entries.length, checkBadges]);

  return (
    <div className="stack-lg">
      {/* Onboarding Wizard */}
      {!onboardingDone && (
        <OnboardingWizard
          onComplete={() => completeOnboarding()}
          onAddHabit={() => setShowAddForm(true)}
          hasHabits={activeHabits.length > 0}
          hasCheckinToday={todayEntries.length > 0}
        />
      )}

      {/* Hero */}
      <div className="hero">
        <h1 className="hero-greeting">
          Привет, {firstHabitName}
        </h1>
        <p className="hero-date">
          {format(new Date(), 'd MMMM yyyy', { locale: ru })} ·{' '}
          {activeHabits.length > 0
            ? `${activeHabits.length} ${activeHabits.length === 1 ? 'привычка' : activeHabits.length < 5 ? 'привычки' : 'привычек'}`
            : 'добавь первую привычку'}
        </p>
      </div>

      {/* Badge Display */}
      {unlockedBadges.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 }}>
          {unlockedBadges.map((badge) => (
            <span
              key={badge.id}
              title={`${badge.name}: ${badge.description}`}
              style={{
                fontSize: 24,
                cursor: 'help',
                filter: 'drop-shadow(0 0 4px rgba(154,171,143,0.3))',
              }}
            >
              {badge.icon}
            </span>
          ))}
        </div>
      )}

      {/* Onboarding: Create first habit */}
      {onboardingStep === 'create' && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span className="onboarding-hint">Создай первую привычку</span>
        </div>
      )}

      {/* Onboarding: Tap to check-in */}
      {onboardingStep === 'tap' && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span className="onboarding-hint">Нажми на карточку, чтобы отметить</span>
        </div>
      )}

      {/* Stats Row */}
      {activeHabits.length > 0 && <StatsRow />}

      {/* Date Navigator */}
      {activeHabits.length > 0 && (
        <div className="date-nav">
          <button className="date-nav-arrow" onClick={goBack} aria-label="Предыдущий день">
            ◀
          </button>
          <span className="date-nav-label">
            {format(selectedDate, 'EEEE, d MMMM', { locale: ru })}
          </span>
          <button
            className="date-nav-arrow"
            onClick={goForward}
            disabled={isToday(selectedDate)}
            aria-label="Следующий день"
          >
            ▶
          </button>
        </div>
      )}

      {/* Reminder Banner */}
      {inAppReminderQueue.length > 0 && (
        <div className="banner">
          <span>
            Напоминание:{' '}
            {inAppReminderQueue
              .map((hid) => activeHabits.find((h) => h.id === hid)?.title ?? hid)
              .join(', ')}
          </span>
          <button className="banner-dismiss" onClick={clearInAppReminderQueue}>
            OK
          </button>
        </div>
      )}

      {/* Empty State: No habits at all */}
      {noHabits && (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <h2 className="empty-title">Добавь первую привычку</h2>
          <p className="empty-text">
            Отмечай ежедневные действия и отслеживай прогресс вместе с тренером
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            + Создать привычку
          </button>
        </div>
      )}

      {/* Add Habit Form */}
      {(showAddForm || editingHabitId) && (
        <div className="inline-form">
          <HabitForm
            initialTitle={
              editingHabitId
                ? activeHabits.find((h) => h.id === editingHabitId)?.title
                : undefined
            }
            initialColor={
              editingHabitId
                ? activeHabits.find((h) => h.id === editingHabitId)?.color
                : undefined
            }
            initialCategory={
              editingHabitId
                ? activeHabits.find((h) => h.id === editingHabitId)?.category
                : undefined
            }
            submitLabel={editingHabitId ? 'Сохранить' : 'Создать'}
            onSubmit={async (title, color, category) => {
              if (editingHabitId) {
                await updateHabit(editingHabitId, title, color, category);
                setEditingHabitId(null);
              } else {
                await handleCreateHabit(title, color, category);
              }
            }}
            onCancel={() => {
              setShowAddForm(false);
              setEditingHabitId(null);
            }}
          />
        </div>
      )}

      {/* Add habit button */}
      {!noHabits && !showAddForm && !editingHabitId && (
        <div style={{ textAlign: 'center' }}>
          <button
            className={`btn-add${onboardingStep === 'create' ? ' pulse' : ''}`}
            onClick={() => setShowAddForm(true)}
            title="Добавить привычку"
          >
            +
          </button>
        </div>
      )}

      {/* Category Filter */}
      {activeHabits.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`btn ${categoryFilter === cat.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategoryFilter(cat.value as HabitCategory | '')}
              style={{ padding: '4px 12px', fontSize: 12 }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Habit Check-in List */}
      {activeHabits.length > 0 && (
        <DailyCheckin selectedDate={selectedDate} habits={categoryFilter ? filteredHabits : undefined} />
      )}

      {/* Empty state: no entries for selected date */}
      {activeHabits.length > 0 && filteredHabits.every((h) => {
        const e = entries.find((entry) => entry.habitId === h.id && entry.date === dayKey);
        return !e;
      }) && dayKey === toDayKey(new Date()) && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
          Ты ещё не отметил ни одной привычки сегодня
        </p>
      )}

      {/* Archived Habits */}
      {archivedHabits.length > 0 && (
        <div className="archived-section">
          <h3 style={{ marginBottom: 'var(--gap-list)' }}>Архив</h3>
          {archivedHabits.map((habit) => (
            <div key={habit.id} className="habit-card" style={{ opacity: 0.6 }}>
              <span
                className="habit-color-dot"
                style={{ '--dot-color': habit.color } as React.CSSProperties}
              />
              <span className="habit-card-title">{habit.title}</span>
              <span className="habit-card-actions" style={{ opacity: 1 }}>
                <button
                  className="btn-ghost"
                  onClick={() => restoreHabit(habit.id)}
                  style={{ padding: '4px 8px', fontSize: 14, minWidth: 32, minHeight: 32 }}
                >
                  ↩
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    if (confirm(`Удалить привычку «${habit.title}» навсегда?`)) {
                      deleteHabit(habit.id);
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: 14,
                    minWidth: 32,
                    minHeight: 32,
                    color: 'var(--danger)',
                  }}
                >
                  🗑
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Widget */}
      {activeHabits.length > 0 && (
        <CalendarWidget
          selectedDate={dayKey}
          onDateSelect={(date) => {
            setSelectedDate(new Date(date + 'T00:00:00'));
          }}
        />
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Badge Celebration */}
      {newBadge && (
        <div className="toast" style={{ bottom: 150 }}>
          {newBadge.icon} {newBadge.name} — {newBadge.description}!
        </div>
      )}
    </div>
  );
}
