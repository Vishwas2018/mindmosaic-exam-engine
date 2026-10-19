import { NextResponse } from "next/server";

import { saveWritingDraftRequestSchema } from "@/features/writing/contracts";
import { isResponse, readWritingRequest, writingError } from "@/server/writing/route-helpers";
import { saveWritingDraft } from "@/server/writing/service";

/** Autosave. Refused once the deadline has passed; only the final submit remains. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const ctx = await readWritingRequest(request, saveWritingDraftRequestSchema);
  if (isResponse(ctx)) return ctx;

  const { id } = await params;
  const outcome = await saveWritingDraft(ctx.supabase, id, ctx.body.text);
  if (!outcome.ok) return writingError(outcome.status, outcome.code);

  return NextResponse.json({ savedAt: outcome.value });
}
