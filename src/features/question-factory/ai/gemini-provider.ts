import type { GenerationPromptPack } from "../generation";
import type { ReviewPromptPack } from "../review";
import { parseGeneratedCandidates, parseReviewVerdict } from "./parse-provider-output";
import type { AiProvider, GenerateCandidatesOutcome, ReviewCandidateOutcome } from "./provider";

const GEMINI_GENERATE_CONTENT_URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
/**
 * Resolves through the shared identity-alias table
 * (`config/identity-normalisation.ts`) — never a bare string typed twice.
 * A fallback only: the owner sets the current Gemini model via
 * `QF_AI_GEMINI_MODEL` (`create-provider.ts`), because a model id baked in
 * here would go stale the moment Google ships a new one.
 */
export const GEMINI_DEFAULT_MODEL = "gemini-2.5-pro";

interface GeminiContentPart {
  readonly text?: string;
}

interface GeminiCandidate {
  readonly content?: { readonly parts?: readonly GeminiContentPart[] };
}

interface GeminiGenerateContentResponse {
  readonly candidates?: readonly GeminiCandidate[];
}

function extractResponseText(body: GeminiGenerateContentResponse): string | undefined {
  const part = body.candidates?.[0]?.content?.parts?.find((candidate) => typeof candidate.text === "string");
  return part?.text;
}

/**
 * Gemini `generateContent` REST API adapter (contract: this feature's
 * `AiProvider` interface, `provider.ts`). Never called with no `apiKey` —
 * `create-provider.ts` is the only place that decides whether a provider is
 * configured at all.
 *
 * REST rather than the `@google/genai` SDK, matching `AnthropicProvider`/
 * `OpenAiProvider`: no new runtime dependency, same request/response/error
 * shape, and a mocked global `fetch` covers it exactly like the other two
 * adapters' tests already do.
 */
export class GeminiProvider implements AiProvider {
  readonly providerId = "gemini" as const;
  readonly modelId: string;
  private readonly apiKey: string;

  constructor(apiKey: string, modelId: string = GEMINI_DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  private async callGenerateContent(promptText: string): Promise<
    { readonly ok: true; readonly text: string } | { readonly ok: false; readonly issueCode: "provider_request_failed" | "malformed_provider_response"; readonly message: string }
  > {
    let response: Response;
    try {
      response = await fetch(`${GEMINI_GENERATE_CONTENT_URL_BASE}/${this.modelId}:generateContent`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: promptText }] }],
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, issueCode: "provider_request_failed", message: `Gemini request failed: ${message}` };
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      return {
        ok: false,
        issueCode: "provider_request_failed",
        message: `Gemini API returned ${response.status} ${response.statusText}: ${bodyText.slice(0, 500)}`,
      };
    }

    let body: GeminiGenerateContentResponse;
    try {
      body = (await response.json()) as GeminiGenerateContentResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, issueCode: "malformed_provider_response", message: `Gemini response body is not valid JSON: ${message}` };
    }

    const text = extractResponseText(body);
    if (text === undefined) {
      return { ok: false, issueCode: "malformed_provider_response", message: "Gemini response contained no text content part." };
    }
    return { ok: true, text };
  }

  async generateCandidates(pack: GenerationPromptPack): Promise<GenerateCandidatesOutcome> {
    const result = await this.callGenerateContent(JSON.stringify(pack));
    if (!result.ok) return { ok: false, issueCode: result.issueCode, message: result.message };
    return parseGeneratedCandidates(result.text);
  }

  async reviewCandidates(pack: ReviewPromptPack): Promise<ReviewCandidateOutcome> {
    const result = await this.callGenerateContent(JSON.stringify(pack));
    if (!result.ok) return { ok: false, issueCode: result.issueCode, message: result.message };
    return parseReviewVerdict(result.text);
  }
}
