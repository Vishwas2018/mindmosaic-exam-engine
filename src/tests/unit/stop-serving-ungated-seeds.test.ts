import { describe, expect, it, vi } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

import { publishedExamBank } from "@/content/questions/practice-bank";
import { GET as getPracticeQuestions } from "@/app/api/practice/session/questions/route";
import { getGuestExamBank } from "@/server/exam-bank";
vi.mock("@/server/practice-session-user", () => ({ getSignedInUserId: async () => null }));
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
  describe("1. Guest allocation only uses published items", () => {
    it("retires bulk delivery and keeps ungated seeds out of the guest source pool", async () => {
      const response = getGuestBank();
      expect(response.status).toBe(410);
      expect(await response.json()).toEqual({ error: "guest_bank_retired" });

      const officialPublishedIds = new Set(publishedExamBank.map((q) => q.id));
      const pool = getGuestExamBank("published");
      expect(pool.length).toBeGreaterThan(0);
      expect(pool.every(({ id }) => officialPublishedIds.has(id) && !id.startsWith("gen-"))).toBe(true);
      const seedFile = resolve(process.cwd(), "src/content/questions/generated/generated-questions.ts");
      expect(existsSync(seedFile)).toBe(false);
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
    it("keeps the same published practice selection when extended is requested", async () => {
      const url = "http://localhost/api/practice/session/questions?source=learning&subject=numeracy&year=3&count=5&seed=fixture";
      const base = await (await getPracticeQuestions(new Request(url))).json();
      const extended = await (await getPracticeQuestions(new Request(url + "&extended=1"))).json();
      expect(base.questions).toHaveLength(5);
      expect(extended.questions).toEqual(base.questions);
      for (const question of extended.questions) {
        expect(question.id).not.toMatch(/^gen-/);
        expect(question).not.toHaveProperty("answerKey");
        expect(question).not.toHaveProperty("explanation");
      }
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
