import { describe, expect, it } from "vitest";

import { metadata } from "@/app/page";

describe("home page metadata", () => {
  it("declares the root as its canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe("/");
  });
});
