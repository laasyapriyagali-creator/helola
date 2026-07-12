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
  {
    icon: "🌍",
    title: "Travel Like a Local",
    desc: "Chat with verified locals before your trip to uncover hidden cafés, secret viewpoints, and authentic experiences most tourists miss. Get trusted tips, safety insights, and cultural know-how before you even land.",
  },
  {
    icon: "🎉",
    title: "Premium Experiences",
    desc: "Unlock unforgettable moments curated only for members — sunrise hikes, rooftop dinners, private yacht trips, and weekend escapes that go far beyond ordinary travel.",
  },
  {
    icon: "🏆",
    title: "Loyalty Rewards",
    desc: "Every completed trip earns reward points. Redeem them for Premium months, travel vouchers, partner discounts, exclusive merch, and future Helola experiences.",
  },
  {
    icon: "🚀",
    title: "Early Access",
    desc: "Always be first. From brand-new features to exclusive beta releases, Premium members get early access to everything we build before anyone else.",
  },
  {
    icon: "🎁",
    title: "Birthday & Celebration Perks",
    desc: "Celebrate your birthday and Helola milestones with exclusive travel discounts, complimentary experiences, and surprise rewards made just for members.",
  },
  {
    icon: "💼",
    title: "Exclusive Partner Benefits",
    desc: "Save more wherever you go with special offers from our partners — hotels, cafés, adventure companies, gear brands, airport lounges, and more.",
  },
  {
    icon: "🎥",
    title: "AI Travel Memory Movie",
    desc: "After every trip, Helola turns everyone's shared photos and videos into a beautifully edited cinematic travel movie — with music, transitions, and unforgettable moments.",
  },
  {
    icon: "⭐",
    title: "Premium Verified Traveller",
    desc: "Stand out with a Premium Verified Traveller badge across your profile. Build trust in the community and enjoy greater visibility when creating trips.",
  },
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
