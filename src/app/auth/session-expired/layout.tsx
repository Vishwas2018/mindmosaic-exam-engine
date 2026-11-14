import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Session expired",
  description: "Your MindMosaic session has expired. Sign in again.",
};

export default function SessionExpiredLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
