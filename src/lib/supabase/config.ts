/**
 * Cloud configuration, deliberately free of any dependency on the Supabase
 * library so that reading these flags never pulls the SDK into a page bundle.
 */

/** Trimmed, so a value pasted with a stray space still works. */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

/** Is this something the Supabase SDK (and fetch) can actually call? */
function isUsableUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * True only when both values are present and the URL is one Supabase can
 * reach. A swapped, blank or truncated pair fails this check, and the app then
 * runs on local accounts instead of failing while it boots.
 */
export const CLOUD_ENABLED = isUsableUrl(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 20;
