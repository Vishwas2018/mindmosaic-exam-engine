/**
 * Mission 3D governed-authority remediation. The two report id families
 * that must never be persisted through generic repository writes —
 * `cva-*` (correctness-pass attestations) and `sr-*` (semantic-completion
 * evidence). `FsFactoryRepository.create()` refuses any write to either
 * family in the `reports` compartment unless presented with a valid
 * `GovernedWriteCapability` for that exact family (see
 * `governed-write-capability.ts`); the only code that ever holds one is
 * the dedicated governed evidence writer constructed inside
 * `correctness/orchestrate-correctness-verification.ts` and
 * `review/orchestrate-semantic-review.ts` themselves.
 */
export const TRUSTED_REPORT_FAMILIES = ["cva-", "sr-"] as const;
export type TrustedReportFamily = (typeof TRUSTED_REPORT_FAMILIES)[number];

export function isTrustedReportId(id: string): boolean {
  return TRUSTED_REPORT_FAMILIES.some((prefix) => id.startsWith(prefix));
}

export function trustedReportFamilyOf(id: string): TrustedReportFamily | undefined {
  return TRUSTED_REPORT_FAMILIES.find((prefix) => id.startsWith(prefix));
}
