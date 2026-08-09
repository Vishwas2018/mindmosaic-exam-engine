import type { TrustedReportFamily } from "./trusted-reports";

/**
 * Mission 3D governed-authority remediation.
 *
 * An in-process proof that the caller is entitled to persist one specific
 * reserved report family (`cva-*` or `sr-*`). `FsFactoryRepository.create()`
 * refuses to write either family unless presented with a valid capability
 * for that exact family — see `trusted-reports.ts` and `fs-factory-repository.ts`.
 *
 * **What this is.** An application-level access-control primitive, not a
 * cryptographic one. Two independent checks compose to make it
 * meaningfully unforgeable *within this application's supported API
 * surface*:
 *
 * 1. `GovernedWriteCapability`'s constructor is `private` — TypeScript
 *    restricts a `private` member to the declaring class's own body, so
 *    only `GovernedWriteCapability.issue` (a static method, part of that
 *    body) can construct one; no other function, in this file or any
 *    other, can call `new GovernedWriteCapability(...)` through ordinary,
 *    type-checked TypeScript. This alone is only a compile-time boundary
 *    — a caller willing to bypass the type system with `as unknown as
 *    GovernedWriteCapability` can still produce a same-shaped object.
 * 2. `issuedCapabilities`, a module-private `WeakSet`, is populated only
 *    inside `issue` and checked by `isValidGovernedWriteCapability`. A
 *    type-asserted fake object was never added to this set, so it fails
 *    validation even though it satisfies the TypeScript shape.
 *
 * **What this is not.** This module is never re-exported through
 * `storage/index.ts` (or any other public feature barrel) — `GovernedWriteCapability.issue`
 * is only ever called from `correctness/orchestrate-correctness-verification.ts`
 * and `review/orchestrate-semantic-review.ts`, the two governed
 * orchestration composition roots. A caller who deep-imports this file's
 * path directly (bypassing every public barrel) can still reach `issue` —
 * TypeScript/ES modules have no caller-identity mechanism to prevent
 * that, and this codebase already treats "not barrel-exported" as its
 * established definition of "internal" throughout (`correctness/index.ts`,
 * `validation/index.ts`, `originality/index.ts` all document the same
 * convention: individual modules remain reachable by file path for tests,
 * only the public surface is narrowed). Direct filesystem tampering, a
 * compromised runtime, or edited source code are explicitly outside this
 * boundary — see the governed-authority remediation report's threat-model
 * section. This module never claims cryptographic authenticity.
 */
const issuedCapabilities = new WeakSet<GovernedWriteCapability>();

export class GovernedWriteCapability {
  private constructor(readonly reportFamily: TrustedReportFamily) {}

  /** The sole issuing function — see this module's class doc comment for what "sole" does and does not guarantee. */
  static issue(reportFamily: TrustedReportFamily): GovernedWriteCapability {
    const capability = new GovernedWriteCapability(reportFamily);
    issuedCapabilities.add(capability);
    return capability;
  }
}

export function isValidGovernedWriteCapability(
  capability: GovernedWriteCapability | undefined,
  requiredFamily: TrustedReportFamily,
): boolean {
  return capability !== undefined && issuedCapabilities.has(capability) && capability.reportFamily === requiredFamily;
}
