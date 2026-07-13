// Server-side proxy for Unsplash search so the access key never ships in the client bundle.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const UNSPLASH_API = "https://api.unsplash.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let query = (url.searchParams.get("query") || "").trim();
    let perPageRaw = url.searchParams.get("per_page");
    let orientationRaw = url.searchParams.get("orientation");

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body && typeof body === "object") {
          if (!query && typeof body.query === "string") query = body.query.trim();
          if (!perPageRaw && body.per_page != null) perPageRaw = String(body.per_page);
          if (!orientationRaw && typeof body.orientation === "string") orientationRaw = body.orientation;
        }
      } catch { /* ignore malformed body */ }
    }

    const perPage = Math.min(Math.max(parseInt(perPageRaw || "12", 10) || 12, 1), 30);
    const orientation = orientationRaw === "squarish" ? "squarish" : "landscape";

    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "UNSPLASH_KEY_MISSING", fallback: true, results: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}&content_filter=high&client_id=${key}`;
    const res = await fetch(upstream);
    if (!res.ok) {
      const fallback = res.status === 429 || res.status >= 500;
      console.error("Unsplash upstream error", res.status, await res.text().catch(() => ""));
      return new Response(JSON.stringify({ error: "UNSPLASH_UPSTREAM_ERROR", status: res.status, fallback, results: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const results = (data?.results || []).map((p: any) => ({
      id: p.id,
      description: p.description,
      alt_description: p.alt_description,
      urls: { full: p.urls?.full, regular: p.urls?.regular, small: p.urls?.small, thumb: p.urls?.thumb },
      links: { html: p.links?.html },
      user: p.user ? { name: p.user.name } : undefined,
      tags: Array.isArray(p.tags) ? p.tags.map((t: any) => ({ title: t?.title })).filter((t: any) => t.title) : [],
    }));

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
    });
  } catch (e) {
    console.error("Unsplash proxy error", (e as Error).message);
    return new Response(JSON.stringify({ error: "UNSPLASH_PROXY_ERROR", fallback: true, results: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});