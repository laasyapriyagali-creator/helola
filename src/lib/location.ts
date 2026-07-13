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

/**
 * Curated overrides — map common suburbs / localities to the nearest
 * well-known metro city. Protects privacy (no hyper-local names) and
 * improves recognizability for travelers worldwide.
 */
const SUBURB_TO_METRO: Record<string, { city: string; country: string }> = {
  // India
  pendurthi: { city: "Visakhapatnam", country: "India" },
  gajuwaka: { city: "Visakhapatnam", country: "India" },
  anakapalle: { city: "Visakhapatnam", country: "India" },
  andheri: { city: "Mumbai", country: "India" },
  bandra: { city: "Mumbai", country: "India" },
  borivali: { city: "Mumbai", country: "India" },
  thane: { city: "Mumbai", country: "India" },
  "navi mumbai": { city: "Mumbai", country: "India" },
  whitefield: { city: "Bengaluru", country: "India" },
  "electronic city": { city: "Bengaluru", country: "India" },
  marathahalli: { city: "Bengaluru", country: "India" },
  koramangala: { city: "Bengaluru", country: "India" },
  bangalore: { city: "Bengaluru", country: "India" },
  gurgaon: { city: "Gurugram", country: "India" },
  noida: { city: "Delhi", country: "India" },
  "new delhi": { city: "Delhi", country: "India" },
  ghaziabad: { city: "Delhi", country: "India" },
  faridabad: { city: "Delhi", country: "India" },
  howrah: { city: "Kolkata", country: "India" },
  velachery: { city: "Chennai", country: "India" },
  tambaram: { city: "Chennai", country: "India" },
  secunderabad: { city: "Hyderabad", country: "India" },
  cyberabad: { city: "Hyderabad", country: "India" },
  // Global
  brooklyn: { city: "New York", country: "United States" },
  queens: { city: "New York", country: "United States" },
  manhattan: { city: "New York", country: "United States" },
  bronx: { city: "New York", country: "United States" },
};

/** Strip noisy admin suffixes like " District", " Mandal", " Taluk". */
function cleanCityName(name: string): string {
  return name
    .replace(/\s+(district|metropolitan region|metropolitan area|division|tehsil|mandal|taluk|taluka|sub-?district)$/i, "")
    .trim();
}

function extractCity(addr: Record<string, string | undefined>): string {
  // Prefer real city/town. If only a village/suburb is returned, the
  // surrounding county / state_district is usually the nearest major city
  // (e.g. Nominatim returns state_district="Visakhapatnam" for Pendurthi).
  const direct = addr.city || addr.town || addr.municipality;
  const broader = addr.county || addr.state_district;
  return cleanCityName(direct || broader || addr.village || addr.suburb || addr.state || "");
}

/** Apply curated suburb→metro overrides over any layer of the returned address. */
function applyMetroOverride(
  addr: Record<string, string | undefined>,
  fallbackCity: string,
  fallbackCountry: string
): { city: string; country: string } {
  const layers = [addr.neighbourhood, addr.suburb, addr.village, addr.town, addr.city, addr.municipality, fallbackCity];
  for (const raw of layers) {
    if (!raw) continue;
    const hit = SUBURB_TO_METRO[raw.trim().toLowerCase()];
    if (hit) return hit;
  }
  return { city: fallbackCity, country: fallbackCountry };
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

  // zoom=10 = city. Combined with extractCity() preferring city/county over
  // village/suburb, this returns the nearest well-known city, not a locality.
  const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error("Couldn't look up that location. Try again.");
  const data = await res.json();
  const addr = data?.address || {};
  const rawCity = extractCity(addr);
  const rawCountry = addr.country || "";
  if (!rawCity || !rawCountry) throw new Error("Couldn't determine your city. Please pick one manually.");
  const { city, country } = applyMetroOverride(addr, rawCity, rawCountry);
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
    const rawCity = extractCity(addr);
    const rawCountry = addr.country || "";
    if (!rawCity || !rawCountry) continue;
    const { city, country } = applyMetroOverride(addr, rawCity, rawCountry);
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
