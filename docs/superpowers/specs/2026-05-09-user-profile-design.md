# User Profile Extension — Design Spec

**Date:** 2026-05-09  
**Status:** approved

## Summary

Add a user profile with fields: First Name (required), Last Name, About Me, Biggest Goal.
The profile is for regular users (not trainers). Trainer profile logic remains unchanged.

## Data Model

### New table: `user_profiles`

| Column       | Type                   | Constraints                        |
|-------------|------------------------|------------------------------------|
| id          | UUID                   | PK, DEFAULT gen_random_uuid()      |
| user_id     | UUID                   | UNIQUE NOT NULL, FK auth.users(id) ON DELETE CASCADE |
| first_name  | TEXT                   | NOT NULL DEFAULT ''                |
| last_name   | TEXT                   | NOT NULL DEFAULT ''                |
| about_me    | TEXT                   | NOT NULL DEFAULT ''                |
| biggest_goal | TEXT                   | NOT NULL DEFAULT ''                |
| created_at  | TIMESTAMPTZ            | NOT NULL DEFAULT now()             |

RLS: `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE.

### TypeScript type

```ts
export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  aboutMe: string;
  biggestGoal: string;
  createdAt: string;
}
```

Added to `src/features/habits/model/types.ts`.

### camelCase ↔ snake_case mapping

| JS           | DB           |
|-------------|-------------|
| firstName   | first_name  |
| lastName    | last_name   |
| aboutMe     | about_me    |
| biggestGoal | biggest_goal |
| userId      | user_id     |
| createdAt   | created_at  |

## Architecture

### New Zustand store: `useProfileStore`

Location: `src/features/profile/model/store.ts` (new feature directory).

Methods:
- `loadProfile(userId)` — Supabase `.from('user_profiles').select('*').eq('user_id', userId).maybeSingle()`. Returns `UserProfile | null`.
- `upsertProfile(data)` — upserts `user_profiles`. Checks if a row exists for this `userId`:
  - Exists → UPDATE
  - Not exists → INSERT (generate `id` via crypto)
- `clearProfile()` — resets profile state to `null`.
- `exportProfile()` — returns current profile or `null`.

### AuthGuard changes (`src/components/AuthGuard.tsx`)

Add to auth callback:
```ts
loadProfile(user.id)  // alongside loadUserData, loadTrainerProfile, loadWorkouts
```

Add to logout callback:
```ts
clearProfile()  // alongside clearData, clearWorkouts
```

### Data export/import (`src/features/habits/model/store.ts`)

`exportAllData()`: add `profile` key to the exported JSON object.
Import: when restoring, call `upsertProfile(imported.profile)`.

## UI Changes

### 1. Settings page (`src/pages/SettingsPage.tsx`)

New section **"Профиль"** at the top of the settings list (before "Аккаунт").

**Read mode:** shows current values inline, "Редактировать" button.
**Edit mode:** inline form with:

- Имя* (text input, required validation)
- Фамилия (text input, optional)
- О себе (textarea, optional)
- Цель (text input or textarea, optional)
- Кнопки: «Сохранить» / «Отмена»

On save: validate firstName is non-empty, call `upsertProfile`, return to read mode.

### 2. Header (`src/components/AppLayout.tsx`)

Replace `user?.email` display with `profile?.firstName || user?.email`.

### 3. Dashboard (`src/pages/DashboardPage.tsx`)

Greeting changes from `Привет, {email.split('@')[0]}` to `Привет, {profile?.firstName || email.split('@')[0]}`.

### 4. CSS (`src/styles.css`)

Reuse existing `.form-group`, `.form-label`, `.form-input`, `.card`, `.btn`, `.btn-primary`, `.stack-lg` classes. Add minimal new classes if needed for the profile display card.

## Edge Cases

- **First login (no profile):** `loadProfile` returns `null`. Header shows email. Settings shows empty form with firstName highlighted as required.
- **Empty first name:** form validation blocks save, shows inline error.
- **Logout:** `clearProfile()` resets store to initial state.
- **Deleted user:** CASCADE from `auth.users` handles cleanup.

## What NOT to do

- Don't touch trainer profile (`trainer_profiles` table, `useWorkoutStore`).
- Don't change the workouts/trainer settings section.
- Don't add profile to the navigation tabs (stays on Settings page only).

## Files to create / modify

| File | Action |
|------|--------|
| `supabase/schema.sql` | Add `user_profiles` table + RLS |
| `supabase/reset_schema.sql` | Add `user_profiles` table |
| `supabase/clear_data.sql` | Add `user_profiles` to TRUNCATE list |
| `src/features/habits/model/types.ts` | Add `UserProfile` interface |
| `src/features/profile/model/store.ts` | **New** — `useProfileStore` |
| `src/components/AuthGuard.tsx` | Add load/clear profile calls |
| `src/pages/SettingsPage.tsx` | Add profile section (read + edit) |
| `src/components/AppLayout.tsx` | Show firstName in header |
| `src/pages/DashboardPage.tsx` | Show firstName in greeting |
| `src/features/habits/model/store.ts` | Add profile to exportAllData |
| `src/styles.css` | Minor additions if needed |

## Implementation order

1. Database: schema migration (`user_profiles` table + RLS)
2. Types: `UserProfile` interface
3. Store: `useProfileStore`
4. AuthGuard: load on auth, clear on logout
5. SettingsPage: profile section UI
6. AppLayout: header display name
7. DashboardPage: greeting display name
8. Export/import: include profile
9. Verify: typecheck + build
