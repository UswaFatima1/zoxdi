import { describe, expect, it } from "vitest";
import {
  clearSession,
  hashPassword,
  isValidEmail,
  loadAccounts,
  loadSession,
  makeSalt,
  normalizeEmail,
  registerAccount,
  saveSession,
  verifyLogin,
} from "@/lib/storage/accounts";
import type { StorageLike } from "@/lib/storage/progress";

function makeStorage(): StorageLike {
  const data: Record<string, string> = {};
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

const valid = {
  name: "Alex Morgan",
  email: "alex@gmail.com",
  password: "secret12",
};

describe("account sign-up and login", () => {
  it("creates an account, hashes the password and derives identity", () => {
    const storage = makeStorage();
    const result = registerAccount(valid, storage);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.account.email).toBe("alex@gmail.com");
    expect(result.account.shopName).toBe("Alex's Shop");
    expect(result.account.passwordHash).not.toBe(valid.password);
    expect(result.account.passwordHash.length).toBeGreaterThan(8);

    const stored = loadAccounts(storage);
    expect(stored).toHaveLength(1);
    expect(stored[0].passwordHash).toBe(result.account.passwordHash);
  });

  it("normalises email so case and spaces do not create duplicates", () => {
    const storage = makeStorage();
    registerAccount(valid, storage);
    const duplicate = registerAccount({ ...valid, email: "  ALEX@Gmail.com " }, storage);
    expect(duplicate.ok).toBe(false);
    expect(loadAccounts(storage)).toHaveLength(1);
  });

  it("rejects weak payloads with a readable message", () => {
    const storage = makeStorage();
    expect(registerAccount({ ...valid, name: "A" }, storage).ok).toBe(false);
    expect(registerAccount({ ...valid, email: "not-an-email" }, storage).ok).toBe(false);
    expect(registerAccount({ ...valid, password: "123" }, storage).ok).toBe(false);
    expect(loadAccounts(storage)).toHaveLength(0);
  });

  it("accepts the right password and refuses the wrong one", () => {
    const storage = makeStorage();
    registerAccount(valid, storage);

    const good = verifyLogin("alex@gmail.com", "secret12", storage);
    expect(good.ok).toBe(true);

    const bad = verifyLogin("alex@gmail.com", "wrongpass", storage);
    expect(bad.ok).toBe(false);

    const missing = verifyLogin("nobody@gmail.com", "secret12", storage);
    expect(missing.ok).toBe(false);
  });

  it("round-trips a session and clears it", () => {
    const storage = makeStorage();
    expect(loadSession(storage)).toBeNull();
    saveSession("Alex@Gmail.com", storage);
    expect(loadSession(storage)).toBe("alex@gmail.com");
    clearSession(storage);
    expect(loadSession(storage)).toBeNull();
  });

  it("never stores a bare password, and hashing is salted and stable", () => {
    const saltA = makeSalt(() => 0);
    const saltB = makeSalt(() => 0.999);
    expect(saltA).not.toBe(saltB);
    expect(hashPassword("secret12", saltA)).toBe(hashPassword("secret12", saltA));
    expect(hashPassword("secret12", saltA)).not.toBe(hashPassword("secret12", saltB));
  });

  it("validates and normalises emails", () => {
    expect(isValidEmail("alex@gmail.com")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
    expect(normalizeEmail("  ALEX@Gmail.com ")).toBe("alex@gmail.com");
  });
});
