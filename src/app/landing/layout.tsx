import type { ReactNode } from "react";
import { Bricolage_Grotesque, Inter } from "next/font/google";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${display.variable} ${body.variable} lp-root`}>
      {children}
    </div>
  );
}
