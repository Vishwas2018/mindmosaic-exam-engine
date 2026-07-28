import type { Metadata } from "next";

import { AdminAccessGate } from "@/features/admin-analytics/components/AdminAccessGate";
import { AdminOperationsBoard } from "@/features/admin-analytics/components/AdminOperationsBoard";
import { AdminShell } from "@/features/admin-analytics/components/AdminShell";
import { getMockBackgroundJobs } from "@/features/admin-analytics/mock-operations-data";
import type { ProfileRole } from "@/features/auth";

export const metadata: Metadata = { title: "Admin — Operations" };

/*
 * Background jobs (screen 23): a platform-admin console for the job queue
 * that doesn't exist yet — every row is mock data (mock-operations-data.ts)
 * and retrying a job only mutates local state (AdminOperationsBoard). Swap
 * getMockBackgroundJobs for a real loader once a job-queue backend ships.
 */

export default function AdminOperationsPage() {
  /*
   * Layout (src/app/admin/layout.tsx) already ran
   * requireRole("admin", "/admin") before this renders, so `role` is always
   * "admin" for a real request. It's threaded through as an explicit value
   * so AdminAccessGate stays a plain, prop-driven component instead of
   * re-deriving auth here.
   */
  const role: ProfileRole = "admin";
  const jobs = getMockBackgroundJobs();

  return (
    <AdminShell
      active="operations"
      title="Operations"
      contextPill="Mock job data — no live queue connected"
    >
      <AdminAccessGate role={role}>
        <AdminOperationsBoard jobs={jobs} />
      </AdminAccessGate>
    </AdminShell>
  );
}
