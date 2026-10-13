/**
 * Account credentials for the built-in fallback auth.
 *
 * When no backend is configured, Zoxdi can run entirely on its own and verifies
 * sign-up and log-in itself. Passwords are salted and stretched through many
 * rounds of a deliberately slow hash so a bare password is never retained —
 * obfuscation for a prototype, NOT real security. When Supabase is configured,
 * account creation and verification happen in Supabase and none of this runs.
 */

import { avatarForName, defaultShopName, isAvatar } from "../profile/identity";
import type { StorageLike } from "./progress";

export const ACCOUNTS_KEY = "zoxdi.accounts.v1";
export const SESSION_KEY = "zoxdi.session.v1";

export interface Account {
  /** Normalised (lower-cased) email — the account's key. */
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  avatar: string;
  shopName: string;
  createdAt: number;
}

export interface AccountInput {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  shopName?: string;
}

export type AuthResult =
  | { ok: true; account: Account }
  | { ok: false; error: string };

function getStore(): StorageLike | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const MIN_PASSWORD_LENGTH = 6;

/** A short random salt. `random` is injectable so tests stay deterministic. */
export function makeSalt(random: () => number = Math.random): string {
  let salt = "";
  for (let index = 0; index < 12; index += 1) {
    salt += Math.floor(random() * 16).toString(16);
  }
  return salt;
}

/**
 * A deterministic, salted hash. Not a cryptographic primitive — it exists so a
 * plain password is never stored, then is stretched with many rounds so
 * guessing is at least slow. Same input always yields the same digest.
 */
export function hashPassword(password: string, salt: string): string {
  const input = `${salt}::${password}::zoxdi`;
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    a = Math.imul(a ^ code, 0x01000193) >>> 0;
    b = Math.imul(b + code, 0x85ebca6b) >>> 0;
  }
  for (let round = 0; round < 4000; round += 1) {
    a = Math.imul(a ^ (b + round), 0x01000193) >>> 0;
    b = Math.imul(b ^ (a + round), 0x85ebca6b) >>> 0;
  }
  return (a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0")).slice(0, 32);
}

function isAccount(value: unknown): value is Account {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.email === "string" &&
    typeof record.name === "string" &&
    typeof record.passwordHash === "string" &&
    typeof record.salt === "string"
  );
}

export function loadAccounts(storage: StorageLike | null = getStore()): Account[] {
  if (!storage) return [];
  try {
    const serialized = storage.getItem(ACCOUNTS_KEY);
    if (!serialized) return [];
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAccount).map((account) => ({
      ...account,
      email: normalizeEmail(account.email),
      name: account.name.slice(0, 60),
      avatar: isAvatar(account.avatar) ? account.avatar : avatarForName(account.name),
      shopName:
        typeof account.shopName === "string" && account.shopName.trim().length > 0
          ? account.shopName.trim().slice(0, 40)
          : defaultShopName(account.name),
      createdAt: typeof account.createdAt === "number" ? account.createdAt : Date.now(),
    }));
  } catch {
    return [];
  }
}

export function saveAccounts(
  accounts: Account[],
  storage: StorageLike | null = getStore(),
): void {
  if (!storage) return;
  try {
    storage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Quota/security errors: the app still works, it just will not remember.
  }
}

export function findAccount(accounts: Account[], email: string): Account | undefined {
  const normalized = normalizeEmail(email);
  return accounts.find((account) => account.email === normalized);
}

/** Validate a sign-up payload without touching storage. */
export function validateSignUp(input: AccountInput): string {
  if (input.name.trim().length < 2) return "Please enter your name.";
  if (!isValidEmail(input.email)) return "Enter a valid email address.";
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
  }
  return "";
}

/**
 * Create an account. Returns an error string (not a throw) for the usual
 * failures so the form can show it inline.
 */
export function registerAccount(
  input: AccountInput,
  storage: StorageLike | null = getStore(),
): AuthResult {
  const invalid = validateSignUp(input);
  if (invalid) return { ok: false, error: invalid };

  const email = normalizeEmail(input.email);
  const name = input.name.trim().slice(0, 60);
  const accounts = loadAccounts(storage);
  if (findAccount(accounts, email)) {
    return { ok: false, error: "That email already has an account — try logging in." };
  }

  const salt = makeSalt();
  const account: Account = {
    email,
    name,
    passwordHash: hashPassword(input.password, salt),
    salt,
    avatar: isAvatar(input.avatar) ? input.avatar : avatarForName(name),
    shopName: input.shopName?.trim() || defaultShopName(name),
    createdAt: Date.now(),
  };
  saveAccounts([...accounts, account], storage);
  return { ok: true, account };
}

/** Check an email + password pair against the stored accounts. */
export function verifyLogin(
  email: string,
  password: string,
  storage: StorageLike | null = getStore(),
): AuthResult {
  const account = findAccount(loadAccounts(storage), email);
  if (!account) return { ok: false, error: "No account found for that email." };
  if (hashPassword(password, account.salt) !== account.passwordHash) {
    return { ok: false, error: "That password does not match." };
  }
  return { ok: true, account };
}

/** Does any account use this email? Drives the "already registered" hint. */
export function accountExists(
  email: string,
  storage: StorageLike | null = getStore(),
): boolean {
  return Boolean(findAccount(loadAccounts(storage), email));
}

/** Is there at least one account stored? */
export function hasAccounts(storage: StorageLike | null = getStore()): boolean {
  return loadAccounts(storage).length > 0;
}

export function loadSession(storage: StorageLike | null = getStore()): string | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(SESSION_KEY);
    return value ? normalizeEmail(value) : null;
  } catch {
    return null;
  }
}

export function saveSession(
  email: string,
  storage: StorageLike | null = getStore(),
): void {
  if (!storage) return;
  try {
    storage.setItem(SESSION_KEY, normalizeEmail(email));
  } catch {
    // Nothing to do.
  }
}

export function clearSession(storage: StorageLike | null = getStore()): void {
  if (!storage) return;
  try {
    storage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to do.
  }
}
