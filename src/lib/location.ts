/**
 * Trusted location helpers — no free text allowed.
 * Uses the browser Geolocation API + OpenStreetMap Nominatim for reverse / forward
 * geocoding. Nominatim is free and key-less but requires a custom User-Agent and
 * has fair-use rate limits, so we cache results in memory.
 */

export interface CityResult {
  city: string;
  country: string;
  countryCode?: string;
  lat?: number;
  lon?: number;
}

const NOMINATIM = "https://nominatim.openstreetmap.org";
const HEADERS = { "Accept-Language": "en" };
const reverseCache = new Map<string, CityResult>();
const searchCache = new Map<string, CityResult[]>();

function extractCity(addr: Record<string, string | undefined>): string {
  return (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.county ||
    addr.state_district ||
    addr.state ||
    ""
  );
}

/** Ask the browser for the user's coordinates, then reverse-geocode to City, Country. */
export async function detectDeviceLocation(): Promise<CityResult> {
  if (!("geolocation" in navigator)) throw new Error("Geolocation is not available on this device.");

  const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p.coords),
      (err) => reject(new Error(err.message || "Location permission denied.")),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60_000 }
    );
  });

  const key = `${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`;
  if (reverseCache.has(key)) return reverseCache.get(key)!;

  const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error("Couldn't look up that location. Try again.");
  const data = await res.json();
  const addr = data?.address || {};
  const city = extractCity(addr);
  const country = addr.country || "";
  if (!city || !country) throw new Error("Couldn't determine your city. Please pick one manually.");
  const result: CityResult = {
    city,
    country,
    countryCode: (addr.country_code || "").toUpperCase(),
    lat: coords.latitude,
    lon: coords.longitude,
  };
  reverseCache.set(key, result);
  return result;
}

/** Forward-search the OSM gazetteer for a city. Always returns structured results — no free text. */
export async function searchCities(query: string): Promise<CityResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const cached = searchCache.get(q.toLowerCase());
  if (cached) return cached;
  const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=8&featuretype=city&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];
  const data: Array<{ address?: Record<string, string>; lat: string; lon: string; type?: string }> = await res.json();
  const results: CityResult[] = [];
  const seen = new Set<string>();
  for (const item of data) {
    const addr = item.address || {};
    const city = extractCity(addr);
    const country = addr.country || "";
    if (!city || !country) continue;
    const key = `${city.toLowerCase()}|${country.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      city,
      country,
      countryCode: (addr.country_code || "").toUpperCase(),
      lat: Number(item.lat),
      lon: Number(item.lon),
    });
  }
  searchCache.set(q.toLowerCase(), results);
  return results;
}

export function formatLocation(city?: string | null, country?: string | null): string {
  if (city && country) return `${city}, ${country}`;
  return city || country || "";
}
