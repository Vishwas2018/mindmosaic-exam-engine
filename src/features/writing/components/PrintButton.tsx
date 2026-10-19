"use client";

import { Printer } from "lucide-react";

import { buttonClasses } from "@/components/ui";

export function PrintButton() {
  return (
    <button type="button" className={buttonClasses({ variant: "primary" })} onClick={() => window.print()}>
      <Printer aria-hidden="true" className="mr-2 h-4 w-4" />
      Print prompt &amp; ruled sheet
    </button>
  );
}
