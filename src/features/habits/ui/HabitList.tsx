import { useMemo, useState } from 'react';
import { HabitForm } from './HabitForm';
import { useActiveHabits, useArchivedHabits, useHabitStore } from '../model/store';

export const HabitList = (): JSX.Element => {
  const activeHabits = useActiveHabits();
  const archivedHabits = useArchivedHabits();
  const createHabit = useHabitStore((state) => state.createHabit);
  const updateHabit = useHabitStore((state) => state.updateHabit);
  const archiveHabit = useHabitStore((state) => state.archiveHabit);
  const restoreHabit = useHabitStore((state) => state.restoreHabit);
  const deleteHabit = useHabitStore((state) => state.deleteHabit);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const editingHabit = useMemo(() => activeHabits.find((habit) => habit.id === editingId), [activeHabits, editingId]);

  return (
    <section className="stack">
      <h2>Создание и управление привычками</h2>
      {error ? <div className="banner">{error}</div> : null}
      <HabitForm
        onSubmit={async (title, color) => {
          try {
            await createHabit(title, color);
            setError('');
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Не удалось добавить привычку');
          }
        }}
        submitLabel="Добавить привычку"
      />

      <div className="stack">
        <h3>Активные привычки ({activeHabits.length})</h3>
        {activeHabits.length === 0 ? <p className="card">Пока нет активных привычек. Добавьте первую выше.</p> : null}
        {activeHabits.map((habit) => (
          <article className="card" key={habit.id}>
            <div className="habit-row">
              <div className="habit-title-wrap">
                <span className="dot" style={{ backgroundColor: habit.color }} />
                <strong>{habit.title}</strong>
              </div>
              <div className="button-row compact">
                <button type="button" className="ghost" onClick={() => setEditingId(habit.id)}>
                  Изменить
                </button>
                <button type="button" className="ghost" onClick={() => archiveHabit(habit.id)}>
                  В архив
                </button>
                <button type="button" className="danger" onClick={() => deleteHabit(habit.id)}>
                  Удалить
                </button>
              </div>
            </div>
            {editingHabit?.id === habit.id ? (
              <HabitForm
                initialTitle={habit.title}
                initialColor={habit.color}
                submitLabel="Сохранить"
                onSubmit={(title, color) => {
                  updateHabit(habit.id, title, color);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : null}
          </article>
        ))}
      </div>

      <div className="stack">
        <h3>Архивные привычки ({archivedHabits.length})</h3>
        {archivedHabits.map((habit) => (
          <article className="card" key={habit.id}>
            <div className="habit-row">
              <div className="habit-title-wrap">
                <span className="dot" style={{ backgroundColor: habit.color }} />
                <strong>{habit.title}</strong>
              </div>
              <div className="button-row compact">
                <button type="button" className="ghost" onClick={() => restoreHabit(habit.id)}>
                  Восстановить
                </button>
                <button type="button" className="danger" onClick={() => deleteHabit(habit.id)}>
                  Удалить
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
