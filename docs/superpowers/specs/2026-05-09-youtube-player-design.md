# YouTube Player — Design Spec

**Date:** 2026-05-09

## Problem

Trainers upload workouts with YouTube video URLs, but clicking a trainer's workout card does nothing — no navigation, no playback. The trainer view in `WorkoutsPage` renders cards as plain `<div>` elements (no `<Link>`), while the public user view already links to `WorkoutDetailPage` which contains a working YouTube iframe player.

## Goal

Make trainer workout cards navigable to `WorkoutDetailPage` so any user — including the trainer who uploaded a video — can watch it immediately after uploading.

## Out of scope

- Inline / modal video player
- YouTube Shorts or live URL support
- Thumbnail auto-generation from YouTube API
- "Mark as completed" persistence (Supabase)

---

## Changes

### 1. `src/pages/WorkoutsPage.tsx` — Trainer cards

Replace the `<div>` wrapper on trainer workout cards with a `<Link>`:

**Before:**
```tsx
<div
  key={w.id}
  className={`workout-card-placeholder ${!w.isPublished ? 'workout-unpublished' : ''}`}
>
```

**After:**
```tsx
<Link
  key={w.id}
  to={`/workouts/${w.id}`}
  className={`workout-card-placeholder ${!w.isPublished ? 'workout-unpublished' : ''}`}
  style={{ textDecoration: 'none', display: 'block' }}
>
```

Applies to **all** trainer cards regardless of `isPublished` — the trainer can preview drafts before publishing.

### 2. `src/pages/WorkoutDetailPage.tsx` — Hide completion button for owner

Add an `isOwner` check and conditionally render the "Mark as completed" button:

```tsx
import { useHabitStore } from '../features/habits/model/store';

// inside component:
const userId = useHabitStore((s) => s.userId);
const isOwner = !!userId && workout?.trainerId === userId;

// in JSX, wrap the button:
{!isOwner && (
  <button
    className={`btn ${completed ? 'btn-secondary' : 'btn-primary'}`}
    onClick={() => setCompleted((prev) => !prev)}
    style={{ width: '100%' }}
  >
    {completed ? '✓ Выполнено' : 'Отметить как выполненную'}
  </button>
)}
```

---

## Data flow

No new state or network calls. `workouts` in `WorkoutStore` already contains the trainer's own workouts; `WorkoutDetailPage` already queries Supabase directly if the workout isn't in the store. `userId` is already loaded into `HabitStore` by `AuthGuard → loadUserData`.

---

## Verification

1. Log in as a trainer who has at least one workout with a YouTube URL.
2. Navigate to `/workouts` — click a trainer card → should navigate to `/workouts/:id`.
3. Verify the YouTube iframe loads and the video plays.
4. Verify the "Отметить как выполненную" button is **absent** on the detail page for the trainer.
5. Log in as a non-trainer user, open a public workout → "Отметить как выполненную" button should be **present**.
6. Verify unpublished cards also navigate (draft preview works).
