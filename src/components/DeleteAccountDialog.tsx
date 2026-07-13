import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: Props) {
  const [stage, setStage] = useState<"confirm" | "type">("confirm");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const reset = () => { setStage("confirm"); setTyped(""); };

  const handleDelete = async () => {
    if (typed !== "DELETE") return;
    setBusy(true);
    const { error } = await supabase.rpc("request_account_deletion");
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't schedule deletion", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Account scheduled for deletion",
      description: "You have 30 days to log in and reactivate before everything is permanently erased.",
    });
    onOpenChange(false);
    reset();
    await signOut();
    navigate("/auth");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md">
        {stage === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Are you sure you want to delete the account?
              </DialogTitle>
              <DialogDescription>
                This will start the account deletion process.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Cancel
              </Button>
              <Button onClick={() => setStage("type")} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-destructive">Type DELETE to confirm</DialogTitle>
              <DialogDescription className="space-y-2 text-foreground/80">
                <span className="block">These changes can't be undone.</span>
                <span className="block">Your account will be deleted after a 30-day grace period, and you can reactivate it anytime within that period if you change your mind.</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm</Label>
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" autoFocus />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={typed !== "DELETE" || busy}
                className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {busy ? "Scheduling…" : "Delete my account"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
