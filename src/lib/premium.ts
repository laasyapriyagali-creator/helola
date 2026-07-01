import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  price: number;
  priceLabel: string;
  cadence: string;
  monthlyEquivalent: number;
  savingsVsMonthly?: number;
  badge?: "Most Popular" | "Best Value";
  months: number;
}

export const PLANS: PlanDef[] = [
  {
    id: "monthly",
    name: "Monthly",
    emoji: "🌙",
    price: 299,
    priceLabel: "₹299",
    cadence: "/month",
    monthlyEquivalent: 299,
    months: 1,
  },
  {
    id: "six_month",
    name: "6-Month Saver",
    emoji: "💼",
    price: 1499,
    priceLabel: "₹1,499",
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
    priceLabel: "₹1,999",
    cadence: "/year",
    monthlyEquivalent: Math.round(1999 / 12),
    savingsVsMonthly: 299 * 12 - 1999,
    badge: "Best Value",
    months: 12,
  },
];

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

/** Simulated subscribe — payment gateway integration point. */
export async function subscribeToPlan(userId: string, plan: PremiumPlan) {
  const def = planById(plan);
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + def.months);

  const payload = {
    user_id: userId,
    plan,
    status: "active" as PremiumStatus,
    start_date: now.toISOString(),
    renewal_date: end.toISOString(),
    expiry_date: end.toISOString(),
    auto_renew: true,
    cancelled_at: null,
    provider: "simulated",
  };

  const { data, error } = await supabase
    .from("premium_subscriptions")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .maybeSingle();
  if (error) throw error;

  await supabase.from("premium_payment_history").insert({
    user_id: userId,
    subscription_id: data?.id,
    plan,
    amount_inr: def.price,
    status: "succeeded",
    provider: "simulated",
  });

  return data as unknown as PremiumSubscription;
}

export async function cancelSubscription(userId: string) {
  const { error } = await supabase
    .from("premium_subscriptions")
    .update({ status: "cancelled", auto_renew: false, cancelled_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function setAutoRenew(userId: string, value: boolean) {
  const { error } = await supabase
    .from("premium_subscriptions")
    .update({ auto_renew: value })
    .eq("user_id", userId);
  if (error) throw error;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
