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

import { isKnownYearLevel } from "@/features/taxonomy/year-registry";
import type { YearLevel } from "@/schemas/question.schema";

export interface ProvisionChildInput {
  readonly displayName: string;
  readonly yearLevel?: YearLevel;
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

/**
 * The year levels `public.profiles.year_level` will actually accept.
 *
 * Mirrors `profiles_year_level_check` in
 * supabase/migrations/20260718090000_phase0_roles_and_exam_schema.sql,
 * which is still `IN (3, 5)` on the live project — verified against
 * pg_constraint, not assumed from the migration file. `yearLevelSchema`
 * and `isKnownYearLevel` accept Years 1-12 (expansion-plan T0a), so the
 * application and the database disagree, and until a migration closes
 * that the database is the one that decides.
 *
 * Deliberately NOT derived from `yearLevelsWithGatedCoverage()`: that
 * answers "do we have content for this year", which moves every time
 * content is published and is a softer question than "can this value be
 * stored at all". A parent may legitimately hold a profile for a year we
 * have no content for yet. They may not hold one the database will
 * refuse.
 *
 * Widening beyond {3,5} requires a profiles_year_level_check migration first (owner-gated).
 *
 * Classified by spec Phase 0 (ADR-001 §3) as a **deliberate persistence gate**,
 * explicitly retained. It is one of the narrow year lists §6.1 permits to
 * survive consolidation: it is named for what it gates, documents the database
 * constraint it mirrors, and makes no claim about the product's supported year
 * range. That range is `YEAR_LEVELS` in
 * `src/features/taxonomy/year-registry.ts` ([1..12]), which is the sole
 * authority — see `src/tests/unit/year-authority.test.ts`.
 */
const PERSISTABLE_YEAR_LEVELS: readonly YearLevel[] = [3, 5];

/** "Year 3 or Year 5" — for a message a parent reads, not a log line. */
function formatYearLevels(years: readonly YearLevel[]): string {
  const labels = years.map((year) => `Year ${year}`);
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
}

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
  /*
   * Years 1-12 (expansion-plan T0a). Was a hard `!== 3 && !== 5`, which
   * would have rejected every year the widened schema now represents.
   *
   * This validates the RANGE, not our coverage: a parent may hold a Year 7
   * profile before Year 7 content exists, exactly as a Year 3 profile
   * existed before its bank was full. Which years are OFFERED is decided
   * by yearLevelsWithGatedCoverage() at the point of choosing, not here —
   * this boundary only refuses values that are not year levels at all.
   */
  if (input.yearLevel !== undefined && !isKnownYearLevel(input.yearLevel)) {
    return { ok: false, message: "Year level must be a whole number from 1 to 12." };
  }

  /*
   * ...and then the narrower gate the DATABASE actually enforces.
   *
   * Audit finding H-01. T0a widened this function and the schema to Years
   * 1-12, but no migration widened `profiles_year_level_check`, which is
   * still `CHECK (year_level IS NULL OR year_level IN (3, 5))` on the live
   * project. So the range check above passed a Year 7 through to an UPDATE
   * the database then rejected — and because that UPDATE's error was never
   * read (see below), provisioning returned { ok: true } with credentials
   * while the year level was silently discarded.
   *
   * Refusing here rather than sending a value we know will bounce: the
   * parent gets a specific message instead of an opaque failure, and no
   * auth user is created for a request that cannot fully succeed.
   *
   * Widening beyond {3,5} requires a profiles_year_level_check migration first (owner-gated).
   */
  if (input.yearLevel !== undefined && !PERSISTABLE_YEAR_LEVELS.includes(input.yearLevel)) {
    return {
      ok: false,
      message: `Year ${input.yearLevel} isn't available yet. Choose ${formatYearLevels(
        PERSISTABLE_YEAR_LEVELS,
      )}, or leave the year level blank and set it later.`,
    };
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
      //
      // H-01: this `await` used to discard its result. Every other Supabase
      // call in this file checks its error; this one did not, so a year
      // level the database refused vanished silently and the parent was
      // handed working credentials for a profile that had quietly lost the
      // one field they had just set. PERSISTABLE_YEAR_LEVELS should now
      // stop that value ever reaching here — this is the belt to that
      // braces, and it is what makes any FUTURE constraint drift loud
      // instead of silent.
      const { error: yearLevelError } = await admin
        .from("profiles")
        .update({ year_level: input.yearLevel })
        .eq("id", childId);

      if (yearLevelError) {
        console.error(
          "provisionChild: profiles.year_level update failed",
          { childId, yearLevel: input.yearLevel },
          yearLevelError,
        );
        /*
         * The auth user exists at this point but no parent_children link
         * has been written, so the child is unreachable: it cannot sign in
         * to anything a parent can see, and the parent is told plainly
         * that nothing was set up. Better an orphaned auth row than a
         * linked child whose year level is a lie — and the retry path is
         * clean because a fresh call mints a fresh code.
         */
        return {
          ok: false,
          message:
            "Could not save the year level, so the student account was not set up. Please try again.",
        };
      }
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
