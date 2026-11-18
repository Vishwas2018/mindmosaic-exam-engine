import { describe, expect, it } from "vitest";

import {
  buildAliasEmail,
  loginCodeFromAliasEmail,
  generateLoginCode,
} from "@/features/auth/student-alias";

describe("loginCodeFromAliasEmail", () => {
  it("is the inverse of buildAliasEmail", () => {
    const raw = generateLoginCode();
    const email = buildAliasEmail(raw);
    expect(loginCodeFromAliasEmail(email)).toBe(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  });

  it("returns null for a real address, so an email is never shown as a code", () => {
    expect(loginCodeFromAliasEmail("parent@example.com")).toBeNull();
    expect(loginCodeFromAliasEmail("childcode+K7XJ2P9R@example.com")).toBeNull();
    expect(loginCodeFromAliasEmail(null)).toBeNull();
    expect(loginCodeFromAliasEmail(undefined)).toBeNull();
  });

  it("refuses a malformed alias", () => {
    expect(loginCodeFromAliasEmail("childcode+short@students.mindmosaic.internal")).toBeNull();
  });
});
