import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, X } from "lucide-react";
import { PLANS, PREMIUM_BENEFITS, PremiumPlan, subscribeToPlan, usePremium, planById, formatDate } from "@/lib/premium";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumSheet({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sub, isPremium, reload } = usePremium();
  const [selected, setSelected] = useState<PremiumPlan>("six_month");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) setSelected("six_month"); }, [open]);

  const handleSubscribe = async () => {
    if (!user) { onOpenChange(false); navigate("/auth"); return; }
    setBusy(true);
    try {
      // Payments are gated to a server-side gateway. Until it ships,
      // subscribeToPlan throws with a friendly "coming soon" message.
      await subscribeToPlan(user.id, selected);
      await reload();
      toast.success("Welcome to Helola Premium ✨");
      onOpenChange(false);
    } catch (e: any) {
      toast.info(e?.message ?? "Checkout is coming soon.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t-0 bg-gradient-to-b from-primary via-primary to-[#3d0016] p-0 text-primary-foreground"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-primary-foreground backdrop-blur transition hover:bg-white/20"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero */}
        <div className="px-6 pb-6 pt-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm animate-scale-in">
            <Crown className="h-7 w-7 text-amber-300" />
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight animate-fade-in">
            Helola Premium
          </h2>
          <p className="mt-2 text-sm text-primary-foreground/75 animate-fade-in">
            A more meaningful way to travel — together.
          </p>
        </div>

        {isPremium && sub ? (
          <ActiveBanner planId={sub.plan} renewal={sub.renewal_date} />
        ) : null}

        {/* Plans */}
        <div className="px-4 pb-2 space-y-3">
          {PLANS.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={cn(
                  "relative flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all",
                  active
                    ? "border-amber-300 bg-white/12 shadow-[0_0_0_1px_rgba(252,211,77,0.5)]"
                    : "border-white/15 bg-white/[0.06] hover:bg-white/10"
                )}
              >
                {p.badge && (
                  <span className="absolute -top-2 right-4 rounded-full bg-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {p.badge}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.emoji}</span>
                    <p className="font-semibold">{p.name}</p>
                  </div>
                  <p className="mt-1 text-xs text-primary-foreground/70">
                    {p.savingsLabel ? `Save ${p.savingsLabel} vs monthly` : "Flexible, cancel anytime"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold">{p.priceLabel}</p>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/60">{p.cadence}</p>
                </div>
                <span className={cn(
                  "ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  active ? "border-amber-300 bg-amber-300 text-primary" : "border-white/40"
                )}>
                  {active && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Benefits */}
        <div className="mt-6 px-6">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/90">
            <Sparkles className="h-3.5 w-3.5" /> Every plan includes
          </p>
          <ul className="space-y-3">
            {PREMIUM_BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-3">
                <span className="mt-0.5 text-xl">{b.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{b.title}</p>
                  <p className="text-xs text-primary-foreground/70">{b.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="sticky bottom-0 mt-8 border-t border-white/10 bg-gradient-to-t from-[#3d0016] to-[#3d0016]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
          <Button
            onClick={handleSubscribe}
            disabled={busy}
            className="h-12 w-full rounded-full bg-amber-300 text-primary hover:bg-amber-200 font-semibold text-base shadow-elegant"
          >
            {isPremium
              ? `Switch to ${planById(selected).name}`
              : `Join Premium — ${planById(selected).priceLabel}`}
          </Button>
          <p className="mt-2 text-center text-[11px] text-primary-foreground/60">
            Cancel anytime. Renews automatically until cancelled.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ActiveBanner({ planId, renewal }: { planId: PremiumPlan; renewal: string | null }) {
  const p = planById(planId);
  return (
    <div className="mx-4 mb-4 rounded-2xl border border-amber-300/40 bg-amber-300/10 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">You're a Premium Member</p>
      <p className="mt-1 text-sm">
        Current plan: <span className="font-semibold">{p.name}</span> · Renews {formatDate(renewal)}
      </p>
    </div>
  );
}
