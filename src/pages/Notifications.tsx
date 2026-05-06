import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Heart, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Notif {
  id: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  actor_id: string | null;
  read_at: string | null;
  created_at: string;
  actor?: { full_name: string | null; avatar_url: string | null } | null;
}

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Notifications · HELOLA"; }, []);
  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id,type,entity_type,entity_id,actor_id,read_at,created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    const list = (data ?? []) as Notif[];
    const actorIds = Array.from(new Set(list.map(n => n.actor_id).filter(Boolean))) as string[];
    if (actorIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", actorIds);
      const map = new Map((profs ?? []).map(p => [p.id, p]));
      list.forEach(n => { n.actor = (map.get(n.actor_id!) as any) ?? null; });
    }
    setItems(list);
    setLoading(false);

    // Mark unread as read
    const unread = list.filter(n => !n.read_at).map(n => n.id);
    if (unread.length) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", unread);
    }
  }

  useEffect(() => { if (user) load(); }, [user]);

  async function clearAll() {
    if (!user || !items.length) return;
    if (!confirm("Clear all notifications?")) return;
    const { error } = await supabase.from("notifications").delete().eq("recipient_id", user.id);
    if (error) return toast({ title: "Couldn't clear", description: error.message, variant: "destructive" });
    setItems([]);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-3 md:px-6">
        <button onClick={() => navigate(-1)} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-sans text-base font-semibold flex-1">Notifications</h1>
        {items.length > 0 && (
          <Button size="sm" variant="ghost" onClick={clearAll} className="text-destructive">
            <Trash2 className="mr-1 h-3.5 w-3.5" />Clear
          </Button>
        )}
      </header>

      <div className="mx-auto max-w-2xl px-3 py-4">
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">You're all caught up</p>
            <p className="mt-1 text-sm text-muted-foreground">Likes and trip activity will show up here.</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {items.map(n => (
              <li key={n.id}>
                <NotifItem n={n} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NotifItem({ n }: { n: Notif }) {
  const name = n.actor?.full_name ?? "Someone";
  let text = "did something";
  let href = "/moments";
  if (n.type === "memory_like") {
    text = "liked your moment";
    href = "/moments";
  }
  return (
    <Link to={href} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-soft hover:bg-muted/50">
      <div className="relative shrink-0">
        <UserAvatar url={n.actor?.avatar_url ?? null} name={name} size={40} />
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
          <Heart className="h-3 w-3 fill-current" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm"><span className="font-semibold">{name}</span> {text}</p>
        <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      </div>
    </Link>
  );
}
