import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, FileSearch } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Admin" };

const TOOLS = [
  {
    href: "/admin/analytics",
    icon: BarChart3,
    title: "Analytics",
    description:
      "Platform-level attempt, score and time aggregates. Pre-aggregated views only — no individual student data.",
  },
  {
    href: "/admin/intelligence",
    icon: FileSearch,
    title: "Content Intelligence",
    description:
      "How the question bank performs: per-question accuracy, discrimination, quality flags and coverage gaps.",
  },
] as const;

export default function AdminHomePage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-8 bg-page px-4 py-16"
    >
      <Link href="/" aria-label="MindMosaic home">
        <MindMosaicLogo />
      </Link>
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
          Admin tools
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Aggregate product analytics only. Individual student data access
          follows the documented support workflow, not these dashboards.
        </p>
      </div>
      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.href} href={tool.href} className="group">
              <Card className="h-full p-6 transition group-hover:-translate-y-0.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-royal/8 text-royal">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h2 className="mt-4 flex items-center gap-2 text-lg font-extrabold text-ink">
                  {tool.title}
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 text-royal transition group-hover:translate-x-0.5"
                  />
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {tool.description}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
