import type { GenerationPromptPack } from "../generation";
import type { ReviewPromptPack } from "../review";
import { parseGeneratedCandidates, parseReviewVerdict } from "./parse-provider-output";
import type { AiProvider, GenerateCandidatesOutcome, ReviewCandidateOutcome } from "./provider";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
/** Resolves through the shared identity-alias table (`config/identity-normalisation.ts`) — never a bare string typed twice. */
export const OPENAI_DEFAULT_MODEL = "gpt-4o";

interface OpenAiChatChoice {
  readonly message?: { readonly content?: string };
}

interface OpenAiChatCompletionsResponse {
  readonly choices?: readonly OpenAiChatChoice[];
}

/**
 * OpenAI Chat Completions API adapter (contract: this feature's `AiProvider`
 * interface, `provider.ts`). Never called with no `apiKey` — `create-provider.ts`
 * is the only place that decides whether a provider is configured at all.
 */
export class OpenAiProvider implements AiProvider {
  readonly providerId = "openai" as const;
  readonly modelId: string;
  private readonly apiKey: string;

  constructor(apiKey: string, modelId: string = OPENAI_DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  private async callChatCompletions(promptText: string): Promise<
    { readonly ok: true; readonly text: string } | { readonly ok: false; readonly issueCode: "provider_request_failed" | "malformed_provider_response"; readonly message: string }
  > {
    let response: Response;
    try {
      response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelId,
          messages: [{ role: "user", content: promptText }],
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, issueCode: "provider_request_failed", message: `OpenAI request failed: ${message}` };
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      return {
        ok: false,
        issueCode: "provider_request_failed",
        message: `OpenAI API returned ${response.status} ${response.statusText}: ${bodyText.slice(0, 500)}`,
      };
    }

    let body: OpenAiChatCompletionsResponse;
    try {
      body = (await response.json()) as OpenAiChatCompletionsResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, issueCode: "malformed_provider_response", message: `OpenAI response body is not valid JSON: ${message}` };
    }

    const text = body.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      return { ok: false, issueCode: "malformed_provider_response", message: "OpenAI response contained no message content." };
    }
    return { ok: true, text };
  }

  async generateCandidates(pack: GenerationPromptPack): Promise<GenerateCandidatesOutcome> {
    const result = await this.callChatCompletions(JSON.stringify(pack));
    if (!result.ok) return { ok: false, issueCode: result.issueCode, message: result.message };
    return parseGeneratedCandidates(result.text);
  }

  async reviewCandidates(pack: ReviewPromptPack): Promise<ReviewCandidateOutcome> {
    const result = await this.callChatCompletions(JSON.stringify(pack));
    if (!result.ok) return { ok: false, issueCode: result.issueCode, message: result.message };
    return parseReviewVerdict(result.text);
  }
}
