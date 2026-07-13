# Destination gallery regression — targeted repair

## Diagnosis

Comparing the current `src/lib/places.ts` (597 lines) against the last commit where the gallery was working end-to-end — `2f6afd4 "Switched to Unsplash images"` (363 lines) — the image half of the file has been rewritten several times since. The public API (`searchPlaces`, `getPlaceSummary`, `getPlaceImages`, `PlaceImage`, `FEATURED_DESTINATIONS`, all IATA/coord helpers) is identical between the two versions, so nothing downstream needs to change. Only the internal Unsplash pipeline drifted.

Commits that touched the image pipeline after the last good state (all "regression candidates"):
`f615839 → 2f6afd4` (good baseline) → `eb87d38` removed Unsplash → `55be0f4` → `1530ba0` de-dupe/face-blocking → `e3cda51` → `5a78dcb` → `d9d0fb5` → `bfeeea3` → `1cc0095` refactored the call → `a432199` rewrote images → `ba801ce` renamed proxy slug → `94d4976` cache bumps → `90eb05b` → `143734f` → `15798c1` → `56bee12` audit (strict validation added) → `28e59a7` 404 fallback → `b0597f8` "fixed mapping" (current HEAD state after two reverts).

The net regressions introduced by that chain are:
1. `evaluateTravelPhoto` requires destination/landmark anchor words in metadata and rejects almost every Unsplash result → `getPlaceImages` frequently returns `[]`, which the UI now renders as a broken tile.
2. Global cooldown timers (`PHOTO_SERVICE_COOLDOWN_MS`, transient cooldown) suppress calls after any 4xx and leave later destinations imageless.
3. `selectedImageDestinations` map + per-destination photo-ID reservation causes the second destination scanned to receive `[]` when the first destination consumed its top result.
4. `queuePhotoRequest` serialises calls so a single stall blocks the batch; combined with 6s timeout inside the queue this starves the initial explorer render.
5. The proxy slug has churned (`unsplash-search` vs `destination-photo-search`); the client keeps a fallback but both edge functions were healthy in the last curl test — the client side is what's returning nothing.

None of these existed in `2f6afd4`, which shipped a simple themed-query + parallel-search + session-cache + global-ID-dedupe pipeline that the user confirms worked.

## Scope of repair

Restore **only** the image section of `src/lib/places.ts` to the `2f6afd4` shape, with two small forward-ports so nothing else breaks:

- Call Unsplash through the existing `unsplash-search` edge function (via `supabase.functions.invoke`) instead of hitting `api.unsplash.com` directly with an inlined key. The edge function already returns the same `{ results: [...] }` shape the good code expected, so the rest of the pipeline stays untouched.
- Keep the current `PlaceImage` / `PlaceSuggestion` / `FEATURED_DESTINATIONS` / IATA / coords exports and their call signatures byte-identical to today's file so `DestinationsExplorer`, `DestinationDetail`, `DestinationsSearch`, `PlaceGalleryDialog`, `TripImage`, `PlaceAboutSection` all continue to compile and behave.

Nothing outside `src/lib/places.ts` needs to be edited. Edge functions (`unsplash-search`, `destination-photo-search`) stay as-is — they already work when curled and the user just rotated the key.

## Technical details

Section-by-section restore inside `src/lib/places.ts`:

1. Delete the following current internals (they encode the regressions): `evaluateTravelPhoto`, `PHOTO_SERVICE_COOLDOWN_MS`, `PHOTO_SERVICE_TRANSIENT_COOLDOWN_MS` and the global cooldown state, `queuePhotoRequest` and its queue, `selectedImageDestinations` map, `UNSPLASH_FN`/`UNSPLASH_FALLBACK_FN` retry ladder, and the `console.info` debug spam introduced during the audit.
2. Reintroduce from `2f6afd4`, verbatim:
   - `cleanPlaceName`, `seedFromString`, `mulberry32`, `shuffle`
   - `PLACE_THEMES` table + `buildQueriesFor`
   - `UnsplashPhoto` type + `toPlaceImage`
   - session-storage caches keyed `helola.placeExtract.v3`, `helola.placeImages.v3`, `helola.usedImg.v3` (Set for global photo-ID dedupe across destinations)
   - `getPlaceSummary` (Wikipedia text + first Unsplash photo as hero)
   - `getPlaceImages` (parallel themed queries → dedupe by id → global used-set filter → shuffle by seed → cache)
3. Replace only the raw-fetch helper `unsplashSearch(query, perPage, orientation)`. In the good version it hits `api.unsplash.com` with an inlined `client_id`. Rewrite it to:
   ```ts
   const { data } = await supabase.functions.invoke("unsplash-search", {
     body: { query, per_page: perPage, orientation },
   });
   return (data?.results ?? []) as UnsplashPhoto[];
   ```
   Wrap in try/catch so a transient invoke failure returns `[]` (the good version already tolerates empty results — the caller renders skeletons or empty state, never a "same image everywhere" fallback).
4. Do not restore the hardcoded `UNSPLASH_ACCESS_KEY` constant. The edge function reads `UNSPLASH_ACCESS_KEY` from secrets, which is already set.

Cache version stays at `v3` (matches the shipped good version). Users' current `v11` keys become orphaned and are ignored — no explicit purge needed, sessionStorage is small.

Verification after implementation:
- `tsgo` clean (public API unchanged).
- Curl `unsplash-search` with `query=Goa India` → confirm 200 + results (already verified in prior turns).
- Playwright load `/destinations/search`, pick Goa / Munnar / Paris / Tokyo / Bali / New York, screenshot each hero — expect distinct, relevant images.
- Load `/` and confirm `DestinationsExplorer` cards render photos, not skeletons.

## Non-goals

- No changes to edge functions, secrets, RLS, or any other file.
- No attempt to fix the unrelated `QueryClientProvider` "useEffect on null" console error — that's a Vite/dep-optimizer artefact from an earlier hot-reload session, not a regression in shipped code, and clears on a fresh reload. If it persists after this fix I'll investigate separately.
- No re-adding of Wikipedia-based image sourcing, "strict travel photo" validation, request queuing, or cooldown gating.
