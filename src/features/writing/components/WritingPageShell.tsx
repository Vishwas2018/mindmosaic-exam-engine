import type { ReactNode } from "react";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";

/**
 * A deliberately quiet frame for writing pages: logo, one way back, and the
 * content. No sidebar and no other navigation, so a child mid-task has nothing
 * to wander off to.
 */
export const WRITING_BACK_LINK_CLASS = "text-sm font-bold text-royal underline-offset-4 hover:underline";

export function WritingPageShell({ children, back }: { children: ReactNode; back: ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-royal/8 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="MindMosaic home" className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20">
            <MindMosaicLogo size="md" />
          </Link>
          {back}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
