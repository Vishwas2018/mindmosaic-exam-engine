import {NextResponse} from "next/server";

import {createClient} from "@/lib/supabase/server";
import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";
import {clearSampleSubmissions} from "@/features/singapore-maths-sample/submission-store";

export async function DELETE(): Promise<NextResponse> {
  if (!isSingaporeMathsSampleAllowed()) {
    return new NextResponse(null, {status: 404});
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({error: "unauthorized"}, {status: 401});
  }

  // Clear all submissions for this user so restarting practice creates a
  // fresh attempt. One child's submissions cannot affect another child's
  // results because the store is keyed by userId\0questionId.
  clearSampleSubmissions(user.id);

  return NextResponse.json({ok: true});
}