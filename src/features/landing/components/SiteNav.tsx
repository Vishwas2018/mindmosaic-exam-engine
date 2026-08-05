"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { useAuth } from "@/features/auth/AuthProvider";
import { roleHomeLabel, roleHomePath } from "@/features/auth/roles";

import { nav } from "../content";
import { mmButton } from "./primitives";

/**
 * The design file's header: a solid, always-bordered bar on the page
 * background (not the previous scroll-reactive translucent one), seven
 * primary links from lg up, and a full-width disclosure panel below the
 * bar on smaller screens.
 *
 * The active item takes the design's treatment — brand purple text, a
 * 2px coral inset underline and `aria-current="page"` — derived from the
 * pathname rather than passed in as a prop, so a new page cannot forget to
 * declare which nav item it belongs to.
 *
 * The auth-aware behaviour is unchanged from the previous header and is
 * not in the design file: a signed-in visitor gets their role home plus
 * sign-out instead of "Log in / Start free", because showing an anonymous
 * CTA to someone with a session is wrong regardless of what the mockup
 * shows.
 */

/** A nav item is active on its own route and on anything nested under it. */
function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { status, role, signOut } = useAuth();

  const isSignedIn = status === "authenticated";
  const showGuestActions = status === "anonymous" || status === "unconfigured";

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    // signOut() only clears the browser client's session, so a
    // server-rendered tree still on screen needs an explicit re-render.
    router.refresh();
  }

  // Escape closes the panel and returns focus to the control that opened it.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Move focus into the panel when it opens, as the design's own script does.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector("a")?.focus();
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-mm-line bg-mm-page/95 backdrop-blur-[6px]">
      <div className="mm-width flex h-[clamp(64px,7vw,80px)] items-center gap-4 lg:gap-[clamp(16px,3vw,36px)]">
        <Link
          href="/"
          aria-label="MindMosaic home"
          className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page"
        >
          <MindMosaicLogo size={34} />
        </Link>

        <nav
          aria-label="Primary"
          className="ml-1.5 hidden items-center gap-[clamp(10px,1.4vw,22px)] lg:flex"
        >
          {nav.links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-lg text-[14.5px] font-semibold transition-colors hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page ${
                  active
                    ? "text-mm-brand shadow-[inset_0_-2px_0_var(--mm-coral)]"
                    : "text-mm-ink-soft"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:gap-[clamp(8px,1.4vw,16px)]">
          {showGuestActions && (
            <>
              <Link
                href={nav.signIn.href}
                className="hidden min-h-11 items-center px-2 text-[14.5px] font-semibold text-mm-ink transition-colors hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page lg:inline-flex"
              >
                {nav.signIn.label}
              </Link>
              <Link
                href={nav.cta.href}
                className={mmButton({ className: "whitespace-nowrap px-[clamp(16px,1.8vw,24px)] text-[14.5px]" })}
              >
                {nav.cta.label}
              </Link>
            </>
          )}
          {isSignedIn && (
            <>
              {role && (
                <Link
                  href={roleHomePath(role)}
                  className={mmButton({ className: "hidden whitespace-nowrap sm:inline-flex" })}
                >
                  <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                  {roleHomeLabel(role)}
                </Link>
              )}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="hidden min-h-11 items-center gap-1.5 px-2 text-[14.5px] font-semibold text-mm-ink transition-colors hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page sm:inline-flex"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                {nav.signedIn.signOutLabel}
              </button>
            </>
          )}

          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls="mm-mobile-nav"
            aria-label={open ? "Close menu" : "Menu"}
            onClick={() => setOpen((value) => !value)}
            className="grid h-11 w-11 place-items-center rounded-[10px] border border-mm-line bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page lg:hidden"
          >
            <span aria-hidden="true" className="grid gap-1">
              <span className="block h-0.5 w-[18px] rounded-sm bg-mm-ink" />
              <span className="block h-0.5 w-[18px] rounded-sm bg-mm-ink" />
              <span className="block h-0.5 w-[18px] rounded-sm bg-mm-ink" />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mm-mobile-nav"
          ref={panelRef}
          aria-label="Primary, mobile"
          className="border-t border-mm-line bg-white lg:hidden"
        >
          <div className="mm-width grid gap-0.5 pb-6 pt-2.5">
            {nav.links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-[52px] items-center border-b border-mm-line-soft text-[17px] font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 ${
                    active ? "text-mm-brand" : "text-mm-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {showGuestActions && (
              <Link
                href={nav.signIn.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[52px] items-center text-[17px] font-bold text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30"
              >
                {nav.signIn.label}
              </Link>
            )}
            {isSignedIn && (
              <>
                {role && (
                  <Link
                    href={roleHomePath(role)}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[52px] items-center gap-2 text-[17px] font-bold text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30"
                  >
                    <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                    {roleHomeLabel(role)}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="flex min-h-[52px] items-center gap-2 text-left text-[17px] font-bold text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  {nav.signedIn.signOutLabel}
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
