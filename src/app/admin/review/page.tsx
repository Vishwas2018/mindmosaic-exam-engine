import type { Metadata } from "next";

import { AdminShell } from "@/features/admin-analytics/components/AdminShell";
import { DraftReview } from "@/features/admin-review/DraftReview";
import { loadAdminReviewCatalogue } from "@/server/admin-review";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin — Draft review",
  robots: { index: false, follow: false },
};

export default async function AdminReviewPage() {
  const catalogue = await loadAdminReviewCatalogue();
  return (
    <AdminShell active="review" title="Draft review">
      <DraftReview catalogue={catalogue} />
    </AdminShell>
  );
}
