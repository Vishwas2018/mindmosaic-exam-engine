import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student sign-in help",
  description: "Help for students who can&rsquo;t sign in to MindMosaic.",
};

export default function StudentHelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
