import { AnthropicProvider } from "./anthropic-provider";
import { OpenAiProvider } from "./openai-provider";
import type { AiProvider } from "./provider";

export type CreateProviderOutcome = { readonly ok: true; readonly provider: AiProvider } | { readonly ok: false; readonly message: string };

/**
 * The single place that decides whether an AI provider is configured at
 * all (contract: `QF_AI_PROVIDER=anthropic|openai` selects the adapter;
 * `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` supply the matching secret — read
 * SERVER-SIDE ONLY, never logged, never a `NEXT_PUBLIC_` variable). Every
 * failure path here is an operator-facing configuration problem, never a
 * thrown exception — the two `questions:*-ai` CLIs stop cleanly on a
 * `{ ok: false }` result rather than crashing or fabricating output.
 */
export function createConfiguredProvider(env: NodeJS.ProcessEnv = process.env): CreateProviderOutcome {
  const providerId = env.QF_AI_PROVIDER;

  if (providerId === "anthropic") {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return { ok: false, message: "QF_AI_PROVIDER=anthropic requires ANTHROPIC_API_KEY to be set. Configure a provider key and retry." };
    }
    const modelId = env.QF_AI_ANTHROPIC_MODEL?.trim();
    return { ok: true, provider: new AnthropicProvider(apiKey, modelId && modelId.length > 0 ? modelId : undefined) };
  }

  if (providerId === "openai") {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return { ok: false, message: "QF_AI_PROVIDER=openai requires OPENAI_API_KEY to be set. Configure a provider key and retry." };
    }
    const modelId = env.QF_AI_OPENAI_MODEL?.trim();
    return { ok: true, provider: new OpenAiProvider(apiKey, modelId && modelId.length > 0 ? modelId : undefined) };
  }

  return {
    ok: false,
    message: "No AI provider configured. Set QF_AI_PROVIDER=anthropic or QF_AI_PROVIDER=openai (and the matching API key) and retry.",
  };
}
