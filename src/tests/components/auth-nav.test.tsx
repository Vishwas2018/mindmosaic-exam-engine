import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthNav, AuthProvider } from "@/features/auth";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

const mockSignOut = vi.fn(async () => ({ error: null }));
const mockGetSession = vi.fn(async () => ({
  data: {
    session: {
      user: { id: "parent-1", user_metadata: { display_name: "Ada" } },
    },
  },
}));
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { role: "parent" } }) }) }),
    }),
  }),
}));

/*
 * QA finding #1/#8: signOut() alone left a signed-out user's already-
 * rendered protected page (e.g. /parent) in the DOM, role badge and all,
 * because nothing told Next.js to re-run the server-side auth gate. This
 * asserts the fix: clicking Sign out calls the Supabase signOut *and*
 * forces a router.refresh(), which is what makes requireRole()'s
 * redirect("/sign-in") in the layout actually run again.
 */
describe("AuthNav sign-out", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    mockSignOut.mockClear();
  });

  it("calls supabase signOut and then forces a server re-render via router.refresh()", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthNav />
      </AuthProvider>,
    );

    const signOutButton = await screen.findByRole("button", { name: /sign out/i });
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    // signOut must resolve before refresh() runs, not fire-and-forget in
    // parallel — otherwise refresh() could race ahead of the session
    // actually clearing.
    const signOutOrder = mockSignOut.mock.invocationCallOrder[0];
    const refreshOrder = refresh.mock.invocationCallOrder[0];
    expect(signOutOrder).toBeLessThan(refreshOrder);
  });
});
