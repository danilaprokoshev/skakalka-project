# Design: Sage Studio — Polish Sprint

**Date:** 2026-05-09  
**Status:** Approved

## Overview

Five improvements to the existing Sage Studio habit tracker + trainer content platform:

1. App rename (name TBD)
2. Auth redirect bug fix
3. Settings page restructure (trainer vs user separation)
4. YouTube embed for workout videos
5. Telegram community link in Settings

---

## 1. App Rename

**Scope:** mechanical find-and-replace only — no architecture changes.

**Files to update:**
- `vite.config.ts` — `manifest.name`, `manifest.short_name`, `manifest.description`
- `index.html` — `<title>`
- Any hardcoded "Sage Studio" or "Sage" strings in `.tsx` files (search codebase)

**Decision:** name is TBD. Candidates: *Puls*, *Novu*, *Ritmo*, *Strivo*. This item can be done last once the name is decided.

---

## 2. Auth Redirect Bug Fix

**Problem:** `AuthGuard` redirects to `/login` when `user === null`. During Supabase JWT token auto-refresh, there is a brief window where the session is being refreshed and `user` is momentarily `null`. This triggers an incorrect redirect mid-session.

**Fix:**

Add `loading: boolean` to `AuthProvider` state:
- Initial value: `true`
- Set to `false` after the first `onAuthStateChange` callback fires (Supabase fires this with event `INITIAL_SESSION` on mount, regardless of whether a session exists)
- Expose `loading` through the auth context

Update `AuthGuard`:
- While `loading === true`: render `null` (or a minimal spinner) — do NOT redirect
- Only redirect to `/login` when `loading === false && user === null`

**Files affected:**
- `src/features/auth/ui/AuthProvider.tsx` — add `loading` state and context value
- `src/components/AuthGuard.tsx` — gate redirect on `!loading`

---

## 3. Settings Page Restructure

**Problem:** All users see "Профиль тренера" (Trainer Profile) in Settings, which is confusing for regular users who are not trainers.

**Solution:** Split Settings into two sections gated by the `is_trainer` flag.

### Detection mechanism

`useWorkoutStore` already loads `trainerProfile` on auth (via `loadTrainerProfile(userId)` called from `AuthGuard`). The flag `trainerProfile?.isTrainer` is available everywhere without additional fetches.

**Note:** Currently `AuthGuard` only calls `loadUserData` — `loadTrainerProfile` must also be called there for all users. The query uses `.maybeSingle()` and safely sets `trainerProfile: null` for regular users who have no row in `trainer_profiles`.

### Page structure

**Section: Аккаунт** (all users)
- Email (read-only display)
- Theme toggle (dark / light)
- Data export (existing)
- Data import (existing)
- Telegram community link (new — see item 5)
- Logout button

**Section: Управление контентом** (visible only if `isTrainer === true`)
- Trainer display name, bio, specialization, photo URL (existing trainer profile form)
- Link or nav to workout management (existing WorkoutsPage)
- Clearly labeled as trainer/admin section

**Files affected:**
- `src/pages/SettingsPage.tsx` — restructure layout, add conditional render for trainer section
- No new DB tables or RLS changes needed

---

## 4. YouTube Embed for Workout Videos

**Decision:** YouTube embeds — zero infrastructure cost, no storage.

**URL parsing** (`src/features/workouts/model/video.ts`):

Support these YouTube URL formats:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID` (pass-through)

Extract `VIDEO_ID` and construct embed URL: `https://www.youtube.com/embed/VIDEO_ID`

**Player** (`src/pages/WorkoutDetailPage.tsx`):

Render an `<iframe>` with:
```
src="https://www.youtube.com/embed/{VIDEO_ID}"
allowFullScreen
width="100%"
aspect-ratio: 16/9 (via CSS)
```

If the URL is not a recognizable YouTube link, show the raw URL as a fallback link rather than a broken embed.

**Trainer input:** When creating/editing a workout, the trainer pastes a YouTube URL (watch link or share link). The app normalizes it to an embed URL at render time — no normalization needed at save time.

**Files affected:**
- `src/features/workouts/model/video.ts` — implement/update `extractYouTubeId()` or equivalent
- `src/pages/WorkoutDetailPage.tsx` — render embed iframe using the parsed ID
- No DB schema changes needed (`video_url` field already exists)

---

## 5. Telegram Community Link

**Placement:** Settings page, in the "Аккаунт" section.

**Implementation:** A simple anchor element:
```html
<a href="https://t.me/Wwork_on_yourself" target="_blank" rel="noopener noreferrer">
  Telegram-канал
</a>
```

Styled as a secondary button or a link row consistent with the existing Settings UI (`.btn.btn-secondary` or a plain text link with icon).

**Files affected:**
- `src/pages/SettingsPage.tsx` — add link row in the Аккаунт section

---

## Out of Scope

- App rename: deferred until name is decided
- Multi-trainer support: intentionally not designed — app is single-trainer
- Vimeo / self-hosted video: intentionally excluded (YouTube-only for cost reasons)
- Pushing `is_trainer = true` to DB: manual step done in Supabase Dashboard by the trainer

---

## Verification

After implementation:

1. **Auth bug:** Log in → stay on the page for several minutes with open DevTools Network tab → confirm no redirect to `/login`; also test: open app in a new tab after a long idle period
2. **Settings restructure:** Log in as a regular user → confirm no trainer section visible; log in as trainer account → confirm trainer section appears
3. **YouTube embed:** Create a workout with a YouTube watch URL, a youtu.be URL, and a non-YouTube URL → confirm embed renders for first two, fallback link for third
4. **Telegram link:** Click the link → confirm it opens `https://t.me/Wwork_on_yourself` in a new tab
5. **App rename** (when name chosen): Check page `<title>`, PWA install prompt name, and all visible UI strings
