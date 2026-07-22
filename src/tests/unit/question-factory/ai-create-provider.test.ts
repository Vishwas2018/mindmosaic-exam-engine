import { describe, expect, it } from "vitest";

import { AnthropicProvider } from "@/features/question-factory/ai/anthropic-provider";
import { createConfiguredProvider } from "@/features/question-factory/ai/create-provider";
import { OpenAiProvider } from "@/features/question-factory/ai/openai-provider";

function env(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return { ...overrides } as NodeJS.ProcessEnv;
}

describe("createConfiguredProvider", () => {
  it("stops cleanly with a configuration message when QF_AI_PROVIDER is unset", () => {
    const outcome = createConfiguredProvider(env({}));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.message).toMatch(/No AI provider configured/);
  });

  it("stops cleanly with a configuration message when QF_AI_PROVIDER is an unsupported value", () => {
    const outcome = createConfiguredProvider(env({ QF_AI_PROVIDER: "gemini" }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.message).toMatch(/No AI provider configured/);
  });

  it("stops cleanly when QF_AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is unset", () => {
    const outcome = createConfiguredProvider(env({ QF_AI_PROVIDER: "anthropic" }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.message).toMatch(/ANTHROPIC_API_KEY/);
  });

  it("stops cleanly when QF_AI_PROVIDER=openai but OPENAI_API_KEY is unset", () => {
    const outcome = createConfiguredProvider(env({ QF_AI_PROVIDER: "openai" }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.message).toMatch(/OPENAI_API_KEY/);
  });

  it("builds a configured AnthropicProvider when QF_AI_PROVIDER=anthropic and the key is set", () => {
    const outcome = createConfiguredProvider(env({ QF_AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "test-key" }));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.provider).toBeInstanceOf(AnthropicProvider);
      expect(outcome.provider.providerId).toBe("anthropic");
    }
  });

  it("builds a configured OpenAiProvider when QF_AI_PROVIDER=openai and the key is set", () => {
    const outcome = createConfiguredProvider(env({ QF_AI_PROVIDER: "openai", OPENAI_API_KEY: "test-key" }));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.provider).toBeInstanceOf(OpenAiProvider);
      expect(outcome.provider.providerId).toBe("openai");
    }
  });

  it("honours a QF_AI_ANTHROPIC_MODEL override", () => {
    const outcome = createConfiguredProvider(
      env({ QF_AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "test-key", QF_AI_ANTHROPIC_MODEL: "claude-opus-4-8" }),
    );
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.provider.modelId).toBe("claude-opus-4-8");
  });

  it("honours a QF_AI_OPENAI_MODEL override", () => {
    const outcome = createConfiguredProvider(env({ QF_AI_PROVIDER: "openai", OPENAI_API_KEY: "test-key", QF_AI_OPENAI_MODEL: "gpt-4" }));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.provider.modelId).toBe("gpt-4");
  });
});
