# Documentation, Claims, Licensing and Governance Audit

## Coverage and method

README, product/architecture/data/security/privacy documents, route maps, exam-pattern/fidelity status, factory governance/review reports, landing/legal copy, package/asset manifests and prior audit claims were cross-checked against imports, build routes, bank counts and commands. Historical documents were treated as claims, not authority.

## Verified strengths

- Terms and assessment disclaimer clearly state independent, original “style” practice and deny official affiliation/endorsement.
- Fidelity docs cite official sources and explicitly document NAPLAN fixed-path and spelling-audio adaptations.
- Catalogue entries generally label unavailable programmes “in development” and avoid startable links.
- Privacy copy describes actual data types and guest/local behaviour rather than a generic template.
- Factory governance documents are unusually candid about deterministic versus judgement review and retrospective independence limits.

## Findings

### P1 High

- `MM-AUD-PROD-001`: landing description/credibility copy presents curriculum learning, primary/secondary coverage and AMC/selective challenges in the primary promise. The more accurate “Years 3 and 5 live today” disclosure appears later. This is a misleading core promise even though individual programme cards say in development.
- `MM-AUD-CONT-001`: documentation describes a governed publication system, but direct hand-authored imports can enter the live bank without factory evidence. Existing originality statements cannot prove external originality.
- `MM-AUD-PRIV-001`: live terms explicitly call themselves draft; privacy says no formal retention/deletion policy exists. These are honest disclosures but incompatible with a production-readiness claim for children's accounts.

### P2 Medium

- `MM-AUD-DOC-001`: README says exactly 100 questions and that autosave, assignments and reporting are future work (`README.md:3,137,141`). Actual `questionBank` is 965 and these route/data paths exist. `QUESTION_BANK_SUMMARY` and several architecture/status sections repeat obsolete totals or phases.
- `MM-AUD-NAV-001`: the supplied governance map (`/login`, `/signup`, `/help`) and implemented later map (`/sign-in`, `/sign-up`, `/resources` plus Learn/Exam Preparation) conflict without a single signed supersession record.
- `MM-AUD-BILL-001`: the landing plans intro says the Family price “is live and is charged,” while `prices.ts` calls it placeholder and sets availability to roadmap; terms/privacy say payments are not processed.
- `MM-AUD-AUTH-001`: deployment guidance records signup/email-delivery limitations that are not surfaced as a release checklist.

### P3 Low

- `MM-AUD-OPS-001`: the admin operations page is explicitly mock, but maintaining it in the product route inventory can confuse scope unless clearly treated as a prototype.

## Licensing and originality

No copied official question was identified, and no protected external question corpus was accessed. Terms prohibit scraping and claim original content. Repository tests can detect internal duplicates/template reuse and some answer leakage, but cannot establish non-paraphrase against commercial banks. No complete asset/dependency licence inventory or automated licence gate was found; this is an uncertainty, not a proven infringement.

## Claims that are currently supportable

Supportable with qualification: original-style Years 3/5 practice; 14 interaction types; 10 structured visual types; fixed-path timed/untimed sessions; deterministic selection; server route scoring; guest use; signed-in persistence; parent aggregates; teacher assignment creation and marking storage.

Not supportable as unqualified current claims: K–12 curriculum platform, adaptive NAPLAN simulation, closed-loop assignment completion, finalised manual marks in results, independent correctness of the whole bank, production privacy/legal readiness, or purchasable Family pricing.

## Gaps and blocked verification

No complete legal opinion, trademark clearance, external originality comparison, asset licence inventory or production setup rehearsal was performed. Those require authorised specialists or protected/external data and remain uncertainties, not inferred violations.

## Priorities

Generate bank/route/status facts from code; move current-live scope into the first hero/metadata message; create one approved navigation decision; align all billing/legal copy; and require provenance/review evidence for every live content import.
