# Sage Studio Redesign — Habit Tracker UI/UX Transformation

**Date:** 2026-04-28  
**Status:** Design approved  
**Target:** Transform minimal habit tracker into a premium trainer-led fitness client  

---

## Context

Current app is a functional but generic multiuser habit tracker (React 18 + Vite + Supabase + Zustand, plain CSS). The user is a fitness trainer building a public product. Reference sources: AURA Studio Pilates, DÉLEYA, Gy Colin portfolio — all share elegant serif typography, warm earth tones, and high-quality photography as central design elements.

### Key decisions from brainstorming

| Topic | Decision |
|-------|----------|
| Goal | Balanced: speed + motivation + aesthetics + flexibility |
| Audience | Public product — needs polish, onboarding, retention |
| Visual tone | Dark premium theme with sage green accents |
| Typeface | Playfair Display (headings) + system sans-serif (body) |
| Check-in | Binary (done/undone) — one tap |
| Gamification | Deferred — reconsider after user feedback |
| Trainer brand | User is the face of the product — photo, bio, exclusive content |

---

## Phase 1 — Visual Redesign + UX Simplification (MVP foundation)

### 1.1 Design System: Sage Studio

**Color palette:**
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-page` | `#0d0d0d` | Deep page background |
| `--bg-card` | `#1a1a1a` | Card surfaces |
| `--bg-card-hover` | `#222222` | Hover/interactive state |
| `--border` | `#2a2a2a` | Borders and dividers |
| `--primary` | `#9aab8f` | Sage green — buttons, active states, accent text |
| `--primary-dim` | `#7a8b6f` | Darker sage — pressed states |
| `--accent` | `#c4b9a8` | Warm beige — secondary accent, decorative elements |
| `--text-primary` | `#e8e4df` | Headings, prominent text |
| `--text-secondary` | `#9c9c9c` | Body text, labels |
| `--text-muted` | `#666666` | Subtle/caption text |
| `--status-done` | `#9aab8f` | Done habit (reuses primary) |
| `--status-missed` | `#4a4a4a` | Auto-missed (no manual status) |
| `--danger` | `#a87a7a` | Delete/destructive actions |

**Typography:**
- **Display/Heading:** Playfair Display (Google Fonts) — h1, h2, h3, brand name
- **Body:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` — all UI text
- **Sizes:** 32px (h1), 24px (h2), 18px (h3), 15px (body), 13px (captions)

**Spacing & shapes:**
- Border radius: 12px (cards), 20px (pills/buttons), 16px (inputs)
- Vertical stack gap: 12px (cards), 8px (list items)
- Horizontal padding: 16px (mobile), 24px (desktop)
- Interactive tap targets: minimum 44x44px

**Animations:**
- Transition: `0.2s ease` on backgrounds, borders, colors
- Check-in: subtle scale pulse (1.0 → 1.05 → 1.0, 200ms) on habit toggle
- Page transitions: fade-in (opacity 0→1, 250ms)
- Hover: background color shift + subtle border glow

### 1.2 Navigation Restructure

**Before:** 4 tabs — Дашборд · Привычки · Календарь · Настройки  
**After:** 3 tabs — Главная · Тренировки · Настройки

| Tab | Content |
|-----|---------|
| Главная | Hero greeting, stats row, habit list with daily check-in, calendar widget |
| Тренировки | Workout library (Phase 2) |
| Настройки | Reminder config, profile, logout |

Habits management (CRUD) moves inline to the main page. Calendar becomes a compact widget. Stats merge into the main dashboard.

**Mobile:** Bottom navigation bar (fixed, 3 icon+label tabs) instead of top tabs. Topbar shows brand name + user avatar only.

### 1.3 Binary Check-in

**Before:** 3 buttons per habit — Выполнено / Частично / Пропущено  
**After:** One tap = done ✓, repeat tap = undo

- Tapping a habit card marks it done with a scale animation and green accent
- Tapping again removes the mark (deletes the entry row)
- Display logic: if no entry exists for a given date before today → shown as "missed" (grey) in calendar/stats. No server-side cron — purely client-side rendering based on absence of data.
- Remove `HabitStatus.partial` and `HabitStatus.missed` from the type union entirely. The `HabitEntry` type becomes: `status: 'done'`.
- New code writes only `done`; existing DB rows with `partial`/`missed` are treated as "not done" by the frontend (filtered out).
- Remove the 3-button row UI entirely.
- Database schema unchanged (still accepts `done|partial|missed`); only `done` is written going forward.

**Types change:**
```typescript
// Before
type HabitStatus = 'done' | 'partial' | 'missed'

// After
type HabitStatus = 'done'  // only value written; existing DB rows with other values ignored
```
**Display logic:** Missing entry for a past date → rendered as "missed" (grey). No `missed` rows are ever created.

### 1.4 Mobile Optimization

- All touch targets ≥ 44px (WCAG recommendation)
- Bottom navigation replaces top tabs on screens ≤ 640px
- Habit cards: full-width, 56px height, 14px text
- Date navigator: larger arrows (44px circles)
- Calendar widget cells: 40px on mobile (up from 28px)
- Forms: inputs at 48px height, labels above with 8px gap
- No horizontal scrolling anywhere

### 1.5 Calendar Widget

- Replace full CalendarPage with a compact widget on the dashboard
- Shows current month in a 7-column grid (Mon–Sun)
- Navigate months: arrow buttons (◀ ▶) — swipe is a nice-to-have stretch goal
- Colored dots per cell: green = done, grey = no entry (missed), empty = future date
- Tapping a cell updates the dashboard's `selectedDate` — shared state via React prop lifted to DashboardPage, passed down to both DailyCheckin and CalendarWidget
- Habit selector: dropdown to switch which habit's data is shown

### 1.6 Collapsible Notes

- Notes textarea hidden behind a "Добавить заметку" toggle per habit
- Opens inline below the habit card with a 150ms expand animation
- Auto-saves on blur (debounced 500ms)
- Character counter (max 500 chars)
- Database: keep `note TEXT` column in `habit_entries`, same upsert logic

### 1.7 Onboarding (minimal, built-in)

- Tracked via a `has_completed_onboarding` boolean in the `habits` Zustand store, persisted to `localStorage` key `sk-onboarding-done` (read once on mount)
- First visit after registration: show a single "Создай первую привычку" prompt
- Highlight the "+" button with a subtle pulse
- After first habit created: highlight the habit card "Нажми, чтобы отметить"
- After first check-in: show brief "Отлично!" toast
- No multi-screen wizard — two inline pointers, one toast

### 1.8 Empty States

- No habits: centered illustration area with "Добавь первую привычку" + prominent add button
- No entries today: "Ты ещё не отметил ни одной привычки сегодня" message
- No workouts: placeholder with description of what's coming (Phase 2)
- Error states: card with error message and retry button (keep existing pattern)

### 1.9 Notification Polish

- In-app reminder queue: keep existing banner pattern, style with sage green accent
- Browser notifications: keep existing logic, no changes needed
- Reminder config UI (Settings page): keep existing, restyle to new design system

---

## Phase 2 — Trainer Content Platform

### 2.1 Trainer Profile

**Data model (new Supabase table):**
```sql
CREATE TABLE trainer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  specialization TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: only the trainer (owner) can INSERT/UPDATE; everyone can SELECT
```

**UI:** Editable section on Settings page. Public view: hero card on the main page above habit list.

**Trainer role:** Identified by an `is_trainer BOOLEAN DEFAULT false` column on the `trainer_profiles` table. Only one trainer in the app — the RLS policy checks `auth.uid()` against `user_id`. Settings page shows trainer-specific UI (workout management) only if `trainer_profile.is_trainer = true`.

### 2.2 Workout Management (Admin)

**Data model:**
```sql
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_published BOOLEAN DEFAULT true
);
-- RLS: trainer can CRUD; users can SELECT published
```

**UI (admin — visible only to trainer):**
- "Добавить тренировку" button on the Workouts tab
- Form: title, description (textarea), video URL (input), thumbnail URL (input), duration (number), difficulty (select), publish toggle
- Edit/delete buttons on workout cards (trainer only)
- Preview mode before publishing

### 2.3 Workout Library (Public)

- Grid of workout cards on the Workouts tab
- Each card: thumbnail (or gradient placeholder), title, duration, difficulty badge, play icon overlay
- Filter by difficulty (beginner/intermediate/advanced)
- Sort by newest first

### 2.4 Workout Detail Page

- Full video embed: YouTube (iframe via `youtube.com/embed/VIDEO_ID`), Vimeo (iframe), or direct MP4 URL (`<video>` tag)
- The `video_url` field stores the full URL; the frontend detects the type: YouTube ID extraction via regex, Vimeo ID via regex, fallback to `<video>` element
- Title, description, duration, difficulty
- Back button to return to library
- "Отметить как выполненную" button — creates a standalone completion record (no habit linking in Phase 2)

### 2.5 Workout-Habit Integration

- Option to link a workout to a habit (e.g., workout "Утренняя растяжка" links to habit "Растяжка 15 мин")
- Completing a linked workout auto-marks the corresponding habit as done
- This is a Phase 2 stretch goal — can be simplified to just marking completion as a standalone entry

---

## Phase 3 — Advanced Features (Future)

*Not for immediate implementation. Listed for completeness; will be spec'd separately when prioritized.*

| Feature | Description |
|---------|-------------|
| Categories | Group habits: Фитнес, Питание, Сон, Ментальное. Stats per category. |
| Onboarding wizard | Multi-screen intro + first habit flow (replaces minimal inline pointers from Phase 1) |
| Export/Import | JSON export of all user data + import for migration/backup |
| Gamification | Achievement badges, milestone celebrations, streak animations |
| PWA | Service worker, offline mode, install prompt |
| Light theme | Alternative color scheme |

---

## Data Model Changes Summary

### Phase 1 changes
- **types.ts:** `HabitStatus` reduces from `'done' | 'partial' | 'missed'` to `'done'`. `HabitEntry.status` becomes `'done'`. Existing DB rows with other values are treated as "no entry" by the frontend.
- **store.ts:** Replace `setEntryStatus(habitId, date, status)` with `toggleHabitDone(habitId, date)`: upsert `{ status: 'done' }` if entry doesn't exist, delete entry if it does. Remove all `partial`/`missed`-related logic.
- **habit_entries table:** No schema change. `status` column stays as-is (CHECK constraint accepts all 3 values); only `done` is written by new code.
- **Onboarding:** New `localStorage` key `sk-onboarding-done` (boolean). Read once on DashboardPage mount. If absent, show onboarding prompts.

### Phase 2 changes
- **New tables:** `trainer_profiles`, `workouts`
- **New types:** `TrainerProfile`, `Workout`
- **New store actions:** `loadTrainerProfile`, `upsertTrainerProfile`, `loadWorkouts`, `createWorkout`, `updateWorkout`, `deleteWorkout`, `toggleWorkoutPublished`
- **RLS policies:** trainer-only write, authenticated read for workouts

### Phase 3 changes
- **New types:** `HabitCategory` enum
- **New column:** `habits.category` (nullable TEXT or ENUM)
- **New table/service:** potentially a separate `achievements` table

---

## Implementation Order

1. **Phase 1** — Single implementation cycle. Changes are confined to CSS, components, and store logic. No new database tables.
2. **Phase 2** — Separate cycle after Phase 1 is deployed and stable. New database migrations + new feature code.
3. **Phase 3** — Prioritized individually based on user feedback after Phase 1+2.

---

## What NOT to Change

- Supabase auth flow (login/register/logout) — stays as-is
- Reminder polling logic — stays as-is (30s interval, localStorage dedup)
- Data ownership model (RLS per user_id) — stays as-is
- Habit color swatches — keep existing palette, applied via new design system
- Store optimistic update pattern — stays as-is
