"use client";

import React from "react";
import { AdminWorkspace } from "../AdminWorkspace";
import { getPreviewAdminData } from "../../adapters/preview-adapter";
import type { AdminView } from "../../types";

export type { AdminView };

export interface AdminPreviewDashboardProps {
  initialView?: AdminView;
}

/**
 * Admin Preview Dashboard.
 *
 * Renders the isolated visual preview architecture using synthetic fixtures
 * for artboards b0–b26 with zero database or ledger writes.
 */
export function AdminPreviewDashboard({ initialView = "overview" }: AdminPreviewDashboardProps) {
  const data = getPreviewAdminData();
  return <AdminWorkspace data={data} initialView={initialView} />;
}
