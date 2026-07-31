import { ExamLoading } from "@/components/route-boundaries";

/*
 * A child waiting on a blank screen assumes it is broken and navigates away, losing the session. The exam skeleton is deliberately shaped like the question card that follows.
 */

export default function SegmentLoading() {
  return <ExamLoading />;
}
