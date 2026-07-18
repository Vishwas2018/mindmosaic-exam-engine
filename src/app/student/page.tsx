import type { Metadata } from "next";

import { RolePlaceholder } from "@/features/auth/components/RolePlaceholder";

export const metadata: Metadata = { title: "Student home" };

export default function StudentHomePage() {
  return (
    <RolePlaceholder
      title="Your student home is on its way"
      description="Signed-in practice now scores your exams on our servers and keeps your attempt history. A full student home — progress, assignments and more — arrives in the next phase."
    />
  );
}
