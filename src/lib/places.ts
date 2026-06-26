// Real-world place data via free, public APIs.
// - Search & geocode: OpenStreetMap Nominatim
// - Images: Wikipedia REST + Wikimedia Commons + verified to belong to the resolved article
// No API keys required.

export type PlaceKind = "airport" | "city" | "landmark" | "area" | "railway_station" | "bus_station";

export interface PlaceSuggestion {
  display_name: string;
  name: string;
  lat: number;
  lon: number;
  type?: string;
  country?: string;
  city?: string;
  osm_id?: number;
  kind?: PlaceKind;
  iata?: string;
}

const CITY_TO_IATA: Record<string, string> = {
  mumbai: "BOM", delhi: "DEL", "new delhi": "DEL", bengaluru: "BLR", bangalore: "BLR",
  kolkata: "CCU", chennai: "MAA", hyderabad: "HYD", goa: "GOI", kochi: "COK",
  ahmedabad: "AMD", pune: "PNQ", jaipur: "JAI", lucknow: "LKO", "port blair": "IXZ",
  leh: "IXL", srinagar: "SXR", guwahati: "GAU", varanasi: "VNS", thiruvananthapuram: "TRV",
  visakhapatnam: "VTZ", vizag: "VTZ", bhubaneswar: "BBI", rajahmundry: "RJA", vijayawada: "VGA",
  tirupati: "TIR", nagpur: "NAG", indore: "IDR", surat: "STV", patna: "PAT", ranchi: "IXR",
  london: "LHR", paris: "CDG", "new york": "JFK", dubai: "DXB", singapore: "SIN",
  bangkok: "BKK", tokyo: "HND", bali: "DPS", denpasar: "DPS", madrid: "MAD",
  sydney: "SYD", "los angeles": "LAX", "san francisco": "SFO", istanbul: "IST",
  rome: "FCO", barcelona: "BCN", amsterdam: "AMS", "kuala lumpur": "KUL", "hong kong": "HKG",
};

export function resolveIata(name?: string): string | undefined {
  if (!name) return;
  const key = normalizePlaceKey(name);
  return CITY_TO_IATA[key] || LOCAL_TRANSPORT_HUBS.find(h => normalizePlaceKey(h.name) === key)?.iata;
}

export function normalizePlaceKey(name?: string): string {
  return (name || "").toLowerCase().replace(/\([^)]*\)/g, "").split(",")[0].replace(/\b(airport|railway station|train station|bus stand|bus station|junction|jn)\b/g, "").replace(/\s+/g, " ").trim();
}

export const INDIAN_CITY_COORDS: Record<string, { lat: number; lon: number; rail: boolean; bus: boolean; cab: boolean }> = {
  mumbai: { lat: 19.076, lon: 72.8777, rail: true, bus: true, cab: true }, delhi: { lat: 28.6139, lon: 77.209, rail: true, bus: true, cab: true }, "new delhi": { lat: 28.6139, lon: 77.209, rail: true, bus: true, cab: true },
  bengaluru: { lat: 12.9716, lon: 77.5946, rail: true, bus: true, cab: true }, bangalore: { lat: 12.9716, lon: 77.5946, rail: true, bus: true, cab: true }, hyderabad: { lat: 17.385, lon: 78.4867, rail: true, bus: true, cab: true },
  chennai: { lat: 13.0827, lon: 80.2707, rail: true, bus: true, cab: true }, kolkata: { lat: 22.5726, lon: 88.3639, rail: true, bus: true, cab: true }, pune: { lat: 18.5204, lon: 73.8567, rail: true, bus: true, cab: true },
  visakhapatnam: { lat: 17.6868, lon: 83.2185, rail: true, bus: true, cab: true }, vizag: { lat: 17.6868, lon: 83.2185, rail: true, bus: true, cab: true }, bhubaneswar: { lat: 20.2961, lon: 85.8245, rail: true, bus: true, cab: true },
  rajahmundry: { lat: 17.0005, lon: 81.804, rail: true, bus: true, cab: true }, vijayawada: { lat: 16.5062, lon: 80.648, rail: true, bus: true, cab: true }, goa: { lat: 15.2993, lon: 74.124, rail: true, bus: true, cab: true }, jaipur: { lat: 26.9124, lon: 75.7873, rail: true, bus: true, cab: true },
  leh: { lat: 34.1526, lon: 77.5771, rail: false, bus: true, cab: true }, "port blair": { lat: 11.6234, lon: 92.7265, rail: false, bus: false, cab: false }, lakshadweep: { lat: 10.5667, lon: 72.6417, rail: false, bus: false, cab: false },
};

const LOCAL_TRANSPORT_HUBS: PlaceSuggestion[] = [
  { name: "Visakhapatnam Airport", display_name: "Visakhapatnam Airport (VTZ), Andhra Pradesh, India", lat: 17.7212, lon: 83.2245, country: "India", city: "Visakhapatnam", kind: "airport", iata: "VTZ", osm_id: -101 },
  { name: "Visakhapatnam Railway Station", display_name: "Visakhapatnam Railway Station, Andhra Pradesh, India", lat: 17.7211, lon: 83.3002, country: "India", city: "Visakhapatnam", kind: "railway_station", osm_id: -102 },
  { name: "Bhubaneswar Airport", display_name: "Biju Patnaik International Airport (BBI), Odisha, India", lat: 20.2539, lon: 85.8178, country: "India", city: "Bhubaneswar", kind: "airport", iata: "BBI", osm_id: -103 },
  { name: "Bhubaneswar Railway Station", display_name: "Bhubaneswar Railway Station, Odisha, India", lat: 20.2664, lon: 85.8438, country: "India", city: "Bhubaneswar", kind: "railway_station", osm_id: -104 },
  { name: "Rajahmundry Airport", display_name: "Rajahmundry Airport (RJA), Andhra Pradesh, India", lat: 17.1104, lon: 81.8182, country: "India", city: "Rajahmundry", kind: "airport", iata: "RJA", osm_id: -105 },
  { name: "Rajahmundry Bus Stand", display_name: "Rajahmundry Bus Stand, Andhra Pradesh, India", lat: 17.0052, lon: 81.7778, country: "India", city: "Rajahmundry", kind: "bus_station", osm_id: -106 },
];

function classifyKind(d: any): PlaceKind {
  const t: string = (d.type || "").toLowerCase();
  const cls: string = (d.class || "").toLowerCase();
  if (t === "aerodrome" || t === "airport" || cls === "aeroway") return "airport";
  if (t.includes("station") && (cls === "railway" || t.includes("railway"))) return "railway_station";
  if (t.includes("bus") || cls === "highway" && t === "bus_stop") return "bus_station";
  if (["city", "town", "village", "municipality", "state", "country", "administrative"].includes(t)) return "city";
  if (["suburb", "neighbourhood", "quarter", "hamlet"].includes(t)) return "area";
  return "landmark";
}

export function isInternationalRoute(from?: string, to?: string): boolean {
  if (!from || !to) return false;
  const inIndia = (s: string) => /,\s*india\b|\bindia$|\bindian\b/i.test(s) || !!INDIAN_CITY_COORDS[normalizePlaceKey(s)];
  return inIndia(from) !== inIndia(to);
}

export function getKnownIndianCity(name?: string) {
  const key = normalizePlaceKey(name);
  return INDIAN_CITY_COORDS[key] ? { key, ...INDIAN_CITY_COORDS[key] } : null;
}

export interface PlaceImage {
  url: string;
  thumb: string;
  source: string;
  title: string;
}

const NOMINATIM = "https://nominatim.openstreetmap.org";
const WIKI_REST = "https://en.wikipedia.org/api/rest_v1";

/** Fetch wrapper with a strict timeout — prevents hung UI when a third party stalls. */
async function safeFetch(url: string, opts: RequestInit = {}, timeoutMs = 6000): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
  catch { return null; }
  finally { clearTimeout(timer); }
}

// In-memory + sessionStorage caches — survive navigations within a session.
function loadSS<T>(k: string): Map<string, T> {
  try { const raw = sessionStorage.getItem(k); return raw ? new Map(JSON.parse(raw)) : new Map(); }
  catch { return new Map(); }
}
function saveSS<T>(k: string, m: Map<string, T>) {
  try { sessionStorage.setItem(k, JSON.stringify(Array.from(m.entries()).slice(-200))); } catch { /* quota */ }
}
const summaryCache = loadSS<{ extract: string; thumb?: string; image?: string } | null>("helola.placeSummary.v2");
const imagesCache = loadSS<PlaceImage[]>("helola.placeImages.v2");
const searchCache = new Map<string, PlaceSuggestion[]>();

export async function searchPlaces(query: string, limit = 6): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (!q) return [];
  const cacheKey = `${q.toLowerCase()}::${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(q)}`;
  const res = await safeFetch(url, { headers: { "Accept-Language": "en" } }, 5000);
  const local = LOCAL_TRANSPORT_HUBS.filter(h => `${h.name} ${h.display_name} ${h.iata || ""}`.toLowerCase().includes(q.toLowerCase()));
  if (!res || !res.ok) {
    const fallback = local.slice(0, limit);
    searchCache.set(cacheKey, fallback);
    return fallback;
  }
  try {
    const data = await res.json();
    const remote = (data || []).map((d: any) => {
      const name = d.name || d.display_name?.split(",")[0] || q;
      const kind = classifyKind(d);
      return {
        display_name: d.display_name,
        name,
        lat: parseFloat(d.lat),
        lon: parseFloat(d.lon),
        type: d.type,
        country: d.address?.country,
        city: d.address?.city || d.address?.town || d.address?.village || d.address?.state,
        osm_id: d.osm_id,
        kind,
        iata: kind === "city" || kind === "airport" ? resolveIata(name) : undefined,
      } as PlaceSuggestion;
    });
    const seen = new Set<string>();
    const merged = [...local, ...remote].filter((p) => {
      const key = `${p.name}-${p.kind}-${p.lat}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0, limit);
    searchCache.set(cacheKey, merged);
    return merged;
  } catch {
    const fallback = local.slice(0, limit);
    searchCache.set(cacheKey, fallback);
    return fallback;
  }
}

// Resolve the canonical Wikipedia title for a query (handles redirects/disambig).
const titleCache = new Map<string, string | null>();
async function resolveWikiTitle(name: string): Promise<string | null> {
  const key = name.trim();
  if (titleCache.has(key)) return titleCache.get(key)!;
  const variants = Array.from(new Set([
    key,
    key.split(",")[0]?.trim(),
    key.replace(/,.*$/, "").trim(),
  ].filter(Boolean))) as string[];
  for (const v of variants) {
    try {
      const r = await safeFetch(`${WIKI_REST}/page/summary/${encodeURIComponent(v)}?redirect=true`);
      if (!r || !r.ok) continue;
      const d = await r.json();
      if (d?.type === "disambiguation") continue;
      const t = d?.titles?.canonical || d?.title;
      if (t) { titleCache.set(key, t); return t; }
    } catch { /* ignore */ }
  }
  titleCache.set(key, null);
  return null;
}

export async function getPlaceSummary(name: string): Promise<{ extract: string; thumb?: string; image?: string } | null> {
  if (summaryCache.has(name)) return summaryCache.get(name)!;
  const title = await resolveWikiTitle(name);
  if (!title) { summaryCache.set(name, null); return null; }
  try {
    const r = await safeFetch(`${WIKI_REST}/page/summary/${encodeURIComponent(title)}?redirect=true`);
    if (!r || !r.ok) { summaryCache.set(name, null); return null; }
    const d = await r.json();
    const image = d.originalimage?.source || d.thumbnail?.source;
    const thumb = d.thumbnail?.source || image;
    const result = { extract: d.extract || "", thumb, image };
    summaryCache.set(name, result); saveSS("helola.placeSummary.v2", summaryCache);
    return result;
  } catch {
    summaryCache.set(name, null); saveSS("helola.placeSummary.v2", summaryCache);
    return null;
  }
}

// Filter out icons/logos/flags/maps/portraits/historical art that frequently appear in articles.
function isLikelyPhoto(fileTitle: string): boolean {
  const t = fileTitle.toLowerCase();
  if (!/\.(jpe?g|png|webp)$/i.test(t)) return false;
  const bad = [
    // non-photo assets
    "icon", "logo", "flag", "coat_of_arms", "coat of arms", "seal", "emblem",
    "map", "locator", "location_map", "topographic", "symbol", "commons-logo",
    "pictogram", "wiki", "diagram", "chart", "graph", "blason",
    // people / portraits — avoid faces
    "portrait", "headshot", "mugshot", "bust_of", "statue_of",
    "president", "mayor", "governor", "minister", "senator", "official_portrait",
    "ceo", "founder", "biographer", "actor", "actress", "singer", "musician",
    // historical paintings / engravings instead of real photos
    "painting", "engraving", "lithograph", "drawing_of", "illustration_of",
    "1846", "1850", "1851", "1852", "1855", "1860", "1870", "1880", "1890",
    "pre-1900", "19th_century", "18th_century",
  ];
  if (bad.some(b => t.includes(b))) return false;
  // Heuristic: files like "John_Smith_2019.jpg" — two TitleCase tokens then year/number → likely a person
  const base = fileTitle.replace(/^File:/, "").replace(/\.[^.]+$/, "");
  if (/^[A-Z][a-z]+_[A-Z][a-z]+(_[A-Z]?[a-z0-9]+)?$/.test(base)) return false;
  return true;
}

// Dedupe near-duplicate uploads (same scene, different size/version).
function dedupeKey(fileTitle: string): string {
  return fileTitle
    .replace(/^File:/i, "")
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")
    .replace(/\b(\d{3,4}x\d{3,4}|\d+px|hdr|panorama|edit\d*|crop\d*|v\d+|version_?\d+|small|large|big|hi-?res)\b/g, "")
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

// Pull images *belonging to the resolved Wikipedia article* — guarantees relevance.
export async function getPlaceImages(name: string, limit = 12): Promise<PlaceImage[]> {
  const cacheKey = `${name}::${limit}`;
  if (imagesCache.has(cacheKey)) return imagesCache.get(cacheKey)!;

  const title = await resolveWikiTitle(name);
  if (!title) { imagesCache.set(cacheKey, []); return []; }

  const collected: PlaceImage[] = [];
  const seenKeys = new Set<string>();

  // 1) media-list = ordered list of images embedded in the article — most relevant.
  try {
    const r = await safeFetch(`${WIKI_REST}/page/media-list/${encodeURIComponent(title)}`);
    if (r.ok) {
      const d = await r.json();
      for (const item of (d?.items || []) as any[]) {
        if (item.type !== "image") continue;
        const fileTitle: string = item.title || "";
        if (!isLikelyPhoto(fileTitle)) continue;
        const key = dedupeKey(fileTitle);
        if (key && seenKeys.has(key)) continue;
        const srcset = (item.srcset || []).slice().sort((a: any, b: any) => (b.scale || 1) - (a.scale || 1));
        let src: string | undefined = srcset[0]?.src || item.original?.source;
        if (!src) continue;
        if (src.startsWith("//")) src = "https:" + src;
        // Use Wikimedia's on-the-fly thumbnailer for a lightweight grid thumb (~480px).
        // This drops grid images from MBs to tens of KB while keeping the full version for the lightbox.
        const thumb = src.replace(/\/(\d+)px-([^/]+)$/, "/480px-$2");
        if (collected.find(c => c.url === src)) continue;
        if (key) seenKeys.add(key);
        collected.push({
          url: src,
          thumb,
          source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(fileTitle)}`,
          title: fileTitle.replace(/^File:/, "").replace(/\.(jpe?g|png|webp)$/i, "").replace(/_/g, " "),
        });
        if (collected.length >= limit) break;
      }
    }
  } catch { /* ignore */ }

  // 2) Prepend the summary hero if not already in.
  try {
    const sum = await getPlaceSummary(name);
    if (sum?.image && !collected.find(c => c.url === sum.image)) {
      collected.unshift({ url: sum.image, thumb: sum.thumb || sum.image, source: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`, title });
    }
  } catch { /* ignore */ }

  imagesCache.set(cacheKey, collected.slice(0, limit));
  saveSS("helola.placeImages.v2", imagesCache);
  return imagesCache.get(cacheKey)!;
}


// Curated, real-world destinations used as the default scrollable list.
export const FEATURED_DESTINATIONS: { name: string; query: string; region: string; tagline: string }[] = [
  { name: "Goa", query: "Goa, India", region: "India", tagline: "Beach mornings & sunset shacks" },
  { name: "Manali", query: "Manali, Himachal Pradesh", region: "India", tagline: "Snow peaks and pine forests" },
  { name: "Jaipur", query: "Jaipur, Rajasthan", region: "India", tagline: "The pink city of palaces" },
  { name: "Leh-Ladakh", query: "Leh, Ladakh", region: "India", tagline: "High-altitude desert adventures" },
  { name: "Munnar", query: "Munnar, Kerala", region: "India", tagline: "Endless tea-green hills" },
  { name: "Andaman Islands", query: "Port Blair, Andaman", region: "India", tagline: "Turquoise seas & coral reefs" },
  { name: "Rishikesh", query: "Rishikesh, Uttarakhand", region: "India", tagline: "Yoga, rafting & Ganga aarti" },
  { name: "Udaipur", query: "Udaipur, Rajasthan", region: "India", tagline: "City of lakes and palaces" },
  { name: "Bali", query: "Bali, Indonesia", region: "International", tagline: "Rice terraces & temple sunsets" },
  { name: "Bangkok", query: "Bangkok, Thailand", region: "International", tagline: "Street food capital of Asia" },
  { name: "Dubai", query: "Dubai, United Arab Emirates", region: "International", tagline: "Skyline, dunes and souks" },
  { name: "Singapore", query: "Singapore", region: "International", tagline: "Garden city of the future" },
  { name: "Paris", query: "Paris, France", region: "International", tagline: "Boulevards, cafés and the Tower" },
  { name: "Tokyo", query: "Tokyo, Japan", region: "International", tagline: "Neon nights & quiet shrines" },
];
