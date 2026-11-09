import type { Metadata } from "next";
import { isAuthPreviewEnabled } from "@/features/auth/preview-mode";
import { AuthPreviewScreens } from "@/features/auth/components/preview/AuthPreviewScreens";

/* /auth/reset is a client component (it reads the Supabase recovery
   session and drives a form), so it can't export `metadata` itself — only
   Server Components can. This sibling layout carries the route's title
   instead, same pattern as src/app/exam/layout.tsx. */
export const metadata: Metadata = {
  title: "Reset your password",
  description: "Set a new password for your MindMosaic account.",
};

export default async function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await isAuthPreviewEnabled()) {
    return <AuthPreviewScreens initialView="reset-password" />;
  }

  return children;
}
