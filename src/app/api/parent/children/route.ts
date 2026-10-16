import { NextResponse } from "next/server";
import { z } from "zod";
import { yearLevelSchema } from "@/schemas/question.schema";

import { provisionChild } from "@/features/auth/provision-child";
import { checkOrigin } from "@/features/auth/require-origin";
import { learnerCurriculumPreferenceSchema } from "@/features/curriculum/contracts";
import { RATE_LIMITS, clientAddress, rateLimitResponse } from "@/lib/security/rate-limit";

/**
 * Route Handler wrapper around provisionChild (../../../../features/auth/provision-child.ts).
 * Mirrors the /api/stripe/checkout pattern (src/app/api/stripe/checkout/route.ts):
 * the service-role-touching action stays reachable only through a Route
 * Handler, which Next.js guarantees never ships to a client bundle — see
 * src/tests/unit/provision-child-server-only.test.ts, which forbids any
 * "use client" component importing provision-child.ts directly.
 */

const requestSchema = z.object({
  displayName: z.string(),
  yearLevel: yearLevelSchema.optional(),
  curriculumPreference: learnerCurriculumPreferenceSchema.optional(),
  pin: z.string().optional(),
  /** Sent only on the retry after the parent confirms the duplicate-name prompt. */
  allowDuplicate: z.boolean().optional(),
}).strict();

export async function POST(request: Request): Promise<NextResponse> {
  const originCheck = checkOrigin(request);
  if (!originCheck.ok) {
    return originCheck.response;
  }

  /* Each accepted call mints an auth user with the service-role key, so
     throttle before doing any work. Keyed by address: the signed-in parent is
     resolved inside provisionChild, which also enforces the per-family cap. */
  const limited = rateLimitResponse(RATE_LIMITS.childMutate, clientAddress(request));
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const result = await provisionChild(parsed.data);
  /*
   * 409 for the duplicate-name case: nothing was rejected as malformed, the
   * request conflicts with a child this parent already has. It is answered
   * by confirming and retrying with allowDuplicate, so it reads as a
   * conflict rather than a client error like the 400s around it.
   */
  const status = result.ok ? 200 : result.duplicate ? 409 : 400;
  return NextResponse.json(result, { status });
}
