# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server (http://localhost:5173, HMR)
npm run build            # tsc -b && vite build — production bundle
npm run preview          # preview production build locally
npx tsc -b --noEmit      # typecheck only (no test framework exists)
npx -p vercel vercel --prod --yes   # deploy to production
```

No lint scripts exist. TypeScript is the only static check.

## Architecture

Single-page React 18 app (Vite + TypeScript, ESM). App name: **Sage Studio**.

**Entry point** (`src/main.tsx`): `ThemeProvider → AuthProvider → RouterProvider`

**Router** (`src/app/router.tsx`) — 5 routes total:
- `/login`, `/register` — public
- `/` → `DashboardPage`, `/workouts`, `/workouts/:workoutId`, `/settings` — behind `AuthGuard`

**Two Zustand stores:**
- `src/features/habits/model/store.ts` — habits, entries, reminders; optimistic cache against Supabase
- `src/features/workouts/model/store.ts` — trainer profiles and workout CRUD

**Auth flow:** `AuthGuard` calls `loadUserData(userId)` on mount, which fetches all three habit-related tables in parallel. On logout, `clearData()` resets the store. `userId` lives in Zustand and must be checked before Supabase mutations.

**Theme:** `ThemeProvider` (`src/lib/theme.tsx`) reads `sk-theme` from localStorage, sets `data-theme` attribute on `<html>`. CSS uses `var(--primary)`, `var(--text-secondary)`, `var(--border)`, etc.

## Data Model

### Habits (`src/features/habits/model/types.ts`)
- `Habit`: id, title, color (hex), category (`HabitCategory | undefined`), createdAt (ISO), isArchived
- `HabitEntry`: id, habitId, date (`yyyy-MM-dd`), status (`'done'` only — the `partial`/`missed` values exist in DB schema but are filtered out on load), note?
- `Reminder`: habitId, enabled, time (`HH:mm`), daysOfWeek (number[], 0=Sunday)
- `HabitCategory`: `'fitness' | 'nutrition' | 'sleep' | 'mental' | 'other'`

### Workouts (`src/features/workouts/model/types.ts`)
- `TrainerProfile`: userId, displayName, bio?, specialization?, photoUrl?, isTrainer, createdAt
- `Workout`: id, trainerId, title, description?, videoUrl, thumbnailUrl?, durationMinutes?, difficulty (`'beginner'|'intermediate'|'advanced'`?), createdAt, isPublished

### Supabase tables
`habits`, `habit_entries`, `reminders` — user-scoped RLS (`auth.uid() = user_id`)
`trainer_profiles`, `workouts` — trainer_profiles public SELECT; workouts: published SELECT for all, CRUD only by trainer_id

**camelCase ↔ snake_case mapping:** `isArchived`↔`is_archived`, `habitId`↔`habit_id`, `daysOfWeek`↔`days_of_week`, `videoUrl`↔`video_url`, `isPublished`↔`is_published`, `displayName`↔`display_name`

## State Conventions

- **No localStorage for data** — only Supabase. Exception: `sk-onboarding-done` (onboarding flag), `sk-theme` (theme), `sk-badges` (unlocked badge IDs).
- All mutations update Zustand optimistically, then fire the Supabase call; errors revert.
- `entries` loaded from Supabase are pre-filtered to `status === 'done'` only.
- Reminder polling every 30 s in `DashboardPage`, deduped by minute.
- `inAppReminderQueue` is transient (not persisted anywhere).

## Gamification

`src/features/gamification/model/badges.ts` — 6 badge definitions, checked client-side. Badge unlock state in localStorage (`sk-badges`). `checkNewBadges()` returns newly unlocked badges to display.

Onboarding: 4-step wizard (`OnboardingWizard.tsx`). Step 2 "Далее" blocks until user has a habit or triggers `onAddHabit`.

## PWA

`vite-plugin-pwa` with `autoUpdate` SW. Caches fonts (CacheFirst) and Supabase API (NetworkFirst, 5-min TTL). Manifest: name "Sage Studio", icons at `/public/icon-192.svg` and `/public/icon-512.svg`.

## CSS Conventions

- All styling in `src/styles.css` — plain CSS, no Tailwind or CSS modules.
- BEM-ish class names (`.card`, `.btn`, `.btn-primary`, `.stack`, `.button-row`). Check existing class names before adding new ones.
- CSS custom properties drive theming; `data-theme="light"` on `<html>` switches the light theme vars.

## Code Conventions

- All exports are **named** — no default exports anywhere.
- Never create a new Supabase client — use `src/lib/supabase.ts`.
- IDs generated via `crypto.randomUUID()` (with fallback in store files).
- Date formatting via `date-fns`; day key helper: `toDayKey()` → `yyyy-MM-dd` (`src/lib/date.ts`).
- `daysOfWeek` uses JS `Date.getDay()` convention: 0 = Sunday.

## Environment Variables

```
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-jwt>
```

Stored in `.env` locally (gitignored) and as Vercel env vars in production.

## Database Scripts

Run in Supabase Dashboard → SQL Editor:
- `supabase/clear_data.sql` — TRUNCATE all tables (keeps schema)
- `supabase/reset_schema.sql` — DROP + recreate from `schema.sql`

## Deployment

Production: **https://skakalka-project.vercel.app**

```bash
git commit -m "message"
npx -p vercel vercel --prod --yes
```
