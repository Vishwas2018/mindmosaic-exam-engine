import { NextResponse } from "next/server";
import { z } from "zod";

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
  yearLevel: z.union([z.literal(3), z.literal(5)]).optional(),
  pin: z.string().optional(),
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
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
