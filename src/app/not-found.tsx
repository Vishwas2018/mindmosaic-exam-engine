import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { EmptyState, buttonClasses } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-royal/8 bg-white">
        <div className="site-width flex min-h-20 items-center py-3">
          <Link
            href="/"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo />
          </Link>
        </div>
      </header>
      <main id="main-content" className="site-width py-10 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <EmptyState
            icon={<SearchX aria-hidden="true" className="h-6 w-6" />}
            title="We can't find that page"
            description="The page you're looking for doesn't exist or may have moved. Let's get you back on track."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/" className={buttonClasses({ variant: "primary" })}>
                  Go home
                </Link>
                <Link href="/practice" className={buttonClasses({ variant: "secondary" })}>
                  Go to practice
                </Link>
              </div>
            }
          />
        </div>
      </main>
    </div>
  );
}
