A full app-wide redesign in one shot would be reckless and risks breaking everything we've stabilized (auth, trips, chat, moments, profiles). Instead I'll do a focused, prioritized polish pass that touches every page but only with safe, additive improvements that keep the current design language intact.

## Scope (one pass, in this order)

### 1. Global foundations
- Add a shared `<PageHeader/>` with consistent back button, title, action slot, and safe-area padding.
- Add `<EmptyState/>`, `<ErrorState/>`, `<LoadingSkeleton/>` primitives so every list uses the same patterns.
- Add `<Spinner/>` + page transition fade (150ms) via a tiny route wrapper.
- Tailwind: ensure `h-dvh` (not `h-screen`), `min-h-11 min-w-11` on icon buttons, `focus-visible` rings on all interactive elements.
- Add `aria-label` to every icon-only button across the app (sweep).

### 2. Per-page friction fixes
- **Home**: skeleton cards while destinations load; debounce search; "no results" empty state with suggestions.
- **MyTrips**: skeleton list; smoother countdown chip animation; pull-to-refresh; confirm-before-leave for unsaved itinerary.
- **TripDetails**: sticky section nav (Overview · Itinerary · Participants · Chat); optimistic join; better transport-alert presentation.
- **Explore / DestinationDetail**: progressive image grid (blur-up), retry button on failed loads, swipe hint on first lightbox open.
- **BookTickets**: clearer "live data unavailable" state with retry; collapse providers under tabs.
- **Chats**: scroll-to-bottom FAB when not at bottom; date separators; typing indicator; image upload progress.
- **Moments**: double-tap to like; skeleton feed; better composer (drag to reorder photos).
- **Profile / Public Profile**: skeleton; clearer Edit vs Share affordances; trust the HostCard fix already shipped.
- **Auth**: inline validation, show/hide password, caps-lock hint, friendlier error copy already in place — add loading state on buttons.
- **Settings / Security**: consistent section headers and grouping.
- **Notifications**: empty state, swipe-to-mark-read, group by day.

### 3. Accessibility + responsiveness sweep
- Single `<main>` per route, correct heading order.
- All forms: labels associated, error text linked via `aria-describedby`.
- Tap targets ≥ 44×44 on mobile.
- Test at 360px, 414px, 768px, 1024px.

### 4. Motion
- Framer-motion page fade + list stagger (already partially in place); keep durations 150–250ms. No flashy effects.

## What I will NOT do
- No palette/typography/layout changes — design language stays.
- No backend schema changes.
- No new features beyond UX primitives above.
- No rewrites of Auth, transport, or places logic — those are stable.

## Delivery
I'll ship this in one pass as a single set of edits, then ask you to spot-check. If you want me to narrow further (e.g. "only MyTrips + Chats this round"), say so; otherwise I proceed with the full list above.