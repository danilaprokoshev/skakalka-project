# Puls Wave 2 — UX Voice & Copywriting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести тексты в Puls в соответствие с манифестом «Мы делаем каждое утро» — клубный тон, «голос тренера» в ключевых точках.

**Architecture:** Только текстовые изменения в 5 файлах. Никакой новой логики, новых компонентов, новых хуков. Изменения изолированы: каждый файл правится и коммитится отдельно.

**Tech Stack:** React 18, TypeScript, Vite. Тестовый фреймворк отсутствует. Верификация: `npx tsc -b --noEmit` (тайпчек) + визуальная проверка в браузере (`npm run dev`).

---

## Карта изменений

| Файл | Что меняется |
|---|---|
| `src/features/gamification/ui/OnboardingWizard.tsx` | Тексты 4 шагов онбординга |
| `src/pages/DashboardPage.tsx` | Empty states, тост первого чек-ина, subtitle hero |
| `src/features/gamification/model/badges.ts` | Описания всех 6 бейджей |
| `src/pages/LoginPage.tsx` | Подзаголовок страницы входа |
| `src/pages/RegisterPage.tsx` | Подзаголовок страницы регистрации |
| `src/pages/WorkoutsPage.tsx` | Клиентский empty state тренировок |

---

## Task 1: Онбординг — обновить тексты 4 шагов

**Files:**
- Modify: `src/features/gamification/ui/OnboardingWizard.tsx:10-31`

Текущий массив `STEPS` — безличный и описательный. Переходим на клубный тон: шаг 1 — «добро пожаловать в клуб», шаг 4 — «голос тренера».

- [ ] **Step 1: Заменить массив `STEPS`**

Найди в файле `src/features/gamification/ui/OnboardingWizard.tsx` строки 10–31 (объявление `const STEPS`) и замени целиком:

```typescript
const STEPS = [
  {
    title: 'Добро пожаловать в клуб',
    description: 'Мы делаем каждое утро — привычки, тренировки и люди, которые встают вместе с тобой.',
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
    title: 'Готово. Увидимся утром.',
    description: 'Первый шаг — это не мелочь. Заходи каждый день и отмечай. Мы рядом.',
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

Открыть `http://localhost:5173`, войти в аккаунт у которого `sk-onboarding-done` не установлен (или сбросить в DevTools → Application → Local Storage → удалить `sk-onboarding-done`). Проверить, что 4 шага отображают новые тексты.

- [ ] **Step 4: Коммит**

```bash
git add src/features/gamification/ui/OnboardingWizard.tsx
git commit -m "copy: update onboarding steps to club tone"
```

---

## Task 2: Dashboard — empty states и тост первого чек-ина

**Files:**
- Modify: `src/pages/DashboardPage.tsx` (строки 125, 163–170, 248–254, 334)

Четыре точки: тост после первого чек-ина, subtitle в hero при отсутствии привычек, главный empty state, подсказка «ещё не отметил».

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
            Одна привычка достаточно, чтобы начать. Клуб уже делает своё.
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
          Ещё есть время. Мы делаем каждое утро.
```

- [ ] **Step 5: Тайпчек**

```bash
npx tsc -b --noEmit
```

Ожидание: 0 ошибок.

- [ ] **Step 6: Визуальная проверка**

Открыть `http://localhost:5173`. Проверить три состояния:
1. Нет привычек → empty state «Начни с одного».
2. Привычки есть, сегодня не отмечено → подсказка «Ещё есть время…».
3. Сделать первый чек-ин в чистом аккаунте → тост «Первый шаг — это не мелочь…».

- [ ] **Step 7: Коммит**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "copy: update dashboard empty states and first checkin toast"
```

---

## Task 3: Бейджи — описания под клубный тон

**Files:**
- Modify: `src/features/gamification/model/badges.ts:10-16`

Бейджи сейчас описывают условие разблокировки («7 дней подряд»). Переходим на «голос тренера» — короткое, честное, без пафоса. Иконки и цвета не трогаем. Бейдж «Коллекция» переименовываем в «Системный».

- [ ] **Step 1: Заменить массив `BADGES`**

Найди в файле `src/features/gamification/model/badges.ts` строки 10–16 и замени:

```typescript
export const BADGES: Badge[] = [
  { id: 'first-habit', name: 'Первый шаг', description: 'Ты в клубе. Начало положено.', icon: '✦', color: '#9aab8f' },
  { id: 'streak-7', name: 'Неделя', description: '7 утренних чек-инов подряд. Большинство сдаётся раньше.', icon: '🌱', color: '#9aab8f' },
  { id: 'streak-30', name: 'Месяц', description: '30 дней без паузы. Это уже часть тебя.', icon: '🔥', color: '#e8a850' },
  { id: 'streak-100', name: 'Сотня', description: '100 дней. Ты не человек — ты ритм.', icon: '💯', color: '#c77dff' },
  { id: 'five-habits', name: 'Системный', description: '5 привычек в режиме. Ты строишь систему.', icon: '📚', color: '#9aab8f' },
  { id: 'perfect-week', name: 'Идеальная неделя', description: '7 из 7. Без пропусков, без оправданий.', icon: '⭐', color: '#e8a850' },
];
```

- [ ] **Step 2: Тайпчек**

```bash
npx tsc -b --noEmit
```

Ожидание: 0 ошибок.

- [ ] **Step 3: Визуальная проверка**

Открыть `http://localhost:5173` → Dashboard. Навести на разблокированный бейдж — проверить tooltip с новым описанием. Если нет разблокированных бейджей, временно добавить id в localStorage: DevTools → Application → Local Storage → `sk-badges` → `["first-habit"]`.

- [ ] **Step 4: Коммит**

```bash
git add src/features/gamification/model/badges.ts
git commit -m "copy: rewrite badge descriptions to club voice"
```

---

## Task 4: Login и Register — подзаголовки

**Files:**
- Modify: `src/pages/LoginPage.tsx:38`
- Modify: `src/pages/RegisterPage.tsx:49`

Подзаголовки сейчас нейтральные («Войдите, чтобы продолжить» / «Создайте аккаунт»). Добавляем клубный оттенок.

- [ ] **Step 1: LoginPage — подзаголовок (строка 38)**

Найди:
```tsx
        <p className="auth-subtitle">Войдите, чтобы продолжить</p>
```

Замени на:
```tsx
        <p className="auth-subtitle">Войди в клуб</p>
```

- [ ] **Step 2: RegisterPage — подзаголовок (строка 49)**

Найди:
```tsx
        <p className="auth-subtitle">Создайте аккаунт</p>
```

Замени на:
```tsx
        <p className="auth-subtitle">Присоединись к клубу</p>
```

- [ ] **Step 3: Тайпчек**

```bash
npx tsc -b --noEmit
```

Ожидание: 0 ошибок.

- [ ] **Step 4: Визуальная проверка**

Открыть `http://localhost:5173/login` и `http://localhost:5173/register` (в режиме инкогнито или разлогиненным). Проверить новые подзаголовки под брендом «Puls».

- [ ] **Step 5: Коммит**

```bash
git add src/pages/LoginPage.tsx src/pages/RegisterPage.tsx
git commit -m "copy: update login/register subtitles to club tone"
```

---

## Task 5: Workouts — клиентский empty state

**Files:**
- Modify: `src/pages/WorkoutsPage.tsx:228-234`

Текущий текст — пассивный («следи за анонсами»). Перенаправляем внимание на привычки как на то, чем можно заниматься прямо сейчас.

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
            Пока работай над привычками — тренер скоро добавит контент.
```

- [ ] **Step 2: Тайпчек**

```bash
npx tsc -b --noEmit
```

Ожидание: 0 ошибок.

- [ ] **Step 3: Визуальная проверка**

Открыть `http://localhost:5173/workouts` под клиентским аккаунтом (без флага `isTrainer`). Убедиться что отображается новый empty state.

- [ ] **Step 4: Коммит**

```bash
git add src/pages/WorkoutsPage.tsx
git commit -m "copy: update workouts client empty state"
```

---

## Самопроверка плана

**Покрытие спека:**
- «Добро пожаловать в клуб» → Task 1, шаг 1 ✅
- «Голос тренера» в ключевых точках → Task 1 (онбординг шаг 4) + Task 2 (тост) ✅
- Empty states под манифест → Task 2 ✅
- Бейджи под клубный тон → Task 3 ✅
- Логин/регистрация → Task 4 ✅
- Workouts empty state → Task 5 ✅

**Placeholder-сканирование:** нет TBD, нет TODO, каждый шаг содержит конкретный код.

**Консистентность типов:** все изменения строковые, типы не затронуты.
