import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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

interface AttemptQueryRow {
  id: string;
  student_id: string;
  submitted_at: string;
  result: unknown;
  exam_sessions: { config: unknown } | null;
}

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

  const [{ data: childProfiles, error: childrenError }, { data: attempts, error: attemptsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, year_level")
        .in("id", childIds),
      supabase
        .from("exam_attempts")
        .select("id, student_id, submitted_at, result, exam_sessions ( config )")
        .in("student_id", childIds)
        .order("submitted_at", { ascending: false })
        .limit(ATTEMPT_FETCH_LIMIT),
    ]);
  if (childrenError || attemptsError) {
    return { status: "error" };
  }

  const attemptsByChild = new Map<string, ParentAttemptRow[]>();
  for (const row of (attempts ?? []) as unknown as AttemptQueryRow[]) {
    const list = attemptsByChild.get(row.student_id) ?? [];
    list.push({
      id: row.id,
      submittedAt: row.submitted_at,
      result: row.result,
      sessionConfig: row.exam_sessions?.config ?? null,
    });
    attemptsByChild.set(row.student_id, list);
  }

  const children: ChildWithAttempts[] = (childProfiles ?? [])
    .map((child) => ({
      profile: {
        id: child.id as string,
        displayName: (child.display_name as string | null) ?? null,
        yearLevel: (child.year_level as number | null) ?? null,
      },
      attempts: attemptsByChild.get(child.id as string) ?? [],
    }))
    .sort((a, b) =>
      (a.profile.displayName ?? "").localeCompare(b.profile.displayName ?? ""),
    );

  return { status: "ready", parentName, children };
}
