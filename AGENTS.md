# AGENTS.md — Habit Tracker MVP

## Dev commands

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck (`tsc -b`) then bundle
- `npm run preview` — preview production build locally

**Other commands:**
- `npx tsc -b --noEmit` — standalone typecheck
- `npx -p vercel vercel --prod --yes` — deploy to Vercel production
- `npx -p vercel vercel login` — Vercel auth (one-time)

There are **no lint, test, or typecheck-only scripts**.

## Architecture

Single-page React 18 app (Vite + TypeScript, ESM). Multiuser with Supabase backend.

```
src/
  main.tsx                     entry point (React StrictMode, AuthProvider → RouterProvider)
  app/router.tsx               createBrowserRouter — 6 routes:
                                 /login, /register (public)
                                 /, /habits, /calendar, /settings (behind AuthGuard)
  components/
    AppLayout.tsx              shell + tab nav + user email + logout button
    AuthGuard.tsx              route guard — redirects to /login if unauthenticated,
                                 calls loadUserData on user change
  features/
    auth/ui/AuthProvider.tsx   React context wrapping supabase.auth — session, user, login, register, logout
    habits/model/store.ts      Zustand store (optimistic cache) — CRUD via Supabase, no localStorage
    habits/model/types.ts      Habit, HabitEntry, HabitStatus, Reminder
    habits/ui/                 HabitForm, HabitList
    checkin/ui/DailyCheckin.tsx
    calendar/ui/ProgressCalendar.tsx
    stats/ui/StatsDashboard.tsx
    reminders/lib/notifications.ts
  lib/
    supabase.ts                Supabase client (createClient from @supabase/supabase-js)
    date.ts                    toDayKey date helper (date-fns)
  pages/
    LoginPage.tsx, RegisterPage.tsx, DashboardPage.tsx,
    HabitsPage.tsx, CalendarPage.tsx, SettingsPage.tsx
  styles.css                   all styling — plain CSS, no utility framework
supabase/schema.sql            DB schema: habits, habit_entries, reminders + RLS policies
```

## State

- **Zustand** store at `src/features/habits/model/store.ts` acts as an optimistic in-memory cache.
- **No localStorage persistence** — all data lives in Supabase (PostgreSQL).
- On user auth, `AuthGuard` calls `loadUserData(userId)` which fetches `habits`, `entries`, `reminders` from Supabase in parallel and hydrates the Zustand store.
- On logout, `clearData()` resets the store.
- Each mutation (create/update/delete) updates Zustand optimistically AND fires a Supabase call. Store methods check `userId` before calling Supabase.
- `inAppReminderQueue` is transient (not persisted).
- `daysOfWeek` uses JS `Date.getDay()` convention: 0 = Sunday, 1–6 = Mon–Sat.

## Data model (types.ts)

- `Habit`: id, title, color, createdAt (ISO string), isArchived
- `HabitEntry`: id, habitId, date (`yyyy-MM-dd`), status (`done | partial | missed`), optional note
- `Reminder`: habitId, enabled, time (`HH:mm`), daysOfWeek (number[])

Supabase tables mirror these with `user_id` column and snake_case column names:
- `habits`: id, user_id, title, color, created_at, is_archived
- `habit_entries`: id, user_id, habit_id, date, status, note
- `reminders`: id, user_id, habit_id, enabled, time, days_of_week

All tables have RLS policies scoped to `auth.uid() = user_id`.

## Key conventions

- Colors are hex strings; swatches defined in `HabitForm.tsx`.
- Date formatting uses `date-fns`; the sole helper is `toDayKey()` → `yyyy-MM-dd`.
- Reminder polling runs every 30 s in `DashboardPage.tsx` via `setInterval`. Dedup is by minute (`alreadyTriggeredThisMinute`).
- No CSS modules or Tailwind — all classes are global strings in `styles.css`. BEM-ish but not strict; check existing class names before adding new ones.
- Exports are all named (no default exports in the codebase).
- Supabase calls go through the client in `src/lib/supabase.ts` — never create a new client.
- `userId` is stored in Zustand state and checked before Supabase mutations.
- Store type mappings: `isArchived` (camelCase) ↔ `is_archived` (snake_case), `habitId` ↔ `habit_id`.

## Supabase env vars

```
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-jwt>
```

These are stored in `.env` (local) and as Vercel environment variables (production). `.env` is in `.gitignore`.

## Deployment

Production URL: **https://skakalka-project.vercel.app**

Deploy cycle:
```bash
git commit -m "message"
npx -p vercel vercel --prod --yes
```

First-time setup:
```bash
npx -p vercel vercel login
npx -p vercel vercel env add VITE_SUPABASE_URL production
npx -p vercel vercel env add VITE_SUPABASE_ANON_KEY production
```

## Supabase setup (new project)

1. Create project at supabase.com
2. Copy Project URL and legacy anon key (Settings → API → Legacy)
3. Run `supabase/schema.sql` in SQL Editor
4. Authentication → Providers → Email: ensure Enabled
5. Authentication → URL Configuration: set Site URL to Vercel domain, add `https://*.vercel.app/**` to Redirect URLs

## Database reset scripts

- `supabase/clear_data.sql` — TRUNCATE all tables (data only, schema unchanged)
- `supabase/reset_schema.sql` — DROP tables + recreate from `schema.sql` (full reset)

Run in Supabase Dashboard → SQL Editor.

## Planned work

- Phase B.4: Add `typecheck`, `lint`, `check` npm scripts.

## What NOT to do

- Don't add a test framework or CSS preprocessor without explicit request.
- Don't assume Tailwind or CSS modules are available.
- Don't use default exports (repo convention: all named).
- Don't use localStorage for data persistence — use Supabase via the Zustand store.
- Don't create new Supabase clients — reuse the one in `src/lib/supabase.ts`.
