# AGENTS.md — Habit Tracker MVP

## Dev commands

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck (`tsc -b`) then bundle
- `npm run preview` — preview production build locally

There are **no lint, test, or typecheck-only scripts**. Run `npx tsc -b --noEmit` for a standalone typecheck.

## Architecture

Single-page React 18 app (Vite + TypeScript, ESM).

```
src/
  main.tsx              entry point (React StrictMode, RouterProvider)
  app/router.tsx        createBrowserRouter — 4 routes: /, /habits, /calendar, /settings
  features/
    habits/model/       Zustand store + types (source of truth for all data)
    habits/ui/          HabitForm, HabitList
    checkin/ui/         DailyCheckin
    calendar/ui/        ProgressCalendar
    stats/ui/           StatsDashboard
    reminders/lib/      browser Notification helpers
  components/           AppLayout (shell + tab nav)
  lib/                  toDayKey date helper (date-fns)
  styles.css            all styling — plain CSS, no utility framework
```

## State

- **Zustand** store at `src/features/habits/model/store.ts`, persisted to `localStorage` key `habit-tracker-mvp-store`.
- Persisted slice: `habits`, `entries`, `reminders`. Transient: `inAppReminderQueue`.
- Store has **no migration/versioning** yet — see `MVP_PLAN_UPDATED.md` Phase A.2 for planned work on corrupt/stale localStorage payloads.
- `daysOfWeek` uses JS `Date.getDay()` convention: 0 = Sunday, 1–6 = Mon–Sat.

## Data model (types.ts)

- `Habit`: id, title, color, createdAt (ISO string), isArchived
- `HabitEntry`: id, habitId, date (`yyyy-MM-dd`), status (`done | partial | missed`), optional note
- `Reminder`: habitId, enabled, time (`HH:mm`), daysOfWeek (number[])

## Key conventions

- Colors are hex strings; swatches defined in `HabitForm.tsx`.
- Date formatting uses `date-fns`; the sole helper is `toDayKey()` → `yyyy-MM-dd`.
- Reminder polling runs every 30 s in `DashboardPage.tsx` via `setInterval`. Dedup is by minute (`alreadyTriggeredThisMinute`).
- No CSS modules or Tailwind — all classes are global strings in `styles.css`. BEM-ish but not strict; check existing class names before adding new ones.
- Exports are all named (no default exports in the codebase).

## Known issues / planned work

Refer to `MVP_PLAN_UPDATED.md` for the full roadmap. High-signal items for agents:

- **Phase A.2**: Add `persist` migration + validation to the store for corrupted localStorage.
- **Phase A.3**: Defensive guards in `notifications.ts` before accessing `.length` / `.includes` on reminder arrays.
- **Phase B.4**: Add `typecheck`, `lint`, `check` npm scripts.

## What NOT to do

- Don't add a test framework or CSS preprocessor without explicit request — this is an MVP with minimal tooling.
- Don't assume Tailwind or CSS modules are available.
- Don't use default exports (repo convention: all named).
