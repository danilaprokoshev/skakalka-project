import { FormEvent, useState } from 'react';

interface HabitFormProps {
  onSubmit: (title: string, color: string) => void;
  initialTitle?: string;
  initialColor?: string;
  submitLabel: string;
  onCancel?: () => void;
}

const defaultColors = ['#818cf8', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4', '#a78bfa'];

export const HabitForm = ({ onSubmit, submitLabel, initialTitle = '', initialColor = defaultColors[0], onCancel }: HabitFormProps): JSX.Element => {
  const [title, setTitle] = useState(initialTitle);
  const [color, setColor] = useState(initialColor);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }

    onSubmit(trimmed, color);
    setTitle('');
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <label>
        Название привычки
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например: Пить воду" maxLength={60} />
      </label>

      <label>
        Цвет
        <div className="color-row">
          {defaultColors.map((swatch) => (
            <button
              type="button"
              key={swatch}
              className={`color-swatch ${color === swatch ? 'selected' : ''}`}
              style={{ backgroundColor: swatch }}
              onClick={() => setColor(swatch)}
              aria-label={`Выбрать цвет ${swatch}`}
            />
          ))}
        </div>
      </label>

      <div className="button-row">
        <button type="submit">{submitLabel}</button>
        {onCancel ? (
          <button type="button" className="ghost" onClick={onCancel}>
            Отмена
          </button>
        ) : null}
      </div>
    </form>
  );
};
