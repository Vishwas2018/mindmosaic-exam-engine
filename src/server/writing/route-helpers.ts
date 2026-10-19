import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { z } from "zod";

import { checkOrigin } from "@/features/auth/require-origin";
import type { WritingErrorCode } from "@/features/writing/contracts";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export function writingError(status: number, code: WritingErrorCode): NextResponse {
  return NextResponse.json({ error: code }, { status });
}

export interface WritingRequestContext<T> {
  supabase: SupabaseClient;
  user: User;
  body: T;
}

/**
 * The preamble every writing write shares: Supabase configured, same-origin,
 * signed in, body matches its schema. Authorisation itself is not decided here
 * or in the route; it is the database's (RLS and the SECURITY DEFINER
 * functions), run as the signed-in caller.
 */
export async function readWritingRequest<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<WritingRequestContext<z.infer<S>> | NextResponse> {
  if (!isSupabaseConfigured) return writingError(503, "not_configured");

  const originCheck = checkOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return writingError(401, "unauthenticated");

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return writingError(400, "invalid_request");

  return { supabase, user, body: parsed.data };
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
