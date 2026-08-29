"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Menu, UserRound, X } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { buttonClasses } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { roleHomeLabel, roleHomePath } from "@/features/auth/roles";
import type { ProfileRole } from "@/features/auth/roles";
import { cn } from "@/lib/cn";

/**
 * Nav entries, each with the roles that can actually reach the destination.
 * `roles: null` means "everyone, signed in or not".
 *
 * "Learn" is /student/learn — a student-only route behind requireStudent —
 * so a parent or teacher never sees a link that would bounce them to a
 * permission-denied screen. Results and Help are open to anyone.
 */
const NAV_ITEMS: {
  label: string;
  href: string;
  roles: readonly ProfileRole[] | null;
  requiresAuth?: boolean;
}[] = [
  { label: "Practice", href: "/practice", roles: null },
  /* Full-length practice papers. Sits beside Practice rather than inside it:
     choosing a short set to work on a skill and sitting a whole paper under
     a clock are different intents, and burying the second inside the first
     is how it stayed unreachable. */
  { label: "Exam papers", href: "/exams", roles: null },
  { label: "Learn", href: "/student/learn", roles: ["student"], requiresAuth: true },
  { label: "Results", href: "/results", roles: null },
  { label: "Help", href: "/help", roles: null },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ProfileMenu({
  displayName,
  role,
  onSignOut,
}: {
  displayName: string | null;
  role: ProfileRole | null;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  /* Escape closes, and a click anywhere outside dismisses — the two things
     a menu opened by a button is expected to do. Both listeners only exist
     while the menu is open. */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        data-testid="profile-menu-trigger"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2.5 text-sm font-bold text-ink transition hover:bg-royal/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-royal/8 text-royal"
        >
          <UserRound className="h-4 w-4" />
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{displayName ?? "Account"}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-royal/10 bg-white p-1.5 shadow-[0_18px_44px_rgba(30,20,60,0.16)]"
        >
          {role && (
            <Link
              role="menuitem"
              href={roleHomePath(role)}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-bold text-ink transition hover:bg-royal/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
            >
              <LayoutDashboard aria-hidden="true" className="h-4 w-4 text-royal" />
              {roleHomeLabel(role)}
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            data-testid="profile-menu-sign-out"
            className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-bold text-ink transition hover:bg-royal/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <LogOut aria-hidden="true" className="h-4 w-4 text-royal" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The application header for signed-in-or-not product screens (the practice
 * catalogue and the program setup pages today).
 *
 * Replaces a bare logo-plus-AuthNav strip that offered no navigation at all:
 * from /practice there was no way to reach Learn, Results or Help, and no
 * indication of where in the product you were. Role shells (StudentShell,
 * ParentShell, TeacherShell) keep their own headers — they carry
 * role-specific navigation this one deliberately does not try to cover.
 */
export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, role, displayName, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isSignedIn = status === "authenticated";
  const showGuestActions = status === "anonymous" || status === "unconfigured";

  /*
   * The signed-in user's own dashboard leads the nav rather than living only
   * inside the profile menu. It is the hub every other signed-in screen
   * hangs off, and behind a dropdown it took two clicks and a guess — on
   * /results, /practice and /practice/<program> the header offered no
   * visible route to it at all, which is how finishing an exam used to dead
   * end at the marketing site. Omitted until `role` resolves, because
   * roleHomePath(null) is "/" and that would be the public site wearing a
   * dashboard label.
   */
  const items = [
    ...(isSignedIn && role
      ? [{ label: roleHomeLabel(role), href: roleHomePath(role), roles: null, requiresAuth: true }]
      : []),
    ...NAV_ITEMS,
  ].filter((item) => {
    if (item.requiresAuth && !isSignedIn) return false;
    if (item.roles === null) return true;
    return role !== null && item.roles.includes(role);
  });

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    /* Same reasoning as AuthNav's own sign-out: signOut() only clears the
       browser client's session, so a server-rendered tree still on screen
       needs an explicit re-render to pick up the signed-out state. */
    router.refresh();
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-royal/8 bg-white/85 backdrop-blur-xl">
      <div className="site-width flex h-18 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo size="md" />
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-xl px-3.5 text-[15px] font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20",
                    active
                      ? "bg-royal/8 text-royal"
                      : "text-muted hover:bg-royal/5 hover:text-royal",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {showGuestActions && (
            <Link
              href="/sign-in"
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              Sign in
            </Link>
          )}
          {isSignedIn && (
            <div className="hidden sm:block">
              <ProfileMenu
                displayName={displayName}
                role={role}
                onSignOut={() => void handleSignOut()}
              />
            </div>
          )}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="app-mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((value) => !value)}
            data-testid="app-nav-toggle"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink transition hover:bg-royal/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 lg:hidden"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="app-mobile-nav"
          className="border-t border-royal/8 bg-white lg:hidden"
        >
          <nav aria-label="Primary navigation, mobile" className="site-width grid gap-1 py-4">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "inline-flex min-h-12 items-center rounded-xl px-3 font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20",
                    active ? "bg-royal/8 text-royal" : "text-ink hover:bg-royal/5",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* No separate role-home link here: it is the first entry in
                `items` above, so the drawer would otherwise list the
                dashboard twice. */}
            {isSignedIn && (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 text-left font-bold text-ink transition hover:bg-royal/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
              >
                <LogOut aria-hidden="true" className="h-4 w-4 text-royal" />
                Sign out
              </button>
            )}
            {showGuestActions && (
              <Link
                href="/sign-in"
                onClick={() => setMenuOpen(false)}
                className={buttonClasses({ variant: "secondary", className: "mt-2 w-full" })}
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
