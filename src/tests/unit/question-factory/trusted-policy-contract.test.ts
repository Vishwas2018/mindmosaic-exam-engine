import { describeTrustedPolicyContractAgainstBothShapes } from "./trusted-policy-contract";

/**
 * Mission 3D governed-authority hardening (starting SHA `adce3f7`).
 *
 * Runs the shared trusted-family policy contract (`trusted-policy-contract.ts`)
 * against both a bare `FsFactoryRepository` and a delegating wrapper
 * around one — see that module for what each case proves and why both
 * shapes matter.
 */
describeTrustedPolicyContractAgainstBothShapes();
