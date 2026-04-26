import { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Lock, MessageCircle, Users } from "lucide-react";

interface ChatThread { trip_id: string; destination: string; start_date: string; max_members: number; member_count: number; }

export default function Chats() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Chats · HELOLA"; }, []);
  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: tm } = await supabase.from("trip_members").select("trip_id").eq("user_id", user.id);
      const ids = (tm ?? []).map(m => m.trip_id);
      if (ids.length === 0) { setThreads([]); setLoading(false); return; }
      const { data: ts } = await supabase.from("trips").select("id,destination,start_date,max_members").in("id", ids);
      const { data: counts } = await supabase.from("trip_members").select("trip_id").in("trip_id", ids);
      const cMap: Record<string, number> = {};
      (counts ?? []).forEach(c => { cMap[c.trip_id] = (cMap[c.trip_id] || 0) + 1; });
      setThreads((ts ?? []).map(t => ({
        trip_id: t.id, destination: t.destination, start_date: t.start_date, max_members: t.max_members,
        member_count: cMap[t.id] || 0,
      })));
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="px-4 pt-6 md:px-8 md:pt-10">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Chats</h1>
      <p className="mt-1 text-sm text-muted-foreground">You'll only get group chat access for trips you've joined.</p>

      <div className="mt-6 space-y-3">
        {loading ? [1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />) :
         threads.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">No chats yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Join a trip to unlock its group chat.</p>
            <Button asChild className="mt-4 rounded-full"><Link to="/">Discover trips</Link></Button>
          </div>
        ) : (
          threads.map(t => {
            const start = new Date(t.start_date);
            return (
              <Link key={t.trip_id} to={`/chats/${t.trip_id}`}>
                <Card className="border-border/60 shadow-soft transition-all hover:shadow-elegant">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold">{t.destination.toUpperCase()} TRIP</p>
                      <p className="text-xs text-muted-foreground">{start.toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })} · <Users className="inline h-3 w-3" /> {t.member_count}/{t.max_members}</p>
                    </div>
                    <span className="text-2xl text-muted-foreground">›</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

interface Message { id: string; sender_id: string; content: string; created_at: string; }

export function ChatRoom() {
  const { tripId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tripName, setTripName] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; avatar_url: string | null }>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!tripId || !user) return;
    (async () => {
      const { data: t } = await supabase.from("trips").select("destination").eq("id", tripId).maybeSingle();
      setTripName(t?.destination ?? "Trip");
      document.title = `${t?.destination ?? "Chat"} · HELOLA`;

      const { data: msgs } = await supabase.from("messages").select("*").eq("trip_id", tripId).order("created_at");
      setMessages((msgs ?? []) as Message[]);

      const senderIds = Array.from(new Set((msgs ?? []).map(m => m.sender_id)));
      if (senderIds.length) {
        const { data: ps } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", senderIds);
        const map: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
        (ps ?? []).forEach(p => { map[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url ?? null }; });
        setProfiles(map);
      }
    })();

    // Realtime subscription
    const channel = supabase.channel(`messages:${tripId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `trip_id=eq.${tripId}` },
        async (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => [...prev, msg]);
          if (!profiles[msg.sender_id]) {
            const { data } = await supabase.from("profiles").select("id,full_name,avatar_url").eq("id", msg.sender_id).maybeSingle();
            if (data) setProfiles(p => ({ ...p, [data.id]: { full_name: data.full_name, avatar_url: data.avatar_url ?? null } }));
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId, user]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !user || !tripId) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    const { error } = await supabase.from("messages").insert({ trip_id: tripId, sender_id: user.id, content: text });
    if (error) {
      // restore input on error
      setInput(text);
      console.error(error);
    }
    setSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:h-[calc(100vh-4rem)]">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-warm text-primary-foreground">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold uppercase">{tripName} Trip</p>
          <p className="text-xs text-muted-foreground">Group chat · {messages.length} messages</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        {messages.length === 0 ? (
          <div className="mx-auto mt-10 max-w-xs text-center text-sm text-muted-foreground">
            Say hi 👋 — break the ice!
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-3">
            {messages.map((m) => {
              const me = m.sender_id === user?.id;
              const prof = profiles[m.sender_id];
              return (
                <div key={m.id} className={`flex items-end gap-2 ${me ? "flex-row-reverse" : ""}`}>
                  <UserAvatar url={prof?.avatar_url} name={prof?.full_name} size={32} />
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${me ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card shadow-soft"}`}>
                    {!me && <p className="mb-0.5 text-[11px] font-semibold opacity-70">{prof?.full_name ?? "Friend"}</p>}
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message..."
            className="h-11 rounded-full border-border bg-card px-4"
          />
          <Button onClick={send} disabled={sending || !input.trim()} size="icon" className="h-11 w-11 rounded-full">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
