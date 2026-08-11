# Architecture, Dependencies and Maintainability Audit

## Coverage and method

App Router/server-client boundaries, Zustand lifecycle, Zod schemas, scoring/selection/timing modules, registries, factory abstractions, dependency manifests/lockfile install scripts, build configuration, repository hygiene and recent branch context were inspected. No dependency install or upgrade was run.

## Verified strengths

- Pure scoring and report construction remain outside React and are highly testable.
- Question and visual registries keep rendering separate from authored data and avoid exam-specific conditionals in general UI.
- Strict TypeScript and boundary parsing are pervasive; typecheck passes.
- Candidate versus authoring question types create a meaningful server/client secrecy boundary.
- Taxonomy/programme/year registries provide a credible route toward broader scope.
- `server-only` guards protect Supabase admin, Stripe and bank modules.
- The factory is decomposed into deterministic planning, validation, correctness, review, revision, staging and publication steps rather than one opaque generator.

## Findings

### P1 High

- `MM-AUD-TIME-001`: the same business fact—session duration—is implemented through two APIs. The architecture comment says create/active/submit share `sessionDurationSeconds`, but submit imports the older count-derived selector.
- `MM-AUD-DEP-001`: Next.js is a reachable production dependency with current high-severity vendor advisories; transitive `postcss` and `sharp` groups also appear in `npm audit`.

### P2 Medium

- `MM-AUD-DATA-003`: trusted domain relationships live in unconstrained JSON/parallel IDs, leaving correctness to route code that direct PostgREST access can bypass.
- `MM-AUD-CI-001`: the repository has high-quality tests but its aggregate runner is not reliably bounded on the audit host, and the build/bundle/checker gates disagree.
- `MM-AUD-DOC-001`: stale architecture/status text increases the chance that maintainers follow obsolete constraints and miss implemented APIs.

### P3 Low

- `MM-AUD-ARCH-001`: persistence allows only Years 3/5 while public taxonomy and TypeScript accept 1–12. This is a deliberate current gate, not a broken live feature, but widening requires coordinated migration/provisioning work.
- `MM-AUD-OPS-001`: mock operations UI remains inside the production route tree behind admin auth. It is labelled clearly but adds maintenance and bundle surface without a real queue.

## Dependency and supply-chain posture

`package-lock.json` is present. Locked install scripts exist for expected native/build packages such as esbuild, sharp and platform helpers; no suspicious repository lifecycle script was found. CI uses `npm ci`, but action references are mutable tags and there is no dependency-review/SBOM/license gate. No license incompatibility was proven; asset and generated-question provenance is documented unevenly, so licensing certainty is incomplete rather than a confirmed violation.

## Repository hygiene

The worktree was already dirty with current content and scratchpad work. Build/test output and env files are ignored. Historical reports are numerous and sometimes treated as current status by comments. The audit did not find client-bundled secrets or bank sentinels. No dead-code deletion recommendation is made without runtime reachability proof; the explicit mock/dev surfaces are recorded separately.

## Gaps and blocked verification

No runtime heap/profile, circular-dependency tool, licence scanner or clean-checkout reproduction was run. Full-suite liveness prevented a complete compatibility signal, and deployment adapter/runtime behaviour outside local Node was not inspected.

## Priorities

Centralise timing authority, narrow persistence mutation APIs, patch dependencies, make one generated current-state document authoritative, and plan the year-level migration only when the roadmap phase is approved.
