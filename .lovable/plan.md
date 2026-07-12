
## Goal

Destination cards must only display real travel photography from Unsplash. Wikipedia and Wikimedia Commons stay in the codebase for text summaries and (unrelated) map data only — never for images. Unsuitable Unsplash results (booths, posters, logos, indoor events, maps, documents) are rejected client-side, and if nothing suitable remains we show a bundled scenic placeholder.

## Changes

### 1. `supabase/functions/unsplash-search/index.ts`
- Project `tags` from each Unsplash photo (array of `{ title }`) in the response, so the client can validate content. Everything else stays the same.
- Redeploy.

### 2. `src/lib/places.ts` — remove all non-Unsplash image sources
- `UnsplashPhoto` type: add `tags?: { title: string }[]`.
- **Delete `commonsImageSearch`** and every call to it.
- **Keep `fetchWikiSummary`** but only expose its `extract`. Stop returning `thumb`/`image` from `WikiSummary`; drop those fields.
- `getPlaceSummary`: no longer sets or returns `image`/`thumb` from Wikipedia. It returns the extract plus (optionally) the hero image sourced from the Unsplash `imagesCache`.
- `getPlaceImages`: remove the Commons batches, `wikiImage`, and `genericCommons` blocks. The only sources are Unsplash themed queries → Unsplash `"<place> travel"` fallback → Unsplash `"travel destination landscape"` fallback. If all three still return zero after validation, return a single placeholder entry (see step 4).

### 3. New Unsplash relevance filter (in `places.ts`)
Add `isRelevantTravelPhoto(photo, placeName)`:
- Build a lowercase haystack from `description`, `alt_description`, `tags[].title`, and `user.name`.
- **Reject** if the haystack contains any denylist token:
  `booth, expo, exhibition, exhibit, convention, conference, trade show, fair stall, indoor, showroom, poster, brochure, flyer, document, paper, logo, sign, signage, billboard, screenshot, map, atlas, diagram, chart, portrait, headshot, selfie, closeup, close-up, food plate, dish, menu, restaurant interior, product, mockup, illustration, drawing, cartoon, vector, 3d render`.
- **Reject** if landscape orientation was requested but the photo's `alt_description` clearly names a person (`man`, `woman`, `boy`, `girl`, `people wearing`) with no destination keyword.
- **Prefer** (bonus score, not required) haystack terms like `beach, mountain, skyline, city, temple, palace, fort, sunset, valley, harbor, harbour, coast, landscape, aerial, street, architecture` — used to sort surviving photos so the strongest matches come first.
- Applied to every Unsplash batch before dedupe/shuffle. Log nothing (silent filter).

### 4. Scenic placeholder
- Generate one bundled asset at `src/assets/destination-placeholder.jpg` (a wide, generic mountains-and-coast scene, no text, no people).
- Import it in `places.ts` and export a helper `DEFAULT_DESTINATION_IMAGE` used by both `getPlaceSummary` (as `image`/`thumb` when the Unsplash cache is empty) and `getPlaceImages` (as the sole entry when all Unsplash attempts return zero valid photos). The placeholder entry has `source = ""` so UI code that treats an empty source as "no attribution link" continues to work.

### 5. Cache bump
- Bump cache keys from `v4` → `v5` for `helola.placeImages` and add `helola.placeSummaryImage.v2`, so users don't keep seeing the current (already-cached) Wikipedia booth photo for Goa. Old caches are ignored automatically because the key changed.

### 6. Verification
- Deploy the edge function.
- Drive Playwright to `/`, wait for the destinations rail, screenshot the Goa card, and confirm the image is a beach/coast (not the booth). Sample two more cards (Paris, Bali) to confirm nothing regressed. If any card falls back to the placeholder, that's acceptable behavior — but log which one for the response.

## Out of scope
- Adding Pexels as a secondary source. Unsplash + placeholder covers the requirement; Pexels can be added later if coverage gaps appear.
- Any UI/layout changes to the destination cards themselves.
