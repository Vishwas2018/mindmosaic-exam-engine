import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Test files that exercise `FsFactoryRepository`
 * (src/features/question-factory/storage/fs-factory-repository.ts), a
 * filesystem-lock-based repository, either directly or through
 * `cli-test-helpers.ts` (every `cli-questions-*.test.ts` file spawns the
 * real CLI script against a sandboxed repository built on top of it), plus
 * `pipeline-batch-lock.test.ts` (a second, independent filesystem-lock
 * mechanism — `acquireBatchLock`/`releaseBatchLock` — with the same shape
 * of risk). Each test uses its own unique `mkdtemp()` root, but running
 * many of these as separate forked processes at once on Windows (and,
 * separately, under a CI runner's more constrained core count) still
 * produces lock-acquisition timeouts, ENOTEMPTY, and rmdir races under the
 * resulting I/O/CPU contention — every suite here is reliable in isolation
 * and with parallelism fully disabled. Rather than disabling parallelism
 * for the whole run, `fileParallelism: false` is scoped to just these
 * files via the "question-factory-fs" project below, so every other suite
 * (including the rest of question-factory) keeps running in parallel with
 * itself and with this project.
 *
 * This list previously omitted four `cli-test-helpers.ts`-based files
 * (`cli-questions-generate-ai`, `cli-questions-ingest`,
 * `cli-questions-prompt`, `cli-questions-review-ai`) despite already
 * claiming to cover exactly that category — a real gap, not a deliberate
 * exclusion, and the direct cause of `cli-questions-prompt.test.ts` and
 * `cli-questions-ingest.test.ts` flaking under full-suite parallel load.
 */
const FS_FACTORY_REPOSITORY_TEST_FILES = [
  "src/tests/unit/question-factory/blueprint-binding-fail-closed.test.ts",
  "src/tests/unit/question-factory/cli-questions-generate-ai.test.ts",
  "src/tests/unit/question-factory/cli-questions-ingest.test.ts",
  "src/tests/unit/question-factory/cli-questions-pipeline.test.ts",
  "src/tests/unit/question-factory/cli-questions-prompt.test.ts",
  "src/tests/unit/question-factory/cli-questions-review-ai.test.ts",
  "src/tests/unit/question-factory/cli-questions-review-ingest.test.ts",
  "src/tests/unit/question-factory/cli-questions-review-prompt.test.ts",
  "src/tests/unit/question-factory/cli-questions-revise.test.ts",
  "src/tests/unit/question-factory/correctness-orchestration.test.ts",
  "src/tests/unit/question-factory/difficulty-orchestration.test.ts",
  "src/tests/unit/question-factory/fs-factory-repository.test.ts",
  "src/tests/unit/question-factory/ingestion.test.ts",
  "src/tests/unit/question-factory/manual-ingestion.test.ts",
  "src/tests/unit/question-factory/mission3a-integration.test.ts",
  "src/tests/unit/question-factory/mission3b-integration.test.ts",
  "src/tests/unit/question-factory/mission3c-integration.test.ts",
  "src/tests/unit/question-factory/mission3d-integration.test.ts",
  "src/tests/unit/question-factory/mission3d-remediation.test.ts",
  "src/tests/unit/question-factory/originality-orchestration.test.ts",
  "src/tests/unit/question-factory/pipeline-batch-lock.test.ts",
  "src/tests/unit/question-factory/pipeline-runner-crash-safety.test.ts",
  "src/tests/unit/question-factory/pipeline-runner.test.ts",
  "src/tests/unit/question-factory/provenance-prompt-hash.test.ts",
  "src/tests/unit/question-factory/publication.test.ts",
  "src/tests/unit/question-factory/review-ingest-crash-safety.test.ts",
  "src/tests/unit/question-factory/review-ingest.test.ts",
  "src/tests/unit/question-factory/revision-ingest-crash-safety.test.ts",
  "src/tests/unit/question-factory/revision-ingest.test.ts",
  "src/tests/unit/question-factory/staging.test.ts",
  "src/tests/unit/question-factory/structural-validation-orchestration.test.ts",
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/tests/**/*.test.{ts,tsx}"],
          exclude: FS_FACTORY_REPOSITORY_TEST_FILES,
        },
      },
      {
        extends: true,
        test: {
          name: "question-factory-fs",
          include: FS_FACTORY_REPOSITORY_TEST_FILES,
          // Serialise only this project's files (see comment above) —
          // sibling projects are unaffected and keep running in parallel.
          fileParallelism: false,
        },
      },
    ],
  },
});
