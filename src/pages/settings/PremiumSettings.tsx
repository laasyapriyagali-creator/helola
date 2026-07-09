import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Crown, Sparkles, RefreshCw, XCircle, Receipt, LifeBuoy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePremium, planById, formatDate, cancelSubscription, setAutoRenew, PLANS, PREMIUM_BENEFITS } from "@/lib/premium";
import { PremiumSheet } from "@/components/premium/PremiumSheet";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PaymentRow {
  id: string;
  plan: "monthly" | "six_month" | "yearly";
  amount_inr: number;
  status: string;
  paid_at: string;
}

export default function PremiumSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sub, isPremium, loading, reload } = usePremium();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  useEffect(() => {
    if (!loading && !isPremium) navigate("/settings", { replace: true });
  }, [loading, isPremium, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("premium_payment_history")
        .select("id,plan,amount_inr,status,paid_at")
        .eq("user_id", user.id)
        .order("paid_at", { ascending: false })
        .limit(20);
      setPayments((data as unknown as PaymentRow[]) ?? []);
    })();
  }, [user, sub?.id]);

  if (loading || !sub) return <SettingsPage title="Helola Premium"><div /></SettingsPage>;

  const plan = planById(sub.plan);

  const handleCancel = async () => {
    if (!user) return;
    try {
      await cancelSubscription(user.id);
      await reload();
      toast.success("Subscription cancelled. You'll keep access until it expires.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not cancel");
    }
  };

  const handleAutoRenew = async (v: boolean) => {
    if (!user) return;
    try {
      await setAutoRenew(user.id, v);
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update");
    }
  };

  const handleRestore = async () => {
    await reload();
    toast.success("Purchases restored");
  };

  return (
    <SettingsPage title="Helola Premium">
      {/* Hero status card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[#3d0016] p-6 text-primary-foreground shadow-elegant">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-300/20">
            <Crown className="h-5 w-5 text-amber-300" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
              {sub.status === "active" ? "Active Member" : sub.status === "cancelled" ? "Cancelled" : sub.status}
            </p>
            <p className="font-display text-xl font-semibold">{plan.name} Plan</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Info label="Started" value={formatDate(sub.start_date)} />
          <Info label={sub.status === "cancelled" ? "Ends" : "Renews"} value={formatDate(sub.renewal_date ?? sub.expiry_date)} />
        </div>
      </div>

      {/* Manage subscription */}
      <Section title="Manage subscription">
        <Row
          label="Upgrade or change plan"
          hint={`Currently ${plan.name}`}
          onClick={() => setSheetOpen(true)}
        />
        <Divider />
        <div className="flex items-center justify-between py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Auto-renew</p>
            <p className="text-xs text-muted-foreground">Keeps your membership active without interruption.</p>
          </div>
          <Switch checked={sub.auto_renew} onCheckedChange={handleAutoRenew} />
        </div>
        {sub.status !== "cancelled" && (
          <>
            <Divider />
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-destructive">Cancel subscription</p>
                <p className="text-xs text-muted-foreground">You'll keep access until {formatDate(sub.expiry_date)}.</p>
              </div>
              <XCircle className="h-4 w-4 text-destructive" />
            </button>
          </>
        )}
        <Divider />
        <button type="button" onClick={handleRestore} className="flex w-full items-center justify-between gap-3 py-3 text-left">
          <div className="min-w-0">
            <p className="text-sm font-medium">Restore purchases</p>
            <p className="text-xs text-muted-foreground">Re-sync your subscription from our servers.</p>
          </div>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </Section>

      {/* Payment history */}
      <Section title="Payment history" icon={<Receipt className="h-4 w-4" />}>
        {payments.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{planById(p.plan).name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.paid_at)} · {p.status}</p>
                </div>
                <p className="text-sm font-semibold">₹{p.amount_inr.toLocaleString(undefined)}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Benefits */}
      <Section title="Your Premium benefits" icon={<Sparkles className="h-4 w-4" />}>
        <ul className="space-y-3 py-2">
          {PREMIUM_BENEFITS.map((b) => (
            <li key={b.title} className="flex gap-3">
              <span className="mt-0.5 text-xl">{b.icon}</span>
              <div>
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Support */}
      <Section title="Support" icon={<LifeBuoy className="h-4 w-4" />}>
        <Row
          label="Contact Premium Support"
          hint="Priority replies from our team."
          onClick={() => (window.location.href = "mailto:helolasupport@gmail.com?subject=Premium%20Support")}
        />
        <Divider />
        <Row
          label="Request refund"
          hint="Eligible within 7 days of a new purchase."
          onClick={() => (window.location.href = "mailto:helolasupport@gmail.com?subject=Premium%20Refund%20Request")}
        />
      </Section>

      <PremiumSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your Premium?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll keep access to member benefits until {formatDate(sub.expiry_date)}. After that your membership won't renew.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Premium</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsPage>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
      <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-2 flex items-center gap-2 text-primary">
        {icon}
        <h3 className="font-sans text-base font-semibold tracking-tight">{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Divider() { return <div className="h-px bg-border" />; }

function Row({ label, hint, onClick }: { label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:text-primary">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span className="text-muted-foreground">›</span>
    </button>
  );
}
