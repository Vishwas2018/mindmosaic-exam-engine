import type { Metadata } from "next";

import { RolePlaceholder } from "@/features/auth/components/RolePlaceholder";

export const metadata: Metadata = { title: "Teacher dashboard" };

export default function TeacherHomePage() {
  return (
    <RolePlaceholder
      title="Your teacher dashboard is on its way"
      description="Class views, assignments and analytics arrive in a later phase. Teacher accounts are currently set up by the MindMosaic team."
    />
  );
}
