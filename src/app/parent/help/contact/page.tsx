import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { SupportContactForm } from "@/features/parent-dashboard/components/SupportContactForm";
import { requireParentPreview } from "@/features/parent-dashboard/preview-mode";

export const metadata: Metadata = {
  title: "Contact Support | MindMosaic Parent",
  description: "Send a message directly to the MindMosaic parent support team.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function HelpContactPage() {
  // Fixture-only screen: 404 outside explicit local preview. Nothing is sent.
  await requireParentPreview();

  return (
    <ParentShell active="/parent/account">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Contact Support
          </h1>
          <p className="mt-1 text-base text-muted sm:text-lg">
            Have a question or feedback? We are here to help.
          </p>
        </div>
        <SupportContactForm />
      </div>
    </ParentShell>
  );
}
