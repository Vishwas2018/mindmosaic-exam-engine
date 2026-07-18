import type { Metadata } from "next";

import { RolePlaceholder } from "@/features/auth/components/RolePlaceholder";

export const metadata: Metadata = { title: "Parent dashboard" };

export default function ParentHomePage() {
  return (
    <RolePlaceholder
      title="Your parent dashboard is on its way"
      description="Soon you'll see your children's progress and results here. Their signed-in practice is already scored and stored securely."
    />
  );
}
