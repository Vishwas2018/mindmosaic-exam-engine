import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Cog, FileSearch } from "lucide-react";

import { Card } from "@/components/ui";
import { AdminShell } from "@/features/admin-analytics/components/AdminShell";
import { isAdminPreviewEnabled } from "@/features/admin/preview-mode";
import {
  AdminPreviewDashboard,
  type AdminView,
} from "@/features/admin/components/preview/AdminPreviewDashboard";

export const metadata: Metadata = { title: "Admin" };

interface AdminHomePageProps {
  searchParams?: Promise<{ view?: string }>;
}

const TOOLS = [
  {
    href: "/admin/review",
    icon: FileSearch,
    title: "Draft review",
    description: "Try unpublished questions, including Scholarship reasoning, and inspect declared answers without recording student progress.",
  },
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

/**
 * Admin Home Page.
 *
 * In preview mode (ADMIN_WORKSPACE_PREVIEW=1 and loopback), renders the
 * full interactive Admin Workspace artboards (b0–b26) with zero writes.
 *
 * Outside preview mode, renders the authentic authenticated AdminShell.
 */
export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  if (await isAdminPreviewEnabled()) {
    const params = await searchParams;
    const initialView = (params?.view as AdminView) ?? "overview";
    return <AdminPreviewDashboard initialView={initialView} />;
  }

  return (
    <AdminShell title="Admin tools">
      <div className="max-w-xl">
        <p className="text-base leading-7 text-muted">
          Review draft content and explore aggregate product analytics. Individual student data access
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
