/**
 * Translate raw Postgres/RLS errors from Supabase into friendly,
 * user-facing toast messages. Keeps wording consistent across
 * every place that joins a trip.
 */
export interface FriendlyError {
  title: string;
  description: string;
}

export function friendlyJoinError(err: { message?: string | null; code?: string | null } | null | undefined): FriendlyError {
  const message = (err?.message ?? "").toLowerCase();
  const code = (err?.code ?? "").toString();

  // Trigger raises this exact phrase from enforce_trip_capacity().
  if (message.includes("trip is full")) {
    return {
      title: "This trip is full",
      description: "All seats are taken. Try another trip — new ones are added every day.",
    };
  }

  // Duplicate trip_member (unique constraint trip_id + user_id).
  if (code === "23505" || message.includes("duplicate key")) {
    return {
      title: "You're already in this trip",
      description: "Open the trip to see your group chat and itinerary.",
    };
  }

  // RLS denied insert/select.
  if (
    code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied")
  ) {
    return {
      title: "You can't join this trip",
      description: "This trip isn't open for joining right now.",
    };
  }

  // check_violation (e.g., custom check constraint) fall-through.
  if (code === "23514") {
    return {
      title: "Can't join this trip",
      description: "Something about this trip doesn't allow joining yet.",
    };
  }

  return {
    title: "Couldn't join the trip",
    description: "Please check your connection and try again.",
  };
}

/**
 * Friendly mapping for profile reads. When RLS blocks visibility,
 * Supabase returns no row (not an error), so the UI sees `null`.
 * Use this when you want to render an explicit "private" state.
 */
export function isProfileHidden(profile: unknown): boolean {
  return profile === null || profile === undefined;
}
