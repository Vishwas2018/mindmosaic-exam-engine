import type { Metadata } from "next";

import { RolePlaceholder } from "@/features/auth/components/RolePlaceholder";

export const metadata: Metadata = { title: "Admin" };

export default function AdminHomePage() {
  return (
    <RolePlaceholder
      title="Admin tools are on their way"
      description="Aggregate product analytics land in a later phase. Individual student data access follows the documented support workflow only."
    />
  );
}
