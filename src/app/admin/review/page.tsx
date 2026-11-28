import type { Metadata } from "next";

import { AdminShell } from "@/features/admin-analytics/components/AdminShell";
import { DraftReview } from "@/features/admin-review/DraftReview";
import { loadAdminReviewCatalogue } from "@/server/admin-review";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin — Draft review",
  robots: { index: false, follow: false },
};

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ bank?: string | string[] }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const rawBank = Array.isArray(resolvedParams?.bank)
    ? resolvedParams?.bank[0]
    : resolvedParams?.bank;
  const catalogue = await loadAdminReviewCatalogue({ bankId: rawBank });
  const activeBank = (catalogue.banks ?? []).find(
    (bank) => bank.id === catalogue.activeBankId,
  );
  return (
    <AdminShell
      active="review"
      title="Draft review"
      contextPill={activeBank ? activeBank.shortLabel : undefined}
    >
      <DraftReview catalogue={catalogue} />
    </AdminShell>
  );
}
