import { useState } from "react";
import { Sparkles, Crown, ChevronRight } from "lucide-react";
import { PremiumSheet } from "./PremiumSheet";
import { usePremium, planById, formatDate } from "@/lib/premium";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "home" | "profile";
  className?: string;
}

/**
 * Invite card shown on Home and Profile.
 * Automatically flips to a "Premium Member" card when the user is subscribed.
 */
export function PremiumInviteCard({ variant = "home", className }: Props) {
  const [open, setOpen] = useState(false);
  const { sub, isPremium, loading } = usePremium();

  if (loading) return null;

  if (isPremium && sub) {
    const plan = planById(sub.plan);
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "group relative block w-full overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-primary via-primary to-[#3d0016] p-5 text-left text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5",
            className
          )}
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" />
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-300/20 backdrop-blur">
              <Crown className="h-5 w-5 text-amber-300" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">Helola Premium Member</p>
              <p className="mt-0.5 text-base font-semibold">You're on the {plan.name} plan</p>
              <p className="text-xs text-primary-foreground/75">Renews {formatDate(sub.renewal_date)}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-primary-foreground/70" />
          </div>
        </button>
        <PremiumSheet open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group relative block w-full overflow-hidden rounded-3xl border border-amber-300/25 bg-gradient-to-br from-primary via-primary to-[#3d0016] p-5 text-left text-primary-foreground shadow-elegant transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(92,1,32,0.6)]",
          className
        )}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-300/15 backdrop-blur ring-1 ring-amber-300/30">
            <Sparkles className="h-5 w-5 text-amber-300" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
              {variant === "home" ? "Unlock Helola Premium" : "Try Helola Premium"}
            </p>
            <p className="mt-1 font-display text-lg font-semibold leading-snug">
              A more meaningful way to travel
            </p>
            <p className="mt-1 text-xs text-primary-foreground/75">
              Exclusive experiences • Community • Effortless travel
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-4 py-1.5 text-xs font-semibold text-primary shadow-soft transition-transform group-hover:scale-[1.02]">
              Explore Premium
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </button>
      <PremiumSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
