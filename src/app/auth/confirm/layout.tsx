import type { Metadata } from "next";

/* /auth/confirm is a client component (it reads the confirmation `code` and
   drives a status screen), so it can't export `metadata` itself — only
   Server Components can. Same pattern as src/app/auth/reset/layout.tsx. */
export const metadata: Metadata = {
  title: "Confirm your email",
  description: "Confirming your MindMosaic account.",
};

export default function EmailConfirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
