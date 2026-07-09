import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatPriceFromINR } from "@/lib/i18n";

export type PremiumPlan = "monthly" | "six_month" | "yearly";
export type PremiumStatus = "active" | "cancelled" | "expired" | "pending";

export interface PremiumSubscription {
  id: string;
  user_id: string;
  plan: PremiumPlan;
  status: PremiumStatus;
  start_date: string;
  renewal_date: string | null;
  expiry_date: string | null;
  auto_renew: boolean;
  cancelled_at: string | null;
  provider: string | null;
}

export interface PlanDef {
  id: PremiumPlan;
  name: string;
  emoji: string;
  /** Base price in INR (storage currency). Display converts to viewer's locale. */
  price: number;
  /** Localized display string derived from `price`. */
  priceLabel: string;
  cadence: string;
  monthlyEquivalent: number;
  savingsVsMonthly?: number;
  savingsLabel?: string;
  badge?: "Most Popular" | "Best Value";
  months: number;
}

const RAW_PLANS: Omit<PlanDef, "priceLabel" | "savingsLabel">[] = [
  {
    id: "monthly",
    name: "Monthly",
    emoji: "🌙",
    price: 299,
    cadence: "/month",
    monthlyEquivalent: 299,
    months: 1,
  },
  {
    id: "six_month",
    name: "6-Month Saver",
    emoji: "💼",
    price: 1499,
    cadence: "every 6 months",
    monthlyEquivalent: Math.round(1499 / 6),
    savingsVsMonthly: 299 * 6 - 1499,
    badge: "Most Popular",
    months: 6,
  },
  {
    id: "yearly",
    name: "Yearly",
    emoji: "👑",
    price: 1999,
    cadence: "/year",
    monthlyEquivalent: Math.round(1999 / 12),
    savingsVsMonthly: 299 * 12 - 1999,
    badge: "Best Value",
    months: 12,
  },
];

export const PLANS: PlanDef[] = RAW_PLANS.map(p => ({
  ...p,
  priceLabel: formatPriceFromINR(p.price),
  savingsLabel: p.savingsVsMonthly ? formatPriceFromINR(p.savingsVsMonthly) : undefined,
}));

export const PREMIUM_BENEFITS = [
  { icon: "🎟️", title: "Exclusive Helola Community Events", desc: "Curated meetups, dinners, and travel gatherings only for members." },
  { icon: "🛂", title: "Effortless Travel with Visa Check-in & Support", desc: "Guided visa checklists and priority travel help before every trip." },
  { icon: "🎁", title: "Exclusive Perks & Member Discounts", desc: "Handpicked partner offers on stays, experiences, and gear." },
  { icon: "🌍", title: "Welcome on Arrival in Local Tradition", desc: "A warm local welcome at select destinations, where available." },
  { icon: "🤝", title: "Choose Who You Travel With", desc: "Priority access to trips and the ability to shape your travel circle." },
];

export function planById(id: PremiumPlan) {
  return PLANS.find(p => p.id === id)!;
}

export function isActive(sub: PremiumSubscription | null): boolean {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  if (sub.expiry_date && new Date(sub.expiry_date).getTime() < Date.now()) return false;
  return true;
}

export function usePremium() {
  const { user } = useAuth();
  const [sub, setSub] = useState<PremiumSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setSub(null); setLoading(false); return; }
    const { data } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSub((data as unknown as PremiumSubscription) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { sub, isPremium: isActive(sub), loading, reload: load };
}

/**
 * Premium activation is intentionally NOT available from the client.
 * A real payment gateway (Stripe/Paddle/Razorpay) must verify payment
 * server-side and insert the row using the service role. Until that
 * integration ships, subscribe attempts throw. Direct INSERT on
 * premium_subscriptions is revoked from the client anyway (defense in depth).
 */
export async function subscribeToPlan(_userId: string, _plan: PremiumPlan): Promise<never> {
  throw new Error("Payments are coming soon — checkout will open here once billing is live.");
}

/** Cancel the caller's own active subscription via server-side RPC (auth.uid() check inside). */
export async function cancelSubscription(_userId: string) {
  const { error } = await supabase.rpc("cancel_premium_subscription");
  if (error) throw error;
}

/** Toggle auto-renew on the caller's own subscription via server-side RPC (auth.uid() check inside). */
export async function setAutoRenew(_userId: string, value: boolean) {
  const { error } = await supabase.rpc("set_premium_auto_renew", { _value: value });
  if (error) throw error;
}

export { formatMediumDate as formatDate } from "@/lib/i18n";
