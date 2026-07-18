import { describe, expect, it } from "vitest";

import { evaluatePassword, PASSWORD_RULES } from "@/features/auth/password";

describe("evaluatePassword", () => {
  it("reports an empty password as no rules met", () => {
    const result = evaluatePassword("");
    expect(result.metCount).toBe(0);
    expect(result.allMet).toBe(false);
    expect(result.strength).toBe("empty");
  });

  it("requires all five rules for a fully valid password", () => {
    const result = evaluatePassword("Str0ng!pass");
    expect(result.allMet).toBe(true);
    expect(result.metCount).toBe(PASSWORD_RULES.length);
    expect(result.strength).toBe("strong");
  });

  it("flags each missing rule individually", () => {
    const noUpper = evaluatePassword("str0ng!pass");
    expect(noUpper.results.find((r) => r.id === "upper")?.met).toBe(false);
    expect(noUpper.allMet).toBe(false);

    const noSpecial = evaluatePassword("Str0ngpass");
    expect(noSpecial.results.find((r) => r.id === "special")?.met).toBe(false);

    const tooShort = evaluatePassword("Aa1!");
    expect(tooShort.results.find((r) => r.id === "length")?.met).toBe(false);
  });

  it("scales strength with the number of satisfied rules", () => {
    expect(evaluatePassword("aa").strength).toBe("weak"); // lower only
    expect(evaluatePassword("Abcdefg1").strength).toBe("fair"); // 4 of 5
    expect(evaluatePassword("Abcdefg1!").strength).toBe("strong"); // all 5
  });
});
