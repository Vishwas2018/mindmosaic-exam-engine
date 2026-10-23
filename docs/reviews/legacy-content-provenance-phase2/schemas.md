# Proposed schemas for the deterministic legacy admission route

**Status:** PROPOSED design sketch. Not implemented. No file in `src/` is changed by this PR.

These shapes exist to be reviewed and argued with. Two design rules govern all of them.

**Rule 1 — a record must be able to express failure.** Any schema that can only encode a passing result is not evidence; it is an assertion with a type annotation. Where the withdrawn draft used `z.literal(0)`, `z.literal(true)` and `z.literal("PASS")`, these shapes use discriminated unions and real enums, so that a match, an uncertainty, an outage or a rejection has somewhere to live.

**Rule 2 — a name must not overstate.** Nothing here is called independent, verified, cleared or zero-risk. The route proves recomputed correctness and says so.

---

## 1. Route and classification

```ts
export const legacyGovernanceRouteSchema = z.enum([
  "legacy_intake_pending",            // Phase 1 baseline: imported, blocked everywhere
  "deterministic_legacy_admission",   // proposed Phase 2a route: recomputed correctness only
  "legacy_deferred",                  // Class B / C: held, advisory evidence retained
]);

/** Permanently recorded alongside the route. Never derived from it. */
export const legacyIndependenceStatusSchema = z.literal("not_established_unknown_origin");
```

There is deliberately no `legacy_exception_approved` value. "Exception" names a waiver; this route is not one.

Carrying the `deterministic_legacy_admission` value does not place a candidate in scope. The in-scope candidate set is an explicit, enumerated gate input — currently `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014` — checked before any evidence in sections 2 to 6 is read. `nr-001` and `vr-032` are refused at that check today regardless of what is attached to them.

---

## 2. First-party recompute evidence

Mirrors what `verifyFirstPartyScholarshipAttestation` already produces, so the evidence is a record of a real gate result rather than a parallel claim.

```ts
export const firstPartyRecomputeEvidenceSchema = z.discriminatedUnion("outcome", [
  z.object({
    outcome: z.literal("recomputed_match"),
    registry: z.enum(["scholarship_nr", "scholarship_maths"]),
    /** Registry key actually used, e.g. "scholarship-y6-nr-022". The editorial
     *  record in section 4a is bound to this value, not to a restated string. */
    solverIdentifier: z.string().min(1),
    solverRevision: z.string().min(1),
    executedAt: z.string().datetime(),
    boundContentHash: z.string().regex(/^[0-9a-f]{64}$/),
    givensReadFromPrompt: z.array(z.number()).min(1),
    computedValue: z.union([z.string(), z.number()]),
    derivedOptionId: z.string().min(1),
    declaredOptionId: z.string().min(1),
    candidateLogicExecuted: z.literal(false),  // solverParams and sidecars ignored
  }),
  z.object({
    outcome: z.enum([
      "not_in_scope",          // isScholarshipAttestedItem returned false
      "missing_first_party_solver",
      "solver_execution_failed",
      "prompt_givens_mismatch",
      "option_match_ambiguous",
      "key_mismatch",
      "content_hash_mismatch",
    ]),
    registry: z.enum(["scholarship_nr", "scholarship_maths"]).nullable(),
    executedAt: z.string().datetime(),
    boundContentHash: z.string().regex(/^[0-9a-f]{64}$/).nullable(),
    detail: z.string().min(1),
  }),
]);
```

Only `recomputed_match` can contribute to admission. Every other outcome is recorded and rejects.

---

## 3. Revision binding

```ts
export const candidateRevisionBindingSchema = z.object({
  candidateId: z.string().min(1),
  factoryRevision: z.number().int().min(0),
  rawQuestionHash: z.string().regex(/^[0-9a-f]{64}$/),
  factoryCandidateHash: z.string().regex(/^[0-9a-f]{64}$/),
  publicationContentHash: z.string().regex(/^[0-9a-f]{64}$/),
  transformation: z.enum(["none", "solver_sidecar"]),
  sidecarHash: z.string().regex(/^[0-9a-f]{64}$/).nullable(),
});
```

Every other evidence component names the binding it was computed against. A component whose `boundContentHash` does not match the candidate's current hash is stale and is discarded, never reused.

---

## 4. Originality assessment

The shape the withdrawn draft got wrong. This one can fail, and makes a bounded claim.

```ts
export const originalitySearchSchema = z.object({
  searchId: z.string().min(1),
  engine: z.string().min(1),                 // the actual tool, named
  corporaSearched: z.array(z.string()).min(1),
  corporaKnownNotCovered: z.array(z.string()),   // paywalled papers, print textbooks, ...
  searchedAt: z.string().datetime(),
  boundContentHash: z.string().regex(/^[0-9a-f]{64}$/),
  queries: z.array(z.string()).min(1),
  auditorIdentity: z.string().min(1),

  result: z.discriminatedUnion("status", [
    z.object({
      status: z.literal("no_match_found"),
      highestSimilarity: z.number().min(0).max(1).nullable(),
      threshold: z.number().min(0).max(1),
    }),
    z.object({
      status: z.literal("matches_found"),
      matches: z.array(z.object({
        source: z.string().min(1),
        matchedSpan: z.string().min(1),
        similarity: z.number().min(0).max(1),
      })).min(1),
    }),
    z.object({ status: z.literal("uncertain"), detail: z.string().min(1) }),
    z.object({ status: z.literal("inconclusive"), reason: z.string().min(1) }),
    z.object({
      status: z.literal("rejected"),
      adjudicatedBy: z.string().min(1),
      rationale: z.string().min(1),
    }),
  ]),

  /** The only claim this record makes. Deliberately not a risk verdict. */
  claim: z.literal("search_result_only_no_originality_or_copyright_determination"),
});
```

Notes for reviewers:

- There is no `plagiarismRiskAssessment` field and no "zero risk" value anywhere. Copyright position is a legal determination and no tool in this repository produces one.
- `corporaKnownNotCovered` is required, so coverage gaps are part of the record rather than an unstated assumption.
- Superseded searches are retained. Repeated runs until a pass must be visible.
- Only `no_match_found` can contribute to admission. `uncertain` and `inconclusive` reject and require human adjudication; `matches_found` and `rejected` reject outright.

---

## 4a. Editorial interpretation check

Added on independent review finding P1-2. This is the component that carries what the numeric recompute cannot reach, so each of its four judgements is recorded separately and each can fail on its own. A single overall "looks fine" boolean would reproduce the defect this record exists to catch.

```ts
const interpretationVerdictSchema = z.discriminatedUnion("verdict", [
  z.object({ verdict: z.literal("affirmed"), notes: z.string().min(10) }),
  z.object({ verdict: z.enum(["rejected", "uncertain"]), detail: z.string().min(10) }),
]);

export const editorialInterpretationCheckSchema = z.object({
  /** Bound to the exact candidate and revision, not just to a hash, so that a
   *  record cannot be lifted from one candidate onto another. */
  candidateId: z.string().min(1),
  factoryRevision: z.number().int().min(0),
  boundContentHash: z.string().regex(/^[0-9a-f]{64}$/),

  /** A named, qualified human. An anonymous or unqualified reviewer is a reject,
   *  not a weaker pass: this is the only component that reads the prose. */
  reviewerIdentity: z.string().min(1),
  reviewerRole: z.enum(["curriculum_specialist", "senior_examiner", "lead_editor"]),
  reviewerQualification: z.string().min(10),
  reviewedAt: z.string().datetime(),

  /** The solver's reading, shown to the reviewer verbatim. A reviewer who was never
   *  shown the interpretation cannot have affirmed it. */
  solverInterpretationPresented: z.object({
    solverIdentifier: z.string().min(1),
    declaredGivens: z.array(z.number()),
    statedModel: z.string().min(10),
  }),

  promptToSolverAssumptions: interpretationVerdictSchema,
  exhaustiveness: interpretationVerdictSchema,
  ambiguity: interpretationVerdictSchema,
  alternativeDefensibleAnswers: z.object({
    verdict: z.enum(["none_defensible", "alternatives_defensible", "uncertain"]),
    optionIds: z.array(z.string().min(1)),   // non-empty whenever alternatives are defensible
    detail: z.string().min(10),
  }),
});
```

Only `affirmed` on the first three, together with `none_defensible` on the fourth, can contribute to admission. `uncertain` rejects and requires adjudication; it is not a soft pass.

`maths-014` is the worked example. Before `45b6cdab`, a conforming record would have had to report `exhaustiveness: rejected` and `alternativeDefensibleAnswers: { verdict: "alternatives_defensible", optionIds: ["c", "d", "e"] }` — while the recompute for the same revision returned a clean match. The schema must be able to hold that pair of facts simultaneously, because that pair is what actually happened.

## 5. Age-suitability and curriculum record

```ts
export const ageSuitabilityRecordSchema = z.object({
  reviewerIdentity: z.string().min(1),
  reviewerRole: z.enum(["curriculum_specialist", "senior_examiner", "lead_editor"]),
  reviewedAt: z.string().datetime(),
  boundContentHash: z.string().regex(/^[0-9a-f]{64}$/),
  targetYearLevel: z.number().int().min(3).max(6),
  judgement: z.discriminatedUnion("verdict", [
    z.object({
      verdict: z.literal("suitable"),
      syllabusReference: z.string().min(1),
      distractorQuality: z.enum(["high", "acceptable"]),
      notes: z.string().min(10),
    }),
    z.object({
      verdict: z.enum(["not_suitable", "needs_revision"]),
      reasons: z.array(z.string().min(1)).min(1),
    }),
  ]),
});
```

---

## 6. Advisory evidence

Attached, labelled, and carrying no weight in any gate.

```ts
export const advisoryReviewSchema = z.object({
  evidenceType: z.literal("manual_user_attested"),
  provider: z.string().min(1),
  model: z.string().min(1),
  apiEnvelope: z.literal(false),
  transportLimitations: z.string().min(1),
  rawEvidenceSha256: z.string().regex(/^[0-9a-f]{64}$/),
  targetPacketSha256: z.string().regex(/^[0-9a-f]{64}$/),
  derivedOptionId: z.string().min(1),
  agreesWithDeclaredKey: z.boolean(),
  supersededBy: z.string().nullable(),
  /** Enforced by the gate, not by convention. */
  contributesToAdmission: z.literal(false),
});
```

---

## 7. Human approval — deliberately not specified here

**This section is intentionally incomplete.** Approval authentication is a separate security design requirement (ADR-017 section 6), and publishing a schema now would imply a design decision that has not been reviewed.

What a future design must settle before any schema is written:

1. **Signer trust** — which keys are authorised, where the registry lives, and how it is protected from the writer who uses it. `.github/allowed_signers` does not currently exist; `dev` has no rulesets, requires zero approving reviews and does not enforce protections for admins, so a writer could today add their own key in the commit that uses it.
2. **Canonical signed payload** — the exact serialisation covered by the signature, including candidate id, publication content hash and decision. A free-form `signaturePayload: z.string()` is satisfied by a signature over anything and must not be used.
3. **Artefact-to-commit binding** — the approval record must name the signing commit, and the verifier must fetch deeply enough to see it.
4. **Key lifecycle** — rotation, revocation, and the status of approvals signed by a key later revoked.

Symmetric HMAC is excluded: any party able to verify is able to forge.

Until this is designed and reviewed, the existing `content/publication-approvals/*.json` format (`questionId`, `contentHash`, `sourceManifestHash`, `approvedBy`) remains in force and remains unauthenticated. Any future work should extend that format rather than fork a parallel one.

---

## 8. Legacy-origin ledger — deliberately not specified here

Also a separate security design requirement (ADR-017 section 7). A ledger is only tamper-evident if the thing it binds is tracked state, and Phase 1 recorded that the importer's journal lives in the untracked factory workspace while the candidate record is consumed at publication. Specifying a file format before resolving that would describe a control that cannot be enforced.

---

## 9. Assembled bundle

```ts
const sameNumbers = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export const deterministicLegacyAdmissionBundleSchema = z.object({
  schemaVersion: z.literal(1),
  route: z.literal("deterministic_legacy_admission"),
  independenceStatus: legacyIndependenceStatusSchema,
  originalGenerationStatus: z.literal("unverified"),

  binding: candidateRevisionBindingSchema,
  recompute: firstPartyRecomputeEvidenceSchema,
  editorialInterpretation: editorialInterpretationCheckSchema,   // mandatory; section 4a
  originality: originalitySearchSchema,
  ageSuitability: ageSuitabilityRecordSchema,                    // separate, still required
  advisory: z.array(advisoryReviewSchema).default([]),

  // Populated only once sections 7 and 8 are designed, reviewed and implemented.
  approval: z.never().optional(),
  ledgerEntryRef: z.never().optional(),
}).superRefine((b, ctx) => {
  const reject = (path: string[], message: string) =>
    ctx.addIssue({ code: "custom", path, message });

  const ed = b.editorialInterpretation;

  // (a) Editorial evidence is bound to THIS candidate and THIS revision.
  if (ed.candidateId !== b.binding.candidateId)
    reject(["editorialInterpretation", "candidateId"], "Editorial evidence names a different candidate");
  if (ed.factoryRevision !== b.binding.factoryRevision)
    reject(["editorialInterpretation", "factoryRevision"], "Editorial evidence names a different revision");

  // (b) Editorial evidence is bound to THIS content, and to the same content the
  //     recompute ran against. Either mismatch is stale evidence, never reused.
  if (ed.boundContentHash !== b.binding.publicationContentHash)
    reject(["editorialInterpretation", "boundContentHash"], "Editorial evidence is stale for this content");

  // (c) The recompute must itself be a match before anything else is considered.
  if (b.recompute.outcome !== "recomputed_match") {
    reject(["recompute"], "Only recomputed_match can contribute to admission");
  } else {
    if (ed.boundContentHash !== b.recompute.boundContentHash)
      reject(["editorialInterpretation", "boundContentHash"],
             "Editorial evidence and recompute evidence are bound to different content");

    // (d) The interpretation the reviewer was shown must be the one that was
    //     actually executed - same solver, same givens. Not a restated string.
    if (ed.solverInterpretationPresented.solverIdentifier !== b.recompute.solverIdentifier)
      reject(["editorialInterpretation", "solverInterpretationPresented", "solverIdentifier"],
             "Reviewer was shown a different solver than the one that produced the recompute");
    if (!sameNumbers(ed.solverInterpretationPresented.declaredGivens, b.recompute.givensReadFromPrompt))
      reject(["editorialInterpretation", "solverInterpretationPresented", "declaredGivens"],
             "Reviewer was shown different givens than the recompute used");
  }

  // (e) Every judgement must be affirmative. uncertain and rejected both reject.
  for (const field of ["promptToSolverAssumptions", "exhaustiveness", "ambiguity"] as const)
    if (ed[field].verdict !== "affirmed")
      reject(["editorialInterpretation", field], `${field} is '${ed[field].verdict}', which is not an affirmation`);

  if (ed.alternativeDefensibleAnswers.verdict !== "none_defensible")
    reject(["editorialInterpretation", "alternativeDefensibleAnswers"],
           "Alternative defensible answers were found or could not be ruled out");
});
```

**The cross-binding is the point, not the field.** Adding an `editorialInterpretation` member alone would be satisfied by a reviewer restating whatever strings the bundle author supplied. Refinements (a) to (d) make the record answerable to evidence that exists elsewhere in the bundle: the candidate and revision come from the binding, the content hash must agree with both the binding and the recompute, and the solver identity and givens must be the ones the recompute actually executed.

**One check the schema cannot perform, and the gate must.** A bundle is self-consistent data; `superRefine` can only compare its fields to each other, so a bundle author who fabricates *both* the recompute record and the editorial record consistently would pass. The admission gate must therefore re-derive the authoritative values rather than trust the bundle:

- Re-run `verifyFirstPartyScholarshipAttestation` against the candidate at validation time and compare its result to `recompute`, rather than accepting the stored record.
- Read `solverIdentifier` and `declaredGivens` from the live registry entry, not from the bundle, and require the editorial record to match *those*.
- Recompute the content hash from the candidate and require it to equal `boundContentHash` on every component.

Stated as a rule: **nothing in the bundle may be the sole authority for a fact the gate can independently derive.**

`approval` and `ledgerEntryRef` are typed `z.never()` on purpose: the bundle cannot currently validate into an admissible state, which is the correct behaviour while two required controls do not exist. They become real types in the PR that builds them.

### 9.1 The six mandatory components

The bundle carries exactly the six requirements of ADR-017 section 3, in the same order:

| ADR requirement | Bundle member | Schema |
|---|---|---|
| 1. First-party recomputed correctness | `recompute` | section 2 |
| 2. Editorial interpretation check | `editorialInterpretation` | section 4a |
| 3. Exact candidate and revision binding | `binding` | section 3 |
| 4. Originality assessment | `originality` | section 4 |
| 5. Age-suitability and curriculum check | `ageSuitability` | section 5 |
| 6. Authorised human approval | `approval` | section 7, deliberately unspecified |

`advisory` is not a requirement and carries no weight; it is attached and labelled. Requirements 2 and 5 are **separate** components with separate verdicts, and neither substitutes for the other: an age-suitability `suitable` verdict says nothing about whether the stem admits a second reading.
