import { describe, expect, it } from "vitest";

import {
  DARK_READY_EXACT,
  DARK_READY_PREFIXES,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  effectiveTheme,
  isDarkReadyPath,
  parsePreference,
} from "@/features/theme/theme";

/** Runs the pre-paint script against a fake page, the way a browser would, and reports data-theme. */
function runInitScript(stored: string | null, pathname: string): string | null {
  const attributes: Record<string, string> = {};
  const fakeWindow = {
    localStorage: { getItem: (key: string) => (key === THEME_STORAGE_KEY ? stored : null) },
    location: { pathname },
    document: { documentElement: { setAttribute: (k: string, v: string) => (attributes[k] = v) } },
  };
  new Function("localStorage", "location", "document", THEME_INIT_SCRIPT)(
    fakeWindow.localStorage,
    fakeWindow.location,
    fakeWindow.document,
  );
  return attributes["data-theme"] ?? null;
}

describe("night mode preference", () => {
  it("is light unless the stored value is exactly dark", () => {
    expect(parsePreference("dark")).toBe("dark");
    for (const value of [null, undefined, "", "light", "DARK", "true", "1", "{}"]) {
      expect(parsePreference(value as string | null)).toBe("light");
    }
  });

  it("is dark only for a dark preference on a verified route", () => {
    expect(effectiveTheme("dark", "/practice/naplan")).toBe("dark");
    expect(effectiveTheme("light", "/practice/naplan")).toBe("light");
    expect(effectiveTheme("dark", "/")).toBe("dark");
  });

  it("never darkens a route that has not been verified", () => {
    for (const path of ["/admin", "/admin/review", "/teacher", "/parent", "/parent/children", "/billing", "/student/assignments", "/student/writing", "/student/learn/lessons/VC2M5N01", "/student/practice/x", "/dev/routes", "/writing/sit/x"]) {
      expect(isDarkReadyPath(path), path).toBe(false);
      expect(effectiveTheme("dark", path), path).toBe("light");
    }
  });

  it("matches a prefix only on a path boundary", () => {
    expect(isDarkReadyPath("/practice")).toBe(true);
    expect(isDarkReadyPath("/practice/icas")).toBe(true);
    expect(isDarkReadyPath("/practicefoo")).toBe(false);
    expect(isDarkReadyPath("/examination")).toBe(false);
    expect(isDarkReadyPath("/student-tips")).toBe(true);
      });

  it("lists the contrast-checked student pages exactly, never the whole /student tree", () => {
    for (const path of ["/student", "/student/learn", "/student/practice", "/student/exam-preparation", "/student/engagement"]) {
      expect(isDarkReadyPath(path), path).toBe(true);
    }
    expect(isDarkReadyPath("/student/assignments")).toBe(false);
    expect(isDarkReadyPath("/student/learn/lessons/VC2M5N01")).toBe(false);
  });
});

describe("the pre-paint script agrees with effectiveTheme", () => {
  const paths = ["/", ...DARK_READY_EXACT, "/student/assignments", ...DARK_READY_PREFIXES, ...DARK_READY_PREFIXES.map((p) => `${p}/x`), "/admin", "/student", "/practicefoo", "/billing"];

  it("sets data-theme exactly when effectiveTheme says dark, for every path", () => {
    for (const path of paths) {
      expect(runInitScript("dark", path), `dark ${path}`).toBe(effectiveTheme("dark", path) === "dark" ? "dark" : null);
      expect(runInitScript("light", path), `light ${path}`).toBeNull();
      expect(runInitScript(null, path), `unset ${path}`).toBeNull();
    }
  });

  it("covers the same exact routes as the list", () => {
    for (const path of DARK_READY_EXACT) expect(runInitScript("dark", path)).toBe("dark");
  });

  it("fails safe: a storage error leaves the page light", () => {
    const run = () =>
      new Function("localStorage", "location", "document", THEME_INIT_SCRIPT)(
        { getItem: () => { throw new Error("blocked"); } },
        { pathname: "/practice" },
        { documentElement: { setAttribute: () => { throw new Error("should not be reached"); } } },
      );
    expect(run).not.toThrow();
  });
});
