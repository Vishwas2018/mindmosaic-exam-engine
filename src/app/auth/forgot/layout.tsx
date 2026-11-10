import type { Metadata } from "next";

/* /auth/forgot is a client component (it calls sendPasswordReset), so its
   title lives on this sibling layout, same pattern as /auth/reset. */
export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your MindMosaic account.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
