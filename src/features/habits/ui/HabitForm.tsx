import { FormEvent, useState } from 'react';
import { HabitCategory, CATEGORIES } from '../model/types';

interface HabitFormProps {
  onSubmit: (title: string, color: string, category?: HabitCategory) => void | Promise<void>;
  initialTitle?: string;
  initialColor?: string;
  initialCategory?: HabitCategory;
  submitLabel: string;
  onCancel?: () => void;
}

const defaultColors = ['#818cf8', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4', '#a78bfa'];

export const HabitForm = ({
  onSubmit,
  submitLabel,
  initialTitle = '',
  initialColor = defaultColors[0],
  initialCategory,
  onCancel,
}: HabitFormProps): JSX.Element => {
  const [title, setTitle] = useState(initialTitle);
  const [color, setColor] = useState(initialColor);
  const [category, setCategory] = useState<HabitCategory | ''>(initialCategory ?? '');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await onSubmit(trimmed, color, (category || undefined) as HabitCategory | undefined);
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Название привычки</label>
        <input
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Пить воду"
          maxLength={60}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Категория</label>
        <select
          className="form-input"
          value={category}
          onChange={(e) => setCategory(e.target.value as HabitCategory | '')}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Цвет</label>
        <div className="color-row">
          {defaultColors.map((swatch) => (
            <button
              type="button"
              key={swatch}
              className={`color-swatch${color === swatch ? ' selected' : ''}`}
              style={{ backgroundColor: swatch }}
              onClick={() => setColor(swatch)}
              aria-label={`Выбрать цвет ${swatch}`}
            />
          ))}
        </div>
      </div>

      <div className="button-row">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
};
