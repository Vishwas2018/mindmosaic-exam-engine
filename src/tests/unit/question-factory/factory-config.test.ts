import { describe, expect, it } from "vitest";

import { questionRendererRegistry } from "@/features/exam-engine/question-renderers/question-renderer-registry";
import { visualRendererRegistry } from "@/features/exam-engine/visual-renderers/visual-renderer-registry";
import {
  FACTORY_LIMITS,
  FACTORY_THRESHOLDS,
  FACTORY_VERSIONS,
  PUBLICATION_CONTROLLED_FILES,
  REPOSITORY_MODES,
  factoryConfig,
  factoryConfigSchema,
  getProductionQuestionsRoot,
  getWorkspaceRoot,
  repositoryModeSchema,
} from "@/features/question-factory/config";

describe("factoryConfig", () => {
  it("is a frozen, already-validated singleton", () => {
    expect(Object.isFrozen(factoryConfig)).toBe(true);
  });

  it("defaults repositoryMode to production", () => {
    expect(factoryConfig.repositoryMode).toBe("production");
  });

  it("fixes the revision limit at 2, per Shared Governance", () => {
    expect(factoryConfig.thresholds.MAX_REVISIONS).toBe(2);
    expect(FACTORY_THRESHOLDS.MAX_REVISIONS).toBe(2);
  });

  it("exposes the same allowed question/visual types as the renderer registries (single source of truth)", () => {
    expect(factoryConfig.allowedQuestionTypes).toEqual([...questionRendererRegistry.supportedTypes]);
    expect(factoryConfig.allowedVisualTypes).toEqual([...visualRendererRegistry.supportedTypes]);
  });

  it("resolves the workspace root under content/question-factory", () => {
    expect(factoryConfig.workspaceRoot.replaceAll("\\", "/")).toMatch(
      /content\/question-factory$/,
    );
    expect(getWorkspaceRoot("/repo").replaceAll("\\", "/")).toBe("/repo/content/question-factory");
  });

  it("resolves the production questions root under src/content/questions", () => {
    expect(getProductionQuestionsRoot("/repo").replaceAll("\\", "/")).toBe(
      "/repo/src/content/questions",
    );
  });

  it("centrally defines every publication-controlled file path", () => {
    expect(PUBLICATION_CONTROLLED_FILES.generatedBankIndex.replaceAll("\\", "/")).toBe(
      "src/content/questions/generated/index.ts",
    );
    expect(PUBLICATION_CONTROLLED_FILES.bankContract.replaceAll("\\", "/")).toBe(
      "src/content/questions/question-bank-contract.generated.json",
    );
    expect(factoryConfig.publicationControlledFiles).toEqual(PUBLICATION_CONTROLLED_FILES);
  });

  it("records non-empty version tags for schema, taxonomy and prompts", () => {
    expect(FACTORY_VERSIONS.SCHEMA_VERSION.length).toBeGreaterThan(0);
    expect(FACTORY_VERSIONS.TAXONOMY_VERSION.length).toBeGreaterThan(0);
    expect(FACTORY_VERSIONS.PROMPT_VERSION.length).toBeGreaterThan(0);
  });
});

describe("factoryConfigSchema", () => {
  it("accepts the real assembled config", () => {
    expect(factoryConfigSchema.safeParse(factoryConfig).success).toBe(true);
  });

  it("rejects a threshold outside [0, 1]", () => {
    const broken = {
      ...factoryConfig,
      thresholds: { ...factoryConfig.thresholds, PRODUCTION_REVIEW_CONFIDENCE: 1.5 },
    };
    expect(factoryConfigSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a non-positive limit", () => {
    const broken = {
      ...factoryConfig,
      limits: { ...factoryConfig.limits, BLUEPRINT_MAX_TARGET_COUNT: 0 },
    };
    expect(factoryConfigSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects an unknown repository mode", () => {
    const broken = { ...factoryConfig, repositoryMode: "staging" };
    expect(factoryConfigSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects an empty allowed-question-types list", () => {
    const broken = { ...factoryConfig, allowedQuestionTypes: [] };
    expect(factoryConfigSchema.safeParse(broken).success).toBe(false);
  });
});

describe("repositoryModeSchema", () => {
  it("accepts every declared repository mode", () => {
    for (const mode of REPOSITORY_MODES) {
      expect(repositoryModeSchema.safeParse(mode).success).toBe(true);
    }
  });

  it("rejects an unknown mode", () => {
    expect(repositoryModeSchema.safeParse("staging").success).toBe(false);
  });
});

describe("FACTORY_LIMITS", () => {
  it("every declared limit is a positive integer", () => {
    for (const [key, value] of Object.entries(FACTORY_LIMITS)) {
      expect(Number.isInteger(value), `${key} should be an integer`).toBe(true);
      expect(value, `${key} should be positive`).toBeGreaterThan(0);
    }
  });
});
