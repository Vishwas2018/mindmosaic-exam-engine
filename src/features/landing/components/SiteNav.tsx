"use client";

import { useEffect, useRef, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { useAuth } from "@/features/auth/AuthProvider";
import { roleHomeLabel, roleHomePath } from "@/features/auth/roles";

import { nav } from "../content";

/**
 * Global MindMosaic navigation header.
 *
 * Designed for families and education with a warm, calm, and trustworthy presence.
 * Features:
 * - Brand colours: Warm background (#FCFBF8), Primary purple (#5925A8), Coral accent (#FF5055)
 * - Single-row desktop layout with approved MindMosaic logo, central navigation, and auth actions
 * - Active section highlighting with quiet indicator supporting nested routes
 * - Loading-state protection to prevent flashing signed-out controls before auth resolves
 * - Role-aware destination and secure sign-out for authenticated users
 * - Full accessible mobile navigation drawer with scroll lock, Escape dismissal, and focus management
 */

/** A nav item is active on its own route and on anything nested under it. */
function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DashboardLinkLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return <>{pending ? "Loading dashboard…" : label}</>;
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { status, role, signOut } = useAuth();

  const isLoading = status === "loading";
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

  // Move focus into the panel when it opens.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector("a")?.focus();
  }, [open]);

  // Lock body scroll when mobile menu is open to prevent background scrolling.
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-mm-line bg-[#FCFBF8]/95 backdrop-blur-[6px]">
      <div className="mm-width flex h-[clamp(64px,7vw,76px)] items-center justify-between gap-4 lg:gap-[clamp(16px,2.5vw,36px)]">
        {/* Left: MindMosaic Logo */}
        <Link
          href="/"
          aria-label="MindMosaic home"
          className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/25 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page"
        >
          <MindMosaicLogo size={34} />
        </Link>

        {/* Center: Desktop Primary Navigation */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-[clamp(8px,1.2vw,20px)] lg:flex"
        >
          {nav.links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex min-h-11 items-center rounded-lg px-3.5 py-2 text-[14.5px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/25 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page ${
                  active
                    ? "font-bold text-mm-brand shadow-[inset_0_-2px_0_var(--mm-coral)]"
                    : "text-mm-ink-soft hover:bg-mm-brand/5 hover:text-mm-brand"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Authentication Actions & Mobile Toggle */}
        <div className="flex items-center gap-2 lg:gap-[clamp(8px,1.2vw,14px)]">
          {/* Prevent flashing signed-out controls while auth is loading */}
          {isLoading && (
            <div
              aria-hidden="true"
              className="hidden h-11 w-32 animate-pulse rounded-xl bg-mm-line/40 lg:block"
            />
          )}

          {showGuestActions && (
            <>
              <Link
                href={nav.signIn.href}
                className="hidden min-h-11 items-center rounded-lg px-3 text-[14.5px] font-semibold text-mm-ink transition-colors hover:bg-mm-brand/5 hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/25 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page lg:inline-flex"
              >
                {nav.signIn.label}
              </Link>
              <Link
                href={nav.cta.href}
                className="inline-flex min-h-11 select-none items-center justify-center whitespace-nowrap rounded-xl bg-mm-coral px-[clamp(16px,1.8vw,22px)] text-[14.5px] font-bold text-mm-ink shadow-[0_2px_8px_rgba(255,80,85,0.22)] transition-[background-color,transform,box-shadow] duration-150 hover:bg-[#F23D43] active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/25 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page"
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
                  className="hidden min-h-11 select-none items-center gap-2 whitespace-nowrap rounded-xl border border-mm-line bg-white px-4 text-[14px] font-bold text-mm-brand shadow-[0_1px_3px_rgba(89,37,168,0.08)] transition-[background-color,border-color,transform] duration-150 hover:border-mm-brand hover:bg-mm-brand/5 active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/25 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page sm:inline-flex"
                >
                  <LayoutDashboard aria-hidden="true" className="h-4 w-4 text-mm-brand" />
                  <DashboardLinkLabel label={roleHomeLabel(role)} />
                </Link>
              )}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="hidden min-h-11 items-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold text-mm-ink transition-colors hover:bg-mm-brand/5 hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/25 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page sm:inline-flex"
              >
                <LogOut aria-hidden="true" className="h-4 w-4 text-mm-muted" />
                {nav.signedIn.signOutLabel}
              </button>
            </>
          )}

          {/* Mobile menu button */}
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls="mm-mobile-nav"
            aria-label={open ? "Close menu" : "Menu"}
            onClick={() => setOpen((value) => !value)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-mm-line bg-white text-mm-ink transition-colors hover:border-mm-brand hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/25 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page lg:hidden"
          >
            {open ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <nav
          id="mm-mobile-nav"
          ref={panelRef}
          aria-label="Primary, mobile"
          className="border-t border-mm-line bg-[#FCFBF8] shadow-[0_12px_24px_rgba(24,21,31,0.06)] lg:hidden"
        >
          <div className="mm-width grid gap-1 py-4">
            {nav.links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-12 items-center rounded-xl px-3.5 text-[16px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/25 ${
                    active
                      ? "bg-mm-brand/8 font-bold text-mm-brand shadow-[inset_3px_0_0_var(--mm-coral)]"
                      : "text-mm-ink hover:bg-mm-brand/5 hover:text-mm-brand"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="my-2 border-t border-mm-line-soft pt-2">
              {showGuestActions && (
                <div className="grid gap-2">
                  <Link
                    href={nav.cta.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center justify-center rounded-xl bg-mm-coral px-4 text-[15.5px] font-bold text-mm-ink shadow-[0_2px_8px_rgba(255,80,85,0.22)] transition-[background-color,transform] hover:bg-[#F23D43] active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/25"
                  >
                    {nav.cta.label}
                  </Link>
                  <Link
                    href={nav.signIn.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center justify-center rounded-xl border border-mm-line bg-white px-4 text-[15.5px] font-bold text-mm-ink transition-colors hover:border-mm-brand hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/25"
                  >
                    {nav.signIn.label}
                  </Link>
                </div>
              )}

              {isSignedIn && (
                <div className="grid gap-2">
                  {role && (
                    <Link
                      href={roleHomePath(role)}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center gap-2.5 rounded-xl border border-mm-line bg-white px-4 text-[15.5px] font-bold text-mm-brand shadow-[0_1px_3px_rgba(89,37,168,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/25"
                    >
                      <LayoutDashboard aria-hidden="true" className="h-4 w-4 text-mm-brand" />
                      <DashboardLinkLabel label={roleHomeLabel(role)} />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="flex min-h-12 items-center gap-2.5 rounded-xl px-4 text-left text-[15.5px] font-bold text-mm-ink hover:bg-mm-brand/5 hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/25"
                  >
                    <LogOut aria-hidden="true" className="h-4 w-4 text-mm-muted" />
                    {nav.signedIn.signOutLabel}
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
