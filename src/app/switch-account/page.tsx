import type { Metadata } from "next";

import { SwitchAccountScreen } from "@/features/auth/components/SwitchAccountScreen";

export const metadata: Metadata = {
  title: "Switch account",
  robots: { index: false, follow: false },
};

export default function SwitchAccountPage() {
  return <SwitchAccountScreen />;
}
