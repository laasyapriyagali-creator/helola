# HELOLA Passport — Profile section

A new "coming soon" teaser section on the Profile page, styled after the selected **Hardcover Foil Passport v4** direction (deep midnight cover, silver foil typography, constellation motif, coordinates + north star).

## Placement

`src/pages/Profile.tsx`: insert between `<ProfilePublicSections />` and the `<PremiumInviteCard />` block. Show on **own profile only** (framed as "your adventures").

## Files to create

1. `src/components/passport/PassportCard.tsx` — the tappable cover, styled per v4.
2. `src/components/passport/PassportPreviewDialog.tsx` — the modal opened on tap.

## Cover (`PassportCard`)

Faithful port of v4 into the project's stack:

- Full-width, `aspect-[16/10]`, `rounded-2xl`, dark base `bg-[#020617]` with layered shadow + `ring-1 ring-white/10`.
- Constellation SVG background at `opacity-25` — star points with staggered `animate-pulse` durations, faint constellation lines.
- North-star icon bottom-right, monospace "Origin — 51.5074° N, 0.1278° W" coordinate label top-left.
- Left "spine" gradient strip.
- Silver-foil title **HELOLA Passport** using `font-display` (project's existing serif — no new Google Font import needed) with `bg-gradient-to-b from-white via-slate-300 to-slate-500 bg-clip-text text-transparent`.
- Tagline "*Your adventures, beautifully preserved.*" flanked by short slate hairlines.
- Top-right "In Development" pill: pulsing dot, `bg-white/5 border-white/20 backdrop-blur`.
- Hover shimmer sweep, `hover:scale-[1.01] active:scale-[0.99]` press feedback.

Whole card is a `<button>` that opens the dialog.

## Modal (`PassportPreviewDialog`)

Uses existing `Dialog` from `@/components/ui/dialog`. Visually echoes the cover (same midnight + silver palette on the header, cream body for readability).

- Header row: 🛂 **HELOLA Passport** in `font-display`.
- Slim divider (silver gradient line + tiny star glyph centered).
- Pull-quote (serif italic): *"Every journey tells a story."*
- Body copy (verbatim from the request):
  - "Soon, every completed trip will automatically become part of your personal travel passport. You'll collect destination stamps, preserve memories, unlock travel achievements, revisit your travel timeline, reconnect with people you've traveled with, and relive every adventure through AI-generated journals and memories."
  - "In the future, you'll also be able to order a beautifully printed hardcover version of your passport to keep your travel story forever."
- Footer buttons:
  - Primary **Notify Me** — solid button; on click, `toast.success("We'll let you know the moment HELOLA Passport is ready.")` and close.
  - Secondary **Close** — `variant="ghost"`.

No backend / no waitlist table (MVP teaser). If you'd like the "Notify Me" click persisted later, I'll add a `passport_waitlist` table with RLS in a follow-up.

## Styling notes

- Colors used are scoped locally to the card (celestial silver + midnight) — no changes to global tokens, no theme drift.
- Reuses `font-display` (project serif) — no new font import.
- Pure Tailwind + inline SVG; no new dependencies.
- Respects mobile viewport (360px): 16:10 aspect ratio scales cleanly; typography drops to `text-4xl` on small screens.

## Not in scope

- Real trip→stamp generation, achievements, AI journals, ordering printed passports (all mentioned in modal copy as future).
- Showing the card on other users' profiles.
