import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Cog, FileSearch } from "lucide-react";

import { Card } from "@/components/ui";
import { AdminShell } from "@/features/admin-analytics/components/AdminShell";

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
  {
    href: "/admin/operations",
    icon: Cog,
    title: "Operations",
    description:
      "Background jobs, retries and the dead-letter queue. Mock job data — no live queue connected yet.",
  },
] as const;

/*
 * Wrapped in AdminShell like its own three children.
 *
 * This page was a centred stack of cards with a logo above them, and the
 * logo was the only link that left: no section nav, no way back to a
 * dashboard, no sign-out. An admin landing here could reach the three tools
 * or the marketing site, and nothing else — while every page those tools
 * lead to has a full sidebar. The shell's "Admin home" link now resolves to
 * a page that looks like the rest of the section.
 */
export default function AdminHomePage() {
  return (
    <AdminShell title="Admin tools">
      <div className="max-w-xl">
        <p className="text-base leading-7 text-muted">
          Aggregate product analytics only. Individual student data access
          follows the documented support workflow, not these dashboards.
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
    </AdminShell>
  );
}
