import type { Metadata } from "next";
import { Suspense } from "react";

import { SessionExpiredScreen } from "@/features/auth/components/SessionExpiredScreen";

export const metadata: Metadata = {
  title: "Signed out",
  robots: { index: false, follow: false },
};

export default function SessionExpiredPage() {
  return (
    <Suspense fallback={null}>
      <SessionExpiredScreen />
    </Suspense>
  );
}
