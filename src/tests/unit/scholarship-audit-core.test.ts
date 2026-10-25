import { describe, expect, it } from "vitest";
import {
  AuditFailureError,
  DECLARED_GENERATOR_SENTENCE,
  REVIEW_DIR,
  SOURCE_PATHS,
  assertNoMachineFailures,
  auditSection,
  buildBlindPacket,
  buildInventory,
  buildQuestionEvidence,
  checkInventoryConsistency,
  fsReader,
  loadSections,
  machineKeyCheck,
  parseAdoptedScope,
  renderOwnerPack,
  serialiseInventory,
  type DraftQuestion,
  type DraftSidecar,
  type LoadedSection,
  type SourceReader,
} from "../../../scripts/lib/scholarship-audit-core";

/** Reader that serves the real repository except for explicit overrides (`null` = file missing). */
function overlay(overrides: Record<string, string | null>): SourceReader {
  return {
    readText: (p) => {
      if (p in overrides) {
        const v = overrides[p];
        if (v === null) throw new Error(`missing: ${p}`);
        return v;
      }
      return fsReader.readText(p);
    },
    exists: (p) => (p in overrides ? overrides[p] !== null : fsReader.exists(p)),
    listDir: (p) => fsReader.listDir(p),
  };
}

const sections = loadSections(fsReader);
const nr = sections.find((s) => s.spec.key === "nr")!;
const maths = sections.find((s) => s.spec.key === "maths")!;
const find = (s: LoadedSection, id: string): DraftQuestion => s.data.questions.find((q) => q.id === id)!;
const clone = <T,>(v: T): T => structuredClone(v);

describe("machine key check: solver result is read only after ok is checked", () => {
  it("verifies a genuine closed-language item (nr-001) with an explicit computed value", () => {
    const q = find(nr, "scholarship-y6-nr-001");
    const r = machineKeyCheck(q, nr.data.parameters?.[q.id]);
    expect(r.status).toBe("verified");
    expect(r.method).toBe("closed_language_solver");
    expect(r.computedValue).toBe(35);
    expect(r.optionsMatchingComputedValue).toBe(1);
  });

  it("verifies a genuine first-party item (nr-022) and a maths item", () => {
    const a = find(nr, "scholarship-y6-nr-022");
    expect(machineKeyCheck(a, nr.data.parameters?.[a.id]).status).toBe("verified");
    const m = find(maths, "scholarship-y6-maths-004");
    const r = machineKeyCheck(m, maths.data.parameters?.[m.id]);
    expect(r.status).toBe("verified");
    expect(r.method).toBe("first_party_recompute");
  });

  it("reports FAILED, with no computed value, when the solver returns { ok: false }", () => {
    const q = find(nr, "scholarship-y6-nr-001");
    const broken: DraftSidecar = { solver: "no_such_solver", solverParams: {} };
    const r = machineKeyCheck(q, broken);
    expect(r.status).toBe("failed");
    expect(r.failureCode).toBe("solver_error");
    expect(r.computedValue).toBeUndefined();
    expect(r.detail).toMatch(/failed/);
    expect(r.detail).not.toMatch(/key matches|matches the stored key/);
  });

  it("reports FAILED on a solver value that disagrees with the stored key (closed language)", () => {
    const q = clone(find(nr, "scholarship-y6-nr-001"));
    q.answerKey = { ...q.answerKey, optionId: "a" };
    const r = machineKeyCheck(q, nr.data.parameters?.[q.id]);
    expect(r.status).toBe("failed");
    expect(r.failureCode).toBe("key_mismatch");
    expect(r.computedValue).toBe(35);
  });

  it("reports FAILED when an untrusted correctValue contradicts the solver", () => {
    const q = find(nr, "scholarship-y6-nr-001");
    const side = clone(nr.data.parameters![q.id]);
    side.correctValue = 999;
    const r = machineKeyCheck(q, side);
    expect(r.status).toBe("failed");
    expect(r.failureCode).toBe("solver_error");
  });

  it("reports FAILED when two options equal the computed value", () => {
    const q = clone(find(nr, "scholarship-y6-nr-001"));
    q.options = q.options.map((o) => (o.id === "a" ? { ...o, text: "35" } : o));
    const r = machineKeyCheck(q, nr.data.parameters?.[q.id]);
    expect(r.status).toBe("failed");
    expect(r.failureCode).toBe("option_match_not_unique");
  });

  it("reports FAILED when a first-party attested key is wrong", () => {
    const q = clone(find(nr, "scholarship-y6-nr-022"));
    q.answerKey = { ...q.answerKey, optionId: "a" };
    const r = machineKeyCheck(q, undefined);
    expect(r.status).toBe("failed");
    expect(r.method).toBe("first_party_recompute");
    expect(r.computedValue).toBeUndefined();
  });

  it("reports not_established, never verified, when no machine proof exists (reading comprehension)", () => {
    const rc = sections.find((s) => s.spec.key === "rc")!;
    const q = rc.data.questions[0];
    const r = machineKeyCheck(q, rc.data.parameters?.[q.id]);
    expect(r.status).toBe("not_established");
    expect(r.method).toBe("none");
  });
});

describe("failure propagates into the audit; a failed check never becomes a 'key matches' report", () => {
  const brokenSection = (): LoadedSection => {
    const data = clone(nr.data);
    const q = data.questions.find((x) => x.id === "scholarship-y6-nr-001")!;
    q.answerKey = { ...q.answerKey, optionId: "a" };
    return { ...nr, data };
  };

  it("assertNoMachineFailures throws AuditFailureError naming the item", () => {
    const audit = auditSection(brokenSection(), fsReader);
    expect(() => assertNoMachineFailures(audit)).toThrow(AuditFailureError);
    try {
      assertNoMachineFailures(audit);
    } catch (e) {
      expect((e as AuditFailureError).failures.map((f) => f.id)).toEqual(["scholarship-y6-nr-001"]);
    }
  });

  it("renderOwnerPack refuses to render a failed section", () => {
    const section = brokenSection();
    const audit = auditSection(section, fsReader);
    expect(() =>
      renderOwnerPack(section, audit, parseAdoptedScope(fsReader), new Map(), {}, "x", "p.md", "h", "T"),
    ).toThrow(AuditFailureError);
  });

  it("a successful section renders and never claims 'key matches' or blanket educational verification", () => {
    const audit = auditSection(nr, fsReader);
    const md = renderOwnerPack(nr, audit, parseAdoptedScope(fsReader), new Map(), {}, "x", "p.md", "h", "NUMERICAL-40-OWNER-REVIEW");
    expect(md).not.toMatch(/key matches/i);
    expect(md).not.toMatch(/unique mathematical solution/i);
    expect(md).not.toMatch(/Distractors are plausible/i);
    expect(md).not.toMatch(/Year 6 Suitability/i);
    expect(md).toMatch(/not_established/);
  });

  it("inventory records a failure and flips auditStatus when a source key is wrong", () => {
    const text = fsReader.readText(`${"content/scholarship-drafts"}/scholarship-y6-numerical-reasoning-draft.json`);
    const data = JSON.parse(text);
    data.questions[0].answerKey.optionId = "a";
    const reader = overlay({ "content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json": JSON.stringify(data) });
    const result = buildInventory({ reader });
    expect(result.failures.map((f) => f.id)).toContain("scholarship-y6-nr-001");
    expect(result.document.auditStatus).toBe("FAILED");
  });
});

describe("evidence fields: a solver match never marks semantic, uniqueness, distractor or age-fit verified", () => {
  it("only the machine field can be verified; the five judgement fields are not_established with a missing source", () => {
    const q = find(nr, "scholarship-y6-nr-022");
    const e = buildQuestionEvidence(q, undefined, fsReader);
    expect(e.machineVerifiedResult.status).toBe("verified");
    for (const f of [e.stemToSolverSemanticVerification, e.independentAnswerUniqueness, e.distractorQuality, e.ageCurriculumAppropriateness, e.qualifiedHumanReview]) {
      expect(f.status).toBe("not_established");
      expect(f.evidenceRef.length).toBeGreaterThan(0);
      expect(f.missingSource).toBeTruthy();
    }
  });

  it("an uninterpretable qualified-review record fails rather than being guessed", () => {
    const reader = overlay({ [SOURCE_PATHS.qualifiedReviewRecords]: "{}" });
    const e = buildQuestionEvidence(find(nr, "scholarship-y6-nr-022"), undefined, reader);
    expect(e.qualifiedHumanReview.status).toBe("failed");
  });
});

describe("inventory reproducibility", () => {
  const base = buildInventory({ reader: fsReader });
  const text = serialiseInventory(base.document);

  it("is byte-identical across runs and carries no wall-clock value", () => {
    expect(serialiseInventory(buildInventory({ reader: fsReader }).document)).toBe(text);
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(text).not.toMatch(/"generatedAt"\s*:/);
    expect((base.document.generation as { clock: string }).clock).toMatch(/^none/);
  });

  it("the committed inventory equals a fresh deterministic regeneration (stale inventory fails)", () => {
    const committed = fsReader.readText(`${REVIEW_DIR}/scholarship-160-inventory.json`).replace(/\r\n/g, "\n");
    expect(committed).toBe(text);
  });

  it("has 160 unique, stably ordered ids in section order", () => {
    const ids = (base.document.items as Array<{ id: string; section: string }>).map((i) => i.id);
    expect(ids).toHaveLength(160);
    expect(new Set(ids).size).toBe(160);
    const order = ["nr", "maths", "vr", "rc"];
    const sectionIdx = (base.document.items as Array<{ section: string }>).map((i) => order.indexOf(i.section));
    expect([...sectionIdx].sort((a, b) => a - b)).toEqual(sectionIdx);
    expect(base.failures).toEqual([]);
    expect(base.contradictions).toEqual([]);
  });

  it("rejects a duplicate id and a section-prefix violation", () => {
    const data = JSON.parse(fsReader.readText("content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json"));
    data.questions[1].id = data.questions[0].id;
    expect(() => buildInventory({ reader: overlay({ "content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json": JSON.stringify(data) }) })).toThrow(/Duplicate question id/);
    const data2 = JSON.parse(fsReader.readText("content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json"));
    data2.questions[0].id = "scholarship-y6-maths-001";
    expect(() => buildInventory({ reader: overlay({ "content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json": JSON.stringify(data2) }) })).toThrow(/does not belong/);
  });

  it("detects a changed source revision: hashes and the file hash move, so --check would fail", () => {
    const file = "content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json";
    const data = JSON.parse(fsReader.readText(file));
    data.questions[0].prompt += " Think carefully.";
    const changed = buildInventory({ reader: overlay({ [file]: JSON.stringify(data) }) });
    expect(serialiseInventory(changed.document)).not.toBe(text);
    const before = (base.document.items as Array<{ id: string; recomputedSourceFacts: { hashes: { d1_rawQuestionHash: string }; sourceFileSha256: string } }>)[0];
    const after = (changed.document.items as typeof before[])[0];
    expect(after.recomputedSourceFacts.hashes.d1_rawQuestionHash).not.toBe(before.recomputedSourceFacts.hashes.d1_rawQuestionHash);
    expect(after.recomputedSourceFacts.sourceFileSha256).not.toBe(before.recomputedSourceFacts.sourceFileSha256);
  });
});

describe("missing evidence is reported as not_established, never silently assigned", () => {
  type Item = {
    id: string;
    provenance: { historicalDeclaredGeneration: { status: string; missingSource?: string }; repositoryRevisionProvenance: { status: string } };
    governanceRecords: { adr017AdmissionScope: { value: string; parsed: boolean } };
    historicalAdvisoryFindings: {
      sixteenOctBlindReview: { status: string; missingSource?: string; bindingNote?: string; bindsCurrentRevision?: string };
      difficultyAdvisory: { status: string; missingSource?: string };
    };
  };
  const items = (r: ReturnType<typeof buildInventory>) => r.document.items as Item[];

  it("verified original generation is never verified for any item", () => {
    const r = buildInventory({ reader: fsReader });
    for (const i of r.document.items as Array<{ provenance: { verifiedOriginalGeneration: { status: string; missingSource?: string } } }>) {
      expect(i.provenance.verifiedOriginalGeneration.status).toBe("not_established");
      expect(i.provenance.verifiedOriginalGeneration.missingSource).toBeTruthy();
    }
  });

  it("a declaration is recorded as declared_unverified, and disappears to not_established if its source sentence is absent", () => {
    const withDecl = buildInventory({ reader: fsReader });
    expect(items(withDecl)[0].provenance.historicalDeclaredGeneration.status).toBe("declared_unverified");
    const doc = fsReader.readText(SOURCE_PATHS.declaredProvenanceDoc).replace(DECLARED_GENERATOR_SENTENCE, "REMOVED");
    const without = buildInventory({ reader: overlay({ [SOURCE_PATHS.declaredProvenanceDoc]: doc }) });
    expect(items(without)[0].provenance.historicalDeclaredGeneration.status).toBe("not_established");
    expect(items(without)[0].provenance.historicalDeclaredGeneration.missingSource).toBeTruthy();
  });

  it("an unreadable adoption record makes ADR-017 scope not_established instead of 'no route'", () => {
    const r = buildInventory({ reader: overlay({ [SOURCE_PATHS.adoptionRecord]: null }) });
    for (const i of items(r)) {
      expect(i.governanceRecords.adr017AdmissionScope.value).toBe("not_established");
      expect(i.governanceRecords.adr017AdmissionScope.parsed).toBe(false);
    }
  });

  it("scope is read from the adoption record: exactly the five adopted candidates, one conditional, six deferred", () => {
    const scope = parseAdoptedScope(fsReader);
    expect(scope.parsed).toBe(true);
    const ids = (v: string) => [...scope.byId].filter(([, s]) => s === v).map(([id]) => id).sort();
    expect(ids("adr017_initial_engineering_scope")).toEqual(
      ["scholarship-y6-maths-004", "scholarship-y6-maths-007", "scholarship-y6-maths-014", "scholarship-y6-nr-022", "scholarship-y6-nr-023"],
    );
    expect(ids("adr017_conditional_policy_eligible")).toEqual(["scholarship-y6-nr-001"]);
    expect(ids("adr017_deferred")).toEqual(
      ["scholarship-y6-rc-001", "scholarship-y6-rc-002", "scholarship-y6-rc-003", "scholarship-y6-vr-001", "scholarship-y6-vr-016", "scholarship-y6-vr-032"],
    );
  });

  it("a missing blind-review record is not_established with the missing source named", () => {
    const r = buildInventory({ reader: overlay({ [SOURCE_PATHS.blindReview("nr")]: null }) });
    const first = items(r)[0].historicalAdvisoryFindings.sixteenOctBlindReview;
    expect(first.status).toBe("not_established");
    expect(first.missingSource).toContain("blind-review-nr.json");
  });

  it("missing difficulty advisory data is not defaulted to 'keep'", () => {
    const r = buildInventory({ reader: overlay({ [SOURCE_PATHS.difficultyRecommendations]: null }) });
    expect(items(r)[0].historicalAdvisoryFindings.difficultyAdvisory.status).toBe("not_established");
  });

  it("an item revised after earlier reviews is flagged stale; an unrevised item cannot be bound either", () => {
    const base = buildInventory({ reader: fsReader });
    const maths012 = items(base).find((i) => i.id === "scholarship-y6-maths-012")!;
    expect(maths012.historicalAdvisoryFindings.sixteenOctBlindReview.bindingNote).toMatch(/stale/);
    const nr001 = items(base).find((i) => i.id === "scholarship-y6-nr-001")!;
    expect(nr001.historicalAdvisoryFindings.sixteenOctBlindReview.bindingNote).not.toMatch(/stale/);
    expect(nr001.historicalAdvisoryFindings.sixteenOctBlindReview.bindsCurrentRevision).toBe("not_established");
    const revised = JSON.parse(fsReader.readText(SOURCE_PATHS.revisedList)) as string[];
    const next = buildInventory({ reader: overlay({ [SOURCE_PATHS.revisedList]: JSON.stringify([...revised, "scholarship-y6-nr-001"]) }) });
    expect(items(next).find((i) => i.id === "scholarship-y6-nr-001")!.historicalAdvisoryFindings.sixteenOctBlindReview.bindingNote).toMatch(/stale/);
  });
});

describe("contradictory claims are detected", () => {
  const sampleItem = () => ({
    id: "x",
    evidence: {
      machineVerifiedResult: { status: "verified", optionsMatchingComputedValue: 1, computedValue: 1 },
      stemToSolverSemanticVerification: { status: "not_established" },
      independentAnswerUniqueness: { status: "not_established" },
      distractorQuality: { status: "not_established" },
      ageCurriculumAppropriateness: { status: "not_established" },
      qualifiedHumanReview: { status: "not_established" },
    },
    provenance: { verifiedOriginalGeneration: { status: "not_established" }, independentReviewerQualification: { status: "not_established" } },
    governanceRecords: { humanApproval: { status: "not_established" } },
    policyDerivedAssessment: { publicationEligibility: "refused_by_phase1_fail_closed_gates" },
  });

  it("a consistent item yields no contradictions", () => {
    expect(checkInventoryConsistency([sampleItem()])).toEqual([]);
  });

  it("flags verified machine result without a unique matching option", () => {
    const i = sampleItem();
    i.evidence.machineVerifiedResult.optionsMatchingComputedValue = 2;
    expect(checkInventoryConsistency([i]).join()).toMatch(/exactly one option/);
  });

  it("flags age-fit verified without a verified qualified human review", () => {
    const i = sampleItem();
    i.evidence.ageCurriculumAppropriateness.status = "verified";
    expect(checkInventoryConsistency([i]).join()).toMatch(/no qualified human review/);
  });

  it("flags an independent reviewer asserted while generation is unverified", () => {
    const i = sampleItem();
    i.provenance.independentReviewerQualification.status = "verified";
    expect(checkInventoryConsistency([i]).join()).toMatch(/independent reviewer 'verified'/);
  });

  it("flags publication eligibility asserted without verified human approval", () => {
    const i = sampleItem();
    i.policyDerivedAssessment.publicationEligibility = "eligible";
    expect(checkInventoryConsistency([i]).join()).toMatch(/without a verified human approval/);
  });

  it("flags a recomputed pipeline bucket that disagrees with the committed status.json", () => {
    const status = JSON.parse(fsReader.readText(SOURCE_PATHS.pipelineStatus)) as { items: Array<{ id: string; bucket: string }> };
    status.items[0].bucket = "ready_for_review_WRONG";
    const r = buildInventory({ reader: overlay({ [SOURCE_PATHS.pipelineStatus]: JSON.stringify(status) }) });
    expect(r.contradictions.join()).toMatch(/differs from committed status.json/);
    expect(r.document.auditStatus).toBe("FAILED");
  });
});

describe("blind packet hash binds the packet text", () => {
  it("changing any character changes the hash; the hash line itself is excluded", () => {
    const p1 = buildBlindPacket(nr, "SCH-Y6-NR-BLIND-V1");
    const p2 = buildBlindPacket(nr, "SCH-Y6-NR-BLIND-V2");
    expect(p1.packetSha256).not.toBe(p2.packetSha256);
    expect(p1.text).toContain(p1.packetSha256);
  });
});
