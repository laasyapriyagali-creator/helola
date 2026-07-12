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

// Unsplash requests are proxied through a Lovable Cloud edge function so the
// access key never ships in the client bundle. Unsplash is the ONLY source
// of destination photography — Wikipedia/Commons are used solely for text.
import { supabase } from "@/integrations/supabase/client";
import destinationPlaceholder from "@/assets/destination-placeholder.jpg";
const UNSPLASH_FN = "destination-photo-search";

export const DEFAULT_DESTINATION_IMAGE: PlaceImage = {
  url: destinationPlaceholder,
  thumb: destinationPlaceholder,
  source: "",
  title: "Scenic travel destination",
};

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
function loadSet(k: string): Set<string> {
  try { const raw = sessionStorage.getItem(k); return raw ? new Set(JSON.parse(raw)) : new Set(); }
  catch { return new Set(); }
}
function saveSet(k: string, s: Set<string>) {
  try { sessionStorage.setItem(k, JSON.stringify(Array.from(s).slice(-500))); } catch { /* quota */ }
}

const summaryTextCache = loadSS<string | null>("helola.placeExtract.v5");
const summaryImageCache = loadSS<{ image?: string; thumb?: string } | null>("helola.placeSummaryImage.v4");
const imagesCache = loadSS<PlaceImage[]>("helola.placeImages.v7");
const searchCache = new Map<string, PlaceSuggestion[]>();
// Global dedupe so two different destinations never get the same photo.
const usedImageIds = loadSet("helola.usedImg.v7");

const photoQueue: Array<() => void> = [];
let activePhotoRequests = 0;
const MAX_PHOTO_REQUESTS = 2;

async function queuePhotoRequest<T>(task: () => Promise<T>): Promise<T> {
  if (activePhotoRequests >= MAX_PHOTO_REQUESTS) {
    await new Promise<void>((resolve) => photoQueue.push(resolve));
  }
  activePhotoRequests += 1;
  try {
    return await task();
  } finally {
    activePhotoRequests = Math.max(0, activePhotoRequests - 1);
    photoQueue.shift()?.();
  }
}

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

// ─── Unsplash-powered destination images ────────────────────────────────────
// Wikipedia is no longer used for images — only for text summaries.

function cleanPlaceName(name: string): string {
  return (name || "").split(",")[0].replace(/\([^)]*\)/g, "").trim();
}

function titleCandidates(name: string): string[] {
  const full = (name || "").replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  const first = cleanPlaceName(name);
  return Array.from(new Set([full, first].filter(Boolean)));
}


// Deterministic seed so the random rotation is stable per-session-per-place
// but different across destinations.
function seedFromString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Hand-tuned themes — drives "landmarks / beaches / mountains / skylines"
// search terms per destination. Falls back to a generic travel theme.
const PLACE_THEMES: { match: RegExp; queries: string[] }[] = [
  { match: /goa/i,                    queries: ["Goa beach", "Goa palolem", "Goa sunset"] },
  { match: /manali|himachal/i,        queries: ["Manali snow mountains", "Himachal Pradesh landscape", "Himalayas village"] },
  { match: /leh|ladakh/i,             queries: ["Ladakh landscape", "Leh monastery", "Pangong lake"] },
  { match: /jaipur/i,                 queries: ["Jaipur hawa mahal", "Amber fort Jaipur", "Jaipur city palace"] },
  { match: /udaipur/i,                queries: ["Udaipur lake palace", "Udaipur city", "Pichola lake"] },
  { match: /munnar|kerala/i,          queries: ["Munnar tea plantation", "Kerala backwaters", "Alleppey houseboat"] },
  { match: /andaman|port blair/i,     queries: ["Andaman beach", "Havelock island", "Radhanagar beach"] },
  { match: /rishikesh|uttarakhand/i,  queries: ["Rishikesh ganga", "Rishikesh bridge", "Ganges aarti"] },
  { match: /bali|denpasar/i,          queries: ["Bali rice terraces", "Bali temple", "Ubud Bali"] },
  { match: /bangkok|thailand/i,       queries: ["Bangkok temple", "Bangkok skyline", "Wat Arun"] },
  { match: /dubai/i,                  queries: ["Dubai skyline", "Burj Khalifa", "Dubai desert"] },
  { match: /singapore/i,              queries: ["Singapore marina bay", "Singapore gardens", "Singapore skyline"] },
  { match: /paris/i,                  queries: ["Paris Eiffel tower", "Paris street", "Louvre Paris"] },
  { match: /tokyo/i,                  queries: ["Tokyo skyline", "Shibuya Tokyo", "Tokyo street night"] },
  { match: /london/i,                 queries: ["London Big Ben", "Tower Bridge London", "London skyline"] },
  { match: /new york/i,               queries: ["New York skyline", "Manhattan", "Brooklyn bridge"] },
  { match: /mumbai/i,                 queries: ["Mumbai gateway of india", "Marine drive Mumbai", "Mumbai skyline"] },
  { match: /delhi/i,                  queries: ["India gate Delhi", "Red Fort Delhi", "Humayun tomb"] },
  { match: /bengaluru|bangalore/i,    queries: ["Bangalore city", "Lalbagh Bangalore", "Vidhana Soudha"] },
  { match: /chennai/i,                queries: ["Chennai marina beach", "Chennai temple", "Mahabalipuram"] },
  { match: /kolkata/i,                queries: ["Howrah bridge Kolkata", "Victoria memorial Kolkata", "Kolkata street"] },
  { match: /hyderabad/i,              queries: ["Charminar Hyderabad", "Hyderabad city", "Golconda fort"] },
  { match: /visakhapatnam|vizag/i,    queries: ["Visakhapatnam beach", "RK beach Vizag", "Araku valley"] },
  { match: /bhubaneswar/i,            queries: ["Bhubaneswar temple", "Lingaraj temple", "Konark sun temple"] },
];

function buildQueriesFor(name: string): string[] {
  const cleaned = cleanPlaceName(name);
  const theme = PLACE_THEMES.find(t => t.match.test(cleaned));
  if (theme) return theme.queries;
  // Generic high-quality travel themes — landmarks first, then nature/skyline.
  return [
    `${cleaned} landmark`,
    `${cleaned} skyline`,
    `${cleaned} travel`,
    `${cleaned} nature`,
  ];
}

interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: { full: string; regular: string; small: string; thumb: string };
  links: { html: string };
  user?: { name: string };
  tags?: { title: string }[];
}

interface WikiSummary {
  extract: string;
}

// Wikipedia is used ONLY for text summaries. Never surface Wikipedia
// thumbnails as destination imagery — they are frequently maps, flags,
// booth/exhibition photos, or other non-travel content.
async function fetchWikiSummary(name: string): Promise<WikiSummary> {
  for (const title of titleCandidates(name)) {
    try {
      const r = await safeFetch(`${WIKI_REST}/page/summary/${encodeURIComponent(title)}?redirect=true`, {}, 4000);
      if (!r || !r.ok) continue;
      const d = await r.json();
      if (d?.type === "disambiguation") continue;
      return { extract: d?.extract || "" };
    } catch { /* try next title */ }
  }
  return { extract: "" };
}

async function unsplashSearch(query: string, perPage = 12, orientation: "landscape" | "squarish" = "landscape"): Promise<UnsplashPhoto[]> {
  return queuePhotoRequest(async () => {
    try {
      const { data, error } = await supabase.functions.invoke(UNSPLASH_FN, {
        body: { query, per_page: perPage, orientation },
      });
      if (error || data?.fallback) return [];
      return (data?.results || []) as UnsplashPhoto[];
    } catch {
      return [];
    }
  });
}

// Tokens that indicate the photo is NOT a real travel/destination shot.
const REJECT_TOKENS = [
  "booth", "expo", "exposition", "exhibition", "exhibit", "convention",
  "conference", "trade show", "tradeshow", "fair stall", "stall", "kiosk",
  "showroom", "indoor event", "poster", "brochure", "flyer", "leaflet",
  "document", "paperwork", "logo", "signage", "billboard", "screenshot",
  "map", "atlas", "diagram", "chart", "infographic",
  "portrait", "headshot", "selfie", "closeup", "close-up", "close up",
  "menu", "product shot", "mockup", "mock-up", "illustration", "drawing",
  "cartoon", "vector", "3d render", "render", "clipart",
];

const PREFER_TOKENS = [
  "beach", "coast", "coastline", "shore", "ocean", "sea", "island",
  "mountain", "mountains", "valley", "hill", "hills", "forest", "lake",
  "river", "waterfall", "desert", "dune", "sunset", "sunrise", "sky",
  "skyline", "cityscape", "aerial", "landscape", "panorama", "vista",
  "temple", "palace", "fort", "monument", "harbor", "harbour", "bay",
  "street", "architecture", "cathedral", "mosque", "old town", "square",
];

function isRelevantTravelPhoto(p: UnsplashPhoto, placeName: string): boolean {
  const haystack = [
    p.description || "",
    p.alt_description || "",
    ...(p.tags || []).map(t => t.title || ""),
  ].join(" ").toLowerCase();

  // Empty metadata → we can't verify, but Unsplash's "high" content_filter
  // is already applied server-side. Allow it through.
  if (!haystack.trim()) return true;

  for (const bad of REJECT_TOKENS) {
    if (haystack.includes(bad)) return false;
  }

  // Extra guard: shots that read as pure people/food closeups with no
  // destination anchor are almost never good hero images.
  const placeKey = cleanPlaceName(placeName).toLowerCase();
  const mentionsPlace = placeKey && haystack.includes(placeKey);
  const mentionsPreferred = PREFER_TOKENS.some(t => haystack.includes(t));
  const looksLikePerson = /\b(man|woman|boy|girl|kid|baby|face|smiling|posing|wearing)\b/.test(haystack);
  if (looksLikePerson && !mentionsPlace && !mentionsPreferred) return false;

  return true;
}

function scorePhoto(p: UnsplashPhoto, placeName: string): number {
  const haystack = [
    p.description || "",
    p.alt_description || "",
    ...(p.tags || []).map(t => t.title || ""),
  ].join(" ").toLowerCase();
  const placeKey = cleanPlaceName(placeName).toLowerCase();
  let score = 0;
  if (placeKey && haystack.includes(placeKey)) score += 5;
  for (const t of PREFER_TOKENS) if (haystack.includes(t)) score += 1;
  return score;
}

function toPlaceImage(p: UnsplashPhoto, place: string): PlaceImage {
  return {
    url: p.urls.regular,
    thumb: p.urls.small,
    source: p.links.html,
    title: p.alt_description || p.description || place,
  };
}

export async function getPlaceSummary(name: string): Promise<{ extract: string; thumb?: string; image?: string } | null> {
  let extract = summaryTextCache.get(name) || "";

  if (!summaryTextCache.has(name)) {
    const wiki = await fetchWikiSummary(name);
    extract = wiki.extract || extract;
    summaryTextCache.set(name, extract || null);
    saveSS("helola.placeExtract.v5", summaryTextCache);
  }

  // Hero image comes from the Unsplash-only imagesCache, never Wikipedia.
  const cachedImgs = imagesCache.get(`${cleanPlaceName(name).toLowerCase()}::6`) || imagesCache.get(`${cleanPlaceName(name).toLowerCase()}::12`);
  const hero = cachedImgs?.[0];
  return {
    extract,
    image: hero?.url || DEFAULT_DESTINATION_IMAGE.url,
    thumb: hero?.thumb || DEFAULT_DESTINATION_IMAGE.thumb,
  };
}

export async function getPlaceImages(name: string, limit = 12): Promise<PlaceImage[]> {
  const cacheKey = `${cleanPlaceName(name).toLowerCase()}::${limit}`;
  const cached = imagesCache.get(cacheKey);
  if (cached?.length) return cached;

  const cleaned = cleanPlaceName(name);
  const queries = buildQueriesFor(name);
  const seed = seedFromString(cleaned.toLowerCase());

  // Keep image loading gentle: one primary photo query first. Extra themed
  // searches only run if the primary query produced no suitable travel photo.
  let pool = await unsplashSearch(queries[0], Math.min(limit + 4, 12));

  // Dedupe by Unsplash id.
  const byId = new Map<string, UnsplashPhoto>();
  for (const p of pool) if (!byId.has(p.id)) byId.set(p.id, p);
  pool = Array.from(byId.values());

  // Reject exhibition/booth/logo/map/etc. shots.
  pool = pool.filter(p => isRelevantTravelPhoto(p, name));

  // Sort by relevance score (place name + travel keywords) but keep a
  // deterministic seeded shuffle within equal scores for variety.
  const shuffled = shuffle(pool, seed);
  shuffled.sort((a, b) => scorePhoto(b, name) - scorePhoto(a, name));

  // Prefer photos NOT already used by another destination.
  const fresh = shuffled.filter(p => !usedImageIds.has(p.id));
  const reused = shuffled.filter(p => usedImageIds.has(p.id));
  let ordered = [...fresh, ...reused];

  // Fallback chains — each still runs through the relevance filter.
  if (ordered.length === 0) {
    const fb = (await unsplashSearch(queries[1] || `${cleaned} travel landscape`, Math.min(limit + 4, 12)))
      .filter(p => isRelevantTravelPhoto(p, name));
    ordered = shuffle(fb, seed);
  }
  if (ordered.length === 0) {
    const fb = (await unsplashSearch(queries[2] || `${cleaned} city`, Math.min(limit + 4, 12)))
      .filter(p => isRelevantTravelPhoto(p, name));
    ordered = shuffle(fb, seed);
  }

  const unsplashImages = ordered.slice(0, limit).map(p => toPlaceImage(p, cleaned));

  // Track usage globally so other destinations skip these ids.
  for (const p of ordered.slice(0, limit)) usedImageIds.add(p.id);
  saveSet("helola.usedImg.v7", usedImageIds);

  // If Unsplash returned nothing suitable, show the bundled scenic
  // placeholder rather than an unrelated Wikipedia image.
  const final = unsplashImages.length > 0
    ? unsplashImages
    : [DEFAULT_DESTINATION_IMAGE];

  if (unsplashImages.length > 0) {
    imagesCache.set(cacheKey, final);
    saveSS("helola.placeImages.v7", imagesCache);
  }
  return final;
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
