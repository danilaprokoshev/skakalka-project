# Plan: Bug Fix + Features — 2026-04-26

## Items

1. **Bug fix:** Data loss on page refresh — habit entries disappear
2. **Feature:** Mark habits for previous days
3. **Feature:** Telegram link in footer (URL TBD)

---

## Task 1: Fix data loss on page refresh

### Root cause

`setEntryStatus`, `setEntryNote`, `updateHabit`, `archiveHabit`, `restoreHabit`,
`deleteHabit`, `upsertReminder` in `store.ts` fire Supabase calls **without `await`
or error handling**. The promise is silently discarded.

If a Supabase write fails (network error, RLS issue), local Zustand state has the
entry but the database doesn't. On page refresh, `loadUserData` fetches from Supabase
and gets the "real" (empty) data — entries are gone.

Secondary issue: `createHabit` adds a `defaultReminder` to local state (line 110)
but never inserts it into Supabase. On refresh the reminder is missing.

### Changes

**File: `src/features/habits/model/store.ts`**

Make all 7 mutation methods `async` with `await` on Supabase calls. On error, revert
the optimistic update.

Pattern for existing-entry update:
```
1. Save previous state
2. Optimistic update via set()
3. await supabase call
4. If error → revert via set() with previous state
```

Pattern for new-entry insert:
```
1. Generate ID, create local object
2. Optimistic append via set()
3. await supabase insert
4. If error → remove from state via set()
```

Methods to update:
- `setEntryStatus` (lines 160-182)
- `setEntryNote` (lines 184-204)
- `updateHabit` (lines 114-123)
- `archiveHabit` (lines 125-134)
- `restoreHabit` (lines 136-145)
- `deleteHabit` (lines 147-158)
- `upsertReminder` (lines 206-235)

In `createHabit` (lines 93-112): after inserting the habit, also insert the
`defaultReminder` into the `reminders` table.

---

## Task 2: Add error handling to `loadUserData`

### Changes

**File: `src/features/habits/model/store.ts`**
- Add `loadError: string | null` to store state (initial: `null`)
- In `loadUserData`: if any of the 3 parallel queries returns an error, set
  `loadError` to the error message instead of silently returning
- Clear `loadError` at the start of `loadUserData` and in `clearData`

**File: `src/components/AuthGuard.tsx`**
- Read `loadError` from store
- If `loadError` is set, show error message + "Повторить" button that calls
  `loadUserData(user.id)` again

---

## Task 3: Mark habits for previous days

### Changes

**File: `src/features/checkin/ui/DailyCheckin.tsx`**
- Replace `useMemo(() => new Date(), [])` with `useState<Date>(new Date())`
- Compute `dayKey` from state date (no useMemo needed, derived on each render)
- Add prev/next day buttons around the date display:
  - `◀` button: `setDate(prev => subDays(prev, 1))`
  - `▶` button: `setDate(prev => addDays(prev, 1))`, disabled when date is today
- Header becomes: `◀  Четверг, 24 апреля  ▶`
- All `setEntryStatus` / `setEntryNote` calls already use `dayKey`, so they
  automatically use the selected date

**File: `src/styles.css`**
- Add `.date-nav` class: flex row, align-items center, justify-content center, gap
- Add `.date-nav button` for arrow buttons (ghost style, larger touch target)

---

## Task 4: Telegram link

### Changes

**File: `src/components/AppLayout.tsx`**
- Add `<footer>` after `</main>` with a Telegram link
- `href="#"` placeholder — user will provide the real URL later
- Text: "Наш Telegram"

**File: `src/styles.css`**
- `.footer`: text-align center, padding, subtle color
- `.telegram-link`: underline, accent color

---

## Implementation order

1. Task 1 (bug fix) — core fix, highest priority
2. Task 2 (error handling) — improves robustness
3. Task 3 (previous days) — new feature
4. Task 4 (Telegram link) — simple addition
