import { DashboardLoading } from "@/components/route-boundaries";

/*
 * The admin aggregate views are the slowest queries in the product — this is the segment most likely to show a blank page without a loading state.
 */

export default function SegmentLoading() {
  return <DashboardLoading label="Loading platform analytics" cards={4} />;
}
