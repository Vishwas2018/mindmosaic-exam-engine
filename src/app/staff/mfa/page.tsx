import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/AuthMosaicPanel";
import { StaffMfaPanel } from "@/features/auth/components/StaffMfaPanel";
import {
  isProfileRole,
  landingForEntitled,
  resolveEntitledRoles,
  type AdminGrantRow,
} from "@/features/auth/roles";
import { safeNextPath } from "@/features/auth/safe-next";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Verify it's you",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Step-up for privileged admin work. Reached only by a signed-in login that holds an active admin entitlement: anyone
 * else is routed to their own home, so this screen is never a way to probe who is staff.
 */
export default async function StaffMfaPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/");
  const params = searchParams ? await searchParams : {};
  const requested = safeNextPath(params.next);
  const next = requested && (requested === "/admin" || requested.startsWith("/admin/")) ? requested : "/admin";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/staff/sign-in?next=${encodeURIComponent(next)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, access_revoked_at")
    .eq("id", user.id)
    .single();
  if (profile?.access_revoked_at) redirect("/sign-in");
  const primary = isProfileRole(profile?.role) ? profile.role : null;
  const { data: grants, error } = await supabase.from("user_roles").select("role, revoked_at").eq("user_id", user.id);
  const roles = resolveEntitledRoles(primary, error ? null : ((grants ?? []) as AdminGrantRow[]));
  if (!roles.includes("admin")) redirect(landingForEntitled(roles, primary));

  return (
    <AuthShell
      panel={{
        heading: "One more step.",
        intro: "Admin actions need a second check. Enter the 6-digit code from your authenticator app.",
      }}
    >
      <StaffMfaPanel next={next} />
    </AuthShell>
  );
}
