import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { TripImage } from "@/components/TripImage";
import { TripGroupSheet } from "@/components/TripGroupSheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Lock, Users, Paperclip, X, Loader2, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ChatThread { trip_id: string; destination: string; start_date: string; max_members: number; member_count: number; cover_image_url: string | null }

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
      const { data: ts } = await supabase.from("trips").select("id,destination,start_date,max_members,cover_image_url").in("id", ids);
      const { data: counts } = await supabase.from("trip_members").select("trip_id").in("trip_id", ids);
      const cMap: Record<string, number> = {};
      (counts ?? []).forEach(c => { cMap[c.trip_id] = (cMap[c.trip_id] || 0) + 1; });
      setThreads((ts ?? []).map(t => ({
        trip_id: t.id, destination: t.destination, start_date: t.start_date, max_members: t.max_members,
        member_count: cMap[t.id] || 0, cover_image_url: t.cover_image_url ?? null,
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
                    <TripImage destination={t.destination} coverUrl={t.cover_image_url} rounded="xl" className="h-14 w-14 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold">{t.destination.toUpperCase()} TRIP</p>
                      <p className="text-xs text-muted-foreground">{start.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })} · <Users className="inline h-3 w-3" /> {t.member_count}/{t.max_members}</p>
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

interface Attachment { type: "image" | "video"; url: string }
interface Message { id: string; sender_id: string; content: string; created_at: string; attachments?: Attachment[] | null }

export function ChatRoom() {
  const { tripId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tripName, setTripName] = useState<string>("");
  const [tripCover, setTripCover] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; avatar_url: string | null }>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Resolve a stored attachment reference (a storage path, or a legacy public URL)
  // to a fresh signed URL from the now-private chat-media bucket.
  async function resolveAttachmentUrl(ref: string): Promise<string> {
    if (!ref) return ref;
    if (signedUrls[ref]) return signedUrls[ref];
    const legacyMarker = "/storage/v1/object/public/chat-media/";
    let path = ref;
    if (ref.startsWith("http")) {
      const i = ref.indexOf(legacyMarker);
      if (i === -1) return ref; // unknown external URL — leave as-is
      path = ref.slice(i + legacyMarker.length).split("?")[0];
    }
    const { data, error } = await supabase.storage.from("chat-media").createSignedUrl(path, 60 * 60);
    if (error || !data?.signedUrl) return "";
    setSignedUrls(prev => ({ ...prev, [ref]: data.signedUrl }));
    return data.signedUrl;
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBtn(!nearBottom);
  }
  function scrollToBottom(smooth = true) {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!tripId || !user) return;
    (async () => {
      const { data: t } = await supabase.from("trips").select("destination,cover_image_url").eq("id", tripId).maybeSingle();
      setTripName(t?.destination ?? "Trip");
      setTripCover(t?.cover_image_url ?? null);
      document.title = `${t?.destination ?? "Chat"} · HELOLA`;

      const { data: msgs } = await supabase.from("messages").select("*").eq("trip_id", tripId).order("created_at");
      setMessages((msgs ?? []) as unknown as Message[]);

      const senderIds = Array.from(new Set((msgs ?? []).map(m => m.sender_id)));
      if (senderIds.length) {
        const { data: ps } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", senderIds);
        const map: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
        (ps ?? []).forEach(p => { map[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url ?? null }; });
        setProfiles(map);
      }
    })();

    const channel = supabase.channel(`messages:${tripId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `trip_id=eq.${tripId}` },
        async (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => prev.some(p => p.id === msg.id) ? prev : [...prev, msg]);
          if (!profiles[msg.sender_id]) {
            const { data } = await supabase.from("profiles").select("id,full_name,avatar_url").eq("id", msg.sender_id).maybeSingle();
            if (data) setProfiles(p => ({ ...p, [data.id]: { full_name: data.full_name, avatar_url: data.avatar_url ?? null } }));
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId, user]);

  useEffect(() => { scrollToBottom(true); }, [messages.length]);

  function pickFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"));
    if (arr.length === 0) { toast({ title: "Pick images or videos", variant: "destructive" }); return; }
    setPendingFiles(prev => [...prev, ...arr].slice(0, 6));
  }

  const send = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || !user || !tripId) return;
    setSending(true);
    const text = input.trim();
    const files = pendingFiles;
    setInput(""); setPendingFiles([]);

    const attachments: Attachment[] = [];
    if (files.length > 0) {
      setUploading(true);
      try {
        for (const f of files) {
          if (f.size > 25 * 1024 * 1024) throw new Error("Files must be 25MB or less");
          const ext = (f.name.split(".").pop() || "bin").toLowerCase();
          const path = `${user.id}/${tripId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
          const { error } = await supabase.storage.from("chat-media").upload(path, f, { contentType: f.type, upsert: false });
          if (error) throw error;
          // Store the storage path (private bucket — resolved to signed URL at render time)
          attachments.push({ type: f.type.startsWith("video/") ? "video" : "image", url: path });
        }
      } catch (e: any) {
        toast({ title: "Upload failed", description: e.message, variant: "destructive" });
        setInput(text); setPendingFiles(files); setSending(false); setUploading(false); return;
      }
      setUploading(false);
    }

    const { error } = await supabase.from("messages").insert({
      trip_id: tripId, sender_id: user.id, content: text, attachments: attachments as any,
    });
    if (error) { setInput(text); setPendingFiles(files); console.error(error); }
    setSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:h-[calc(100vh-4rem)]">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button onClick={() => setGroupOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <TripImage destination={tripName} coverUrl={tripCover} rounded="full" className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold uppercase">{tripName} Trip</p>
            <p className="text-xs text-muted-foreground">Group chat · {messages.length} messages</p>
          </div>
        </button>
      </div>

      <TripGroupSheet open={groupOpen} onOpenChange={setGroupOpen} tripId={tripId ?? null} />

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 py-4 relative">
        {messages.length === 0 ? (
          <div className="mx-auto mt-10 max-w-xs text-center text-sm text-muted-foreground">
            Say hi 👋 — break the ice!
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-3">
            {messages.map((m, idx) => {
              const me = m.sender_id === user?.id;
              const prof = profiles[m.sender_id];
              const atts = (m.attachments ?? []) as Attachment[];
              const dayKey = new Date(m.created_at).toDateString();
              const prevDay = idx > 0 ? new Date(messages[idx - 1].created_at).toDateString() : null;
              const showDay = dayKey !== prevDay;
              const today = new Date().toDateString();
              const yest = new Date(Date.now() - 86400000).toDateString();
              const label = dayKey === today ? "Today" : dayKey === yest ? "Yesterday" : new Date(m.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
              return (
                <div key={m.id}>
                  {showDay && (
                    <div className="my-3 flex items-center justify-center">
                      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">{label}</span>
                    </div>
                  )}
                  <div className={`flex items-end gap-2 ${me ? "flex-row-reverse" : ""}`}>
                    <UserAvatar url={prof?.avatar_url} name={prof?.full_name} size={32} />
                    <div className={`max-w-[78%] space-y-1.5 rounded-2xl px-3.5 py-2 text-sm ${me ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card shadow-soft"}`}>
                      {!me && <p className="mb-0.5 text-[11px] font-semibold opacity-70">{prof?.full_name ?? "Friend"}</p>}
                      {atts.length > 0 && (
                        <div className={`grid gap-1 ${atts.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                          {atts.map((a, i) => (
                            <ChatAttachment key={i} refUrl={a.url} type={a.type} resolve={resolveAttachmentUrl} />
                          ))}
                        </div>
                      )}
                      {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                      <p className={`text-[10px] opacity-60 ${me ? "text-right" : ""}`}>{new Date(m.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom(true)}
            aria-label="Scroll to latest"
            className="sticky bottom-3 ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elegant transition-opacity hover:opacity-90"
            style={{ float: "right" }}
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        {pendingFiles.length > 0 && <PendingPreview files={pendingFiles} onRemove={(i) => setPendingFiles(prev => prev.filter((_, j) => j !== i))} />}
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/70"
            aria-label="Attach">
            <Paperclip className="h-4 w-4" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple hidden
            onChange={e => { pickFiles(e.target.files); e.target.value = ""; }} />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message..."
            className="h-11 rounded-full border-border bg-card px-4"
          />
          <Button onClick={send} disabled={sending || uploading || (!input.trim() && pendingFiles.length === 0)} size="icon" className="h-11 w-11 rounded-full">
            {sending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Stable object-URL previews — created once per file, revoked on unmount/remove. */
function PendingPreview({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  const urls = useMemo(() => files.map(f => URL.createObjectURL(f)), [files]);
  useEffect(() => () => { urls.forEach(u => URL.revokeObjectURL(u)); }, [urls]);
  return (
    <div className="mx-auto mb-2 flex max-w-2xl gap-2 overflow-x-auto">
      {files.map((f, i) => {
        const isVideo = f.type.startsWith("video/");
        return (
          <div key={i} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border">
            {isVideo
              ? <video src={urls[i]} className="h-full w-full object-cover" />
              : <img src={urls[i]} alt="" className="h-full w-full object-cover" />}
            <button onClick={() => onRemove(i)}
              aria-label="Remove attachment"
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white">
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Renders a chat attachment by resolving its private-bucket reference to a signed URL. */
function ChatAttachment({ refUrl, type, resolve }: { refUrl: string; type: "image" | "video"; resolve: (r: string) => Promise<string> }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    let alive = true;
    resolve(refUrl).then(u => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [refUrl, resolve]);
  if (!url) return <div className="h-40 w-full animate-pulse rounded-lg bg-muted/50" />;
  if (type === "video") return <video src={url} controls playsInline className="max-h-64 w-full rounded-lg object-cover" />;
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="attachment" className="max-h-64 w-full rounded-lg object-cover" loading="lazy" />
    </a>
  );
}
