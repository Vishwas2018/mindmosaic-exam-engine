import { NextResponse } from "next/server";
import { z } from "zod";
import { checkOrigin } from "@/features/auth/require-origin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const preferencesSchema = z.object({
  yearLevel: z.union([z.literal(3), z.literal(5)]),
  interests: z.array(z.string().trim().max(100)).max(20).optional().default([]),
  weeklyGoalMinutes: z.number().int().min(15).max(600).optional().default(60),
});

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const originCheck = checkOrigin(request);
  if (!originCheck.ok) {
    return originCheck.response;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { yearLevel, interests, weeklyGoalMinutes } = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      year_level: yearLevel,
      interests,
      weekly_goal_minutes: weeklyGoalMinutes,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "profile_update_failed", message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
