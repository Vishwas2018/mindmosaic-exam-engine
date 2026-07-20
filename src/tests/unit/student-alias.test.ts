import { describe, expect, it } from "vitest";

import {
  buildAliasEmail,
  formatLoginCode,
  generateLoginCode,
  generatePin,
  isValidPin,
  normalizeLoginCode,
} from "@/features/auth/student-alias";

describe("generateLoginCode", () => {
  it("produces an 8-character code from the safe alphabet only", () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateLoginCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
    }
  });

  it("does not use visually ambiguous characters", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateLoginCode()).not.toMatch(/[01OIL]/);
    }
  });

  it("is not trivially predictable across repeated calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateLoginCode()));
    expect(codes.size).toBeGreaterThan(15);
  });
});

describe("formatLoginCode / normalizeLoginCode", () => {
  it("formats a raw code as XXXX-XXXX", () => {
    expect(formatLoginCode("K7XJ2P9R")).toBe("K7XJ-2P9R");
  });

  it("normalizes lower-case, hyphens, and stray whitespace the same way", () => {
    expect(normalizeLoginCode("k7xj2p9r")).toBe("K7XJ2P9R");
    expect(normalizeLoginCode("k7xj-2p9r")).toBe("K7XJ2P9R");
    expect(normalizeLoginCode("  K7XJ 2P9R  ")).toBe("K7XJ2P9R");
  });

  it("round-trips: formatting a normalized code and re-normalizing it is a no-op", () => {
    const raw = generateLoginCode();
    expect(normalizeLoginCode(formatLoginCode(raw))).toBe(raw);
  });
});

describe("buildAliasEmail", () => {
  it("is deterministic for the same code", () => {
    const code = generateLoginCode();
    expect(buildAliasEmail(code)).toBe(buildAliasEmail(code));
  });

  it("reconstructs the same alias from any formatting of the same code", () => {
    const email = buildAliasEmail("K7XJ2P9R");
    expect(buildAliasEmail("k7xj-2p9r")).toBe(email);
    expect(buildAliasEmail("  K7XJ 2P9R  ")).toBe(email);
  });

  it("uses the non-guessable internal alias domain and the childcode+ local prefix", () => {
    const email = buildAliasEmail("K7XJ2P9R");
    expect(email).toBe("childcode+k7xj2p9r@students.mindmosaic.internal");
  });

  it("produces distinct aliases for distinct codes", () => {
    expect(buildAliasEmail("AAAAAAAA")).not.toBe(buildAliasEmail("BBBBBBBB"));
  });
});

describe("generatePin / isValidPin", () => {
  it("generates a 6-digit numeric PIN", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generatePin()).toMatch(/^\d{6}$/);
    }
  });

  it("accepts 4-6 digit PINs and rejects everything else", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });

  it("every generated PIN is itself valid", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(isValidPin(generatePin())).toBe(true);
    }
  });
});
