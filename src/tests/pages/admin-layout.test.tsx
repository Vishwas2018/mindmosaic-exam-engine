import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    }),
  })),
}));

import AdminLayout from "@/app/admin/layout";

/** Next's redirect() throws; the destination is encoded in error.digest. */
function redirectPath(error: unknown): string {
  const digest = (error as { digest?: string } | null)?.digest ?? "";
  return digest.split(";").slice(2, -2).join(";");
}

function setSession(user: { id: string } | null, role: string | null) {
  mockGetUser.mockResolvedValue({ data: { user } });
  mockSingle.mockResolvedValue({ data: role ? { role } : null });
}

describe("admin layout auth gate", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockSingle.mockReset();
  });

  /*
   * This is the class of bug the whole batch fixes: admin/page.tsx used to
   * have no auth check of its own at all, so a signed-out visitor could
   * load /admin directly. It now inherits this gate from admin/layout.tsx.
   */
  it("redirects a signed-out visitor to sign-in instead of rendering /admin", async () => {
    setSession(null, null);
    const error = await AdminLayout({ children: <div /> }).catch((e: unknown) => e);
    expect(redirectPath(error)).toBe("/sign-in?next=%2Fadmin");
  });

  it("redirects a wrong-role visitor to their own home instead of rendering /admin", async () => {
    setSession({ id: "u1" }, "teacher");
    const error = await AdminLayout({ children: <div /> }).catch((e: unknown) => e);
    expect(redirectPath(error)).toBe("/teacher");
  });

  it("renders children for a signed-in admin", async () => {
    setSession({ id: "u1" }, "admin");
    const children = <div data-testid="child" />;
    const result = await AdminLayout({ children });
    expect(result).toBe(children);
  });
});
