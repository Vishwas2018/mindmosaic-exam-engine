import { NextResponse } from "next/server";

import { selectFreeSample } from "@/lib/billing/free-sample";
import { getGuestExamBank } from "@/server/exam-bank";

/**
 * The guest practice bank, answer keys and explanations included — but only
 * the Free plan's sample of it (a handful of questions per programme, see
 * src/lib/billing/free-sample.ts). Guests never receive the full bank, so
 * the limit is a property of the data served, not a client-side check.
 *
 * Guest mode is deliberately fully client-side (no account, no server
 * round-trip to score) and therefore needs the authoring bank in the
 * browser — the long-documented, accepted guest trade-off in
 * docs/ASSESSMENT_SECURITY_MODEL.md. Serving it from this static endpoint
 * instead of embedding it in the home page payload is what keeps every
 * *page render* bank-free: signed-in clients never fetch this URL (their
 * questions come server-selected from /api/exam/session), so no answer
 * key rides along with any signed-in visitor's page. The URL itself is
 * public exactly as the client bundle used to be; that residual applies
 * to guest mode only and is disclosed in the security model.
 */
export const dynamic = "force-static";

export function GET(): NextResponse {
  return NextResponse.json({
    curated: selectFreeSample(getGuestExamBank("curated")),
    published: selectFreeSample(getGuestExamBank("published")),
  });
}
