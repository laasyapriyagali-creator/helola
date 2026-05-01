import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings as SettingsIcon, Lock, Bell, Heart, FileText, UserCircle2, ChevronRight, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => { document.title = "Settings · HELOLA"; }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-3 md:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-sans text-base font-semibold tracking-tight text-foreground">Settings</h1>
      </header>

      <div className="mx-auto max-w-2xl space-y-10 px-4 py-6 md:px-8">
        <Section title="My account" icon={<SettingsIcon className="h-4 w-4" />}>
          <NavRow to="/settings/account" label="Account information" hint="Username, display name, email, phone" />
          <Divider />
          <NavRow to="/settings/edit-profile" label="Edit profile details" hint="Name, location, bio, hobbies" />
        </Section>

        <Section title="Privacy & safety" icon={<Lock className="h-4 w-4" />}>
          <NavRow to="/settings/visibility" label="Profile visibility" hint="Who can see your profile" />
          <Divider />
          <NavRow to="/settings/messages" label="Who can message you" />
          <Divider />
          <NavRow to="/settings/blocked" label="Blocked users" />
          <Divider />
          <NavRow to="/settings/report" label="Report issues" />
        </Section>

        <Section title="Notifications" icon={<Bell className="h-4 w-4" />}>
          <NavRow to="/settings/notifications/trip-updates" label="Trip updates" />
          <Divider />
          <NavRow to="/settings/notifications/group-chat" label="Group chat messages" />
          <Divider />
          <NavRow to="/settings/notifications/new-trip-alerts" label="New trip alerts" />
          <Divider />
          <NavRow to="/settings/notifications/offers" label="Offers & promotions" />
        </Section>

        <Section title="Preferences" icon={<Heart className="h-4 w-4" />}>
          <NavRow to="/settings/preferences/location" label="Location access" />
          <Divider />
          <NavRow to="/settings/preferences/destinations" label="Preferred destinations" />
          <Divider />
          <NavRow to="/settings/preferences/budget" label="Budget range" />
          <Divider />
          <NavRow to="/settings/preferences/interests" label="Travel interests" />
        </Section>

        <Section title="Legal & support" icon={<FileText className="h-4 w-4" />}>
          <NavRow to="/legal/privacy" label="Privacy Policy" />
          <Divider />
          <NavRow to="/legal/terms" label="Terms & Conditions" />
          <Divider />
          <NavRow to="/legal/community" label="Community Guidelines" />
          <Divider />
          <NavRow to="/about" label="About HELOLA" />
          <Divider />
          <NavRow to="/support" label="Contact support" />
        </Section>

        <Section title="Account actions" icon={<UserCircle2 className="h-4 w-4" />}>
          <div className="flex items-center justify-between gap-3 py-3">
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            <Button size="sm" onClick={async () => { await signOut(); navigate("/auth"); }} className="rounded-full">
              <LogOut className="mr-1 h-3.5 w-3.5" />Log out
            </Button>
          </div>
          <Divider />
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-destructive">Delete account</p>
              <p className="truncate text-xs text-muted-foreground">Permanently remove your account after a 30-day grace period.</p>
            </div>
            <Button size="sm" onClick={() => setDeleteOpen(true)} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="mr-1 h-3.5 w-3.5" />Delete account
            </Button>
          </div>
        </Section>

        <p className="pt-4 text-center text-xs text-muted-foreground">© All rights reserved by HELOLA</p>
      </div>

      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 text-primary">
        {icon}
        <h3 className="font-sans text-base font-semibold tracking-tight">{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Divider() { return <div className="h-px bg-border" />; }

function NavRow({ to, label, hint }: { to: string; label: string; hint?: string }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-primary">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
