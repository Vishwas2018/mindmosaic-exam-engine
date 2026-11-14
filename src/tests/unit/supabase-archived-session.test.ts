// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { AuthSessionMissingError, type SupabaseClient } from "@supabase/supabase-js";

const fakeServerClient = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => fakeServerClient.current }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: () => undefined }) }));
vi.mock("@/lib/supabase/config", () => ({ SUPABASE_URL: "https://qawbnonprodproject.supabase.co", SUPABASE_ANON_KEY: "anon" }));

import { denyArchivedSessions as deny, isArchivedUser } from "@/lib/supabase/archived-session";
import { createClient } from "@/lib/supabase/server";

type UserResult = { data: { user: unknown }; error: unknown };
function clientReturning(result: UserResult) {
  const getUser = vi.fn(async (jwt?: string): Promise<UserResult> => {
    void jwt;
    return result;
  });
  const getSession = vi.fn(async () => ({ data: { session: null }, error: null }));
  return { auth: { getUser, getSession } } as never as { auth: { getUser: typeof getUser; getSession: typeof getSession } };
}
/** The helper is generic over the real client type; these tests use a minimal fake with only `auth`. */
const denyArchivedSessions = <T,>(fake: T): T => deny(fake as unknown as SupabaseClient) as unknown as T;
const user = (appMetadata: Record<string, unknown> | undefined) => ({ id: "child-1", app_metadata: appMetadata });

describe("isArchivedUser", () => {
  it("is true only for the explicit archived flag", () => {
    expect(isArchivedUser({ app_metadata: { archived: true } } as never)).toBe(true);
    expect(isArchivedUser({ app_metadata: { archived: false } } as never)).toBe(false);
    expect(isArchivedUser({ app_metadata: { archived: "true" } } as never)).toBe(false);
    expect(isArchivedUser({ app_metadata: {} } as never)).toBe(false);
    expect(isArchivedUser({} as never)).toBe(false);
    expect(isArchivedUser(null)).toBe(false);
    expect(isArchivedUser(undefined)).toBe(false);
  });
});

describe("denyArchivedSessions (QA-003: an issued session stops working once the child is archived)", () => {
  it("turns an archived user into 'no user' with a session-missing error, exactly like an expired session", async () => {
    const client = denyArchivedSessions(clientReturning({ data: { user: user({ archived: true, provider: "email" }) }, error: null }));

    const result = await client.auth.getUser();

    expect(result.data.user).toBeNull();
    expect(result.error).toBeInstanceOf(AuthSessionMissingError);
  });

  it("passes an active user through unchanged", async () => {
    const active = { data: { user: user({ archived: false }) }, error: null };
    expect(await denyArchivedSessions(clientReturning(active)).auth.getUser()).toBe(active);
    const noFlag = { data: { user: user(undefined) }, error: null };
    expect(await denyArchivedSessions(clientReturning(noFlag)).auth.getUser()).toBe(noFlag);
  });

  it("passes 'no user' and auth errors through unchanged", async () => {
    const missing = { data: { user: null }, error: new AuthSessionMissingError() };
    expect(await denyArchivedSessions(clientReturning(missing)).auth.getUser()).toBe(missing);
  });

  it("forwards an explicit JWT and leaves every other auth method alone", async () => {
    const base = clientReturning({ data: { user: user({}) }, error: null });
    const originalGetSession = base.auth.getSession;
    const original = base.auth.getUser;
    const wrapped = denyArchivedSessions(base);

    await wrapped.auth.getUser("some.jwt.value");

    expect(original).toHaveBeenCalledWith("some.jwt.value");
    expect(wrapped.auth.getSession).toBe(originalGetSession);
  });
});

describe("createClient (server)", () => {
  it("returns a client whose getUser() denies an archived child and allows everyone else", async () => {
    fakeServerClient.current = clientReturning({ data: { user: user({ archived: true }) }, error: null });
    const archived = await createClient();
    expect((await archived.auth.getUser()).data.user).toBeNull();

    fakeServerClient.current = clientReturning({ data: { user: user({}) }, error: null });
    const active = await createClient();
    expect((await active.auth.getUser()).data.user).toMatchObject({ id: "child-1" });
  });
});
