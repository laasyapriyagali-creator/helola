// Real-world place data via free, public APIs.
// - Search & geocode: OpenStreetMap Nominatim
// - Images: Wikipedia REST + Wikimedia Commons + Unsplash Source fallback
// No API keys required.

export interface PlaceSuggestion {
  display_name: string;
  name: string;
  lat: number;
  lon: number;
  type?: string;
  country?: string;
  city?: string;
  osm_id?: number;
}

export interface PlaceImage {
  url: string;
  thumb: string;
  source: string;
  title: string;
}

const NOMINATIM = "https://nominatim.openstreetmap.org";
const WIKI_REST = "https://en.wikipedia.org/api/rest_v1";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

// In-memory caches (persist for the session) — avoids losing images on re-renders.
const summaryCache = new Map<string, { extract: string; thumb?: string; image?: string } | null>();
const imagesCache = new Map<string, PlaceImage[]>();

export async function searchPlaces(query: string, limit = 6): Promise<PlaceSuggestion[]> {
  if (!query.trim()) return [];
  const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((d: any) => ({
      display_name: d.display_name,
      name: d.name || d.display_name?.split(",")[0] || query,
      lat: parseFloat(d.lat),
      lon: parseFloat(d.lon),
      type: d.type,
      country: d.address?.country,
      city: d.address?.city || d.address?.town || d.address?.village || d.address?.state,
      osm_id: d.osm_id,
    }));
  } catch { return []; }
}

export async function getPlaceSummary(name: string): Promise<{ extract: string; thumb?: string; image?: string } | null> {
  if (summaryCache.has(name)) return summaryCache.get(name)!;
  const variants = Array.from(new Set([
    name,
    name.split(",")[0]?.trim(),
    name.replace(/,.*$/, "").trim(),
  ].filter(Boolean))) as string[];

  let extract = "";
  let image: string | undefined;
  let thumb: string | undefined;

  for (const v of variants) {
    try {
      const res = await fetch(`${WIKI_REST}/page/summary/${encodeURIComponent(v)}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (!extract && data.extract) extract = data.extract;
      const img = data.originalimage?.source || data.thumbnail?.source;
      if (img) { image = img; thumb = data.thumbnail?.source || img; break; }
    } catch { /* keep trying */ }
  }

  if (!image) {
    try {
      const imgs = await getPlaceImages(variants[0], 1);
      if (imgs[0]) { image = imgs[0].url; thumb = imgs[0].thumb; }
    } catch { /* ignore */ }
  }

  // Last-resort hero: Unsplash Source (no key, deterministic by query)
  if (!image) image = unsplashUrl(name, 1200, 800, 0);
  if (!thumb) thumb = unsplashUrl(name, 600, 400, 0);

  const result = { extract, thumb, image };
  summaryCache.set(name, result);
  return result;
}

function unsplashUrl(query: string, w = 800, h = 600, sig = 0) {
  const q = encodeURIComponent(`${query.split(",")[0]} travel`);
  return `https://source.unsplash.com/${w}x${h}/?${q}&sig=${sig}`;
}

function loremFlickrUrl(query: string, w = 800, h = 600, sig = 0) {
  const q = encodeURIComponent(query.split(",")[0]);
  return `https://loremflickr.com/${w}/${h}/${q}/all?lock=${sig}`;
}

export async function getPlaceImages(name: string, limit = 10): Promise<PlaceImage[]> {
  const cacheKey = `${name}::${limit}`;
  if (imagesCache.has(cacheKey)) return imagesCache.get(cacheKey)!;

  const collected: PlaceImage[] = [];

  // 1. Try Wikimedia Commons
  try {
    const url = `${COMMONS_API}?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(
      name,
    )}&gsrlimit=${limit}&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
      for (const p of pages as any[]) {
        const info = p?.imageinfo?.[0];
        if (!info) continue;
        const ext = (info.url || "").toLowerCase();
        if (!/\.(jpg|jpeg|png|webp)$/.test(ext)) continue;
        collected.push({
          url: info.thumburl || info.url,
          thumb: info.thumburl || info.url,
          source: info.descriptionshorturl || info.url,
          title: p.title?.replace(/^File:/, "") || name,
        });
      }
    }
  } catch { /* ignore */ }

  // 2. Add Wikipedia summary hero (different keywords) for variety
  if (collected.length < limit) {
    const baseName = name.split(",")[0].trim();
    const queries = [baseName, `${baseName} city`, `${baseName} landmark`, `${baseName} tourism`];
    for (const q of queries) {
      try {
        const r = await fetch(`${WIKI_REST}/page/summary/${encodeURIComponent(q)}`);
        if (!r.ok) continue;
        const d = await r.json();
        const u = d.originalimage?.source || d.thumbnail?.source;
        if (u && !collected.find(c => c.url === u)) {
          collected.push({ url: u, thumb: d.thumbnail?.source || u, source: d.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(q)}`, title: q });
        }
      } catch { /* ignore */ }
      if (collected.length >= limit) break;
    }
  }

  // 3. Always supplement with Unsplash + LoremFlickr fallbacks so gallery is never empty
  const target = Math.max(limit, 8);
  let sig = 0;
  while (collected.length < target) {
    const useFlickr = sig % 2 === 1;
    const u = useFlickr ? loremFlickrUrl(name, 800, 600, sig) : unsplashUrl(name, 800, 600, sig);
    collected.push({ url: u, thumb: u, source: u, title: `${name} photo` });
    sig++;
    if (sig > 20) break;
  }

  imagesCache.set(cacheKey, collected);
  return collected;
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
