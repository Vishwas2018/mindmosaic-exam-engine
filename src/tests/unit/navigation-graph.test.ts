import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const APP = path.join(ROOT, "src/app");

/**
 * A structural check over the product's navigation, not a render test.
 *
 * Two things it enforces:
 *
 *  - every internal link resolves to a route that exists, so a rename can
 *    never quietly leave a dead `href` behind;
 *  - every screen that is not a hub offers a way out other than the
 *    marketing site, so no route becomes a cul-de-sac whose only exit is
 *    the landing page. /results was exactly that before this test existed:
 *    its whole header was a logo pointing at /practice.
 */

function collectRoutes(dir: string, seg = "", out = new Set<string>()): Set<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "api") continue;
      /* Route groups "(name)" contribute no URL segment. */
      collectRoutes(full, entry.name.startsWith("(") ? seg : `${seg}/${entry.name}`, out);
    } else if (entry.name === "page.tsx") {
      out.add(seg === "" ? "/" : seg);
    }
  }
  return out;
}

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "tests") continue;
      collectFiles(full, out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const routes = collectRoutes(APP);
const dynamicRoutes = [...routes].filter((r) => r.includes("["));

function routeExists(target: string): boolean {
  if (routes.has(target)) return true;
  const parts = target.split("/").filter(Boolean);
  return dynamicRoutes.some((route) => {
    const routeParts = route.split("/").filter(Boolean);
    if (routeParts.length !== parts.length) return false;
    return routeParts.every((seg, i) => seg.startsWith("[") || seg === parts[i]);
  });
}

/* Both quoted hrefs and the template-literal form used for query-carrying
   links (`/teacher/assignments/new${classQuery}`). */
const LINK_PATTERNS = [
  /href=["'](\/[^"'{}\s]*)["']/g,
  /href:\s*["'](\/[^"'{}\s]*)["']/g,
  /href=\{`(\/[^`$]*)/g,
  /router\.(?:push|replace)\(["'](\/[^"'{}\s]*)["']/g,
  /router\.(?:push|replace)\(`(\/[^`$]*)/g,
  /redirect\(["'](\/[^"'{}\s]*)["']/g,
];

describe("navigation graph", () => {
  it("every internal link points at a route that exists", () => {
    const dead: string[] = [];

    for (const file of collectFiles(path.join(ROOT, "src"))) {
      const source = fs.readFileSync(file, "utf8");
      const rel = path.relative(ROOT, file).replaceAll("\\", "/");
      for (const pattern of LINK_PATTERNS) {
        for (const match of source.matchAll(pattern)) {
          const target = match[1].split("#")[0].split("?")[0] || "/";
          /* A template literal that stops at the interpolation is a prefix,
             not a whole path — "/practice/" cannot be resolved on its own. */
          if (target.endsWith("/") && target !== "/") continue;
          if (!routeExists(target)) dead.push(`${target}  (from ${rel})`);
        }
      }
    }

    expect(dead, `dead internal links:\n${dead.join("\n")}`).toEqual([]);
  });

  it("no href is a placeholder", () => {
    const placeholders: string[] = [];
    for (const file of collectFiles(path.join(ROOT, "src"))) {
      const source = fs.readFileSync(file, "utf8");
      if (/href=["']#["']/.test(source)) {
        placeholders.push(path.relative(ROOT, file).replaceAll("\\", "/"));
      }
    }
    expect(placeholders, `href="#" found in:\n${placeholders.join("\n")}`).toEqual([]);
  });

  /*
   * Screens a learner or staff member lands on mid-journey must offer a way
   * onward that is not the marketing site. The allowlist is the set of
   * screens where "out" genuinely is the public site or an external hop.
   */
  const NAV_EXEMPT = new Set([
    "/", // the marketing site itself
    "/sign-in",
    "/sign-up",
    "/student-sign-in",
    "/auth/confirm",
    "/auth/reset",
    "/dev/routes",
    "/showcase",
  ]);

  /*
   * A screen counts as navigable if it mounts one of the shared shells, or
   * one of the two components whose whole job is to be the way out of a
   * header that cannot hard-code a destination: RoleHomeLink (the signed-in
   * user's own dashboard, nothing for guests) and AuthNav (which carries the
   * same role-home link plus sign-out). /billing uses that pair deliberately
   * because it is shared by guests, students and parents.
   */
  const SHELLS = [
    "AppHeader",
    "StudentShell",
    "ParentShell",
    "TeacherShell",
    "AdminShell",
    "LegalPageShell",
    "SiteNav",
    "RoleHomeLink",
    "AuthNav",
  ];

  it("every in-product screen has a shell or its own way back", () => {
    const stranded: string[] = [];

    for (const route of [...routes].sort()) {
      if (NAV_EXEMPT.has(route)) continue;

      const file = path.join(APP, route === "/" ? "" : route, "page.tsx");
      if (!fs.existsSync(file)) continue;
      const source = fs.readFileSync(file, "utf8");

      const hasShell = SHELLS.some((shell) => source.includes(shell));
      /* An explicit step back up: any internal link that is not the
         marketing root. */
      const ownLinks = [...source.matchAll(/href=["'](\/[^"'{}\s]*)["']/g)]
        .map((m) => m[1])
        .filter((href) => href !== "/");

      if (!hasShell && ownLinks.length === 0) stranded.push(route);
    }

    expect(
      stranded,
      `these screens offer no way out except the marketing site:\n${stranded.join("\n")}`,
    ).toEqual([]);
  });
});
