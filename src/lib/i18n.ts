// Global localization helpers.
// - Dates/times use the browser locale + IANA timezone automatically.
// - Currency conversion uses a static rate table from INR (app's storage
//   currency). Rates are rounded, curated snapshots — no live FX. Users see
//   prices in their local currency; storage stays INR until a schema change.

export function getLocale(): string {
  if (typeof navigator === "undefined") return "en";
  const raw = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
  const normalized = raw.replace(/_/g, "-").replace(/@.*$/, "");
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([normalized])[0] || "en";
  } catch {
    return "en";
  }
}

export function getTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// ---------- Currency ----------

export type CurrencyCode =
  | "INR" | "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "JPY"
  | "SGD" | "AED" | "CHF" | "CNY" | "HKD" | "NZD" | "ZAR" | "BRL" | "MXN" | "THB" | "IDR" | "MYR" | "KRW" | "TRY" | "SEK" | "NOK" | "DKK" | "PLN";

// Rate = 1 INR → target currency (approx, static snapshot).
const RATES: Record<CurrencyCode, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AUD: 0.018,
  CAD: 0.016,
  JPY: 1.85,
  SGD: 0.016,
  AED: 0.044,
  CHF: 0.0106,
  CNY: 0.086,
  HKD: 0.094,
  NZD: 0.02,
  ZAR: 0.22,
  BRL: 0.066,
  MXN: 0.22,
  THB: 0.42,
  IDR: 190,
  MYR: 0.056,
  KRW: 16.5,
  TRY: 0.41,
  SEK: 0.125,
  NOK: 0.128,
  DKK: 0.082,
  PLN: 0.049,
};

// ISO 3166 region → currency default. Anything not listed falls back to USD.
const REGION_TO_CURRENCY: Record<string, CurrencyCode> = {
  IN: "INR", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD",
  JP: "JPY", CN: "CNY", HK: "HKD", SG: "SGD", MY: "MYR", TH: "THB",
  ID: "IDR", KR: "KRW", AE: "AED", CH: "CHF", ZA: "ZAR", BR: "BRL",
  MX: "MXN", TR: "TRY", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN",
  // Eurozone
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", PT: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR", LU: "EUR",
  SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", CY: "EUR", MT: "EUR", HR: "EUR",
};

let cachedCurrency: CurrencyCode | null = null;
const CURRENCY_OVERRIDE_KEY = "helola:preferredCurrency";

export function getPreferredCurrency(): CurrencyCode {
  if (cachedCurrency) return cachedCurrency;
  try {
    const override = typeof localStorage !== "undefined" ? localStorage.getItem(CURRENCY_OVERRIDE_KEY) : null;
    if (override && override in RATES) {
      cachedCurrency = override as CurrencyCode;
      return cachedCurrency;
    }
  } catch { /* ignore */ }

  const locale = getLocale();
  // Extract region from BCP-47 tag (e.g. "en-US" → "US", "de" → undefined).
  const region = (() => {
    try { return new Intl.Locale(locale).maximize().region; } catch { return undefined; }
  })();
  cachedCurrency = (region && REGION_TO_CURRENCY[region]) || "USD";
  return cachedCurrency;
}

export function setPreferredCurrency(code: CurrencyCode) {
  cachedCurrency = code;
  try { localStorage.setItem(CURRENCY_OVERRIDE_KEY, code); } catch { /* ignore */ }
}

export function convertFromINR(amountInr: number, to: CurrencyCode = getPreferredCurrency()): number {
  return amountInr * (RATES[to] ?? RATES.USD);
}

/** Format an INR-denominated amount in the viewer's local currency. */
export function formatPriceFromINR(amountInr: number, opts?: { currency?: CurrencyCode; maximumFractionDigits?: number }): string {
  const currency = opts?.currency ?? getPreferredCurrency();
  const value = convertFromINR(amountInr, currency);
  // Round zero-decimal currencies aggressively; others to nearest whole for cleaner display.
  const zeroDecimal = currency === "JPY" || currency === "KRW" || currency === "IDR";
  const rounded = zeroDecimal ? Math.round(value) : Math.round(value);
  return formatCurrency(rounded, currency, { maximumFractionDigits: opts?.maximumFractionDigits ?? 0 });
}

export function formatCurrency(amount: number, currency: CurrencyCode = getPreferredCurrency(), opts?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat(getLocale(), {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      ...opts,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(getLocale())}`;
  }
}

// ---------- Dates / times ----------

function toDate(input: string | number | Date | null | undefined): Date | null {
  if (input === null || input === undefined || input === "") return null;
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

const tz = () => getTimeZone();

export function formatShortDate(input: string | number | Date | null | undefined): string {
  const d = toDate(input); if (!d) return "—";
  return d.toLocaleDateString(getLocale(), { month: "short", day: "numeric", timeZone: tz() });
}

export function formatMediumDate(input: string | number | Date | null | undefined): string {
  const d = toDate(input); if (!d) return "—";
  return d.toLocaleDateString(getLocale(), { day: "numeric", month: "short", year: "numeric", timeZone: tz() });
}

export function formatLongDate(input: string | number | Date | null | undefined): string {
  const d = toDate(input); if (!d) return "—";
  return d.toLocaleDateString(getLocale(), { month: "long", day: "numeric", year: "numeric", timeZone: tz() });
}

export function formatMonthDay(input: string | number | Date | null | undefined): string {
  const d = toDate(input); if (!d) return "—";
  return d.toLocaleDateString(getLocale(), { month: "long", day: "numeric", timeZone: tz() });
}

export function formatMonthShort(input: string | number | Date | null | undefined): string {
  const d = toDate(input); if (!d) return "—";
  return d.toLocaleDateString(getLocale(), { month: "short", timeZone: tz() });
}

export function formatDateTime(input: string | number | Date | null | undefined): string {
  const d = toDate(input); if (!d) return "—";
  return d.toLocaleString(getLocale(), { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: tz() });
}

export function formatTime(input: string | number | Date | null | undefined): string {
  const d = toDate(input); if (!d) return "—";
  return d.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit", timeZone: tz() });
}

export function formatDateRange(startInput: string | number | Date, endInput: string | number | Date): string {
  const s = toDate(startInput); const e = toDate(endInput);
  if (!s || !e) return "—";
  const sameYear = s.getFullYear() === e.getFullYear();
  const locale = getLocale();
  const startFmt = s.toLocaleDateString(locale, { month: "short", day: "numeric", timeZone: tz() });
  const endFmt = e.toLocaleDateString(locale, {
    month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }), timeZone: tz(),
  });
  return `${startFmt} – ${endFmt}`;
}

// ---------- Units ----------

export type UnitSystem = "metric" | "imperial";

export function getUnitSystem(): UnitSystem {
  const locale = getLocale();
  try {
    const region = new Intl.Locale(locale).maximize().region;
    // Only the US, Liberia, and Myanmar use imperial as default.
    if (region === "US" || region === "LR" || region === "MM") return "imperial";
  } catch { /* ignore */ }
  return "metric";
}

export function formatDistanceKm(km: number): string {
  const system = getUnitSystem();
  if (system === "imperial") {
    const mi = km * 0.621371;
    return `${mi.toLocaleString(getLocale(), { maximumFractionDigits: mi < 10 ? 1 : 0 })} mi`;
  }
  return `${km.toLocaleString(getLocale(), { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
}
