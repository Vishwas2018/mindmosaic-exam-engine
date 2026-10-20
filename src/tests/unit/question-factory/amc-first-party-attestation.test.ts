import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { candidateQuestionSchema, type CandidateQuestion } from "@/features/question-factory/ingestion/candidate-question";
import { hashJson } from "@/features/question-factory/provenance/content-hash";

const overrides = vi.hoisted(() => ({ solvers: new Map<string, unknown>(), pins: new Map<string, string>() }));
vi.mock("@/features/question-factory/correctness/amc-first-party-solvers", async (original) => {
  const actual = await original<typeof import("@/features/question-factory/correctness/amc-first-party-solvers")>();
  return { AMC_FIRST_PARTY_SOLVERS: new Proxy({ ...actual.AMC_FIRST_PARTY_SOLVERS }, { get: (target, property: string) => overrides.solvers.has(property) ? overrides.solvers.get(property) : target[property] }) };
});
vi.mock("@/features/question-factory/correctness/amc-content-bindings", async (original) => {
  const actual = await original<typeof import("@/features/question-factory/correctness/amc-content-bindings")>();
  // A copied object lets adversarial tests simulate a separately reviewed snapshot;
  // production exports remain frozen and never accept a caller's registry.
  return { AMC_ATTESTED_CONTENT_HASHES: new Proxy({ ...actual.AMC_ATTESTED_CONTENT_HASHES }, { get: (target, property: string) => overrides.pins.get(property) ?? target[property] }) };
});
import { verifyFirstPartyAmcAttestation } from "@/features/question-factory/correctness/amc-attestation";

const questions: CandidateQuestion[] = [3, 5].flatMap((year) => JSON.parse(readFileSync(`content/roadmap-drafts/amc-y${year}-draft.json`, "utf8")).questions.map((raw: unknown) => candidateQuestionSchema.parse(raw)));
const q = questions[0];
beforeEach(() => { overrides.solvers.clear(); overrides.pins.clear(); });

describe("hash-pinned first-party AMC attestation", () => {
  it.each(questions.map((question) => [question.id, question] as const))("independently recomputes %s", (_id, question) => {
    const result = verifyFirstPartyAmcAttestation(question, hashJson(question));
    expect(result.ok).toBe(true);
    if (result.ok && question.answerKey.kind === "single_option") expect(result.matchedOptionId).toBe(question.answerKey.optionId);
    if (result.ok && question.answerKey.kind === "number") expect(result.computedValue).toBe(question.answerKey.value);
  });
  it("refuses a mismatched provenance hash", () => {
    expect(verifyFirstPartyAmcAttestation(q, "0".repeat(64))).toMatchObject({ ok: false, error: "content_hash_mismatch" });
  });
  it("refuses prompt edits even when the caller recomputes provenance", () => {
    const changed = { ...q, prompt: `${q.prompt} Changed.` };
    expect(verifyFirstPartyAmcAttestation(changed, hashJson(changed))).toMatchObject({ ok: false, error: "content_hash_mismatch" });
  });
  it("refuses missing solvers", () => {
    overrides.solvers.set(q.id, undefined);
    expect(verifyFirstPartyAmcAttestation(q, hashJson(q))).toMatchObject({ ok: false, error: "missing_first_party_solver" });
  });
  it("refuses throwing solvers", () => {
    overrides.solvers.set(q.id, () => { throw new Error("injected failure"); });
    expect(verifyFirstPartyAmcAttestation(q, hashJson(q))).toMatchObject({ ok: false, error: "solver_execution_failed" });
  });
  it.each([NaN, Infinity, -Infinity, undefined, null, {}, ""])("refuses invalid solver result %s", (value) => {
    overrides.solvers.set(q.id, () => value);
    expect(verifyFirstPartyAmcAttestation(q, hashJson(q))).toMatchObject({ ok: false, error: "invalid_solver_result" });
  });
  it("refuses a recomputed answer that points at a different key", () => {
    overrides.solvers.set(q.id, () => 15);
    expect(verifyFirstPartyAmcAttestation(q, hashJson(q))).toMatchObject({ ok: false, error: "key_mismatch" });
  });
  it("refuses ambiguous equal-valued options", () => {
    const ambiguous = { ...q, options: q.options.map((option) => option.id === "c" ? { ...option, text: "12" } : option) };
    overrides.pins.set(q.id, hashJson(ambiguous));
    expect(verifyFirstPartyAmcAttestation(ambiguous, hashJson(ambiguous))).toMatchObject({ ok: false, error: "option_match_ambiguous" });
  });
  it("rejects candidate solverParams rather than accepting literal equality", () => {
    const hostile = { ...q, solverParams: { constraints: [{ op: "eq", variable: "X", value: 12 }] } } as unknown as CandidateQuestion;
    expect(verifyFirstPartyAmcAttestation(hostile, hashJson(hostile))).toMatchObject({ ok: false, error: "candidate_logic_rejected" });
  });
  it.each(["solver", "solverFn", "code", "script", "execute", "derivedAnswer"])("rejects candidate logic field %s", (field) => {
    const hostile = { ...q, [field]: "arbitrary candidate logic" };
    expect(verifyFirstPartyAmcAttestation(hostile, hashJson(hostile))).toMatchObject({ ok: false, error: "candidate_logic_rejected" });
  });
});
