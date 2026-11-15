import "server-only";
import { getExamBank } from "./exam-bank";
import { selectPractice } from "@/features/scholarship-prep/lib/practice";

/** Planning seam only: no new student endpoint, draft loader or publication path.
 * The canonical bank checks human approvals and integrity before this filter runs.
 */
export function getVihaanPracticePlan(count: number, options: {subject?:string; weakTopics?:readonly string[]} = {}) {
  return selectPractice(getExamBank("published"), count, options);
}
