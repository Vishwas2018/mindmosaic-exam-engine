import type { Metadata } from "next";

import { AuthProvider } from "@/features/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MindMosaic | Thoughtful practice, real progress",
    template: "%s | MindMosaic",
  },
  description:
    "Premium, original Grade 3 and Grade 5 NAPLAN-style and ICAS-style practice built for confident learners.",
  applicationName: "MindMosaic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
