import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { fetchSittingRowsWithIdentity } from "@/server/assessment/read-dispatch";

import { compareChildren } from "./default-child";
import type { ChildProfile, ParentAttemptRow } from "./summary";

/**
 * Read-only data loading for the parent dashboard. Auth + the parent-role
 * gate already ran in src/app/parent/layout.tsx before this renders, so
 * this only resolves dashboard data for the confirmed parent. Every query
 * runs as the signed-in parent through the anon-key server client, so RLS
 * is the enforcement mechanism: parent_children "own links",
 * profiles/exam_attempts "parent reads linked children". No service-role
 * key, no write, ever — parents only view (docs/DATA_MODEL_AND_ROLES.md).
 */

/**
 * Newest-first cap on attempt rows fetched across all children. Aggregates
 * are computed app-side from these rows; at personal-use scale this covers
 * full history, and a family exceeding it just sees stats over their most
 * recent attempts.
 */
const ATTEMPT_FETCH_LIMIT = 500;

export interface ChildWithAttempts {
  profile: ChildProfile;
  attempts: ParentAttemptRow[];
}

export type ParentDashboardData =
  | { status: "error" }
  | { status: "ready"; parentName: string; children: ChildWithAttempts[] };

export async function loadParentDashboard(): Promise<ParentDashboardData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    /* Unreachable once the layout gate has run; kept for type safety. */
    redirect("/sign-in");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  if (profileError || !profile) {
    return { status: "error" };
  }

  const { data: links, error: linksError } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", user.id);
  if (linksError) {
    return { status: "error" };
  }

  const parentName = profile.display_name?.trim() || "there";
  const childIds = (links ?? []).map((link) => link.child_id as string);
  if (childIds.length === 0) {
    return { status: "ready", parentName, children: [] };
  }

  const [{ data: childProfiles, error: childrenError }, attempts] =
    await Promise.all([
      /*
       * The ORDER BY is the actual fix, not a nicety. This query used to
       * have none, and the app then sorted the result by display name with
       * a stable sort — which means two children with the same name kept
       * whatever order Postgres happened to return them in. That is not a
       * stable wrong answer, it is an arbitrary one. Ordering here makes
       * the input deterministic; compareChildren below makes the sort a
       * total order. Either alone would leave a gap.
       */
      supabase
        .from("profiles")
        .select("id, display_name, year_level, created_at")
        .in("id", childIds)
        .order("display_name", { ascending: true })
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
      /* Both storage models, each sitting once, from the model that created it
         (§12.7 step 8, ADR-005 Amendment A). A parent sees their linked
         children through the same relationship the base policies encode, so
         this returns exactly the rows the direct `exam_attempts` read returned
         while the cohort is empty — and one row, not two, for a backfilled
         sitting once it is not. */
      fetchSittingRowsWithIdentity(supabase, {
        studentIds: childIds,
        limit: ATTEMPT_FETCH_LIMIT,
      }),
    ]);
  if (childrenError) {
    return { status: "error" };
  }

  const attemptsByChild = new Map<string, ParentAttemptRow[]>();
  for (const sitting of attempts) {
    const list = attemptsByChild.get(sitting.studentId) ?? [];
    list.push({
      id: sitting.row.id,
      submittedAt: sitting.row.submitted_at,
      result: sitting.row.result,
      sessionConfig: sitting.row.session?.config ?? null,
    });
    attemptsByChild.set(sitting.studentId, list);
  }

  const children: ChildWithAttempts[] = (childProfiles ?? [])
    .map((child) => ({
      profile: {
        id: child.id as string,
        displayName: (child.display_name as string | null) ?? null,
        yearLevel: (child.year_level as number | null) ?? null,
        createdAt: (child.created_at as string | null) ?? "",
      },
      attempts: attemptsByChild.get(child.id as string) ?? [],
    }))
    .sort((a, b) => compareChildren(a.profile, b.profile));

  return { status: "ready", parentName, children };
}
