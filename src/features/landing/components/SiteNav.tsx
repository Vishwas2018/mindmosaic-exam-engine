"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, LayoutDashboard, LogOut, Menu, X } from "lucide-react";

import { useAuth } from "@/features/auth/AuthProvider";
import { roleHomeLabel, roleHomePath } from "@/features/auth/roles";

import { nav } from "../content";
import { LandingLogo } from "./Brand";
import { lpButton } from "./primitives";

/**
 * "/#plans" is what content.ts stores so the anchor also works from /about,
 * /help and the legal pages. On the home page itself that would be a full
 * navigation back to "/", losing the in-page smooth scroll, so it collapses
 * to a bare "#plans" there.
 */
function resolveHref(href: string, pathname: string | null): string {
  if (pathname === "/" && href.startsWith("/#")) return href.slice(1);
  return href;
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { status, role, signOut } = useAuth();

  /*
   * `status` is "loading" for the first render on a configured install
   * (AuthProvider is still asking Supabase for the session), and that is
   * also what the server renders — so showing nothing until it settles is
   * hydration-safe and, more importantly, avoids flashing "Log in / Start
   * free" at someone who is already signed in.
   *
   * `role` arrives one step later than `status` (it is a second query,
   * against the profiles row). Until it lands there is no honest
   * destination to link to — roleHomePath(null) is "/", which would be a
   * link back to the page you are already on — so only the sign-out control
   * shows in that gap.
   */
  const isSignedIn = status === "authenticated";
  const showGuestActions = status === "anonymous" || status === "unconfigured";

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    // Same reasoning as AuthNav's own sign-out: signOut() only clears the
    // browser client's session, so a server-rendered tree still on screen
    // needs an explicit re-render to pick up the signed-out state.
    router.refresh();
  }

  // Close the mobile menu on Escape and when focus leaves via a link click.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // The translucent/blurred/bordered treatment only appears once the page
  // has actually scrolled — at the top the header sits directly on the
  // hero with no visual seam. `passive: true` keeps this off the main
  // scroll-blocking path.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 [transition:var(--lp-motion),backdrop-filter_180ms_ease] ${
        scrolled
          ? "border-b border-brand/10 bg-white/90 shadow-[0_1px_0_rgba(42,16,81,0.04)] backdrop-blur-[14px]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="site-width flex min-h-[76px] items-center justify-between gap-2">
        <Link
          href="/"
          aria-label="MindMosaic home"
          className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <LandingLogo />
        </Link>

        {/* Same-page anchors stay plain <a> tags so next/link doesn't
            re-prefetch the current route on every hover. */}
        <nav aria-label="Primary" className="hidden items-center gap-2 lg:flex">
          {nav.links.map((link) => (
            <a
              key={link.label}
              href={resolveHref(link.href, pathname)}
              className="inline-flex min-h-11 items-center rounded-xl px-3.5 text-[15px] font-medium text-lp-muted transition hover:bg-brand/6 hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {showGuestActions && (
            <>
              <Link
                href={nav.signIn.href}
                className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-brand hover:bg-brand/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:inline-flex"
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
            </>
          )}
          {isSignedIn && (
            <>
              {role && (
                <Link
                  href={roleHomePath(role)}
                  className={lpButton({
                    size: "md",
                    className: "hidden whitespace-nowrap sm:inline-flex",
                  })}
                >
                  <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                  {roleHomeLabel(role)}
                </Link>
              )}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="hidden min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-brand hover:bg-brand/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:inline-flex"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                {nav.signedIn.signOutLabel}
              </button>
            </>
          )}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-brand-ink hover:bg-brand/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper lg:hidden"
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
          className="fixed inset-x-0 bottom-0 top-[76px] overflow-y-auto border-t border-brand/10 bg-white lg:hidden"
        >
          <nav aria-label="Primary, mobile" className="site-width grid gap-1 py-6">
            {nav.links.map((link) => (
              <a
                key={link.label}
                href={resolveHref(link.href, pathname)}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-12 items-center rounded-xl px-3 font-semibold text-lp-ink hover:bg-brand/6 hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                {link.label}
              </a>
            ))}
            {showGuestActions && (
              <>
                <Link
                  href={nav.signIn.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-12 items-center rounded-xl px-3 font-bold text-brand hover:bg-brand/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
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
              </>
            )}
            {isSignedIn && (
              <>
                {role && (
                  <Link
                    href={roleHomePath(role)}
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 font-bold text-brand hover:bg-brand/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                  >
                    <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                    {roleHomeLabel(role)}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 text-left font-bold text-brand hover:bg-brand/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  {nav.signedIn.signOutLabel}
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
