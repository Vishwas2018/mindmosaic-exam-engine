import { DashboardLoading } from "@/components/route-boundaries";

/*
 * Deliberately here rather than at /teacher. A loading.tsx wraps its whole
 * subtree in Suspense, which makes the response stream — and a streamed
 * response has already committed HTTP 200 before a descendant can call
 * notFound(). /teacher/students/[id] and /teacher/marking/[attemptId]/
 * [questionId] both do, so a loader at the /teacher root turned their 404s
 * into 200s. See the guard in src/tests/unit/route-loading-boundaries.test.ts.
 */
export default function SegmentLoading() {
  return <DashboardLoading label="Loading class analytics" cards={4} />;
}
