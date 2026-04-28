import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toDayKey } from '../../../lib/date';
import { Habit, CATEGORY_LABELS } from '../../habits/model/types';
import { getEntryByHabitAndDay, useActiveHabits, useHabitStore } from '../../habits/model/store';

interface Props {
  selectedDate: Date;
  habits?: Habit[];
}

const MAX_NOTE_CHARS = 500;

export function DailyCheckin({ selectedDate, habits }: Props) {
  const allActiveHabits = useActiveHabits();
  const activeHabits = habits ?? allActiveHabits;
  const entries = useHabitStore((s) => s.entries);
  const toggleHabitDone = useHabitStore((s) => s.toggleHabitDone);
  const setEntryNote = useHabitStore((s) => s.setEntryNote);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);

  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [animatingHabits, setAnimatingHabits] = useState<Set<string>>(new Set());
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [saveTimers, setSaveTimers] = useState<Record<string, ReturnType<typeof setTimeout>>>({});

  const dayKey = toDayKey(selectedDate);
  const dateLabel = format(selectedDate, 'EEEE, d MMMM', { locale: ru });

  const toggle = useCallback(
    (habitId: string) => {
      setAnimatingHabits((prev) => new Set(prev).add(habitId));
      setTimeout(() => {
        setAnimatingHabits((prev) => {
          const next = new Set(prev);
          next.delete(habitId);
          return next;
        });
      }, 200);
      toggleHabitDone(habitId, dayKey);
    },
    [toggleHabitDone, dayKey],
  );

  const toggleNotes = (habitId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(habitId)) next.delete(habitId);
      else next.add(habitId);
      return next;
    });
  };

  const handleNoteChange = (habitId: string, value: string) => {
    if (value.length > MAX_NOTE_CHARS) return;
    setNoteDrafts((prev) => ({ ...prev, [habitId]: value }));

    if (saveTimers[habitId]) clearTimeout(saveTimers[habitId]);

    const timer = setTimeout(() => {
      setEntryNote(habitId, dayKey, value);
    }, 500);

    setSaveTimers((prev) => ({ ...prev, [habitId]: timer }));
  };

  if (activeHabits.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Привычки</h2>
        <span style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {dateLabel}
        </span>
      </div>

      <div className="habit-list">
        {activeHabits.map((habit) => {
          const entry = getEntryByHabitAndDay(entries, habit.id, dayKey);
          const isDone = entry?.status === 'done';
          const isAnimating = animatingHabits.has(habit.id);
          const isNotesOpen = expandedNotes.has(habit.id);
          const noteValue = noteDrafts[habit.id] ?? entry?.note ?? '';

          return (
            <div key={habit.id}>
              <div
                className={`habit-card ${isDone ? 'habit-done' : ''} ${isNotesOpen ? 'habit-card-expanded' : ''} ${isAnimating ? 'check-animating' : ''}`}
                onClick={() => toggle(habit.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') toggle(habit.id);
                }}
              >
                <span className="habit-color-dot" style={{ '--dot-color': habit.color } as React.CSSProperties} />
                <span className="habit-card-title">{habit.title}</span>
                {habit.category && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-card-hover)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap' }}>
                    {CATEGORY_LABELS[habit.category]}
                  </span>
                )}
                <span className="habit-card-check">✓</span>
                <span
                  className="habit-card-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNotes(habit.id);
                    }}
                    title="Заметка"
                    style={{ padding: '4px 8px', fontSize: 14, minWidth: 32, minHeight: 32 }}
                  >
                    {isNotesOpen ? '✕' : '📝'}
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveHabit(habit.id);
                    }}
                    title="В архив"
                    style={{ padding: '4px 8px', fontSize: 14, minWidth: 32, minHeight: 32 }}
                  >
                    📦
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Удалить привычку «${habit.title}»?`)) {
                        deleteHabit(habit.id);
                      }
                    }}
                    title="Удалить"
                    style={{ padding: '4px 8px', fontSize: 14, minWidth: 32, minHeight: 32, color: 'var(--danger)' }}
                  >
                    🗑
                  </button>
                </span>
              </div>

              {isNotesOpen && (
                <div className="habit-notes">
                  <textarea
                    rows={3}
                    placeholder="Заметка дня..."
                    value={noteValue}
                    onChange={(e) => handleNoteChange(habit.id, e.target.value)}
                    onBlur={() => {
                      if (noteDrafts[habit.id] !== undefined) {
                        if (saveTimers[habit.id]) clearTimeout(saveTimers[habit.id]);
                        setEntryNote(habit.id, dayKey, noteDrafts[habit.id]);
                      }
                    }}
                  />
                  <div className="char-counter">
                    {noteValue.length}/{MAX_NOTE_CHARS}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
