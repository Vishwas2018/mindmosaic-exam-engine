import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DRILL_LAUNCH_MAX_AGE_MS,
  DRILL_LAUNCH_MAX_FUTURE_DRIFT_MS,
  DRILL_STORAGE_PREFIX,
  buildDrillSeed,
  clearDrillLaunchRequest,
  getDrillLaunchRequest,
  saveDrillLaunchRequest,
} from "@/features/exam-engine/recommendation/drill-handoff";

describe("drill-handoff sessionStorage manager & deterministic seed", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe("buildDrillSeed", () => {
    it("produces a compact, deterministic, fixed-length seed", () => {
      const seed1 = buildDrillSeed({
        subject: "numeracy",
        skillOrTopic: "Fractions",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: ["q1", "q2", "q3"],
      });

      const seed2 = buildDrillSeed({
        subject: "numeracy",
        skillOrTopic: "Fractions",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: ["q1", "q2", "q3"],
      });

      expect(seed1).toBe(seed2);
      expect(seed1).toMatch(/^drill-numeracy-[0-9a-f]{8}$/);
      expect(seed1.length).toBeLessThan(35);
    });

    it("changes when prior question IDs differ", () => {
      const seedA = buildDrillSeed({
        subject: "numeracy",
        skillOrTopic: "Fractions",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: ["q1", "q2"],
      });

      const seedB = buildDrillSeed({
        subject: "numeracy",
        skillOrTopic: "Fractions",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: ["q1", "q3"],
      });

      expect(seedA).not.toBe(seedB);
    });

    it("handles large prior question collections (250+ UUIDs) without growing seed length", () => {
      const largePriorIds = Array.from(
        { length: 250 },
        (_, i) => `550e8400-e29b-41d4-a716-${i.toString().padStart(12, "0")}`,
      );

      const seed = buildDrillSeed({
        subject: "numeracy",
        skillOrTopic: "Fractions",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: largePriorIds,
      });

      expect(seed).toMatch(/^drill-numeracy-[0-9a-f]{8}$/);
      expect(seed.length).toBeLessThan(35);
    });
  });

  describe("boundary & storage limit tests", () => {
    it("successfully saves and retrieves a full-sized assessment with >200 UUID-style IDs without exceeding storage limits", () => {
      const largePriorIds = Array.from(
        { length: 250 },
        (_, i) => `550e8400-e29b-41d4-a716-${i.toString().padStart(12, "0")}`,
      );

      const seed = buildDrillSeed({
        subject: "numeracy",
        skillOrTopic: "Fractions",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: largePriorIds,
      });

      const saveResult = saveDrillLaunchRequest({
        launchId: "large-assessment-launch",
        subject: "numeracy",
        skillOrTopic: "Fractions",
        source: "skill",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: largePriorIds,
        seed,
      });

      expect(saveResult.ok).toBe(true);
      if (!saveResult.ok) return;

      const retrieved = getDrillLaunchRequest("large-assessment-launch");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.previousQuestionIds.length).toBe(250);
      expect(retrieved?.previousQuestionIds[0]).toBe(
        "550e8400-e29b-41d4-a716-000000000000",
      );
      expect(retrieved?.previousQuestionIds[249]).toBe(
        "550e8400-e29b-41d4-a716-000000000249",
      );
      expect(retrieved?.seed).toBe(seed);
    });
  });

  describe("exception safety & validation", () => {
    it("saves and retrieves a valid drill launch request with discriminated ok: true", () => {
      const saveResult = saveDrillLaunchRequest({
        launchId: "",
        subject: "numeracy",
        skillOrTopic: "Fractions",
        source: "skill",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: ["q1", "q2"],
        seed: "drill-seed-1",
      });

      expect(saveResult.ok).toBe(true);
      if (!saveResult.ok) return;

      const launchId = saveResult.launchId;
      expect(launchId).toBeTruthy();

      const retrieved = getDrillLaunchRequest(launchId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.version).toBe(1);
      expect(retrieved?.launchId).toBe(launchId);
      expect(retrieved?.subject).toBe("numeracy");
      expect(retrieved?.skillOrTopic).toBe("Fractions");
      expect(retrieved?.source).toBe("skill");
      expect(retrieved?.yearLevel).toBe(3);
      expect(retrieved?.examStyle).toBe("naplan_style");
      expect(retrieved?.previousQuestionIds).toEqual(["q1", "q2"]);
      expect(retrieved?.seed).toBe("drill-seed-1");
      expect(retrieved?.createdAt).toBeTypeOf("number");
    });

    it("handles window.sessionStorage property getter throwing SecurityError safely", () => {
      vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      });

      const saveResult = saveDrillLaunchRequest({
        launchId: "security-test",
        subject: "numeracy",
        skillOrTopic: "Fractions",
        source: "skill",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: [],
        seed: "seed",
      });

      expect(saveResult.ok).toBe(false);
      if (!saveResult.ok) {
        expect(saveResult.reason).toContain("Browser storage is unavailable");
      }

      expect(getDrillLaunchRequest("security-test")).toBeNull();
      expect(() => clearDrillLaunchRequest("security-test")).not.toThrow();
    });

    it("handles length / enumeration throwing during cleanup without crashing save", () => {
      vi.spyOn(Storage.prototype, "length", "get").mockImplementation(() => {
        throw new Error("Storage enumeration failed");
      });

      const result = saveDrillLaunchRequest({
        launchId: "cleanup-throw-test",
        subject: "numeracy",
        skillOrTopic: "Fractions",
        source: "skill",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: [],
        seed: "seed",
      });

      expect(result.ok).toBe(true);
    });

    it("handles getItem throwing safely and returns null without unhandled exceptions", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Corrupted storage sector");
      });

      expect(getDrillLaunchRequest("corrupt-id")).toBeNull();
    });

    it("cleans up partial record on a best-effort basis when write verification fails", () => {
      let stored = "";
      vi.spyOn(Storage.prototype, "setItem").mockImplementation((_k, v) => {
        stored = v.slice(0, 10);
      });
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => stored);
      const removeSpy = vi.spyOn(Storage.prototype, "removeItem");

      const result = saveDrillLaunchRequest({
        launchId: "verify-fail-id",
        subject: "numeracy",
        skillOrTopic: "Fractions",
        source: "skill",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: [],
        seed: "seed",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("Failed to persist drill launch session");
      }

      expect(removeSpy).toHaveBeenCalledWith(
        `${DRILL_STORAGE_PREFIX}verify-fail-id`,
      );
    });

    it("returns ok: false when sessionStorage is blocked or throws QuotaExceededError", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError: DOM Exception 22");
      });

      const result = saveDrillLaunchRequest({
        launchId: "test-id",
        subject: "numeracy",
        skillOrTopic: "Fractions",
        source: "skill",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: [],
        seed: "seed",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("QuotaExceededError");
      }
    });

    it("rejects non-canonical bank subject during save", () => {
      const result = saveDrillLaunchRequest({
        launchId: "test-id",
        // @ts-expect-error testing runtime invalid subject
        subject: "astrology",
        skillOrTopic: "Horoscopes",
        source: "skill",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: [],
        seed: "seed",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("Subject must be a canonical bank subject");
      }
    });

    it("returns null for non-existent launch ID", () => {
      expect(getDrillLaunchRequest("non-existent-id")).toBeNull();
    });

    it("returns null and cleans up malformed JSON in sessionStorage", () => {
      const key = `${DRILL_STORAGE_PREFIX}bad-id`;
      window.sessionStorage.setItem(key, "invalid-json{");

      expect(getDrillLaunchRequest("bad-id")).toBeNull();
      expect(window.sessionStorage.getItem(key)).toBeNull();
    });

    it("rejects and cleans up records where embedded launchId does not match storage key", () => {
      const key = `${DRILL_STORAGE_PREFIX}key-a`;
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          launchId: "tampered-key-b",
          subject: "numeracy",
          skillOrTopic: "Fractions",
          source: "skill",
          yearLevel: 3,
          examStyle: "naplan_style",
          previousQuestionIds: ["q1"],
          seed: "seed",
          createdAt: Date.now(),
        }),
      );

      expect(getDrillLaunchRequest("key-a")).toBeNull();
      expect(window.sessionStorage.getItem(key)).toBeNull();
    });

    it("returns null and cleans up records failing schema validation", () => {
      const key = `${DRILL_STORAGE_PREFIX}invalid-schema`;
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          launchId: "invalid-schema",
          createdAt: Date.now(),
        }),
      );

      expect(getDrillLaunchRequest("invalid-schema")).toBeNull();
      expect(window.sessionStorage.getItem(key)).toBeNull();
    });

    it("returns null and deletes expired records (> 2 hours)", () => {
      const key = `${DRILL_STORAGE_PREFIX}expired-id`;
      const oldTime = Date.now() - (DRILL_LAUNCH_MAX_AGE_MS + 10000);
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          launchId: "expired-id",
          subject: "numeracy",
          skillOrTopic: "Fractions",
          source: "skill",
          yearLevel: 3,
          examStyle: "naplan_style",
          previousQuestionIds: ["q1"],
          seed: "seed",
          createdAt: oldTime,
        }),
      );

      expect(getDrillLaunchRequest("expired-id")).toBeNull();
      expect(window.sessionStorage.getItem(key)).toBeNull();
    });

    it("returns null and deletes unreasonably future-dated records", () => {
      const key = `${DRILL_STORAGE_PREFIX}future-id`;
      const futureTime = Date.now() + (DRILL_LAUNCH_MAX_FUTURE_DRIFT_MS + 60000);
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          launchId: "future-id",
          subject: "numeracy",
          skillOrTopic: "Fractions",
          source: "skill",
          yearLevel: 3,
          examStyle: "naplan_style",
          previousQuestionIds: ["q1"],
          seed: "seed",
          createdAt: futureTime,
        }),
      );

      expect(getDrillLaunchRequest("future-id")).toBeNull();
      expect(window.sessionStorage.getItem(key)).toBeNull();
    });

    it("clears a launch request on clearDrillLaunchRequest", () => {
      const saveResult = saveDrillLaunchRequest({
        launchId: "clear-test-1",
        subject: "reading",
        skillOrTopic: "Inference",
        source: "skill",
        yearLevel: "mixed",
        examStyle: "mixed",
        previousQuestionIds: [],
        seed: "seed",
      });

      expect(saveResult.ok).toBe(true);
      if (!saveResult.ok) return;

      expect(getDrillLaunchRequest("clear-test-1")).not.toBeNull();
      clearDrillLaunchRequest("clear-test-1");
      expect(getDrillLaunchRequest("clear-test-1")).toBeNull();
    });
  });
});
