import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { FactoryCompartment, FactoryRepository, TrustedReportFamily } from "@/features/question-factory/storage";
import { FsFactoryRepository, TrustedFamilyReservedError } from "@/features/question-factory/storage";
import { GovernedWriteCapability } from "@/features/question-factory/storage/governed-write-capability";

/**
 * Mission 3D governed-authority hardening (starting SHA `adce3f7`).
 *
 * Wraps a real `FactoryRepository`, delegating every call unchanged.
 * `describeTrustedPolicyContract` below runs against both a bare
 * `FsFactoryRepository` and this wrapper, proving the trusted-family
 * policy lives in the concrete implementation itself — not merely an
 * artefact of tests calling `FsFactoryRepository`'s own methods directly
 * — since every production caller reaches it only through the
 * `FactoryRepository` interface, frequently via a thin wrapper exactly
 * like this one (see the crash-simulation wrappers used throughout the
 * other Mission 3D test files).
 */
export function delegatingRepository(real: FactoryRepository): FactoryRepository {
  return {
    create: (compartment, candidateId, data, capability) => real.create(compartment, candidateId, data, capability),
    read: (compartment, candidateId) => real.read(compartment, candidateId),
    exists: (compartment, candidateId) => real.exists(compartment, candidateId),
    remove: (compartment, candidateId) => real.remove(compartment, candidateId),
    list: (compartment) => real.list(compartment),
    move: (candidateId, from, to) => real.move(candidateId, from, to),
    update: (compartment, candidateId, data, options) => real.update(compartment, candidateId, data, options),
    reconcile: () => real.reconcile(),
  };
}

/**
 * Plants a candidate record directly on disk, bypassing `create()`
 * entirely — used only to stage a precondition (“this id already lives
 * somewhere”) for exercising `move()`/`update()`/`remove()`'s own
 * independent trusted-family guards, which must refuse a trusted id
 * regardless of how it got onto disk, not only when it arrived there via
 * `create()`.
 */
async function plantRawRecord(
  rootDir: string,
  compartment: FactoryCompartment,
  candidateId: string,
  data: unknown,
): Promise<void> {
  const dir = path.join(rootDir, ...compartment.split("/"));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${candidateId}.json`), JSON.stringify(data, null, 2), "utf8");

  const metadataDir = path.join(rootDir, ".metadata");
  await mkdir(metadataDir, { recursive: true });
  await writeFile(
    path.join(metadataDir, `${candidateId}.json`),
    JSON.stringify({ candidateId, compartment, updatedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
}

const TRUSTED_FAMILIES: readonly TrustedReportFamily[] = ["cva-", "sr-"];

function trustedId(family: TrustedReportFamily, suffix: string): string {
  return `${family}${suffix}`;
}

function otherFamily(family: TrustedReportFamily): TrustedReportFamily {
  return family === "cva-" ? "sr-" : "cva-";
}

/**
 * Reusable adversarial/regression suite for the trusted-family write
 * policy. Call it once per `FactoryRepository` shape under test — a bare
 * `FsFactoryRepository`, and a thin delegating wrapper around one (see
 * `delegatingRepository` above) — so every case below is proven twice,
 * confirming the policy is enforced by the repository implementation
 * itself rather than by some incidental property of how a caller happens
 * to invoke it.
 */
export function describeTrustedPolicyContract(
  label: string,
  buildRepository: (rootDir: string) => FactoryRepository,
): void {
  describe(`trusted-family policy contract — ${label}`, () => {
    let rootDir: string;
    let repo: FactoryRepository;

    beforeEach(async () => {
      rootDir = await mkdtemp(path.join(tmpdir(), "trusted-policy-contract-"));
      repo = buildRepository(rootDir);
    });

    afterEach(async () => {
      await rm(rootDir, { recursive: true, force: true });
    });

    for (const family of TRUSTED_FAMILIES) {
      describe(`family '${family}'`, () => {
        it("create() refuses with no capability, in every compartment (not only 'reports')", async () => {
          const id = trustedId(family, "no-cap-every-compartment-001");
          for (const compartment of ["reports", "generated", "review-queue", "inbox", "quarantined"] as const) {
            const result = await repo.create(compartment, id, { fake: true });
            expect(result.ok).toBe(false);
            if (!result.ok) expect(result.reason).toBe("trusted_family_reserved");
          }
        });

        it("create() refuses a forged, never-issued capability-shaped object", async () => {
          const id = trustedId(family, "forged-capability-001");
          const forged = { reportFamily: family } as unknown as Parameters<FactoryRepository["create"]>[3];
          const result = await repo.create("reports", id, { fake: true }, forged);
          expect(result.ok).toBe(false);
          if (!result.ok) expect(result.reason).toBe("trusted_family_reserved");
        });

        it("create() refuses a validly issued capability for the wrong family", async () => {
          const id = trustedId(family, "wrong-family-capability-001");
          const capability = GovernedWriteCapability.issue(otherFamily(family));
          const result = await repo.create("reports", id, { fake: true }, capability);
          expect(result.ok).toBe(false);
          if (!result.ok) expect(result.reason).toBe("trusted_family_reserved");
        });

        it("create() succeeds only with a validly issued, matching capability", async () => {
          const id = trustedId(family, "valid-capability-001");
          const capability = GovernedWriteCapability.issue(family);
          const result = await repo.create("reports", id, { fake: true }, capability);
          expect(result.ok).toBe(true);
          expect(await repo.exists("reports", id)).toBe(true);
        });

        it("D1 regression: create() in a non-'reports' compartment cannot stage the id for a later move() into 'reports'", async () => {
          const id = trustedId(family, "d1-create-generated-001");
          const createResult = await repo.create("generated", id, { fake: true });
          expect(createResult.ok).toBe(false);
          if (!createResult.ok) expect(createResult.reason).toBe("trusted_family_reserved");
          expect(await repo.exists("generated", id)).toBe(false);
        });

        it("D1 regression: move() refuses a trusted id regardless of direction (immovable), even for a record already on disk", async () => {
          const id = trustedId(family, "d1-move-immovable-001");
          await plantRawRecord(rootDir, "generated", id, { fake: true });

          const forwardMove = await repo.move(id, "generated", "reports");
          expect(forwardMove.ok).toBe(false);
          if (!forwardMove.ok) expect(forwardMove.reason).toBe("trusted_family_reserved");
          expect(await repo.exists("reports", id)).toBe(false);
          expect(await repo.exists("generated", id)).toBe(true);

          await plantRawRecord(rootDir, "reports", id, { fake: true });
          const backwardMove = await repo.move(id, "reports", "generated");
          expect(backwardMove.ok).toBe(false);
          if (!backwardMove.ok) expect(backwardMove.reason).toBe("trusted_family_reserved");
        });

        it("D2 regression: update() unconditionally refuses to rewrite an existing trusted record, even with a self-consistent recomputed value", async () => {
          const id = trustedId(family, "d2-update-tamper-001");
          const capability = GovernedWriteCapability.issue(family);
          const original = { fake: true, version: 1 };
          const createResult = await repo.create("reports", id, original, capability);
          expect(createResult.ok).toBe(true);

          const tampered = { fake: true, version: 2 };
          const updateResult = await repo.update("reports", id, tampered);
          expect(updateResult.ok).toBe(false);
          if (!updateResult.ok) expect(updateResult.reason).toBe("trusted_family_reserved");
          expect(await repo.read("reports", id)).toEqual(original);
        });

        it("D3 regression: remove() throws TrustedFamilyReservedError for an existing trusted record rather than deleting it", async () => {
          const id = trustedId(family, "d3-remove-001");
          const capability = GovernedWriteCapability.issue(family);
          const createResult = await repo.create("reports", id, { fake: true }, capability);
          expect(createResult.ok).toBe(true);

          await expect(repo.remove("reports", id)).rejects.toThrow(TrustedFamilyReservedError);
          expect(await repo.exists("reports", id)).toBe(true);
        });
      });
    }

    it("non-trusted ids are completely unaffected: create/move/update/remove all still work normally", async () => {
      const id = "ordinary-candidate-001";
      const createResult = await repo.create("generated", id, { fake: true });
      expect(createResult.ok).toBe(true);

      const moveResult = await repo.move(id, "generated", "review-queue");
      expect(moveResult.ok).toBe(true);

      const updateResult = await repo.update("review-queue", id, { fake: true, updated: true });
      expect(updateResult.ok).toBe(true);

      await repo.remove("review-queue", id);
      expect(await repo.exists("review-queue", id)).toBe(false);
    });
  });
}

export function describeTrustedPolicyContractAgainstBothShapes(): void {
  describeTrustedPolicyContract("real FsFactoryRepository", (rootDir) => new FsFactoryRepository(rootDir));
  describeTrustedPolicyContract("delegating wrapper around FsFactoryRepository", (rootDir) =>
    delegatingRepository(new FsFactoryRepository(rootDir)),
  );
}
