/**
 * Night mode: the preference, which routes honour it, and the script that applies it before first paint.
 *
 * Two deliberate limits keep it from breaking anything:
 *
 *  1. It is opt-in. The default is, and stays, the light theme for everyone; nothing changes for anyone
 *     until they choose Night mode. (It does not follow the operating system's setting.)
 *  2. It applies only on routes whose dark rendering has been checked (see DARK_READY below). Everywhere
 *     else stays light, and no toggle is shown there, rather than risking an unreadable page. A route is
 *     added to the list only once it passes the dark-mode axe contrast run and a visual check.
 */

export type ThemePreference = "light" | "dark";
export type EffectiveTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "mm-theme";
export const THEME_CHANGE_EVENT = "mm-theme-change";

/** Routes (exact) and route trees (prefix) whose dark rendering has been verified. */
/* The student portal is listed page by page, not by prefix: only these five were contrast-checked in Night mode
   with a real student session (lessons, assignments and writing under /student have not been), so they alone
   honour it and show the toggle. */
export const DARK_READY_EXACT: readonly string[] = [
  "/",
  "/student",
  "/student/learn",
  "/student/practice",
  "/student/exam-preparation",
  "/student/engagement",
];
export const DARK_READY_PREFIXES: readonly string[] = [
  "/practice",
  "/exam",
  "/exams",
  "/results",
  "/programs",
  "/learn",
  "/pricing",
  "/how-it-works",
  "/sign-in",
  "/sign-up",
  "/student-sign-in",
  "/student-tips",
  "/parent-guide",
  "/help",
  "/about",
  "/resources",
  "/privacy",
  "/terms",
  "/accessibility",
  "/assessment-disclaimer",
];

export function isDarkReadyPath(pathname: string): boolean {
  if (DARK_READY_EXACT.includes(pathname)) return true;
  return DARK_READY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Anything that is not exactly "dark" is light, so a corrupt value can never leave a page dark. */
export function parsePreference(value: string | null | undefined): ThemePreference {
  return value === "dark" ? "dark" : "light";
}

export function effectiveTheme(preference: ThemePreference, pathname: string): EffectiveTheme {
  return preference === "dark" && isDarkReadyPath(pathname) ? "dark" : "light";
}

/**
 * Runs in <head> before first paint, so a person who chose Night mode never sees a light flash. It repeats
 * effectiveTheme() in plain ES5 (a test holds the two together) and fails safe: any error leaves the page light.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var d=${JSON.stringify(
  DARK_READY_EXACT,
)},p=${JSON.stringify(DARK_READY_PREFIXES)},k=${JSON.stringify(
  THEME_STORAGE_KEY,
)},t=localStorage.getItem(k),l=location.pathname;if(t!=="dark")return;var ok=d.indexOf(l)>-1;for(var i=0;i<p.length&&!ok;i++){if(l===p[i]||l.indexOf(p[i]+"/")===0)ok=true}if(ok)document.documentElement.setAttribute("data-theme","dark")}catch(e){}})();`;
