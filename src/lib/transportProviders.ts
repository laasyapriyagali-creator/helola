// Transport provider abstraction.
//
// Each provider implements `search(query)` and returns a structured
// result set with a clear `source` flag. The UI never shows fabricated
// prices — when no provider is configured (or all fail), we surface a
// "live data unavailable" state instead of an estimate.
//
// To plug in a real provider (Amadeus, Skyscanner, Aviationstack,
// RailwayAPI, RedBus, Ola/Uber price APIs, etc.):
//   1. Add an edge function that holds the API key.
//   2. Implement `search()` here to call that function.
//   3. Register it in `PROVIDERS` for the relevant mode.
// No other code in the app needs to change.

export type Mode = "flight" | "train" | "bus" | "cab";

export interface TransportQuery {
  from: string;
  to: string;
  fromIata?: string;
  toIata?: string;
  date: string;
  mode: Mode;
}

export interface LiveTransportOption {
  id: string;
  operator: string;
  departTime?: string;      // ISO or HH:mm — empty when not reported
  arriveTime?: string;
  durationMinutes?: number;
  stops?: string;
  classOrSeat?: string;     // e.g. "Economy", "3A", "Sleeper"
  seatsAvailable?: number | null;
  currency?: string;        // ISO 4217
  price?: number | null;    // null = price not reported by the provider
  priceTrend?: "down" | "up" | "flat";
  bookingUrl?: string;      // deep link if the provider returns one
  source: string;           // provider name — shown in the UI for transparency
  routeNote?: string;
}

export interface ProviderResult {
  ok: boolean;
  options: LiveTransportOption[];
  /** Reason live data is missing — surfaced verbatim to the user. */
  reason?: string;
  provider: string;
}

export interface TransportProvider {
  name: string;
  modes: Mode[];
  search(q: TransportQuery): Promise<ProviderResult>;
}

// ---------------------------------------------------------------------------
// Registry — empty by default. Real providers get appended here once their
// API credentials are configured.
// ---------------------------------------------------------------------------
export const PROVIDERS: TransportProvider[] = [];

export function providersFor(mode: Mode): TransportProvider[] {
  return PROVIDERS.filter((p) => p.modes.includes(mode));
}

/**
 * Aggregate live results across every configured provider for the mode.
 * If none are configured, returns `{ ok:false, options:[], reason }` so the
 * UI can show an honest "live data unavailable" state.
 */
export async function searchLiveTransport(q: TransportQuery): Promise<ProviderResult> {
  const providers = providersFor(q.mode);
  if (providers.length === 0) {
    return {
      ok: false,
      options: [],
      provider: "none",
      reason:
        "Live pricing isn't connected yet. Use the partner booking links below to check real-time fares.",
    };
  }
  const settled = await Promise.allSettled(providers.map((p) => p.search(q)));
  const options: LiveTransportOption[] = [];
  const failures: string[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value.ok) options.push(...r.value.options);
    else if (r.status === "fulfilled") failures.push(`${r.value.provider}: ${r.value.reason || "no data"}`);
    else failures.push(`provider error: ${String(r.reason)}`);
  }
  if (options.length === 0) {
    return {
      ok: false,
      options: [],
      provider: providers.map((p) => p.name).join(", "),
      reason:
        failures[0] ||
        "Live data could not be retrieved right now. Please try again in a moment or use a partner link below.",
    };
  }
  // Sort by price when available, otherwise by reported departure time.
  options.sort((a, b) => {
    if (a.price != null && b.price != null) return a.price - b.price;
    return (a.departTime || "").localeCompare(b.departTime || "");
  });
  return { ok: true, options, provider: providers.map((p) => p.name).join(", ") };
}
