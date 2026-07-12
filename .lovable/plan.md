## Why you're seeing £ instead of ₹

`getPreferredCurrency()` in `src/lib/i18n.ts` reads the region from `navigator.language` (BCP-47 locale tag). Your device's system language is likely English (UK) — very common on Android/Samsung in India — so the region resolves to `GB` and the map returns `GBP`. Location, SIM, and timezone are never consulted.

## Fix

Make currency detection prefer the user's actual geography, with an explicit override always available.

1. **Timezone-first detection in `getPreferredCurrency()`** — Use `Intl.DateTimeFormat().resolvedOptions().timeZone` (e.g. `Asia/Kolkata`) as the primary signal, since it reflects the device's real location far more reliably than UI language. Fall back to locale region only when the timezone is unknown.

   Add a `TIMEZONE_TO_CURRENCY` map covering the currencies already in `RATES`:
   - `Asia/Kolkata` → INR
   - `Europe/London` → GBP, `America/New_York`/`Los_Angeles`/… → USD
   - `Asia/Tokyo` → JPY, `Asia/Singapore` → SGD, `Asia/Dubai` → AED, `Asia/Hong_Kong` → HKD, `Asia/Shanghai` → CNY, `Asia/Seoul` → KRW, `Asia/Bangkok` → THB, `Asia/Jakarta` → IDR, `Asia/Kuala_Lumpur` → MYR
   - Eurozone timezones → EUR (Berlin, Paris, Madrid, Rome, Amsterdam, …)
   - Australia/Sydney → AUD, Pacific/Auckland → NZD, Toronto → CAD, Johannesburg → ZAR, São_Paulo → BRL, Mexico_City → MXN, Istanbul → TRY, Stockholm → SEK, Oslo → NOK, Copenhagen → DKK, Warsaw → PLN, Zurich → CHF
   - Final fallback: USD

   Resolution order: `localStorage` override → timezone map → locale region map → USD.

2. **Currency picker in Settings → Preferences** — Add a "Currency" row in `src/components/settings/PreferencesDialog.tsx` (a Select of the supported `CurrencyCode`s labelled "₹ INR — Indian Rupee", etc., plus an "Auto (detect)" option). Selecting a value calls `setPreferredCurrency(code)`; "Auto" clears the localStorage key and cached value so detection re-runs.

3. **Cache invalidation** — Currently `cachedCurrency` persists for the tab's lifetime, so changing the override doesn't repaint prices already computed. `setPreferredCurrency` already updates the cache; also expose a `clearPreferredCurrency()` for the Auto option, and make components that show prices (Premium sheet, Premium settings) re-render on change. Simplest: fire a `window.dispatchEvent(new Event("helola:currency-changed"))` from the setter, and have `PremiumSheet` / `PremiumSettings` subscribe with a small `useCurrency()` hook that forces a re-render.

## Files touched

- `src/lib/i18n.ts` — timezone map, updated `getPreferredCurrency`, add `clearPreferredCurrency`, emit change event, add `useCurrency` hook.
- `src/components/settings/PreferencesDialog.tsx` — add Currency select row.
- `src/components/premium/PremiumSheet.tsx`, `src/pages/settings/PremiumSettings.tsx` — call `useCurrency()` so price labels refresh when the user changes currency.

## Not in scope

- Live FX rates (still static snapshot in `RATES`).
- Server-side geolocation (adds infra; timezone + manual override is enough).
- Changing storage currency from INR.
