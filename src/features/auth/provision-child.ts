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
  /**
   * Set once the parent has seen the duplicate-name warning and confirmed
   * they meant it — two children really can share a first name. Absent or
   * false, a name the parent already has stops the call.
   */
  readonly allowDuplicate?: boolean;
}

export interface ProvisionChildResult {
  readonly ok: boolean;
  readonly message?: string;
  /**
   * True when the only thing wrong was that this parent already has a child
   * with this name. The caller is expected to show `message` as a
   * confirmation prompt and, if the parent confirms, retry with
   * `allowDuplicate: true` — this is a question, not a failure.
   */
  readonly duplicate?: boolean;
  /** Formatted for display, e.g. "K7XJ-2P9R". Only ever returned once, to the provisioning parent. */
  readonly loginCode?: string;
  readonly pin?: string;
}

const MAX_CODE_ATTEMPTS = 3;

/** Trimmed and case-folded, so "child a", "Child A" and "Child A " are one name. */
function normalizeChildName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

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
    return { ok: false, message: "PIN must be exactly 6 digits." };
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

  /*
   * Nothing here was idempotent: every call minted a fresh auth.users row
   * with a fresh random login code, so submitting the form twice produced
   * two separate children with the same name and no way to tell which
   * credentials belonged to which. The case that prompted this had the two
   * submissions five minutes apart — a parent who wasn't sure the first one
   * had worked — so a client-side in-flight guard alone would not have
   * caught it; the check has to live on the server, across requests.
   *
   * It asks rather than refuses: two children in one family really can
   * share a first name. The caller shows the message and retries with
   * allowDuplicate once the parent confirms.
   *
   * Read through the RLS-scoped requester client, not the admin one — a
   * parent may already read their own links and their children's profiles
   * (parent_children "own links", profiles "parent reads linked children"),
   * so this needs no privilege the caller doesn't have.
   */
  if (!input.allowDuplicate) {
    const { data: links } = await requesterClient
      .from("parent_children")
      .select("child_id")
      .eq("parent_id", requester.id);

    const childIds = (links ?? []).map((link) => link.child_id as string);
    if (childIds.length > 0) {
      const { data: existing } = await requesterClient
        .from("profiles")
        .select("display_name")
        .in("id", childIds);

      const wanted = normalizeChildName(displayName);
      /*
       * The message names the existing child as they are actually stored,
       * not as the parent just typed them — typing "child a" and being told
       * "you already have a child called child a" reads like the form is
       * arguing with itself.
       */
      const clash = (existing ?? []).find(
        (child) => normalizeChildName((child.display_name as string | null) ?? "") === wanted,
      );
      if (clash) {
        const existingName = ((clash.display_name as string | null) ?? displayName).trim();
        return {
          ok: false,
          duplicate: true,
          message: `You already have a child called ${existingName}. Add another one anyway?`,
        };
      }
    }
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
      // No error, but also no user — an unexpected shape from the admin
      // API rather than a normal failure path, so it's worth a server log
      // even though there's no Supabase error object to attach.
      console.error("provisionChild: admin.auth.admin.createUser returned no user id", created);
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
      console.error("provisionChild: parent_children insert failed", linkError);
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
