import { DashboardLoading } from "@/components/route-boundaries";

/*
 * Both parent pages await Supabase (loadParentDashboard + getMySubscription in parallel), so this segment is genuinely async on every visit.
 */

export default function SegmentLoading() {
  return <DashboardLoading label="Loading your dashboard" cards={3} />;
}
