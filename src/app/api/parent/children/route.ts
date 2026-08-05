import { NextResponse } from "next/server";
import { z } from "zod";
import { yearLevelSchema } from "@/schemas/question.schema";

import { provisionChild } from "@/features/auth/provision-child";
import { checkOrigin } from "@/features/auth/require-origin";

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
  pin: z.string().optional(),
  /** Sent only on the retry after the parent confirms the duplicate-name prompt. */
  allowDuplicate: z.boolean().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const originCheck = checkOrigin(request);
  if (!originCheck.ok) {
    return originCheck.response;
  }

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
