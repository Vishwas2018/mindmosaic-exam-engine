"use client";

import { useEffect, useState, type ComponentType } from "react";

import { useAuth } from "@/features/auth";

import type { UatSessionConfig } from "./UatAssistantShell";

/**
 * Tiny client bootstrapper (~1 KB) mounted in RootLayout on non-production builds.
 *
 * Keeps statically prerendered routes (`/`, `/exam`, `/results`, `/showcase`)
 * completely untouched on cold load: nothing from the UAT Assistant UI, IndexedDB
 * store, or canvas annotator is downloaded unless `/api/uat/session` confirms
 * both a DEV environment and a verified admin/tester session.
 */
export function UatAssistantBootstrap() {
  const { user, status } = useAuth();
  const [sessionConfig, setSessionConfig] = useState<UatSessionConfig | null>(null);
  const [ShellComponent, setShellComponent] = useState<ComponentType<{ config: UatSessionConfig }> | null>(
    null,
  );

  const userId = user?.id ?? null;

  useEffect(() => {
    // Wait until initial auth state resolves when Supabase is configured so we don't fire twice on boot.
    if (status === "loading") return;

    let cancelled = false;
    fetch("/api/uat/session", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as
          | ({ enabled: true } & UatSessionConfig)
          | { enabled: false };
      })
      .then(async (data) => {
        if (cancelled) return;
        if (!data || !data.enabled) {
          setSessionConfig(null);
          return;
        }
        const mod = await import("./UatAssistantShell");
        if (cancelled) return;
        setShellComponent(() => mod.UatAssistantShell);
        setSessionConfig({
          activeRole: data.activeRole,
          aiConfigured: data.aiConfigured,
          githubConfigured: data.githubConfigured,
          githubRepo: data.githubRepo,
        });
      })
      .catch(() => {
        if (!cancelled) setSessionConfig(null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, status]);

  if (!sessionConfig || !ShellComponent) return null;
  return <ShellComponent config={sessionConfig} />;
}
