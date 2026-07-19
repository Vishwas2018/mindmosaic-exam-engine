import Link from "next/link";

import { EmptyState, buttonClasses } from "@/components/ui";
import { SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";

/**
 * Friendly non-crashing state for student portal pages when Supabase env
 * vars are absent (local guest-only setups). Mirrors the fail-closed
 * behaviour of the auth screens.
 */
export function PortalNotConfigured() {
  return (
    <EmptyState
      title="Accounts aren't set up here yet"
      description={SUPABASE_NOT_CONFIGURED_MESSAGE}
      action={
        <Link href="/" className={buttonClasses({ variant: "orange" })}>
          Go to practice
        </Link>
      }
    />
  );
}
