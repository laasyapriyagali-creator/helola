import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/UserAvatar";
import { Trash2, Loader2 } from "lucide-react";

type Visibility = "public" | "friends" | "private";
type MessagePerm = "everyone" | "friends" | "nobody";

export function VisibilityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const [value, setValue] = useState<Visibility>("public");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("profiles").select("profile_visibility").eq("id", user.id).maybeSingle()
      .then(({ data }) => data?.profile_visibility && setValue(data.profile_visibility as Visibility));
  }, [open, user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ profile_visibility: value }).eq("id", user.id);
    setBusy(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: "Visibility updated" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile visibility</DialogTitle>
          <DialogDescription>Choose who can see your profile and trips.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={value} onValueChange={(v) => setValue(v as Visibility)} className="space-y-2 py-2">
          {[
            { v: "public", l: "Public", d: "Anyone on HELOLA can find you." },
            { v: "friends", l: "Trip mates only", d: "Only people from shared trips." },
            { v: "private", l: "Private", d: "Only you can see your profile." },
          ].map((opt) => (
            <Label key={opt.v} htmlFor={`vis-${opt.v}`} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 hover:bg-muted/40">
              <RadioGroupItem id={`vis-${opt.v}`} value={opt.v} className="mt-0.5" />
              <div><p className="font-medium">{opt.l}</p><p className="text-xs text-muted-foreground">{opt.d}</p></div>
            </Label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button onClick={save} disabled={busy} className="rounded-full">{busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MessagePermissionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const [value, setValue] = useState<MessagePerm>("everyone");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("profiles").select("message_permission").eq("id", user.id).maybeSingle()
      .then(({ data }) => data?.message_permission && setValue(data.message_permission as MessagePerm));
  }, [open, user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ message_permission: value }).eq("id", user.id);
    setBusy(false);
    if (error) return toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    toast({ title: "Updated" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Who can message you</DialogTitle>
          <DialogDescription>Control who is allowed to start a chat with you.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={value} onValueChange={(v) => setValue(v as MessagePerm)} className="space-y-2 py-2">
          {[
            { v: "everyone", l: "Everyone" },
            { v: "friends", l: "Trip mates only" },
            { v: "nobody", l: "Nobody" },
          ].map((opt) => (
            <Label key={opt.v} htmlFor={`mp-${opt.v}`} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/40">
              <RadioGroupItem id={`mp-${opt.v}`} value={opt.v} />
              <span className="font-medium">{opt.l}</span>
            </Label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button onClick={save} disabled={busy} className="rounded-full">{busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BlockedRow { id: string; blocked_id: string; profile?: { full_name: string | null; username: string | null; avatar_url: string | null } | null; }

export function BlockedUsersDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<BlockedRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("blocked_users").select("id, blocked_id").eq("blocker_id", user.id);
    const ids = (data ?? []).map(r => r.blocked_id);
    let profiles: Record<string, BlockedRow["profile"]> = {};
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", ids);
      profiles = Object.fromEntries((ps ?? []).map(p => [p.id, p]));
    }
    setRows((data ?? []).map(r => ({ ...r, profile: profiles[r.blocked_id] })));
    setLoading(false);
  };

  useEffect(() => { if (open) load(); /* eslint-disable-next-line */ }, [open, user]);

  const unblock = async (id: string) => {
    const { error } = await supabase.from("blocked_users").delete().eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Unblocked" });
    load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Blocked users</DialogTitle>
          <DialogDescription>People you've blocked can't see your profile or message you.</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-y-auto py-2">
          {loading ? <p className="text-center text-sm text-muted-foreground">Loading…</p>
          : rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">You haven't blocked anyone.</p>
          : rows.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-2.5">
              <div className="flex items-center gap-2.5">
                <UserAvatar url={r.profile?.avatar_url} name={r.profile?.full_name} size={36} />
                <div><p className="text-sm font-medium">{r.profile?.full_name || "Unknown"}</p><p className="text-xs text-muted-foreground">@{r.profile?.username || "user"}</p></div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => unblock(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReportIssueDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const [reason, setReason] = useState("Bug or technical issue");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!details.trim()) return toast({ title: "Please add some details", variant: "destructive" });
    setBusy(true);
    const { error } = await supabase.from("user_reports").insert({
      reporter_id: user.id, reported_id: user.id, reason, details, status: "pending",
    });
    setBusy(false);
    if (error) return toast({ title: "Couldn't submit", description: error.message, variant: "destructive" });
    toast({ title: "Report submitted ❤️", description: "Our team will look into it." });
    setDetails("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Report an issue</DialogTitle><DialogDescription>Tell us what went wrong.</DialogDescription></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Type</Label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option>Bug or technical issue</option><option>Inappropriate content</option><option>Safety concern</option>
              <option>Payment or refund</option><option>Other</option>
            </select>
          </div>
          <div className="space-y-1.5"><Label>Details</Label><Textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe what happened…" /></div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy} className="rounded-full">{busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}Submit</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
