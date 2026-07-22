import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnthropicProvider } from "@/features/question-factory/ai/anthropic-provider";
import type { GenerationPromptPack } from "@/features/question-factory/generation";
import type { ReviewPromptPack } from "@/features/question-factory/review";

const MINIMAL_GENERATION_PACK = { batchId: "batch-001", promptVersion: "1", blueprints: [] } as unknown as GenerationPromptPack;
const MINIMAL_REVIEW_PACK = { candidateId: "man-001", reviewPromptVersion: "1" } as unknown as ReviewPromptPack;

function validReviewResponseJson(): string {
  return JSON.stringify({
    reviewId: "review-ai-001",
    candidateId: "man-001",
    candidateRevision: 0,
    candidateContentHash: "hash-content",
    blueprintHash: "hash-blueprint",
    reviewerModel: "claude-sonnet-5",
    reviewerVersion: "1",
    result: "passed",
    confidence: 0.9,
    findings: ["Checked the arithmetic."],
    evidenceReferences: ["12 + 7 = 19"],
    ambiguityStatus: "none",
    reviewedAt: "2026-07-22T00:00:00.000Z",
    reviewPromptVersion: "1",
    reviewPromptHash: "hash-prompt",
  });
}

function jsonResponse(status: number, body: unknown, statusText = "OK"): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("AnthropicProvider", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the correct Anthropic Messages request shape", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { content: [{ type: "text", text: "[]" }] }));
    const provider = new AnthropicProvider("test-key", "claude-sonnet-5");

    await provider.generateCandidates(MINIMAL_GENERATION_PACK);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("test-key");
    expect(headers["anthropic-version"]).toBeTruthy();
    const body = JSON.parse(init.body as string) as { model: string; messages: readonly { role: string; content: string }[] };
    expect(body.model).toBe("claude-sonnet-5");
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe("user");
    expect(JSON.parse(body.messages[0].content)).toEqual(MINIMAL_GENERATION_PACK);
  });

  it("never sends the API key anywhere but the x-api-key header", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { content: [{ type: "text", text: "[]" }] }));
    const provider = new AnthropicProvider("super-secret-key", "claude-sonnet-5");
    await provider.generateCandidates(MINIMAL_GENERATION_PACK);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body as string).not.toContain("super-secret-key");
  });

  it("parses a well-formed generation response into candidates", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { content: [{ type: "text", text: JSON.stringify([{ type: "multiple_choice", prompt: "1+1?" }]) }] }),
    );
    const provider = new AnthropicProvider("test-key");
    const outcome = await provider.generateCandidates(MINIMAL_GENERATION_PACK);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.candidates).toHaveLength(1);
  });

  it("parses a well-formed review response into a validated verdict", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { content: [{ type: "text", text: validReviewResponseJson() }] }));
    const provider = new AnthropicProvider("test-key");
    const outcome = await provider.reviewCandidates(MINIMAL_REVIEW_PACK);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.review.result).toBe("passed");
  });

  it("fails cleanly on a non-2xx HTTP response, never throwing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({}),
      text: async () => "invalid x-api-key",
    } as unknown as Response);
    const provider = new AnthropicProvider("bad-key");
    const outcome = await provider.generateCandidates(MINIMAL_GENERATION_PACK);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issueCode).toBe("provider_request_failed");
      expect(outcome.message).toMatch(/401/);
    }
  });

  it("fails cleanly when the response has no text content block", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { content: [{ type: "tool_use" }] }));
    const provider = new AnthropicProvider("test-key");
    const outcome = await provider.generateCandidates(MINIMAL_GENERATION_PACK);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("malformed_provider_response");
  });

  it("fails cleanly when the response text is not valid JSON", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { content: [{ type: "text", text: "not json at all" }] }));
    const provider = new AnthropicProvider("test-key");
    const outcome = await provider.generateCandidates(MINIMAL_GENERATION_PACK);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("malformed_provider_response");
  });

  it("fails cleanly on a network error, never throwing", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNRESET"));
    const provider = new AnthropicProvider("test-key");
    const outcome = await provider.generateCandidates(MINIMAL_GENERATION_PACK);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issueCode).toBe("provider_request_failed");
      expect(outcome.message).toMatch(/ECONNRESET/);
    }
  });
});
