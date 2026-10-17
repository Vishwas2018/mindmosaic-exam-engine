# AMC first-party attestation recovery ? 17 October 2026

Branch: `fix/amc-publication-clean`. No artifact from the abandoned worktree was recovered.

The committed `content/amc-publication-pipeline` branch points to `3b85a102`. Its generic `attestation.ts`, `governed-attestation-writer.ts` and `validate-correctness-attestation-binding.ts` are already present byte-for-byte on the clean branch. They remain unchanged. There is no committed AMC solver module on that legacy branch to restore.

The 60 first-party recomputations were rebuilt from the legitimate, committed `scripts/verify-roadmap-amc-answers.mts`. Literal time/ordering/assignment results were replaced by computations. The registry never reads a supplied answer or evaluates supplied code. Separate static content hashes pin each implementation to the exact candidate snapshot; merely changing candidate provenance to its new hash cannot authorize a changed question.

`verifyFirstPartyAmcAttestation` is now called by correctness derivation and `checkPublicationEligibility`. It refuses candidate solver parameters/code, mismatched snapshots/provenance, missing/throwing/non-finite solvers, ambiguous answer options, unsupported shapes and mismatched keys. Existing governed attestation writers and upstream structural/originality/difficulty requirements remain in force.

Guardrails plus existing approval and solver regression suites: 134 tests pass. No test assertion was weakened. Draft-source filesystem access was moved under `scripts/lib` so unsigned drafts remain outside runtime source; the authoring CLI supplies its exact source resolver explicitly.

This correctness work does not claim that structural taxonomy, originality, difficulty, staging or publication have passed. A real first-party correctness result cannot replace any missing upstream gate.
