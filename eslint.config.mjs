import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
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
  /*
   * Server-only question bank boundary (docs/ASSESSMENT_SECURITY_MODEL.md,
   * Phase 0 addendum): the authoring banks carry every answer key and
   * explanation, so app code may reach them only through the server-only
   * gateway src/server/exam-bank.ts. Exempt: the gateway itself and the
   * content workspace (bank modules importing each other), the Node-side
   * question-factory tooling, and tests (which run in Node, never in a
   * client bundle). Root-level scripts/ are outside src and unaffected.
   * npm run check:bundle independently verifies no shipped client chunk
   * contains bank content.
   */
  {
    files: ["src/**/*.{ts,tsx,mts,mjs}"],
    ignores: [
      "src/server/**",
      "src/content/**",
      "src/features/question-factory/**",
      "src/tests/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/content/question-bank",
                "@/content/questions/question-bank",
                "@/content/questions/practice-bank",
                "**/content/question-bank",
                "**/content/questions/question-bank",
                "**/content/questions/practice-bank",
              ],
              message:
                "The authoring question bank (answer keys included) is server-only. Import it via src/server/exam-bank.ts from a Route Handler or server component — see docs/ASSESSMENT_SECURITY_MODEL.md.",
            },
          ],
        },
      ],
    },
  },
  /*
   * e2e/ is Playwright test tooling, not React — but Playwright's own
   * fixture API (`test.extend`) requires a callback whose second parameter
   * is conventionally named `use`, which react-hooks's naming heuristic
   * mistakes for the React `use()` hook. See e2e/fixtures/auth.fixture.ts.
   */
  {
    files: ["e2e/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
]);

export default eslintConfig;
