import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/AuthMosaicPanel";
import { StaffSignInForm } from "@/features/auth/components/StaffSignInForm";
import { safeNextPath } from "@/features/auth/safe-next";

export const metadata: Metadata = {
  title: "Staff sign-in",
  description: "MindMosaic staff sign-in for the Admin workspace.",
  robots: { index: false, follow: false },
};

// Per-request render so the CSP nonce reaches Next's scripts (see src/proxy.ts).
export const dynamic = "force-dynamic";

/** Admin/Staff entry. Same Supabase login as everyone else; access is granted by MindMosaic, never self-served. */
export default async function StaffSignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const requested = safeNextPath(params.next);
  const next = requested && (requested === "/admin" || requested.startsWith("/admin/")) ? requested : "/admin";

  return (
    <AuthShell
      panel={{
        heading: "Staff sign-in.",
        intro: "For MindMosaic staff reviewing questions and running the platform. Parents and students sign in from the main page.",
      }}
    >
      <StaffSignInForm next={next} />
    </AuthShell>
  );
}
