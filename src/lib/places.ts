// Real-world place data via free, public APIs.
// - Search & geocode: OpenStreetMap Nominatim
// - Images: Wikipedia REST (page summary thumbnail) + Wikimedia Commons search
// No API keys required. No AI-generated images.

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
  source: string; // attribution / link
  title: string;
}

const NOMINATIM = "https://nominatim.openstreetmap.org";
const WIKI_REST = "https://en.wikipedia.org/api/rest_v1";
const WIKI_API = "https://en.wikipedia.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

export async function searchPlaces(query: string, limit = 6): Promise<PlaceSuggestion[]> {
  if (!query.trim()) return [];
  const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(query)}`;
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
}

export async function getPlaceSummary(name: string): Promise<{ extract: string; thumb?: string; image?: string } | null> {
  // Try multiple name variants against Wikipedia, then fall back to Commons image search.
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
      if (img) {
        image = img;
        thumb = data.thumbnail?.source || img;
        break;
      }
    } catch { /* keep trying */ }
  }

  // Fallback: search Wikimedia Commons for a real photo of the place.
  if (!image) {
    try {
      const imgs = await getPlaceImages(variants[0], 1);
      if (imgs[0]) { image = imgs[0].url; thumb = imgs[0].thumb; }
    } catch { /* ignore */ }
  }

  if (!extract && !image) return null;
  return { extract, thumb, image };
}

export async function getPlaceImages(name: string, limit = 8): Promise<PlaceImage[]> {
  // Use Commons MediaWiki search for real photographs.
  try {
    const url = `${COMMONS_API}?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(
      name,
    )}&gsrlimit=${limit}&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
    const images: PlaceImage[] = [];
    for (const p of pages as any[]) {
      const info = p?.imageinfo?.[0];
      if (!info) continue;
      const ext = (info.url || "").toLowerCase();
      if (!/\.(jpg|jpeg|png|webp)$/.test(ext)) continue;
      images.push({
        url: info.thumburl || info.url,
        thumb: info.thumburl || info.url,
        source: info.descriptionshorturl || info.url,
        title: p.title?.replace(/^File:/, "") || name,
      });
    }
    return images;
  } catch {
    return [];
  }
}

// Curated, real-world destinations used as the default scrollable list.
// Names are passed through Nominatim/Wikipedia at runtime — no images hardcoded.
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
