import { describe, expect, it, vi } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

import { publishedExamBank } from "@/content/questions/practice-bank";
import { GET as getGuestBank } from "@/app/api/exam/guest-bank/route";
import { POST as postExamSession } from "@/app/api/exam/session/route";

const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockCreateRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    rpc: vi.fn((fn: string, params?: unknown) =>
      fn === "session_storage_model_for_caller"
        ? Promise.resolve({ data: "legacy", error: null })
        : mockCreateRpc(fn, params),
    ),
    from: (table: string) => {
      if (table === "profiles") {
        return { select: () => ({ eq: () => ({ single: mockProfileSingle }) }) };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  })),
}));

describe("Stop serving ungated seed questions", () => {
  describe("1. Guest-bank payload contains only published items", () => {
    it("returns only curated and published banks, with no practice property", async () => {
      const response = getGuestBank();
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty("curated");
      expect(json).toHaveProperty("published");
      expect(json).not.toHaveProperty("practice");

      // Verify that all published questions in the payload are members of publishedExamBank
      const publishedIdsInPayload = new Set((json.published as Array<{ id: string }>).map((q) => q.id));
      const officialPublishedIds = new Set(publishedExamBank.map((q) => q.id));

      expect(publishedIdsInPayload.size).toBe(officialPublishedIds.size);
      for (const id of publishedIdsInPayload) {
        expect(officialPublishedIds.has(id)).toBe(true);
      }

      // Assert the ungated seed bank file no longer exists on disk
      const seedFile = resolve(process.cwd(), "src/content/questions/generated/generated-questions.ts");
      expect(existsSync(seedFile)).toBe(false);

      // Assert zero retired seed questions leak into guest-bank payload
      for (const id of publishedIdsInPayload) {
        expect(id.startsWith("gen-")).toBe(false);
      }
    });
  });

  describe("2. The API rejects bankId: 'practice' with 400", () => {
    it("returns status 400 when bankId is 'practice'", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "student-1" } } });
      mockProfileSingle.mockResolvedValue({ data: { role: "student" } });

      const request = new Request("http://localhost/api/exam/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          config: {
            yearLevel: 5,
            examStyle: "naplan_style",
            subject: "numeracy",
            questionCount: 10,
            timing: "untimed",
          },
          bankId: "practice",
        }),
      });

      const response = await postExamSession(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body).toEqual({
        error: "invalid_bank",
        message: "The practice bank is not available for exam sessions.",
      });
      expect(mockCreateRpc).not.toHaveBeenCalled();
    });
  });

  describe("3. ?extended=true has no effect", () => {
    it("practice session page component pools exclusively from published, never practiceExamBank", () => {
      // In practice/session/page.tsx:
      // const pool = banks.published;
      // Even if stdParams.extended is true, the pool remains banks.published.
      const pageFile = readFileSync(
        resolve(process.cwd(), "src/app/practice/session/page.tsx"),
        "utf8",
      );

      // Verify that banks.practice is not referenced anywhere in practice/session/page.tsx
      expect(pageFile).not.toMatch(/banks\.practice/);
      expect(pageFile).toMatch(/const pool = banks\.published;/);
    });
  });

  describe("4. Nothing outside factory/tooling imports practiceExamBank for serving", () => {
    function findImports(dir: string): Array<{ file: string; line: number }> {
      const results: Array<{ file: string; line: number }> = [];
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules, tests, .agent, .git, etc.
          if (
            entry === "node_modules" ||
            entry === ".git" ||
            entry === ".next" ||
            entry === "tests" ||
            entry === "question-factory"
          ) {
            continue;
          }
          results.push(...findImports(fullPath));
        } else if (stat.isFile() && (entry.endsWith(".ts") || entry.endsWith(".tsx"))) {
          // Exclude the source definition file itself
          if (fullPath.endsWith("practice-bank.ts")) {
            continue;
          }
          const content = readFileSync(fullPath, "utf8");
          const lines = content.split("\n");
          lines.forEach((line, idx) => {
            if (/import.*practiceExamBank/.test(line)) {
              results.push({ file: fullPath, line: idx + 1 });
            }
          });
        }
      }

      return results;
    }

    it("zero app or server files import practiceExamBank", () => {
      const srcDir = resolve(process.cwd(), "src");
      const offendingImports = findImports(srcDir);
      expect(offendingImports).toEqual([]);
    });
  });
});
