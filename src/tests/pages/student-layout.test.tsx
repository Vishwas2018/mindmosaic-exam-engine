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

import StudentLayout from "@/app/student/layout";

/** Next's redirect() throws; the destination is encoded in error.digest. */
function redirectPath(error: unknown): string {
  const digest = (error as { digest?: string } | null)?.digest ?? "";
  return digest.split(";").slice(2, -2).join(";");
}

function setSession(user: { id: string } | null, role: string | null) {
  mockGetUser.mockResolvedValue({ data: { user } });
  mockSingle.mockResolvedValue({ data: role ? { role } : null });
}

describe("student layout auth gate", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockSingle.mockReset();
  });

  it("redirects a signed-out visitor to sign-in", async () => {
    setSession(null, null);
    const error = await StudentLayout({ children: <div /> }).catch((e: unknown) => e);
    expect(redirectPath(error)).toBe("/sign-in?next=%2Fstudent");
  });

  it("redirects a wrong-role visitor to their own home", async () => {
    setSession({ id: "u1" }, "admin");
    const error = await StudentLayout({ children: <div /> }).catch((e: unknown) => e);
    expect(redirectPath(error)).toBe("/admin");
  });

  it("renders children for a signed-in student", async () => {
    setSession({ id: "u1" }, "student");
    const children = <div data-testid="child" />;
    const result = await StudentLayout({ children });
    expect(result).toBe(children);
  });
});
