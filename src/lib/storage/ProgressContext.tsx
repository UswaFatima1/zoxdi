"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "../i18n";
import { setSfxEnabled } from "../fx/sound";
import { avatarForName, defaultShopName, isAvatar } from "../profile/identity";
import { CLOUD_ENABLED } from "../supabase/config";
import {
  cloudLogIn,
  cloudSignOut,
  cloudSignUp,
  fetchCloudProgress,
  getCloudUser,
  pushCloudProfile,
  pushCloudProgress,
  type CloudUser,
} from "../supabase/cloud";
import {
  clearSession,
  findAccount,
  loadAccounts,
  loadSession,
  registerAccount,
  saveSession,
  verifyLogin,
  type AccountInput,
} from "./accounts";
import {
  accountProgressKey,
  clearProgress,
  createEmptyProgress,
  initialsFromName,
  loadProgress,
  loadProgressFrom,
  saveProgress,
  saveThemePreference,
  type ProgressState,
  type ThemePreference,
  type UserProfile,
} from "./progress";

export interface ProgressApi {
  progress: ProgressState;
  /** False until storage has been read (avoids hydration mismatches). */
  ready: boolean;
  /** True when a Supabase backend is configured for this build. */
  cloudEnabled: boolean;
  update: (updater: (current: ProgressState) => ProgressState) => void;
  reset: () => void;
  lang: Lang;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  sound: boolean;
  toggleSound: () => void;
  profile: UserProfile | null;
  saveProfile: (input: {
    name: string;
    email: string;
    avatar?: string;
    shopName?: string;
  }) => void;
  /** Create an account (cloud when configured) and start a session. */
  signUp: (input: AccountInput) => Promise<SessionResult>;
  /** Verify an email + password and start a session. */
  logIn: (email: string, password: string) => Promise<SessionResult>;
  signOut: () => void;
  /** Award XP for a level once; returns the amount actually granted. */
  awardXp: (levelId: string, amount: number) => number;
}

/** The outcome of a sign-up / log-in attempt, as the forms consume it. */
export type SessionResult = { ok: true } | { ok: false; error: string };

/** The profile a freshly-created (or freshly-restored) account starts from. */
function profileFromAccount(account: {
  name: string;
  email: string;
  avatar: string;
  shopName: string;
  createdAt: number;
  joinedAt?: number;
}): UserProfile {
  return {
    name: account.name,
    email: account.email,
    initials: initialsFromName(account.name),
    avatar: account.avatar,
    shopName: account.shopName,
    joinedAt: account.joinedAt ?? account.createdAt,
  };
}

/** Fill in a profile from the cloud user when the blob has none yet. */
function ensureProfile(
  state: ProgressState,
  seed: { name: string; email: string; avatar: string; shopName: string },
): ProgressState {
  if (state.profile) return state;
  const name = seed.name.trim().slice(0, 60) || "Learner";
  return {
    ...state,
    profile: {
      name,
      email: seed.email,
      initials: initialsFromName(name),
      avatar: isAvatar(seed.avatar) ? seed.avatar : avatarForName(name),
      shopName: seed.shopName.trim() || defaultShopName(name),
      joinedAt: Date.now(),
    },
  };
}

/**
 * Load a signed-in user's books: the cloud copy is the source of truth, but if
 * a newer unpublished set of books exists (more XP) we keep it and push it up,
 * so nothing a learner did offline is ever lost.
 */
async function loadForCloudUser(user: CloudUser): Promise<ProgressState> {
  const key = accountProgressKey(user.email);
  const cached = loadProgressFrom(undefined, key);
  const cloud = await fetchCloudProgress(user.id);
  const cacheIsNewer = cloud !== null && cached.xp.total > cloud.xp.total;
  const chosen = cacheIsNewer ? cached : cloud ?? cached;
  if (cacheIsNewer) {
    void pushCloudProgress(user.id, cached);
    void pushCloudProfile(user.id, cached);
  }
  const withProfile = ensureProfile(chosen, {
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    shopName: user.shopName,
  });
  saveProgress(withProfile, undefined, key);
  return withProfile;
}

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(createEmptyProgress);
  const [session, setSession] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  /** The signed-in cloud user id (progress sync target), or null. */
  const userIdRef = useRef<string | null>(null);
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      // Cloud mode: a stored Supabase session wins. Its books are pulled from
      // the server (with the local cache as a fast fallback).
      if (CLOUD_ENABLED) {
        const user = await getCloudUser();
        if (user && active) {
          userIdRef.current = user.id;
          setSession(user.email);
          const restored = await loadForCloudUser(user);
          if (!active) return;
          setProgress(restored);
          setReady(true);
          return;
        }
      }

      // Fallback mode (no backend configured): restore the signed-in account's
      // private books if there is a session; otherwise fall back to the shared
      // blob only on a true legacy install (no accounts yet) so a signed-out
      // state is never resurrected.
      const accounts = loadAccounts();
      const email = loadSession();
      const account = email ? findAccount(accounts, email) : undefined;
      if (email && account) {
        setSession(account.email);
        setProgress(loadProgressFrom(undefined, accountProgressKey(account.email)));
      } else {
        if (email) clearSession();
        setProgress(accounts.length === 0 ? loadProgress() : createEmptyProgress());
      }
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Keep the sync target in step with the live Supabase session (token refresh,
  // or a sign-out triggered in another tab). The SDK is imported on demand so it
  // never reaches a visitor's first paint.
  useEffect(() => {
    if (!CLOUD_ENABLED) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void (async () => {
      const { getSupabase } = await import("../supabase/client");
      const supabase = getSupabase();
      if (!supabase || !active) return;
      const { data } = supabase.auth.onAuthStateChange((_event, sessionValue) => {
        userIdRef.current = sessionValue?.user?.id ?? null;
      });
      unsubscribe = () => data.subscription.unsubscribe();
    })();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  // Apply the theme class to <html> so Tailwind's `dark:` variant and the CSS
  // variables in globals.css switch the whole interface at once.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", progress.settings.theme === "dark");
    // Mirror the theme on its own key for the pre-paint script in layout.tsx.
    saveThemePreference(progress.settings.theme);
  }, [progress.settings.theme]);

  // Keep the sound engine's module-level flag in step with the stored setting.
  useEffect(() => {
    setSfxEnabled(progress.settings.sound);
  }, [progress.settings.sound]);

  // Save to the cloud a moment after the player stops changing things, so a
  // busy level does not fire a request on every keystroke.
  const queueCloudSave = useCallback((next: ProgressState) => {
    if (!CLOUD_ENABLED) return;
    const userId = userIdRef.current;
    if (!userId) return;
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(() => {
      void pushCloudProgress(userId, next);
      void pushCloudProfile(userId, next);
    }, 800);
  }, []);

  const update = useCallback(
    (updater: (current: ProgressState) => ProgressState) => {
      setProgress((current) => {
        const next = updater(current);
        saveProgress(next, undefined, session ? accountProgressKey(session) : undefined);
        queueCloudSave(next);
        return next;
      });
    },
    [session, queueCloudSave],
  );

  const reset = useCallback(() => {
    clearProgress(undefined, session ? accountProgressKey(session) : undefined);
    const empty = createEmptyProgress();
    setProgress(empty);
    queueCloudSave(empty);
  }, [session, queueCloudSave]);

  const setTheme = useCallback(
    (theme: ThemePreference) => {
      update((current) => ({
        ...current,
        settings: { ...current.settings, theme },
      }));
    },
    [update],
  );

  const toggleTheme = useCallback(() => {
    update((current) => ({
      ...current,
      settings: {
        ...current.settings,
        theme: current.settings.theme === "dark" ? "light" : "dark",
      },
    }));
  }, [update]);

  const toggleSound = useCallback(() => {
    update((current) => ({
      ...current,
      settings: { ...current.settings, sound: !current.settings.sound },
    }));
  }, [update]);

  const saveProfile = useCallback(
    (input: { name: string; email: string; avatar?: string; shopName?: string }) => {
      const name = input.name.trim().slice(0, 60);
      const email = input.email.trim().slice(0, 120);
      const providedShop = input.shopName?.trim().slice(0, 40);
      update((current) => ({
        ...current,
        profile: {
          name,
          email,
          initials: initialsFromName(name),
          avatar: isAvatar(input.avatar)
            ? input.avatar
            : current.profile?.avatar ?? avatarForName(name),
          shopName:
            providedShop && providedShop.length > 0
              ? providedShop
              : current.profile?.shopName ?? defaultShopName(name),
          joinedAt: current.profile?.joinedAt ?? Date.now(),
        },
      }));
    },
    [update],
  );

  const signUp = useCallback(async (input: AccountInput): Promise<SessionResult> => {
    if (CLOUD_ENABLED) {
      const res = await cloudSignUp({
        name: input.name,
        email: input.email,
        password: input.password,
        avatar: isAvatar(input.avatar) ? input.avatar : avatarForName(input.name),
        shopName: input.shopName?.trim() || defaultShopName(input.name),
      });
      if (!res.ok) return { ok: false, error: res.error };
      if (res.needsConfirm) {
        return {
          ok: false,
          error: "Almost there — check your email to confirm your account, then log in.",
        };
      }
      userIdRef.current = res.userId;
      const key = accountProgressKey(res.email);
      const started = ensureProfile(loadProgressFrom(undefined, key), {
        name: input.name,
        email: res.email,
        avatar: isAvatar(input.avatar) ? input.avatar : avatarForName(input.name),
        shopName: input.shopName?.trim() || defaultShopName(input.name),
      });
      saveSession(res.email);
      saveProgress(started, undefined, key);
      await pushCloudProgress(res.userId, started);
      await pushCloudProfile(res.userId, started);
      setSession(res.email);
      setProgress(started);
      return { ok: true };
    }

    const result = registerAccount(input);
    if (!result.ok) return { ok: false, error: result.error };
    const account = result.account;
    const key = accountProgressKey(account.email);
    const fresh = loadProgressFrom(undefined, key);
    const started: ProgressState = {
      ...fresh,
      profile: fresh.profile ?? profileFromAccount(account),
    };
    saveSession(account.email);
    saveProgress(started, undefined, key);
    setSession(account.email);
    setProgress(started);
    return { ok: true };
  }, []);

  const logIn = useCallback(
    async (email: string, password: string): Promise<SessionResult> => {
      if (CLOUD_ENABLED) {
        const res = await cloudLogIn(email, password);
        if (!res.ok) return { ok: false, error: res.error };
        userIdRef.current = res.userId;
        const user = await getCloudUser();
        const restored = user
          ? await loadForCloudUser(user)
          : ensureProfile(loadProgressFrom(undefined, accountProgressKey(res.email)), {
              name: "Learner",
              email: res.email,
              avatar: "🙂",
              shopName: defaultShopName("Learner"),
            });
        saveSession(res.email);
        setSession(res.email);
        setProgress(restored);
        return { ok: true };
      }

      const result = verifyLogin(email, password);
      if (!result.ok) return { ok: false, error: result.error };
      const account = result.account;
      const key = accountProgressKey(account.email);
      const stored = loadProgressFrom(undefined, key);
      // Prefer the saved profile (it may carry edits); fall back to the account
      // record the first time this account signs in.
      const restored: ProgressState = {
        ...stored,
        profile: stored.profile ?? profileFromAccount(account),
      };
      saveSession(account.email);
      saveProgress(restored, undefined, key);
      setSession(account.email);
      setProgress(restored);
      return { ok: true };
    },
    [],
  );

  const signOut = useCallback(() => {
    if (CLOUD_ENABLED) {
      userIdRef.current = null;
      void cloudSignOut();
    }
    clearSession();
    if (session) {
      // Keep the account's saved books (profile included) for the next sign-in.
      setSession(null);
      setProgress((current) => ({ ...current, profile: null }));
      return;
    }
    // A legacy/guest blob lives on the shared key, so persist the signed-out
    // state or a reload would log the old profile back in.
    setProgress((current) => {
      const next = { ...current, profile: null };
      saveProgress(next);
      return next;
    });
  }, [session]);

  const awardXp = useCallback(
    (levelId: string, amount: number) => {
      let granted = 0;
      update((current) => {
        if (current.xp.awarded[levelId]) return current;
        granted = Math.max(0, Math.round(amount));
        return {
          ...current,
          xp: {
            total: current.xp.total + granted,
            awarded: { ...current.xp.awarded, [levelId]: granted },
          },
        };
      });
      return granted;
    },
    [update],
  );

  const value = useMemo<ProgressApi>(
    () => ({
      progress,
      ready,
      cloudEnabled: CLOUD_ENABLED,
      update,
      reset,
      // The interface ships English-only; the language toggle was removed, so
      // `lang` stays constant. The i18n plumbing is kept for a future release.
      lang: "en",
      theme: progress.settings.theme,
      setTheme,
      toggleTheme,
      sound: progress.settings.sound,
      toggleSound,
      profile: progress.profile,
      saveProfile,
      signUp,
      logIn,
      signOut,
      awardXp,
    }),
    [
      progress,
      ready,
      update,
      reset,
      setTheme,
      toggleTheme,
      toggleSound,
      saveProfile,
      signUp,
      logIn,
      signOut,
      awardXp,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgressContext(): ProgressApi {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgressContext must be used inside <ProgressProvider>");
  }
  return context;
}
