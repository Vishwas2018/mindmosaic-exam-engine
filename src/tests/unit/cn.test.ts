import { describe, expect, it } from "vitest";

import { cn } from "@/lib/cn";

describe("cn", () => {
  it("combines conditional classes and resolves Tailwind conflicts", () => {
    expect(cn("rounded-lg", false && "hidden", "px-2", "px-4")).toBe(
      "rounded-lg px-4",
    );
  });
});
