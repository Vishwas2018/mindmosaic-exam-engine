import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Mission 3D governed-authority hardening (starting SHA `adce3f7`).
 *
 * `no-restricted-imports` here is a second, error-level enforcement layer
 * for the same importer boundary `correctness/index.ts`/`review/index.ts`/
 * `storage/index.ts` already document by omission (not barrel-exported):
 * `storage/governed-write-capability` may only be imported by storage's
 * own internals plus the two governed writers, and each governed writer
 * may only be imported by its sibling orchestrator. Scoped to
 * `src/features/question-factory/**` only — test files deep-import these
 * modules deliberately (an established, documented convention throughout
 * this feature) and are not restricted here. A companion source-scan test
 * (`governed-import-boundary.test.ts`) asserts the exact importer sets
 * independently of ESLint actually running.
 *
 * ESLint flat config does not merge a rule's settings across multiple
 * matching config objects — for any given file, whichever matching
 * object appears *last* in the array wins that rule's setting outright,
 * replacing (not combining with) any earlier one. So this cannot be three
 * independent "restrict rule R to everyone except my own allowed
 * importers" objects sharing one broad `files` glob each: for any file
 * not exempted by all three, only the last object's `patterns` would
 * actually apply, silently dropping the other two. Instead: one general
 * config applies all three restrictions to every file in scope, and each
 * legitimately-exempt file gets its own narrow, file-specific override
 * *later* in the array carrying only the subset of patterns it still
 * needs (dropping just the one restriction that file is allowed to
 * cross) — the standard flat-config idiom of "more specific config later
 * in the array wins for the files it targets".
 */
const questionFactorySourceGlob = "src/features/question-factory/**/*.ts";

const RESTRICT_GOVERNED_WRITE_CAPABILITY = {
  // Explicit relative forms rather than a bare "**/..." glob: minimatch's
  // globstar does not cross a leading ".." segment by default (dot-segment
  // matching is opt-in), so a pattern like "**/governed-write-capability"
  // silently fails to match "../storage/governed-write-capability" — the
  // exact form every real importer outside storage/ would use.
  group: ["./governed-write-capability", "../storage/governed-write-capability", "**/governed-write-capability"],
  message:
    "storage/governed-write-capability is internal to the storage layer and the two governed writers only — see storage/trusted-reports.ts.",
};

const RESTRICT_GOVERNED_ATTESTATION_WRITER = {
  group: [
    "./governed-attestation-writer",
    "../correctness/governed-attestation-writer",
    "**/governed-attestation-writer",
  ],
  message:
    "correctness/governed-attestation-writer is internal — only orchestrate-correctness-verification.ts may import it.",
};

const RESTRICT_GOVERNED_SEMANTIC_EVIDENCE_WRITER = {
  group: [
    "./governed-semantic-evidence-writer",
    "../review/governed-semantic-evidence-writer",
    "**/governed-semantic-evidence-writer",
  ],
  message:
    "review/governed-semantic-evidence-writer is internal — only orchestrate-semantic-review.ts may import it.",
};

function noRestrictedImports(...patterns) {
  return { rules: { "no-restricted-imports": ["error", { patterns }] } };
}

const governedImportBoundary = defineConfig([
  {
    files: [questionFactorySourceGlob],
    ...noRestrictedImports(
      RESTRICT_GOVERNED_WRITE_CAPABILITY,
      RESTRICT_GOVERNED_ATTESTATION_WRITER,
      RESTRICT_GOVERNED_SEMANTIC_EVIDENCE_WRITER,
    ),
  },
  // Storage internals and the two governed writers themselves may import
  // governed-write-capability; they still may not import either governed
  // writer.
  {
    files: [
      "src/features/question-factory/storage/fs-factory-repository.ts",
      "src/features/question-factory/storage/factory-repository.ts",
      "src/features/question-factory/storage/trusted-reports.ts",
      "src/features/question-factory/correctness/governed-attestation-writer.ts",
      "src/features/question-factory/review/governed-semantic-evidence-writer.ts",
    ],
    ...noRestrictedImports(RESTRICT_GOVERNED_ATTESTATION_WRITER, RESTRICT_GOVERNED_SEMANTIC_EVIDENCE_WRITER),
  },
  // The correctness orchestrator may import governed-attestation-writer;
  // it still may not import governed-write-capability or the semantic
  // writer directly.
  {
    files: ["src/features/question-factory/correctness/orchestrate-correctness-verification.ts"],
    ...noRestrictedImports(RESTRICT_GOVERNED_WRITE_CAPABILITY, RESTRICT_GOVERNED_SEMANTIC_EVIDENCE_WRITER),
  },
  // The semantic-review orchestrator may import
  // governed-semantic-evidence-writer; it still may not import
  // governed-write-capability or the attestation writer directly.
  {
    files: ["src/features/question-factory/review/orchestrate-semantic-review.ts"],
    ...noRestrictedImports(RESTRICT_GOVERNED_WRITE_CAPABILITY, RESTRICT_GOVERNED_ATTESTATION_WRITER),
  },
]);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...governedImportBoundary,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Question-factory content workspace: generated/candidate JSON data,
    // never source code.
    "content/question-factory/**",
    // Local Claude Code tooling (worktrees, session state) — not project
    // source; can contain a full duplicate checkout under worktrees/.
    ".claude/**",
  ]),
]);

export default eslintConfig;
