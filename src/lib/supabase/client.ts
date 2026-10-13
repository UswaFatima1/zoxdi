/**
 * The Supabase browser client.
 *
 * Zoxdi is a static export, so there is no server to hold secrets: only the
 * public anon key ships to the browser, and every row is protected by
 * row-level security (see `supabase/schema.sql`).
 *
 * The SDK is imported *dynamically* by `cloud.ts`, so this module — and the
 * ~65 kB of Supabase code behind it — only reaches a visitor who actually has
 * a backend configured and is signing in.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CLOUD_ENABLED, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/**
 * A single shared client. Sessions are persisted in localStorage and tokens
 * refresh automatically, so a returning visitor is still signed in.
 */
export function getSupabase(): SupabaseClient | null {
  if (!CLOUD_ENABLED) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
