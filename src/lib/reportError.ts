/**
 * Central place to log errors for developers without ever leaking the raw
 * error text (which can contain SQL, table names, internal IDs, tokens, etc.)
 * into the UI. Call `reportError(scope, err)` from any catch/error branch and
 * then show the user a friendly, generic message via toast.
 *
 * In dev the error is printed to the console with a scope tag. In production
 * this is where a real telemetry sink (Sentry, PostHog, etc.) would be wired.
 */
export function reportError(scope: string, err: unknown): void {
  if (typeof console !== "undefined" && console.error) {
    console.error(`[${scope}]`, err);
  }
}

/** Generic, safe message for any UI-facing failure. */
export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again in a moment.";
