// Real-world place data via free, public APIs.
// - Search & geocode: OpenStreetMap Nominatim
// - Text: Wikipedia REST summaries
// - Images: Unsplash Search Photos only, via a backend proxy

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

// Unsplash requests go through a Lovable Cloud edge function so the access
// key never ships in the client bundle. Unsplash is the ONLY source of
// destination photography — Wikipedia is used solely for text summaries.
import { supabase } from "@/integrations/supabase/client";

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

const summaryTextCache = loadSS<string | null>("helola.placeExtract.v3");
const imagesCache = loadSS<PlaceImage[]>("helola.placeImages.v3");
const searchCache = new Map<string, PlaceSuggestion[]>();
// Global dedupe so two different destinations never get the same photo.
const usedImageIds = loadSet("helola.usedImg.v3");


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
  return Array.from(new Set([first, full].filter(Boolean)));
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

interface DestinationPhotoProfile {
  match: RegExp;
  exact: string;
  anchors: string[];
  requiredAnchors?: string[];
  queries?: string[];
}

const DESTINATION_PHOTO_PROFILES: DestinationPhotoProfile[] = [
  { match: /\bgoa\b/i, exact: "Goa India", anchors: ["goa", "india", "anjuna", "palolem", "baga", "calangute", "candolim", "vagator", "arambol", "dudhsagar", "chapora", "konkan", "beach", "palm", "coconut"], requiredAnchors: ["goa", "anjuna", "palolem", "baga", "calangute", "candolim", "vagator", "arambol", "dudhsagar", "chapora"], queries: ["Goa India", "Goa India beach palms", "Goa India Palolem beach"] },
  { match: /munnar/i, exact: "Munnar Kerala India", anchors: ["munnar", "kerala", "india", "tea", "plantation", "tea garden", "western ghats", "idukki", "hills", "green hillside"], requiredAnchors: ["munnar", "tea", "plantation", "tea garden", "western ghats", "idukki"], queries: ["Munnar Kerala India", "Munnar Kerala India tea plantation", "Munnar India tea gardens"] },
  { match: /paris/i, exact: "Paris France", anchors: ["paris", "france", "eiffel", "louvre", "seine", "montmartre", "arc de triomphe", "notre dame", "parisian"], requiredAnchors: ["paris", "eiffel", "louvre", "seine", "montmartre", "arc de triomphe", "notre dame"], queries: ["Paris France", "Paris France Eiffel Tower", "Paris France Seine"] },
  { match: /tokyo/i, exact: "Tokyo Japan", anchors: ["tokyo", "japan", "shibuya", "shinjuku", "asakusa", "sensoji", "tokyo tower", "skytree", "fuji", "cherry blossom"], requiredAnchors: ["tokyo", "shibuya", "shinjuku", "asakusa", "sensoji", "tokyo tower", "skytree"], queries: ["Tokyo Japan", "Tokyo Japan skyline", "Tokyo Japan Shibuya"] },
  { match: /\bbali\b|denpasar/i, exact: "Bali Indonesia", anchors: ["bali", "indonesia", "ubud", "uluwatu", "tanah lot", "rice terrace", "rice terraces", "tegallalang", "temple", "volcano"], requiredAnchors: ["bali", "ubud", "uluwatu", "tanah lot", "rice terrace", "rice terraces", "tegallalang"], queries: ["Bali Indonesia", "Bali Indonesia rice terraces", "Bali Indonesia temple"] },
  { match: /new york|manhattan/i, exact: "New York USA", anchors: ["new york", "nyc", "usa", "manhattan", "brooklyn", "times square", "central park", "empire state", "statue of liberty", "skyline"], requiredAnchors: ["new york", "nyc", "manhattan", "brooklyn", "times square", "central park", "empire state", "statue of liberty"], queries: ["New York USA", "New York USA skyline", "New York USA Manhattan"] },
  { match: /manali|himachal/i, exact: "Manali Himachal Pradesh India", anchors: ["manali", "himachal", "india", "himalaya", "himalayas", "snow", "solang", "kullu", "mountain", "pine"], requiredAnchors: ["manali", "solang", "kullu"], queries: ["Manali Himachal Pradesh India", "Manali India Himalayas", "Manali India snow mountains"] },
  { match: /leh|ladakh/i, exact: "Leh Ladakh India", anchors: ["leh", "ladakh", "india", "pangong", "himalaya", "monastery", "khardung", "nubra", "zanskar", "mountain"], requiredAnchors: ["leh", "ladakh", "pangong", "khardung", "nubra", "zanskar"], queries: ["Leh Ladakh India", "Leh Ladakh India monastery", "Ladakh India landscape"] },
  { match: /jaipur/i, exact: "Jaipur Rajasthan India", anchors: ["jaipur", "rajasthan", "india", "hawa mahal", "amber fort", "amer fort", "city palace", "pink city", "jal mahal"], requiredAnchors: ["jaipur", "hawa mahal", "amber fort", "amer fort", "city palace", "pink city", "jal mahal"], queries: ["Jaipur Rajasthan India", "Jaipur India Hawa Mahal", "Jaipur India Amber Fort"] },
  { match: /udaipur/i, exact: "Udaipur Rajasthan India", anchors: ["udaipur", "rajasthan", "india", "lake pichola", "city palace", "lake palace", "jag mandir", "ghat"], requiredAnchors: ["udaipur", "lake pichola", "city palace", "lake palace", "jag mandir"], queries: ["Udaipur Rajasthan India", "Udaipur India Lake Pichola", "Udaipur India City Palace"] },
  { match: /andaman|port blair/i, exact: "Andaman India", anchors: ["andaman", "port blair", "india", "havelock", "swaraj dweep", "radhanagar", "island", "beach", "turquoise", "coral"], requiredAnchors: ["andaman", "port blair", "havelock", "swaraj dweep", "radhanagar"], queries: ["Andaman India", "Andaman India beach", "Havelock Island Andaman India"] },
  { match: /rishikesh|uttarakhand/i, exact: "Rishikesh Uttarakhand India", anchors: ["rishikesh", "uttarakhand", "india", "ganga", "ganges", "lakshman jhula", "ram jhula", "rafting", "himalaya"], requiredAnchors: ["rishikesh", "lakshman jhula", "ram jhula"], queries: ["Rishikesh Uttarakhand India", "Rishikesh India Ganga", "Rishikesh India bridge"] },
  { match: /bangkok|thailand/i, exact: "Bangkok Thailand", anchors: ["bangkok", "thailand", "wat arun", "grand palace", "chao phraya", "temple", "sukhumvit", "skyline"], requiredAnchors: ["bangkok", "wat arun", "grand palace", "chao phraya"], queries: ["Bangkok Thailand", "Bangkok Thailand Wat Arun", "Bangkok Thailand Grand Palace"] },
  { match: /dubai/i, exact: "Dubai United Arab Emirates", anchors: ["dubai", "uae", "united arab emirates", "burj khalifa", "marina", "jumeirah", "desert", "skyline"], requiredAnchors: ["dubai", "burj khalifa", "jumeirah"], queries: ["Dubai United Arab Emirates", "Dubai UAE Burj Khalifa", "Dubai UAE skyline"] },
  { match: /singapore/i, exact: "Singapore", anchors: ["singapore", "marina bay", "gardens by the bay", "merlion", "supertree", "sentosa", "skyline"], requiredAnchors: ["singapore", "marina bay", "gardens by the bay", "merlion", "supertree", "sentosa"], queries: ["Singapore", "Singapore Marina Bay", "Singapore Gardens by the Bay"] },
];

function getDestinationPhotoProfile(name: string): DestinationPhotoProfile {
  const normalized = name.replace(/,/g, " ").replace(/\s+/g, " ").trim();
  const known = DESTINATION_PHOTO_PROFILES.find(p => p.match.test(normalized));
  if (known) return known;
  return {
    match: /.*/,
    exact: normalized,
    anchors: normalized.toLowerCase().split(/\s+/).filter(t => t.length > 2),
    queries: [normalized, `${normalized} landmark`, `${normalized} travel photography`],
  };
}

function buildQueriesFor(name: string): string[] {
  const profile = getDestinationPhotoProfile(name);
  const queries = profile.queries || [profile.exact];
  return Array.from(new Set([profile.exact, ...queries].map(q => q.replace(/,/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean)));
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

interface ScoredPhoto {
  photo: UnsplashPhoto;
  score: number;
  reason: string;
  query: string;
  functionName: string;
  usedFallbackFunction: boolean;
}

interface UnsplashSearchResponse {
  photos: UnsplashPhoto[];
  functionName: string;
  usedFallbackFunction: boolean;
  fallbackReason?: string;
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

async function unsplashSearch(destinationName: string, query: string, perPage = 12, orientation: "landscape" | "squarish" = "landscape"): Promise<UnsplashSearchResponse> {
  if (Date.now() < photoServiceDisabledUntil) {
    const reason = `photo service cooldown active until ${new Date(photoServiceDisabledUntil).toISOString()}`;
    console.warn(`[destination-photo] destination="${destinationName}" query="${query}" fallback=true reason="${reason}"`);
    return { photos: [], functionName: UNSPLASH_FN, usedFallbackFunction: false, fallbackReason: reason };
  }

  return queuePhotoRequest(async () => {
    try {
      console.info(`[destination-photo] destination="${destinationName}" searchQuery="${query}" cache=false fallback=false function="${UNSPLASH_FN}"`);
      const session = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const token = session.data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const requestInit: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, per_page: perPage, orientation }),
      };

      let functionName = UNSPLASH_FN;
      let usedFallbackFunction = false;
      let res = await fetch(`${FUNCTIONS_BASE_URL}/${UNSPLASH_FN}`, requestInit);
      if (res.status === 404) {
        usedFallbackFunction = true;
        functionName = UNSPLASH_FALLBACK_FN;
        console.warn(`[destination-photo] destination="${destinationName}" query="${query}" fallback=true reason="${UNSPLASH_FN} returned 404; retrying ${UNSPLASH_FALLBACK_FN}"`);
        res = await fetch(`${FUNCTIONS_BASE_URL}/${UNSPLASH_FALLBACK_FN}`, requestInit);
      }
      if (!res.ok) {
        const reason = `${functionName} returned HTTP ${res.status}`;
        if (res.status === 429 || res.status >= 500) {
          photoServiceDisabledUntil = Date.now() + PHOTO_SERVICE_TRANSIENT_COOLDOWN_MS;
        } else if (res.status === 401 || res.status === 403 || res.status === 404) {
          photoServiceDisabledUntil = Date.now() + PHOTO_SERVICE_TRANSIENT_COOLDOWN_MS;
        }
        console.warn(`[destination-photo] destination="${destinationName}" query="${query}" fallback=true reason="${reason}"`);
        return { photos: [], functionName, usedFallbackFunction, fallbackReason: reason };
      }
      const data = await res.json().catch(() => null);
      if (data?.fallback) {
        const reason = data?.error || `${functionName} requested fallback`;
        photoServiceDisabledUntil = Date.now() + PHOTO_SERVICE_TRANSIENT_COOLDOWN_MS;
        console.warn(`[destination-photo] destination="${destinationName}" query="${query}" fallback=true reason="${reason}"`);
        return { photos: [], functionName, usedFallbackFunction, fallbackReason: reason };
      }
      if (data?.error || data?.status === 401 || data?.status === 403 || data?.status === 429) {
        const reason = data?.error || `${functionName} returned status ${data?.status}`;
        photoServiceDisabledUntil = Date.now() + PHOTO_SERVICE_COOLDOWN_MS;
        console.warn(`[destination-photo] destination="${destinationName}" query="${query}" fallback=true reason="${reason}"`);
        return { photos: [], functionName, usedFallbackFunction, fallbackReason: reason };
      }
      const results = (data?.results || []) as UnsplashPhoto[];
      console.info(`[destination-photo] destination="${destinationName}" query="${query}" function="${functionName}" fallback=${usedFallbackFunction} results=${results.length}`);
      return { photos: results, functionName, usedFallbackFunction };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "network/client exception while invoking photo function";
      photoServiceDisabledUntil = Date.now() + PHOTO_SERVICE_TRANSIENT_COOLDOWN_MS;
      console.warn(`[destination-photo] destination="${destinationName}" query="${query}" fallback=true reason="${reason}"`);
      return { photos: [], functionName: UNSPLASH_FN, usedFallbackFunction: false, fallbackReason: reason };
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
  "cartoon", "vector", "3d render", "render", "clipart", "ai generated",
  "generated image", "wallpaper", "background texture", "studio", "fashion",
];

const PREFER_TOKENS = [
  "beach", "coast", "coastline", "shore", "ocean", "sea", "island",
  "mountain", "mountains", "valley", "hill", "hills", "forest", "lake",
  "river", "waterfall", "desert", "dune", "sunset", "sunrise", "sky",
  "skyline", "cityscape", "aerial", "landscape", "panorama", "vista",
  "temple", "palace", "fort", "monument", "harbor", "harbour", "bay",
  "street", "architecture", "cathedral", "mosque", "old town", "square",
];

function photoHaystack(p: UnsplashPhoto): string {
  return [
    p.description || "",
    p.alt_description || "",
    ...(p.tags || []).map(t => t.title || ""),
  ].join(" ").toLowerCase();
}

function evaluateTravelPhoto(p: UnsplashPhoto, placeName: string, query: string): { accepted: boolean; score: number; reason: string } {
  const profile = getDestinationPhotoProfile(placeName);
  const haystack = photoHaystack(p);

  if (!p?.id || !p.urls?.regular || !p.urls?.small) {
    return { accepted: false, score: 0, reason: "rejected: missing usable Unsplash image URL" };
  }

  if (!haystack.trim()) {
    return { accepted: false, score: 0, reason: "rejected: empty metadata cannot verify destination" };
  }

  for (const bad of REJECT_TOKENS) {
    if (haystack.includes(bad)) return { accepted: false, score: 0, reason: `rejected: metadata contains unrelated token "${bad}"` };
  }

  const looksLikePerson = /\b(man|woman|boy|girl|kid|baby|face|smiling|posing|wearing|person|people|tourist|model)\b/.test(haystack);
  const hasScenery = PREFER_TOKENS.some(t => haystack.includes(t));
  const anchorHits = profile.anchors.filter(anchor => haystack.includes(anchor.toLowerCase()));
  const requiredHits = (profile.requiredAnchors || profile.anchors).filter(anchor => haystack.includes(anchor.toLowerCase()));
  const destinationHits = profile.exact.toLowerCase().split(/\s+/).filter(t => t.length > 3 && !["india", "france", "japan", "indonesia", "usa", "united", "arab", "emirates"].includes(t) && haystack.includes(t));

  if (looksLikePerson && !hasScenery && anchorHits.length === 0) {
    return { accepted: false, score: 0, reason: "rejected: people-only photo without destination scenery" };
  }

  const hasSpecificAnchor = anchorHits.length > 0;
  const hasDestinationName = destinationHits.length > 0;
  if (requiredHits.length === 0 && !hasDestinationName) {
    return { accepted: false, score: 0, reason: "rejected: metadata does not mention the destination or a known destination landmark" };
  }
  if (!hasSpecificAnchor && !hasDestinationName) {
    return { accepted: false, score: 0, reason: "rejected: metadata does not mention destination or known landmark/scenery" };
  }

  let score = 0;
  score += destinationHits.length * 6;
  score += requiredHits.length * 8;
  score += anchorHits.length * 4;
  for (const t of PREFER_TOKENS) if (haystack.includes(t)) score += 1;
  if (query.toLowerCase() === profile.exact.toLowerCase()) score += 2;
  if (looksLikePerson) score -= 3;

  return {
    accepted: score >= 4,
    score,
    reason: score >= 4
      ? `chosen: matched ${[...new Set([...destinationHits, ...requiredHits, ...anchorHits])].slice(0, 5).join(", ") || "destination metadata"}`
      : "rejected: score too low after destination checks",
  };
}

function toPlaceImage(p: UnsplashPhoto, place: string): PlaceImage {
  return {
    url: p.urls.regular,
    thumb: p.urls.small,
    source: p.links.html,
    title: p.alt_description || p.description || place,
    unsplashId: p.id,
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
  const profile = getDestinationPhotoProfile(name);
  const cachedImgs = imagesCache.get(`${profile.exact.toLowerCase()}::6`) || imagesCache.get(`${profile.exact.toLowerCase()}::12`) || imagesCache.get(`${profile.exact.toLowerCase()}::1`);
  const hero = cachedImgs?.[0];
  return {
    extract,
    image: hero?.url,
    thumb: hero?.thumb,
  };
}

export async function getPlaceImages(name: string, limit = 12): Promise<PlaceImage[]> {
  const profile = getDestinationPhotoProfile(name);
  const cacheKey = `${profile.exact.toLowerCase()}::${limit}`;
  const cached = imagesCache.get(cacheKey);
  if (cached?.length) {
    const first = cached[0];
    console.info(`[destination-photo] selected for ${profile.exact}: cache=true fallback=false query="cache:${cacheKey}" id=${first.unsplashId || first.source || first.url} url=${first.url} reason="served from unique destination cache key ${cacheKey}"`);
    return cached;
  }

  const queries = buildQueriesFor(name);
  const seed = seedFromString(profile.exact.toLowerCase());
  const byId = new Map<string, ScoredPhoto>();

  for (const query of queries) {
    const { photos, functionName, usedFallbackFunction, fallbackReason } = await unsplashSearch(profile.exact, query, 30);
    if (fallbackReason) {
      console.warn(`[destination-photo] ${profile.exact} query="${query}" produced no images because fallback was triggered: ${fallbackReason}`);
    }
    for (const photo of photos) {
      const evaluated = evaluateTravelPhoto(photo, name, query);
      console.info(`[destination-photo] ${profile.exact} candidate ${photo.id}: ${evaluated.reason}`);
      if (!evaluated.accepted) continue;
      const existing = byId.get(photo.id);
      if (!existing || evaluated.score > existing.score) {
        byId.set(photo.id, { photo, score: evaluated.score, reason: evaluated.reason, query, functionName, usedFallbackFunction });
      }
    }
    if (byId.size >= Math.min(limit, 6)) break;
  }

  const crossDestinationFiltered = Array.from(byId.values()).filter((candidate) => {
    const usedBy = selectedImageDestinations.get(candidate.photo.id);
    if (!usedBy || usedBy === profile.exact) return true;
    console.warn(`[destination-photo] ${profile.exact} candidate ${candidate.photo.id}: rejected because it is already selected for ${usedBy}`);
    return false;
  });
  const shuffled = shuffle(crossDestinationFiltered, seed);
  shuffled.sort((a, b) => {
    const usagePenaltyA = selectedImageDestinations.get(a.photo.id) === profile.exact ? -5 : 0;
    const usagePenaltyB = selectedImageDestinations.get(b.photo.id) === profile.exact ? -5 : 0;
    return (b.score + usagePenaltyB) - (a.score + usagePenaltyA);
  });

  const ordered = shuffled.map(s => s.photo);
  const selected = shuffled[0];
  if (selected) {
    console.info(`[destination-photo] selected for ${profile.exact}: cache=false fallback=${selected.usedFallbackFunction} query="${selected.query}", id=${selected.photo.id}, url=${selected.photo.urls.regular}, function="${selected.functionName}", reason=${selected.reason}`);
  }

  const unsplashImages = ordered.slice(0, limit).map(p => toPlaceImage(p, profile.exact));

  // Track usage globally so other destinations skip these ids.
  for (const p of ordered.slice(0, limit)) selectedImageDestinations.set(p.id, profile.exact);
  saveSS(USED_IMAGE_CACHE_KEY, selectedImageDestinations);

  if (unsplashImages.length > 0) {
    imagesCache.set(cacheKey, unsplashImages);
    saveSS(IMAGE_CACHE_KEY, imagesCache);
    return unsplashImages;
  }

  // Do not cache empty results. If the API key was just replaced, the function
  // was redeployed, or Unsplash had a temporary hiccup, the next load should try again.
  console.warn(`[destination-photo] no image selected for ${profile.exact}: cache=false fallback=false query="${queries.join(" | ")}" id=none url=none reason="no destination-appropriate Unsplash Search Photos result found"`);
  return [];
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
