// Compute live trip status & transport banner from trip data.
// Pure presentation logic — does not mutate the database.

export type LiveStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface TripLike {
  start_date: string;
  end_date: string;
  status: LiveStatus;
  travel_details?: {
    mode?: string;
    timing?: string;
    pickup?: string;
    state?: "on_time" | "delayed" | "cancelled";
    note?: string;
  } | null;
}

export function computeLiveStatus(trip: TripLike): LiveStatus {
  if (trip.status === "cancelled") return "cancelled";
  const now = new Date();
  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  // End-of-day for end_date so trips end at midnight of the next day
  end.setHours(23, 59, 59, 999);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "completed";
}

export function statusLabel(s: LiveStatus): string {
  switch (s) {
    case "upcoming": return "Upcoming";
    case "ongoing": return "Ongoing";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
  }
}

export function statusToneClass(s: LiveStatus): string {
  switch (s) {
    case "upcoming": return "bg-background/25 text-primary-foreground";
    case "ongoing": return "bg-emerald-500/90 text-white";
    case "completed": return "bg-muted text-muted-foreground";
    case "cancelled": return "bg-destructive text-destructive-foreground";
  }
}

export interface TransportBanner {
  tone: "warning" | "danger";
  title: string;
  detail?: string;
}

export function transportBanner(trip: TripLike): TransportBanner | null {
  const t = trip.travel_details;
  if (!t) return null;
  if (t.state === "cancelled") {
    return {
      tone: "danger",
      title: "Trip affected due to cancellation",
      detail: t.note || `${t.mode || "Transport"} has been cancelled.`,
    };
  }
  if (t.state === "delayed") {
    return {
      tone: "warning",
      title: "Trip delayed due to transport delay",
      detail: t.note || `${t.mode || "Transport"} is currently delayed.`,
    };
  }
  return null;
}
