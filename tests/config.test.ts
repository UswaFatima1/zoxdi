import { describe, expect, it, vi } from "vitest";

const REAL_URL = "https://abcdefghijklm.supabase.co";
const REAL_KEY = "sb_publishable_abcdefghijklmnopqrstuvwxyz";

/**
 * config.ts reads the environment once, at import time, so every case needs a
 * fresh module with its own values.
 */
async function loadConfig(url: string, key: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", key);
  const config = await import("@/lib/supabase/config");
  vi.unstubAllEnvs();
  return config;
}

describe("cloud configuration", () => {
  it("stays off when nothing is configured", async () => {
    const config = await loadConfig("", "");
    expect(config.CLOUD_ENABLED).toBe(false);
  });

  it("turns on for a project URL and key", async () => {
    const config = await loadConfig(REAL_URL, REAL_KEY);
    expect(config.CLOUD_ENABLED).toBe(true);
  });

  it("stays off when the two values are swapped", async () => {
    const config = await loadConfig(REAL_KEY, REAL_URL);
    expect(config.CLOUD_ENABLED).toBe(false);
  });

  it("stays off when only the URL is set", async () => {
    const config = await loadConfig(REAL_URL, "");
    expect(config.CLOUD_ENABLED).toBe(false);
  });

  it("stays off for a value that is not a URL at all", async () => {
    const config = await loadConfig("vpmbscpcymhfaphewoci", REAL_KEY);
    expect(config.CLOUD_ENABLED).toBe(false);
  });

  it("reduces a pasted REST endpoint to the project origin", async () => {
    const config = await loadConfig("https://abcdefghijklm.supabase.co/rest/v1/", REAL_KEY);
    expect(config.SUPABASE_URL).toBe(REAL_URL);
    expect(config.CLOUD_ENABLED).toBe(true);
  });

  it("survives a value pasted with a stray space", async () => {
    const config = await loadConfig(` ${REAL_URL} `, ` ${REAL_KEY} `);
    expect(config.CLOUD_ENABLED).toBe(true);
    expect(config.SUPABASE_URL).toBe(REAL_URL);
    expect(config.SUPABASE_ANON_KEY).toBe(REAL_KEY);
  });
});
