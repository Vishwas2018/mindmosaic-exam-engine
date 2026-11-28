import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/features/auth/safe-next";
import { parseOAuthProviders } from "@/features/auth/oauth-providers";

describe("safeNextPath — only same-origin paths may be returned to", () => {
  it.each(["/parent", "/parent/children?tab=1", "/exam/abc#top", "/student"])(
    "accepts %s",
    (value) => {
      expect(safeNextPath(value)).toBe(value);
    },
  );

  it.each([
    ["absolute URL", "https://evil.test/x"],
    ["protocol-relative", "//evil.test/x"],
    ["backslash host", "/\\evil.test"],
    ["encoded-newline smuggling", "/ok\n//evil.test"],
    ["scheme", "javascript:alert(1)"],
    ["relative", "parent"],
    ["empty", ""],
  ])("refuses %s", (_label, value) => {
    expect(safeNextPath(value)).toBeNull();
  });

  it("refuses null, undefined and absurdly long values", () => {
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath(`/${"a".repeat(3000)}`)).toBeNull();
  });
});

describe("parseOAuthProviders — a social button needs a configured provider", () => {
  it("offers nothing by default", () => {
    expect(parseOAuthProviders(undefined)).toEqual([]);
    expect(parseOAuthProviders("")).toEqual([]);
  });

  it("offers only the providers named, in a fixed order", () => {
    expect(parseOAuthProviders("apple, google")).toEqual(["google", "apple"]);
    expect(parseOAuthProviders("google")).toEqual(["google"]);
  });

  it("ignores providers the product does not offer", () => {
    expect(parseOAuthProviders("facebook,azure,github")).toEqual([]);
  });
});
