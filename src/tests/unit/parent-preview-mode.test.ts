import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockHost = vi.hoisted(() => ({ value: "localhost:3009" as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => (name === "host" ? mockHost.value : null) }),
}));

const mockConfigured = vi.hoisted(() => ({ value: false }));
vi.mock("@/lib/supabase/config", () => ({
  get isSupabaseConfigured() {
    return mockConfigured.value;
  },
}));

const mockNotFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
vi.mock("next/navigation", () => ({ notFound: mockNotFound }));

import {
  isParentPreviewEnabled,
  requireParentPreview,
} from "@/features/parent-dashboard/preview-mode";

describe("parent workspace preview gate", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockHost.value = "localhost:3009";
    mockConfigured.value = false;
    mockNotFound.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("is off by default (no opt-in flag)", async () => {
    expect(await isParentPreviewEnabled()).toBe(false);
  });

  it("is on only with the flag, no Supabase, no Vercel, and a loopback host", async () => {
    vi.stubEnv("PARENT_WORKSPACE_PREVIEW", "1");
    expect(await isParentPreviewEnabled()).toBe(true);
    for (const host of ["localhost:3009", "127.0.0.1:3009", "[::1]:3009", "LOCALHOST"]) {
      mockHost.value = host;
      expect(await isParentPreviewEnabled()).toBe(true);
    }
  });

  it("is refused once Supabase is configured, so fixtures never stand in for real accounts", async () => {
    vi.stubEnv("PARENT_WORKSPACE_PREVIEW", "1");
    mockConfigured.value = true;
    expect(await isParentPreviewEnabled()).toBe(false);
  });

  it("is refused on Vercel, even with the flag set", async () => {
    vi.stubEnv("PARENT_WORKSPACE_PREVIEW", "1");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(await isParentPreviewEnabled()).toBe(false);
  });

  it("is refused for non-loopback hosts and a missing host header", async () => {
    vi.stubEnv("PARENT_WORKSPACE_PREVIEW", "1");
    for (const host of ["example.com", "192.168.1.20:3009", "localhost.evil.com", "", null]) {
      mockHost.value = host;
      expect(await isParentPreviewEnabled()).toBe(false);
    }
  });

  it("requireParentPreview 404s when disabled and passes when enabled", async () => {
    await expect(requireParentPreview()).rejects.toThrow("NEXT_NOT_FOUND");
    vi.stubEnv("PARENT_WORKSPACE_PREVIEW", "1");
    await expect(requireParentPreview()).resolves.toBeUndefined();
  });
});
