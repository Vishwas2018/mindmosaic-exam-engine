import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PrintSheet } from "@/features/writing/components/PrintSheet";
import { resolveWritingTask } from "@/server/writing/tasks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Print writing task", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * The A4 print sheet. Reachable by any signed-in user (a parent prints it as
 * often as a child), but only for a task that resolves: an unapproved task id is
 * a 404 here exactly as it is on the screen route.
 */
export default async function WritingPrintPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const task = resolveWritingTask(taskId);
  if (!task || !isSupabaseConfigured) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return <PrintSheet task={task} back={<Link href="/student/writing" className="text-sm font-bold text-royal underline-offset-4 hover:underline">Back to writing</Link>} />;
}
