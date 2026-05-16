# RuTube Support — Design Spec

**Date:** 2026-05-16

## Problem

Workout videos are currently embedded from YouTube or Vimeo. Russian users increasingly need a VPN to watch them reliably, which hurts the core experience of the app. The application owner (sole developer + admin + only trainer) wants to migrate his content to RuTube while keeping YouTube and Vimeo as fallback for any existing or third-party links.

## Goal

Add RuTube as a first-class video provider so the trainer can paste a RuTube URL into the existing workout form and players just work — without removing support for YouTube, Vimeo, or direct MP4 files.

## Out of scope

- Bulk migration of existing YouTube/Vimeo workouts to RuTube (the trainer will re-upload manually).
- Auto-thumbnail generation from RuTube.
- VK Video, Дзен, or any other Russian video host.
- Refactoring `parseVideoUrl` into a pluggable provider registry — YAGNI until a third Russian host appears.
- Validation or warnings when a YouTube/Vimeo URL is pasted — soft hint only.

---

## Changes

### 1. `src/features/workouts/model/video.ts` — RuTube parsing

Extend `VideoType` with `'rutube'`. Insert a RuTube branch in `parseVideoUrl` ahead of the YouTube branch.

**Supported input URL forms:**

| Form | Example |
|------|---------|
| Public watch | `https://rutube.ru/video/<id32>/` |
| Private watch with token | `https://rutube.ru/video/private/<id32>/?p=<token>` |
| Direct embed | `https://rutube.ru/play/embed/<id32>` |

The video ID is a 32-character lowercase hex string.

**Regex:**

```ts
const rutubeRegex = /rutube\.ru\/(?:video\/(?:private\/)?|play\/embed\/)([a-f0-9]{32})/i;
```

**Embed URL construction:**

- Base: `https://rutube.ru/play/embed/<id>`
- If the input URL contains a `p` query parameter (private video token), preserve it: `https://rutube.ru/play/embed/<id>?p=<token>`. Extract via `new URL(url).searchParams.get('p')`. Without `p` the RuTube player returns 403 for private videos.

**Return shape:** `{ type: 'rutube', embedUrl }` — same as the existing YouTube/Vimeo branches.

### 2. `src/pages/WorkoutDetailPage.tsx` — Render branch

In the player switch, add `'rutube'` to the iframe branch alongside `'youtube'` and `'vimeo'`:

```tsx
{videoInfo.type === 'youtube' || videoInfo.type === 'vimeo' || videoInfo.type === 'rutube' ? (
  <iframe
    src={videoInfo.embedUrl}
    /* existing style, allow, allowFullScreen, title props unchanged */
  />
) : videoInfo.type === 'mp4' ? (
  /* unchanged */
) : (
  /* unchanged */
)}
```

The existing `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"` and `allowFullScreen` work with RuTube embeds.

### 3. `src/pages/WorkoutsPage.tsx` — Soft hint in form

Update the placeholder of the video URL input so RuTube appears first:

**Before:**
```tsx
placeholder="https://youtube.com/watch?v=... или https://vimeo.com/..."
```

**After:**
```tsx
placeholder="https://rutube.ru/video/... или https://youtube.com/watch?v=..."
```

No validation, no warning text, no badges on workout cards. Existing form layout, labels, and submit logic are unchanged.

---

## Data flow

No new state, no new tables, no new network calls. RuTube URLs go into the existing `workouts.video_url` `text` column. The store, RLS policies, and Supabase queries are untouched.

## Compatibility

- Existing workouts whose `video_url` points to YouTube or Vimeo continue to play exactly as before — their detail page hits the same iframe branch.
- Direct MP4 URLs still match the existing `\.(mp4|webm|ogg)` test.
- Unknown URLs fall through to the existing `{ type: 'unknown', directUrl: url }` placeholder — no regression.

## Verification

1. Create a workout with `https://rutube.ru/video/<id>/` — the detail page plays it in the RuTube embed.
2. Create a workout with a private RuTube URL `https://rutube.ru/video/private/<id>/?p=<token>` — embed URL preserves `?p=<token>` and does not return 403.
3. Paste a direct embed URL `https://rutube.ru/play/embed/<id>` — parsed as rutube and plays.
4. Existing YouTube workout still plays after the change (no regression).
5. Existing Vimeo workout still plays after the change (no regression).
6. The form placeholder shows the RuTube example first.
7. `npx tsc -b --noEmit` passes — the `'rutube'` union member is exhaustively handled at both the parser and the render site.
