/** Date / age helpers used by the onboarding + profile system. */

/** Compute age in whole years from an ISO date string (YYYY-MM-DD). */
export function computeAge(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

/** ISO YYYY-MM-DD for "today minus N years". */
export function isoDateYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

/** Minimum DOB to be at least `min` years old. */
export const maxDob = isoDateYearsAgo(13); // platform minimum age
export const minDob = isoDateYearsAgo(100);
