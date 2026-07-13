## Goal

The new `UNSPLASH_ACCESS_KEY` is saved. Verify the edge function now returns valid results with the new key and force clients to re-fetch (bypass stale caches that may still hold Wikipedia/booth images).

## Changes

1. **Verify the key** — Call `unsplash-search?query=Goa%20beach&per_page=3` via curl to confirm the edge function returns 200 with real photo results using the new key. No code change if it works.

2. **Cache bump in `src/lib/places.ts`** — Bump cache keys once more so every user's browser re-fetches with the new key:
   - `helola.placeImages.v5` → `v6`
   - `helola.placeSummaryImage.v2` → `v3`
   - `helola.usedImg.v5` → `v6`

3. **Verification** — Screenshot the Goa card via Playwright to confirm a real beach/coast photo now renders.

## Out of scope

- No changes to the edge function code (it already reads `UNSPLASH_ACCESS_KEY` from env at request time, so the new key is picked up automatically).
- No changes to the relevance filter or placeholder logic.
