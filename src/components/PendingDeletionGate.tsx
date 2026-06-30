import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export function PendingDeletionGate() {
  const { pendingDeletion, restoreAccount, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (!pendingDeletion) return null;

  const handleRestore = async () => {
    setBusy(true);
    const { error } = await restoreAccount();
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't restore account", description: error, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome back!", description: "Your account has been restored." });
  };

  const handleSignOut = async () => {
    setBusy(true);
    await signOut();
    setBusy(false);
    navigate("/auth", { replace: true });
  };

  return (
    <AlertDialog open>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Account scheduled for deletion
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-foreground/80">
            <span className="block">
              Your account will be permanently deleted in <strong>{pendingDeletion.daysLeft} {pendingDeletion.daysLeft === 1 ? "day" : "days"}</strong>.
            </span>
            <span className="block">
              During this time your profile, trips, and moments are hidden. Restore your account now to keep everything, or sign out to leave it scheduled for deletion.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={busy} onClick={handleSignOut} className="rounded-full">
            Sign out
          </AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={handleRestore} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Restoring…" : "Restore account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
