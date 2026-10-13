import { describe, expect, it } from "vitest";

import { isWritingPreviewAllowed } from "@/features/writing/preview-gate";
import { DEV_FIXTURE_WRITING_TASK, listWritingTasks, PUBLISHED_WRITING_TASKS, resolveWritingTask } from "@/features/writing/task";

describe("writing preview gate", () => {
  it("is open outside production", () => {
    expect(isWritingPreviewAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(isWritingPreviewAllowed({ NODE_ENV: "test" })).toBe(true);
  });

  it("is closed in a production build unless the e2e flag is exactly 1", () => {
    expect(isWritingPreviewAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(isWritingPreviewAllowed({ NODE_ENV: "production", WRITING_PREVIEW_ENABLED: "0" })).toBe(false);
    expect(isWritingPreviewAllowed({ NODE_ENV: "production", WRITING_PREVIEW_ENABLED: "true" })).toBe(false);
    expect(isWritingPreviewAllowed({ NODE_ENV: "production", WRITING_PREVIEW_ENABLED: "1" })).toBe(true);
  });

  it("is closed on Vercel production whatever else is set", () => {
    expect(isWritingPreviewAllowed({ NODE_ENV: "production", VERCEL_ENV: "production", WRITING_PREVIEW_ENABLED: "1" })).toBe(false);
    expect(isWritingPreviewAllowed({ NODE_ENV: "development", VERCEL_ENV: "production" })).toBe(false);
    expect(isWritingPreviewAllowed({ NODE_ENV: "production", VERCEL_ENV: "preview", WRITING_PREVIEW_ENABLED: "1" })).toBe(true);
  });
});

describe("which writing tasks a child can reach", () => {
  it("no task is published yet, so production reaches none (fail closed)", () => {
    expect(PUBLISHED_WRITING_TASKS).toHaveLength(0);
    const production = { NODE_ENV: "production" };
    expect(listWritingTasks(production)).toHaveLength(0);
    expect(resolveWritingTask(DEV_FIXTURE_WRITING_TASK.id, production)).toBeNull();
    expect(resolveWritingTask(DEV_FIXTURE_WRITING_TASK.id, { NODE_ENV: "production", VERCEL_ENV: "production", WRITING_PREVIEW_ENABLED: "1" })).toBeNull();
  });

  it("the dev fixture resolves only while the preview gate is open", () => {
    expect(resolveWritingTask(DEV_FIXTURE_WRITING_TASK.id, { NODE_ENV: "development" })).toEqual(DEV_FIXTURE_WRITING_TASK);
    expect(resolveWritingTask("w6-narrative-draft-001", { NODE_ENV: "development" })).toBeNull();
  });
});
