/**
 * Cloud configuration, deliberately free of any dependency on the Supabase
 * library so that reading these flags never pulls the SDK into a page bundle.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when a Supabase project has been configured for this build. */
export const CLOUD_ENABLED = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
