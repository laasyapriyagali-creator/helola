import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Plus, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CreateMemoryDialog } from "@/components/CreateMemoryDialog";
import { cn } from "@/lib/utils";

interface Memory {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  story: string | null;
  like_count: number;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null };
  liked_by_me?: boolean;
}

export default function Moments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const pullStartY = useRef<number | null>(null);
  const [pullDist, setPullDist] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "Moments · HELOLA Trips"; load(); }, []);

  async function load() {
    const { data } = await supabase
      .from("memories")
      .select("id,user_id,image_url,caption,story,like_count,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    const list = (data ?? []) as Memory[];
    if (list.length) {
      const ids = Array.from(new Set(list.map(m => m.user_id)));
      const { data: profs } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids);
      const byId = new Map((profs ?? []).map(p => [p.id, p]));
      let likedSet = new Set<string>();
      if (user) {
        const { data: likes } = await supabase
          .from("memory_likes")
          .select("memory_id")
          .eq("user_id", user.id)
          .in("memory_id", list.map(m => m.id));
        likedSet = new Set((likes ?? []).map(l => l.memory_id));
      }
      list.forEach(m => {
        const p = byId.get(m.user_id) as any;
        m.author = { full_name: p?.full_name ?? null, avatar_url: p?.avatar_url ?? null };
        m.liked_by_me = likedSet.has(m.id);
      });
    }
    setMemories(list);
    setLoading(false);
    setRefreshing(false);
  }

  async function refresh() { setRefreshing(true); await load(); }

  async function toggleLike(m: Memory) {
    if (!user) { navigate("/auth"); return; }
    const liked = !!m.liked_by_me;
    setMemories(prev => prev.map(x => x.id === m.id ? { ...x, liked_by_me: !liked, like_count: x.like_count + (liked ? -1 : 1) } : x));
    if (liked) {
      const { error } = await supabase.from("memory_likes").delete().eq("memory_id", m.id).eq("user_id", user.id);
      if (error) { toast({ title: "Couldn't unlike", variant: "destructive" }); load(); }
    } else {
      const { error } = await supabase.from("memory_likes").insert({ memory_id: m.id, user_id: user.id });
      if (error) { toast({ title: "Couldn't like", variant: "destructive" }); load(); }
    }
  }

  // Pull-to-refresh
  function onTouchStart(e: React.TouchEvent) {
    if ((scrollRef.current?.scrollTop ?? 0) <= 0) pullStartY.current = e.touches[0].clientY;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (pullStartY.current == null) return;
    const d = e.touches[0].clientY - pullStartY.current;
    if (d > 0) setPullDist(Math.min(d, 80));
  }
  function onTouchEnd() {
    if (pullDist > 60) refresh();
    pullStartY.current = null;
    setPullDist(0);
  }

  return (
    <div
      ref={scrollRef}
      className="relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="font-display text-2xl font-bold text-primary">Moments</h1>
        <Button variant="ghost" size="icon" onClick={refresh} aria-label="Refresh">
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Pull indicator */}
      {pullDist > 0 && (
        <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height: pullDist }}>
          {pullDist > 60 ? "Release to refresh" : "Pull to refresh"}
        </div>
      )}

      {/* Feed */}
      <div className="mx-auto max-w-xl space-y-5 px-3 py-4 md:px-0">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-2xl" />)
        ) : memories.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="font-display text-xl font-semibold">No moments yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Be the first to share a travel memory.</p>
            <Button onClick={() => setCreateOpen(true)} className="mt-4 rounded-full"><Plus className="mr-1 h-4 w-4" />Share a moment</Button>
          </div>
        ) : (
          memories.map(m => {
            const isOpen = !!expanded[m.id];
            const story = m.story ?? "";
            const preview = story.length > 120 ? story.slice(0, 120).trimEnd() + "…" : story;
            return (
              <article key={m.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                {/* Author */}
                <Link to={`/u/${m.user_id}`} className="flex items-center gap-3 px-4 py-3">
                  <UserAvatar url={m.author?.avatar_url ?? null} name={m.author?.full_name} size={36} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{m.author?.full_name ?? "Traveler"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</p>
                  </div>
                </Link>

                {/* Image */}
                <img src={m.image_url} alt={m.caption ?? "Travel moment"} className="aspect-square w-full object-cover" loading="lazy" />

                {/* Like row — bottom-left */}
                <div className="flex items-center gap-2 px-4 pt-3">
                  <button
                    onClick={() => toggleLike(m)}
                    className="flex items-center gap-1.5 text-sm font-medium transition-transform active:scale-90"
                    aria-label={m.liked_by_me ? "Unlike" : "Like"}
                  >
                    <Heart className={cn("h-6 w-6", m.liked_by_me ? "fill-primary text-primary" : "text-foreground")} strokeWidth={2} />
                    <span className="tabular-nums">{m.like_count}</span>
                  </button>
                </div>

                {/* Caption + story */}
                <div className="space-y-1 px-4 pb-4 pt-2">
                  {m.caption && <p className="text-sm leading-relaxed"><span className="font-semibold">{m.author?.full_name?.split(" ")[0] ?? "Traveler"}</span> {m.caption}</p>}
                  {story && (
                    <div className="text-sm leading-relaxed text-foreground/85">
                      {isOpen ? story : preview}
                      {story.length > 120 && (
                        <button
                          onClick={() => setExpanded(s => ({ ...s, [m.id]: !isOpen }))}
                          className="ml-1 text-xs font-medium text-primary"
                        >
                          {isOpen ? "Show less" : "View more"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Floating create */}
      <button
        onClick={() => user ? setCreateOpen(true) : navigate("/auth")}
        aria-label="Share a moment"
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:bottom-8"
      >
        <Plus className="h-6 w-6" strokeWidth={2.4} />
      </button>

      <CreateMemoryDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => { setCreateOpen(false); load(); }} />
    </div>
  );
}
