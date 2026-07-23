"use server";

// Belt-and-braces alongside the "use server" directive: this makes any
// accidental client-side import of this module fail at build time rather
// than silently bundling code that touches the service-role key. Same
// pattern already used by ./require-role.ts.
import "server-only";

import { createClient as createAdminClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "@/lib/supabase/config";
import { createClient as createRequestClient } from "@/lib/supabase/server";

import {
  buildAliasEmail,
  formatLoginCode,
  generateLoginCode,
  generatePin,
  isValidPin,
} from "./student-alias";

export interface ProvisionChildInput {
  readonly displayName: string;
  readonly yearLevel?: 3 | 5;
  /** Parent-chosen PIN; a random 6-digit PIN is generated when omitted. */
  readonly pin?: string;
}

export interface ProvisionChildResult {
  readonly ok: boolean;
  readonly message?: string;
  /** Formatted for display, e.g. "K7XJ-2P9R". Only ever returned once, to the provisioning parent. */
  readonly loginCode?: string;
  readonly pin?: string;
}

const MAX_CODE_ATTEMPTS = 3;

/**
 * Server-only action: a signed-in parent provisions a child account.
 *
 * Reuses the existing auth.users/profiles 1:1 relationship with zero schema
 * change (D1) — the child gets a normal auth.users row (via a non-guessable
 * internal alias email) and a normal profiles row (role='student', written
 * by the existing on_auth_user_created trigger from user_metadata, exactly
 * as it already does for self-service sign-up). The only privileged step is
 * creating that auth.users row and the parent_children link, both of which
 * require the service-role key and can only happen here, server-side.
 */
export async function provisionChild(
  input: ProvisionChildInput,
): Promise<ProvisionChildResult> {
  const displayName = input.displayName.trim();
  if (!displayName) {
    return { ok: false, message: "A display name is required." };
  }
  if (input.yearLevel !== undefined && input.yearLevel !== 3 && input.yearLevel !== 5) {
    return { ok: false, message: "Year level must be 3 or 5." };
  }

  const pin = input.pin?.trim() || generatePin();
  if (!isValidPin(pin)) {
    return { ok: false, message: "PIN must be 6 digits." };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.trim().length === 0) {
    // Fail clean, not crash: this is a server configuration gap, not a bug.
    return {
      ok: false,
      message: "Student provisioning isn't configured on this server yet.",
    };
  }

  // Identify the caller through the normal, RLS-scoped session client —
  // never trust a client-supplied "I am a parent" claim.
  const requesterClient = await createRequestClient();
  const {
    data: { user: requester },
  } = await requesterClient.auth.getUser();
  if (!requester) {
    return { ok: false, message: "Sign in as a parent to add a child." };
  }

  const { data: requesterProfile } = await requesterClient
    .from("profiles")
    .select("role")
    .eq("id", requester.id)
    .single();
  if (requesterProfile?.role !== "parent") {
    return { ok: false, message: "Only a parent account can add a child." };
  }

  const admin = createAdminClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateLoginCode();
    const aliasEmail = buildAliasEmail(code);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: aliasEmail,
      password: pin,
      email_confirm: true,
      user_metadata: { display_name: displayName, role: "student" },
    });

    if (createError) {
      // Logged server-side (never returned to the client) so a future
      // opaque failure here is diagnosable from server logs instead of
      // guesswork — see the PIN-length QA bug this replaced.
      console.error("provisionChild: admin.auth.admin.createUser failed", createError);

      // A code collision is astronomically unlikely (40 bits of entropy)
      // but retried defensively rather than surfaced as an opaque failure.
      const looksLikeCollision = /already registered|already exists/i.test(createError.message);
      if (looksLikeCollision && attempt < MAX_CODE_ATTEMPTS - 1) {
        continue;
      }
      // isValidPin already enforces exactly 6 digits before we ever reach
      // here, but Supabase's own minimum_password_length is the ultimate
      // authority — if it still rejects the password, surface that as a
      // PIN problem rather than the generic message.
      const looksLikePasswordIssue = /password/i.test(createError.message);
      if (looksLikePasswordIssue) {
        return { ok: false, message: "That PIN can't be used. Please choose a 6-digit PIN." };
      }
      return { ok: false, message: "Could not create the student account. Please try again." };
    }

    const childId = created.user?.id;
    if (!childId) {
      return { ok: false, message: "Could not create the student account. Please try again." };
    }

    if (input.yearLevel !== undefined) {
      // The on_auth_user_created trigger only sets id/role/display_name;
      // year_level is filled in here via the service role, which bypasses
      // the authenticated-role column grant restricting normal updates.
      await admin.from("profiles").update({ year_level: input.yearLevel }).eq("id", childId);
    }

    const { error: linkError } = await admin
      .from("parent_children")
      .insert({ parent_id: requester.id, child_id: childId });

    if (linkError) {
      return {
        ok: false,
        message:
          "The student account was created but could not be linked to your family. Contact support.",
      };
    }

    return { ok: true, loginCode: formatLoginCode(code), pin };
  }

  return { ok: false, message: "Could not generate a unique login code. Please try again." };
}
