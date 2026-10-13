/**
 * Cloud configuration, deliberately free of any dependency on the Supabase
 * library so that reading these flags never pulls the SDK into a page bundle.
 */

/**
 * Reduce whatever was pasted to the bare project origin. The Supabase dashboard
 * shows several nearby URLs (the REST endpoint ends in /rest/v1), and the SDK
 * wants only the origin: anything else makes every call fail with "Invalid path
 * specified in request URL".
 */
function projectOrigin(value: string): string {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return parsed.origin;
  } catch {
    return "";
  }
}

/** Trimmed and reduced to the project origin, so a stray space or path is fine. */
export const SUPABASE_URL = projectOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

/**
 * True only when both values are present and usable. A swapped, blank or
 * truncated pair fails this check, and the app then runs on local accounts
 * instead of failing while it boots.
 */
export const CLOUD_ENABLED = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 20;
