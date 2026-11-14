import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signed out",
  description: "You have been signed out of MindMosaic.",
};

export default function SignedOutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
