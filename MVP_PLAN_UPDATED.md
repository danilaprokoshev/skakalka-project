# Updated MVP Plan (Post-Implementation)

## Current status
- Core MVP scope is implemented:
  - app scaffold + routing,
  - habit CRUD with local persistence,
  - daily check-in (status + note),
  - monthly calendar,
  - stats (streak + 7/30 completion),
  - reminders with browser notification + in-app fallback.
- Initial MVP goals are achieved functionally, but production-readiness tasks remain.

## Gap analysis vs original plan
- **Done:** feature scope from the original MVP plan.
- **Needs hardening:** persistence schema safety for existing users (legacy/broken `localStorage` payloads).
- **Needs cleanup:** debug instrumentation files/log calls introduced during troubleshooting.
- **Needs verification:** explicit smoke checklist and repeatable run/build commands.
- **Needs UX polish:** onboarding and data safety (export/import) that were identified as post-MVP risks.

## Adjusted execution plan

### Phase A - Stabilize and clean (highest priority)
1. **Remove debug-only instrumentation**
   - Remove `debugLog` calls and temporary event handlers from:
     - `src/main.tsx`
     - `src/pages/DashboardPage.tsx`
     - `src/pages/SettingsPage.tsx`
   - Remove helper file:
     - `src/lib/debugLog.ts`
2. **Add safe persisted-state migration**
   - In `src/features/habits/model/store.ts`, add `persist` migration/versioning:
     - validate `reminders`,
     - coerce invalid/missing `daysOfWeek` to default `[1,2,3,4,5,6,0]`,
     - sanitize invalid `time` values.
3. **Defensive runtime guards**
   - In `src/features/reminders/lib/notifications.ts`, guard against malformed reminder payloads before using `.length/.includes`.

### Phase B - Verification and developer workflow
4. **Add deterministic project scripts**
   - `package.json` scripts:
     - `typecheck`,
     - `lint` (if eslint added),
     - `check` (aggregate command).
5. **Run smoke verification**
   - Manual scenario checklist:
     - create/edit/archive/delete habit,
     - set today status + note,
     - view calendar coloring,
     - confirm streak/rates update,
     - configure reminder and verify in-app banner behavior.

### Phase C - Product polish from original risk section
6. **Data safety**
   - Add JSON export/import (Settings page) to reduce data-loss risk from browser storage clear.
7. **First-run onboarding**
   - Add first-launch hints for:
     - create first habit,
     - daily check-in flow,
     - reminder setup.
8. **Mobile UX pass**
   - Tighten spacing and interaction sizes for main flows (`Dashboard`, `Habits`, `Settings`) for one-hand phone use.

## Suggested file-level roadmap
- `src/main.tsx` - remove debug bootstrap hooks.
- `src/pages/DashboardPage.tsx` - remove debug logs; keep reminder polling logic.
- `src/pages/SettingsPage.tsx` - remove debug logs; keep reminder config UI.
- `src/lib/debugLog.ts` - delete.
- `src/features/habits/model/store.ts` - add persist `version` + `migrate` + sanitization utilities.
- `src/features/reminders/lib/notifications.ts` - add defensive guards.
- `src/pages/SettingsPage.tsx` - add export/import UI (Phase C).
- `package.json` - add check scripts.

## Exit criteria for revised MVP
- No debug instrumentation in production code.
- App does not crash with stale/corrupted persisted data.
- Full smoke checklist passes on a clean browser profile and on an existing profile with old persisted data.
- Project has a one-command quality check (`npm run check`).
- Optional polish items (export/import + onboarding) shipped or explicitly deferred in backlog.
