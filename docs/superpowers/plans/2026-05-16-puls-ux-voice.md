# Puls Wave 2 — Голос тренера: копирайт Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить безличные UI-тексты на короткие живые фразы с голосом тренера — так, чтобы приложение звучало как человек, а не как продукт.

**Architecture:** Только текстовые изменения в 4 файлах. Никакой новой логики, новых компонентов, новых хуков. Каждый файл правится и коммитится отдельно.

**Tech Stack:** React 18, TypeScript, Vite. Тестовый фреймворк отсутствует. Верификация: `npx tsc -b --noEmit` (тайпчек) + визуальная проверка в браузере (`npm run dev`).

---

## Карта изменений

| Файл | Что меняется |
|---|---|
| `src/features/gamification/ui/OnboardingWizard.tsx` | Тексты 4 шагов онбординга |
| `src/pages/DashboardPage.tsx` | Empty states, тост первого чек-ина, subtitle hero |
| `src/features/gamification/model/badges.ts` | Описания всех 6 бейджей |
| `src/pages/WorkoutsPage.tsx` | Клиентский empty state тренировок |

---

## Task 1: Онбординг — обновить тексты 4 шагов

**Files:**
- Modify: `src/features/gamification/ui/OnboardingWizard.tsx:10-31`

- [ ] **Step 1: Заменить массив `STEPS`**

Найди в файле `src/features/gamification/ui/OnboardingWizard.tsx` строки 10–31 (объявление `const STEPS`) и замени целиком:

```typescript
const STEPS = [
  {
    title: 'Добро пожаловать в Puls',
    description: 'Один чек-ин в день — и прогресс становится видимым.',
    icon: '✦',
  },
  {
    title: 'Создай первую привычку',
    description: 'Нажми кнопку + чтобы добавить привычку. Одной достаточно, чтобы начать.',
    icon: '+',
  },
  {
    title: 'Отмечайся каждый день',
    description: 'Нажми на карточку — и день засчитан. Без лишних действий.',
    icon: '✓',
  },
  {
    title: 'Готово.',
    description: 'Первый шаг — это не мелочь. Заходи каждый день и отмечай.',
    icon: '🚀',
  },
];
```

- [ ] **Step 2: Тайпчек**

```bash
npx tsc -b --noEmit
```

Ожидание: 0 ошибок.

- [ ] **Step 3: Визуальная проверка**

```bash
npm run dev
```

Открыть `http://localhost:5173`. Сбросить онбординг: DevTools → Application → Local Storage → удалить `sk-onboarding-done`. Перезагрузить страницу, пройти все 4 шага и проверить новые тексты.

- [ ] **Step 4: Коммит**

```bash
git add src/features/gamification/ui/OnboardingWizard.tsx
git commit -m "copy: update onboarding steps to trainer voice"
```

---

## Task 2: Dashboard — empty states и тост первого чек-ина

**Files:**
- Modify: `src/pages/DashboardPage.tsx` (строки 125, 169, 248–254, 334)

- [ ] **Step 1: Тост первого чек-ина (строка 125)**

Найди:
```typescript
showToast('Отлично! Так держать');
```

Замени на:
```typescript
showToast('Первый шаг — это не мелочь. Увидимся завтра.');
```

- [ ] **Step 2: Hero subtitle при отсутствии привычек (строка 169)**

Найди:
```typescript
: 'добавь первую привычку'}
```

Замени на:
```typescript
: 'начни с одного'}
```

- [ ] **Step 3: Главный empty state (строки 248–254)**

Найди:
```tsx
          <h2 className="empty-title">Добавь первую привычку</h2>
          <p className="empty-text">
            Отмечай ежедневные действия и отслеживай прогресс вместе с тренером
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            + Создать привычку
          </button>
```

Замени на:
```tsx
          <h2 className="empty-title">Начни с одного</h2>
          <p className="empty-text">
            Одна привычка достаточно, чтобы начать.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            + Добавить привычку
          </button>
```

- [ ] **Step 4: Подсказка «ещё не отметил» (строка 334)**

Найди:
```typescript
          Ты ещё не отметил ни одной привычки сегодня
```

Замени на:
```typescript
          Ещё есть время.
```

- [ ] **Step 5: Тайпчек**

```bash
npx tsc -b --noEmit
```

Ожидание: 0 ошибок.

- [ ] **Step 6: Визуальная проверка**

Открыть `http://localhost:5173`. Проверить три состояния:
1. Нет привычек → empty state «Начни с одного».
2. Привычки есть, сегодня не отмечено → «Ещё есть время.»
3. Сделать первый чек-ин в чистом аккаунте → тост «Первый шаг — это не мелочь. Увидимся завтра.»

- [ ] **Step 7: Коммит**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "copy: update dashboard empty states and first checkin toast"
```

---

## Task 3: Бейджи — описания под голос тренера

**Files:**
- Modify: `src/features/gamification/model/badges.ts:10-16`

Бейджи сейчас описывают условие разблокировки («7 дней подряд»). Переходим на короткие живые фразы без технических формулировок. Иконки и цвета не трогаем.

- [ ] **Step 1: Заменить массив `BADGES`**

Найди в файле `src/features/gamification/model/badges.ts` строки 10–16 и замени:

```typescript
export const BADGES: Badge[] = [
  { id: 'first-habit', name: 'Первый шаг', description: 'Ты начал. Это уже много.', icon: '✦', color: '#9aab8f' },
  { id: 'streak-7', name: 'Неделя', description: '7 дней подряд. Большинство сдаётся раньше.', icon: '🌱', color: '#9aab8f' },
  { id: 'streak-30', name: 'Месяц', description: '30 дней без паузы. Это уже часть тебя.', icon: '🔥', color: '#e8a850' },
  { id: 'streak-100', name: 'Сотня', description: '100 дней. Ты не человек — ты ритм.', icon: '💯', color: '#c77dff' },
  { id: 'five-habits', name: 'Система', description: '5 привычек в режиме. Ты строишь систему.', icon: '📚', color: '#9aab8f' },
  { id: 'perfect-week', name: 'Идеальная неделя', description: '7 из 7. Без пропусков, без оправданий.', icon: '⭐', color: '#e8a850' },
];
```

- [ ] **Step 2: Тайпчек**

```bash
npx tsc -b --noEmit
```

Ожидание: 0 ошибок.

- [ ] **Step 3: Визуальная проверка**

Открыть `http://localhost:5173` → Dashboard. Навести на разблокированный бейдж — проверить tooltip с новым описанием. Если нет разблокированных бейджей: DevTools → Application → Local Storage → `sk-badges` → установить значение `["first-habit"]`. Перезагрузить и навести.

- [ ] **Step 4: Коммит**

```bash
git add src/features/gamification/model/badges.ts
git commit -m "copy: rewrite badge descriptions to trainer voice"
```

---

## Task 4: Workouts — клиентский empty state

**Files:**
- Modify: `src/pages/WorkoutsPage.tsx:228-234`

- [ ] **Step 1: Заменить клиентский empty state**

Найди в файле `src/pages/WorkoutsPage.tsx`:
```tsx
          <h3 className="empty-title">Скоро здесь будут тренировки</h3>
          <p className="empty-text">
            Видео-тренировки с твоим тренером появятся здесь.
            Следи за анонсами!
```

Замени на:
```tsx
          <h3 className="empty-title">Тренировки скоро появятся</h3>
          <p className="empty-text">
            Пока работай над привычками — это тоже тренировка.
```

- [ ] **Step 2: Тайпчек**

```bash
npx tsc -b --noEmit
```

Ожидание: 0 ошибок.

- [ ] **Step 3: Визуальная проверка**

Открыть `http://localhost:5173/workouts` под клиентским аккаунтом (без флага `isTrainer`). Убедиться, что отображается новый empty state.

- [ ] **Step 4: Коммит**

```bash
git add src/pages/WorkoutsPage.tsx
git commit -m "copy: update workouts client empty state"
```

---

## Самопроверка плана

**Покрытие:**
- Голос тренера в онбординге → Task 1 ✅
- Голос тренера в ключевых точках dashboard → Task 2 ✅
- Бейджи с живыми описаниями → Task 3 ✅
- Workouts empty state → Task 4 ✅
- Клубные отсылки: отсутствуют ✅

**Placeholder-сканирование:** нет TBD, нет TODO, каждый шаг содержит конкретный код.

**Консистентность типов:** все изменения строковые, типы не затронуты.
