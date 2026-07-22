import type { GenerationPromptPack } from "../generation";
import type { ReviewPromptPack } from "../review";
import { parseGeneratedCandidates, parseReviewVerdict } from "./parse-provider-output";
import type { AiProvider, GenerateCandidatesOutcome, ReviewCandidateOutcome } from "./provider";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
/** Resolves through the shared identity-alias table (`config/identity-normalisation.ts`) — never a bare string typed twice. */
export const ANTHROPIC_DEFAULT_MODEL = "claude-sonnet-5";
const MAX_RESPONSE_TOKENS = 8192;

interface AnthropicMessageBlock {
  readonly type?: string;
  readonly text?: string;
}

interface AnthropicMessagesResponse {
  readonly content?: readonly AnthropicMessageBlock[];
}

function extractResponseText(body: AnthropicMessagesResponse): string | undefined {
  const textBlock = body.content?.find((block) => block.type === "text" && typeof block.text === "string");
  return textBlock?.text;
}

/**
 * Anthropic Messages API adapter (contract: this feature's `AiProvider`
 * interface, `provider.ts`). Never called with no `apiKey` — `create-provider.ts`
 * is the only place that decides whether a provider is configured at all.
 */
export class AnthropicProvider implements AiProvider {
  readonly providerId = "anthropic" as const;
  readonly modelId: string;
  private readonly apiKey: string;

  constructor(apiKey: string, modelId: string = ANTHROPIC_DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  private async callMessages(promptText: string): Promise<
    { readonly ok: true; readonly text: string } | { readonly ok: false; readonly issueCode: "provider_request_failed" | "malformed_provider_response"; readonly message: string }
  > {
    let response: Response;
    try {
      response = await fetch(ANTHROPIC_MESSAGES_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_API_VERSION,
        },
        body: JSON.stringify({
          model: this.modelId,
          max_tokens: MAX_RESPONSE_TOKENS,
          messages: [{ role: "user", content: promptText }],
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, issueCode: "provider_request_failed", message: `Anthropic request failed: ${message}` };
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      return {
        ok: false,
        issueCode: "provider_request_failed",
        message: `Anthropic API returned ${response.status} ${response.statusText}: ${bodyText.slice(0, 500)}`,
      };
    }

    let body: AnthropicMessagesResponse;
    try {
      body = (await response.json()) as AnthropicMessagesResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, issueCode: "malformed_provider_response", message: `Anthropic response body is not valid JSON: ${message}` };
    }

    const text = extractResponseText(body);
    if (text === undefined) {
      return { ok: false, issueCode: "malformed_provider_response", message: "Anthropic response contained no text content block." };
    }
    return { ok: true, text };
  }

  async generateCandidates(pack: GenerationPromptPack): Promise<GenerateCandidatesOutcome> {
    const result = await this.callMessages(JSON.stringify(pack));
    if (!result.ok) return { ok: false, issueCode: result.issueCode, message: result.message };
    return parseGeneratedCandidates(result.text);
  }

  async reviewCandidates(pack: ReviewPromptPack): Promise<ReviewCandidateOutcome> {
    const result = await this.callMessages(JSON.stringify(pack));
    if (!result.ok) return { ok: false, issueCode: result.issueCode, message: result.message };
    return parseReviewVerdict(result.text);
  }
}
