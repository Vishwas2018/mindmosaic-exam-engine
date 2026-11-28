// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const state = vi.hoisted(() => ({
  userId: "11111111-1111-4111-8111-111111111111" as string | null,
  role: "parent" as string | null,
  provisionResult: { ok: false, errorCode: "unauthenticated", message: "Sign in as a parent to add a child." } as Record<string, unknown>,
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: true,
  SUPABASE_URL: "https://mfglzabnayacssgertat.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: state.userId ? { id: state.userId } : null },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: state.role ? { role: state.role } : null }),
        }),
      }),
      update: () => ({
        eq: async () => ({ error: null }),
      }),
    }),
  }),
}));

vi.mock("@/features/auth/provision-child", () => ({
  provisionChild: async () => state.provisionResult,
}));

import { POST as postPreferences } from "@/app/api/student/onboarding/preferences/route";
import { GET as getQuestions } from "@/app/api/student/onboarding/questions/route";
import { POST as postChild } from "@/app/api/parent/children/route";

const SAME_ORIGIN = {
  Origin: "https://preview.mindmosaic.test",
  Host: "preview.mindmosaic.test",
  "Content-Type": "application/json",
};

beforeEach(() => {
  state.userId = "11111111-1111-4111-8111-111111111111";
  state.role = "parent";
});

describe("DEF-AUTH-001: student onboarding routes enforce student role", () => {
  it.each(["parent", "teacher", "admin"] as const)(
    "rejects %s on POST /api/student/onboarding/preferences with 403 students_only",
    async (role) => {
      state.role = role;
      const req = new Request("https://preview.mindmosaic.test/api/student/onboarding/preferences", {
        method: "POST",
        headers: SAME_ORIGIN,
        body: JSON.stringify({ yearLevel: 5 }),
      });
      const res = await postPreferences(req);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "students_only" });
    },
  );

  it("allows student on POST /api/student/onboarding/preferences", async () => {
    state.role = "student";
    const req = new Request("https://preview.mindmosaic.test/api/student/onboarding/preferences", {
      method: "POST",
      headers: SAME_ORIGIN,
      body: JSON.stringify({ yearLevel: 5 }),
    });
    const res = await postPreferences(req);
    expect(res.status).toBe(200);
  });

  it.each(["parent", "teacher", "admin"] as const)(
    "rejects %s on GET /api/student/onboarding/questions with 403 students_only",
    async (role) => {
      state.role = role;
      const req = new Request("https://preview.mindmosaic.test/api/student/onboarding/questions?year=5");
      const res = await getQuestions(req);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "students_only" });
    },
  );
});

describe("DEF-AUTH-003: POST /api/parent/children returns 401/403/503 auth status codes", () => {
  it("returns 401 for unauthenticated caller", async () => {
    state.provisionResult = { ok: false, errorCode: "unauthenticated", message: "Sign in as a parent to add a child." };
    const req = new Request("https://preview.mindmosaic.test/api/parent/children", {
      method: "POST",
      headers: SAME_ORIGIN,
      body: JSON.stringify({ displayName: "Kid", yearLevel: 5 }),
    });
    const res = await postChild(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-parent caller", async () => {
    state.provisionResult = { ok: false, errorCode: "forbidden", message: "Only a parent account can add a child." };
    const req = new Request("https://preview.mindmosaic.test/api/parent/children", {
      method: "POST",
      headers: SAME_ORIGIN,
      body: JSON.stringify({ displayName: "Kid", yearLevel: 5 }),
    });
    const res = await postChild(req);
    expect(res.status).toBe(403);
  });

  it("returns 503 when provisioning is not configured", async () => {
    state.provisionResult = { ok: false, errorCode: "not_configured", message: "Not configured" };
    const req = new Request("https://preview.mindmosaic.test/api/parent/children", {
      method: "POST",
      headers: SAME_ORIGIN,
      body: JSON.stringify({ displayName: "Kid", yearLevel: 5 }),
    });
    const res = await postChild(req);
    expect(res.status).toBe(503);
  });
});
