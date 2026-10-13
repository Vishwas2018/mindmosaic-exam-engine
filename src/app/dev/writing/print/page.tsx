import Link from "next/link";

import { PrintSheet } from "@/features/writing/components/PrintSheet";
import { DEV_FIXTURE_WRITING_TASK } from "@/features/writing/task";

/** The real print sheet for the fixture task, with no sign-in, behind the same gate as the rest of /dev/writing. */
export default function WritingPrintPreviewPage() {
  return <PrintSheet task={DEV_FIXTURE_WRITING_TASK} back={<Link href="/dev/writing" className="text-sm font-bold text-royal underline-offset-4 hover:underline">Back</Link>} />;
}
