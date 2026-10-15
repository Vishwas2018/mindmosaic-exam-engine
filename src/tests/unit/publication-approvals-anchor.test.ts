import { existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";

// servedBank() returns [] when content/publication-approvals/ is missing from the deployment.
// The route-wide trace glob matches files, so an approvals folder with no files is not bundled.
// This test resolves the glob exactly as Next does (next/dist/compiled/glob, dot: true).
describe("publication approvals folder stays in the production bundle", () => {
  const root = path.resolve(__dirname, "../../..");
  const requireFromHere = createRequire(__filename);

  it("keeps the anchor files that hold the folder in git", () => {
    expect(existsSync(path.join(root, "content/publication-approvals/README.md"))).toBe(true);
    expect(existsSync(path.join(root, "content/publication-approvals/.gitkeep"))).toBe(true);
  });

  it("the route-wide tracing glob for the folder matches at least one file", () => {
    const includes = nextConfig.outputFileTracingIncludes?.["/*"] ?? [];
    const pattern = includes.find((entry) => entry === "./content/publication-approvals/*");
    expect(pattern, "next.config.ts must trace ./content/publication-approvals/*").toBeDefined();
    const glob = requireFromHere("next/dist/compiled/glob") as {
      sync: (p: string, o: { cwd: string; nodir: boolean; dot: boolean }) => string[];
    };
    const matched = glob.sync(pattern as string, { cwd: root, nodir: true, dot: true });
    expect(matched.length).toBeGreaterThan(0);
  });
});
