import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { buttonClasses } from "@/components/ui";

/**
 * Phase 0 landing stub for post-sign-in role routing. The real screens
 * (student home, parent/teacher dashboards, admin panel) are later phases;
 * this exists only so each role has somewhere to land today. Practice is
 * always one click away, matching the guests-allowed decision.
 */
export function RolePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-8 bg-page px-4 py-16 text-center"
    >
      <Link href="/" aria-label="MindMosaic home">
        <MindMosaicLogo />
      </Link>
      <div className="max-w-xl">
        <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">{description}</p>
      </div>
      <Link href="/" className={buttonClasses({ variant: "orange", size: "lg" })}>
        Go to practice
        <ArrowRight aria-hidden="true" className="h-5 w-5" />
      </Link>
    </main>
  );
}
