import type { Metadata } from "next";

import { StitchFrame } from "../StitchFrame";

export const metadata: Metadata = {
  title: "Prototype: Dashboard",
};

export default function DashboardPrototypePage() {
  return (
    <StitchFrame
      src="/prototype/stitch/dashboard.html"
      title="Dashboard - Vihaan (Year 5)"
    />
  );
}
