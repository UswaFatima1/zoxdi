/**
 * Everything that talks to Supabase: accounts, the saved progress blob and the
 * public leaderboard rows. Kept apart from the local storage layer so the app
 * can run with or without a backend.
 */

import type { LeaderboardPlayer } from "../learning/xp";
import {
  initialsFromName,
  migrateProgress,
  type ProgressState,
} from "../storage/progress";
import { CLOUD_ENABLED } from "./config";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The client is pulled in on demand so the SDK stays out of the initial page
 * bundle. Every caller below is already async.
 */
async function getClient(): Promise<SupabaseClient | null> {
  if (!CLOUD_ENABLED) return null;
  const { getSupabase } = await import("./client");
  return getSupabase();
}

export interface CloudSignUpInput {
  name: string;
  email: string;
  password: string;
  avatar: string;
  shopName: string;
}

export type CloudAuthResult =
  | { ok: true; userId: string; email: string; needsConfirm: boolean }
  | { ok: false; error: string };

export interface CloudUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  shopName: string;
}

/** Turn Supabase's terse messages into something a learner can act on. */
function friendlyAuthError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) {
    return "That email and password don't match. Please try again.";
  }
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "That email already has an account — try logging in instead.";
  }
  if (text.includes("email not confirmed")) {
    return "Please confirm your email first, then log in.";
  }
  if (text.includes("password should be at least")) {
    return "That password is too short — use at least 6 characters.";
  }
  if (text.includes("invalid format") || text.includes("unable to validate email")) {
    return "Please enter a valid email address.";
  }
  if (text.includes("rate limit") || text.includes("only request this after")) {
    return "Too many attempts just now — please wait a minute and try again.";
  }
  if (text.includes("fetch") || text.includes("network") || text.includes("failed to fetch")) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  return message || "Something went wrong. Please try again.";
}

export async function cloudSignUp(input: CloudSignUpInput): Promise<CloudAuthResult> {
  const supabase = await getClient();
  if (!supabase) return { ok: false, error: "Cloud accounts are not configured." };

  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        name: input.name.trim().slice(0, 60),
        avatar: input.avatar,
        shop_name: input.shopName.trim().slice(0, 40),
      },
    },
  });

  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  if (!data.user) return { ok: false, error: "Could not create the account. Please try again." };

  return {
    ok: true,
    userId: data.user.id,
    email,
    // With email confirmation on there is no session yet.
    needsConfirm: data.session === null,
  };
}

export async function cloudLogIn(email: string, password: string): Promise<CloudAuthResult> {
  const supabase = await getClient();
  if (!supabase) return { ok: false, error: "Cloud accounts are not configured." };

  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  if (!data.user) return { ok: false, error: "Could not sign you in. Please try again." };

  return { ok: true, userId: data.user.id, email: normalized, needsConfirm: false };
}

export async function cloudSignOut(): Promise<void> {
  const supabase = await getClient();
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // Signing out locally still succeeds even if the network hiccups.
  }
}

/** The signed-in user, or null. Reads the persisted session (no network). */
export async function getCloudUser(): Promise<CloudUser | null> {
  const supabase = await getClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    return {
      id: user.id,
      email: (user.email ?? "").toLowerCase(),
      name: typeof meta.name === "string" ? meta.name : "Learner",
      avatar: typeof meta.avatar === "string" ? meta.avatar : "🙂",
      shopName: typeof meta.shop_name === "string" ? meta.shop_name : "",
    };
  } catch {
    return null;
  }
}

/** Read this user's saved progress. Returns null when nothing is stored yet. */
export async function fetchCloudProgress(userId: string): Promise<ProgressState | null> {
  const supabase = await getClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("progress")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return migrateProgress(data.data);
  } catch {
    return null;
  }
}

/** Upsert the whole progress blob. Best-effort: the game never blocks on it. */
export async function pushCloudProgress(
  userId: string,
  progress: ProgressState,
): Promise<void> {
  const supabase = await getClient();
  if (!supabase) return;
  try {
    await supabase.from("progress").upsert(
      { user_id: userId, data: progress, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  } catch {
    // Offline or transient error: the local copy is still up to date.
  }
}

/**
 * Keep the public leaderboard row in step. Only ever holds display fields —
 * never an email — so it is safe to expose for reading.
 */
export async function pushCloudProfile(
  userId: string,
  progress: ProgressState,
): Promise<void> {
  const supabase = await getClient();
  if (!supabase || !progress.profile) return;
  try {
    await supabase.from("profiles").upsert(
      {
        id: userId,
        name: progress.profile.name.slice(0, 60),
        avatar: progress.profile.avatar,
        xp: Math.max(0, Math.round(progress.xp.total)),
        levels: progress.completedLevelIds.length,
        streak: Math.max(0, Math.round(progress.streak.current)),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  } catch {
    // The leaderboard is a nice-to-have; ignore failures.
  }
}

/** The public leaderboard: top players by XP, then levels. */
export async function fetchLeaderboard(limit = 50): Promise<LeaderboardPlayer[]> {
  const supabase = await getClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, avatar, xp, levels")
      .order("xp", { ascending: false })
      .order("levels", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => ({
      id: String(row.id),
      name: String(row.name ?? "Learner").slice(0, 40),
      initials: initialsFromName(String(row.name ?? "L")),
      xp: Number(row.xp) || 0,
      masteredLevels: Number(row.levels) || 0,
    }));
  } catch {
    return [];
  }
}
