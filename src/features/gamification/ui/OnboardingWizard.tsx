import { useState } from 'react';

interface Props {
  onComplete: () => void;
  onAddHabit: () => void;
  hasHabits: boolean;
  hasCheckinToday: boolean;
}

const STEPS = [
  {
    title: 'Добро пожаловать в Sage Studio',
    description: 'Твой персональный трекер привычек с поддержкой тренера. Отмечай прогресс каждый день.',
    icon: '✦',
  },
  {
    title: 'Создай первую привычку',
    description: 'Нажми кнопку + чтобы добавить привычку. Это то, что ты хочешь делать регулярно.',
    icon: '+',
  },
  {
    title: 'Отмечайся каждый день',
    description: 'Нажми на карточку привычки — и она засчитается выполненной. Просто, правда?',
    icon: '✓',
  },
  {
    title: 'Готово!',
    description: 'Ты всё настроил. Теперь заходи каждый день, отмечай привычки и следи за прогрессом.',
    icon: '🚀',
  },
];

export function OnboardingWizard({ onComplete, onAddHabit, hasHabits, hasCheckinToday }: Props) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (step === 1 && !hasHabits) {
      onAddHabit();
      return;
    }
    if (isLast) {
      onComplete();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease',
          padding: 32,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16, animation: 'check-pop 600ms ease' }}>
          {current.icon}
        </div>
        <h2 style={{ marginBottom: 8 }}>{current.title}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          {current.description}
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i === step ? 'var(--primary)' : 'var(--border)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {step > 0 && step < 3 && (
            <button className="btn btn-secondary" onClick={() => setStep((s) => s - 1)}>
              Назад
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleNext}
            style={{ minWidth: 140 }}
          >
            {step === 1 && !hasHabits ? 'Добавить привычку' : isLast ? 'Начать' : 'Далее'}
          </button>
        </div>
      </div>
    </div>
  );
}
