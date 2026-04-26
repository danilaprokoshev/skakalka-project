# Трекер привычек

Многопользовательский трекер привычек с аутентификацией и хранением данных в облаке.

**Продакшен:** https://skakalka-project.vercel.app

---

## Стек

- **Фронтенд:** React 18 + Vite + TypeScript + React Router
- **Стейт:** Zustand (оптимистичный кеш)
- **Бэкенд:** Supabase (PostgreSQL + аутентификация + RLS)
- **Хостинг:** Vercel

## Возможности

- Регистрация и вход по email/паролю (Supabase Auth)
- Создание, редактирование, архивирование и удаление привычек
- Ежедневный чек-ин: отметка `done`, `partial`, `missed` + заметки
- Календарь прогресса за месяц (цветовые метки)
- Статистика: текущая серия, лучшая серия, % за 7 и 30 дней
- Настройка напоминаний по дням недели и времени

## Архитектура

```
src/
  main.tsx                     — входная точка, AuthProvider + RouterProvider
  app/router.tsx               — маршруты (/login, /register, /habits, ...)
  components/
    AppLayout.tsx              — оболочка: шапка, навигация, кнопка выхода
    AuthGuard.tsx              — защита маршрутов (редирект на /login без авторизации)
  features/
    auth/ui/AuthProvider.tsx   — контекст аутентификации (Supabase)
    habits/model/
      store.ts                 — Zustand store: CRUD через Supabase + кеш
      types.ts                 — Habit, HabitEntry, Reminder, HabitStatus
    habits/ui/                 — HabitForm, HabitList
    checkin/ui/DailyCheckin.tsx
    calendar/ui/ProgressCalendar.tsx
    stats/ui/StatsDashboard.tsx
    reminders/lib/notifications.ts
  lib/
    supabase.ts                — клиент Supabase
    date.ts                    — утилита toDayKey (date-fns)
  pages/
    LoginPage.tsx
    RegisterPage.tsx
    DashboardPage.tsx
    HabitsPage.tsx
    CalendarPage.tsx
    SettingsPage.tsx
  styles.css                   — все стили (plain CSS, BEM-подобный)
supabase/schema.sql            — схема БД (таблицы, индексы, RLS)
```

## Разработка

### Требования

- Node.js 20+
- npm

### Первый запуск

```bash
git clone <repo-url> && cd skakalka-project

cp .env.example .env
# ← отредактируй .env: укажи VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY

npm install
npm run dev    # http://localhost:5173
```

### Команды

| Команда | Что делает |
|---------|------------|
| `npm run dev` | Запуск Vite dev-сервера (HMR) |
| `npm run build` | `tsc -b && vite build` — сборка для продакшена |
| `npm run preview` | Просмотр собранного продакшен-бандла локально |
| `npx tsc -b --noEmit` | Только проверка типов |

### Style guide

- Все экспорты именованные (`export const ...`), без `export default`
- Стили в `src/styles.css` — plain CSS, классы вида `.card`, `.stack`, `.button-row`
- Формат дат через `date-fns`, ключ `yyyy-MM-dd` через `toDayKey()`
- ID генерируются через `crypto.randomUUID()`

### Локальная БД

По умолчанию приложение подключается к облачному Supabase. Укажи свои ключи в `.env`. Для изолированной разработки можно создать отдельный Supabase-проект или использовать локальный Supabase CLI.

### Сброс базы данных

В папке `supabase/` есть два SQL-скрипта для работы с данными:

| Скрипт | Назначение |
|--------|------------|
| `clear_data.sql` | Обнуляет данные (TRUNCATE), структура сохраняется |
| `reset_schema.sql` | Полный сброс: удаление таблиц и пересоздание по `schema.sql` |

Оба скрипта запускаются в **SQL Editor** в Supabase Dashboard (секция SQL).

## Развёртывание (Vercel)

Деплой через Vercel CLI. Один раз после клонирования нужно залогиниться:

```bash
npx -p vercel vercel login   # откроет браузер, авторизация через email/GitHub
```

Далее — обычный цикл:

```bash
# 1. Внести изменения в код
# 2. Закоммитить
git add -A && git commit -m "описание изменений"

# 3. Задеплоить
npx -p vercel vercel --prod --yes
```

При первом деплое Vercel создаст проект и свяжет его с директорией (файл `.vercel/`). Переменные окружения (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) нужно добавить один раз:

```bash
npx -p vercel vercel env add VITE_SUPABASE_URL production
npx -p vercel vercel env add VITE_SUPABASE_ANON_KEY production
```

После этого каждое изменение автоматически собирается и публикуется. Продакшен URL:

**https://skakalka-project.vercel.app**

## Настройка Supabase

Если нужно развернуть свой экземпляр Supabase:

1. Зарегистрируйся на [supabase.com](https://supabase.com) и создай проект
2. Скопируй **Project URL** и **anon key** (Settings → API → Legacy anon key)
3. Вставь их в `.env` (локально) и в Vercel (env vars)
4. Выполни SQL из `supabase/schema.sql` в SQL Editor Supabase
5. В Authentication → Providers → Email — убедись, что включено
6. В Authentication → URL Configuration:
   - **Site URL:** `https://<твой-домен>.vercel.app`
   - **Redirect URLs:** добавь `https://<твой-домен>.vercel.app/**`

## Безопасность

- RLS (Row Level Security) включён для всех таблиц — каждый пользователь видит только свои данные
- `.env` и `.vercel/` — в `.gitignore`, секреты не попадают в репозиторий
- `VITE_*` переменные видны в браузере (это нормально для Supabase anon key)
