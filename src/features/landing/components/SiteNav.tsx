"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

import { nav } from "../content";
import { LandingLogo } from "./Brand";
import { lpButton } from "./primitives";

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close the mobile menu on Escape and when focus leaves via a link click.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-brand/10 bg-white/85 backdrop-blur-xl">
      <div className="site-width flex min-h-18 items-center justify-between gap-3 py-2.5">
        <Link
          href="/"
          aria-label="MindMosaic home"
          className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
        >
          <LandingLogo />
        </Link>

        {/* Same-page anchors stay plain <a> tags so next/link doesn't
            re-prefetch the current route on every hover. */}
        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
          {nav.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-lp-muted transition hover:bg-brand/6 hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={nav.signIn.href}
            className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-brand hover:bg-brand/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 sm:inline-flex"
          >
            {nav.signIn.label}
          </Link>
          <Link
            href={nav.cta.href}
            className={lpButton({ size: "md", className: "hidden whitespace-nowrap sm:inline-flex" })}
          >
            {nav.cta.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-brand-ink hover:bg-brand/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 lg:hidden"
          >
            {open ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          ref={panelRef}
          className="border-t border-brand/10 bg-white lg:hidden"
        >
          <nav aria-label="Primary, mobile" className="site-width grid gap-1 py-4">
            {nav.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-12 items-center rounded-xl px-3 font-semibold text-lp-ink hover:bg-brand/6 hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
              >
                {link.label}
              </a>
            ))}
            <Link
              href={nav.signIn.href}
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 items-center rounded-xl px-3 font-bold text-brand hover:bg-brand/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
            >
              {nav.signIn.label}
            </Link>
            <Link
              href={nav.cta.href}
              onClick={() => setOpen(false)}
              className={lpButton({ className: "mt-2 w-full sm:hidden" })}
            >
              {nav.cta.label}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
