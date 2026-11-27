import { afterEach, describe, expect, it, vi } from "vitest";

import {
  NVIDIA_DEFAULT_BASE_URL,
  UAT_AI_TIMEOUT_MS,
  extractJsonObjectFromText,
  improveDefectWithAi,
  resolveApprovedUatAiProvider,
  resolveNvidiaChatCompletionsUrl,
} from "@/features/uat-assistant/server/ai-improver";
import { isAiProviderConfiguredForUat } from "@/features/uat-assistant/server/uat-access";
import type { UatImproveRequest } from "@/features/uat-assistant/types";

// Assembled at runtime so secret scanners never see a literal key-shaped string.
const FAKE_NVIDIA_KEY = ["nvapi-", "unit-test-", "0123456789abcdef"].join("");
const MODEL = "nvidia/nemotron-3-super-120b-a12b";

const nvidiaEnv = {
  QF_AI_PROVIDER: "nvidia",
  NVIDIA_API_KEY: FAKE_NVIDIA_KEY,
  QF_AI_NVIDIA_MODEL: MODEL,
};

function request(overrides: Partial<UatImproveRequest> = {}): UatImproveRequest {
  return {
    originalNotes: "Manage billing button clips at 375px width, label runs past the right border.",
    route: "/billing",
    pageUrl: "https://preview.mindmosaic.test/billing",
    portal: "parent",
    browser: "Chrome 136 · Windows",
    viewport: { width: 375, height: 812 },
    element: null,
    ...overrides,
  };
}

const validFields = {
  title: "Manage billing button clips at 375px width",
  description: "On a 375x812 viewport the Manage billing button label overflows its container.",
  stepsToReproduce: ["Open /billing at 375x812", "Look at the Manage billing button"],
  actualResult: "The label runs past the right border of the button.",
  expectedResult: "To verify: the label fits inside the button.",
  severity: "medium",
  category: "responsive",
};

function chatResponse(content: string | null, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NVIDIA Nemotron — configuration", () => {
  it("resolves with the documented default endpoint and reports the nvidia provider and model", () => {
    const outcome = resolveApprovedUatAiProvider(nvidiaEnv);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.provider.providerId).toBe("nvidia");
      expect(outcome.provider.modelId).toBe(MODEL);
    }
    expect(resolveNvidiaChatCompletionsUrl(nvidiaEnv)).toEqual({
      ok: true,
      url: `${NVIDIA_DEFAULT_BASE_URL}/chat/completions`,
    });
  });

  it("honours MM_UAT_AI_PROVIDER over QF_AI_PROVIDER", () => {
    const outcome = resolveApprovedUatAiProvider({ ...nvidiaEnv, QF_AI_PROVIDER: "openai", MM_UAT_AI_PROVIDER: "nvidia" });
    expect(outcome.ok && outcome.provider.providerId).toBe("nvidia");
  });

  it.each([
    ["missing key", { QF_AI_PROVIDER: "nvidia", QF_AI_NVIDIA_MODEL: MODEL }],
    ["missing model", { QF_AI_PROVIDER: "nvidia", NVIDIA_API_KEY: FAKE_NVIDIA_KEY }],
    ["blank key", { ...nvidiaEnv, NVIDIA_API_KEY: "   " }],
    ["blank model", { ...nvidiaEnv, QF_AI_NVIDIA_MODEL: "  " }],
  ])("is not configured with %s and never echoes secrets", (_label, env) => {
    const outcome = resolveApprovedUatAiProvider(env);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.message).toContain("NVIDIA_API_KEY");
      expect(outcome.message).not.toContain(FAKE_NVIDIA_KEY);
    }
    expect(isAiProviderConfiguredForUat(env)).toBe(false);
  });

  it.each([
    ["plain http", "http://integrate.api.nvidia.com/v1"],
    ["foreign host", "https://evil.example.com/v1"],
    ["lookalike suffix", "https://integrate.api.nvidia.com.evil.example/v1"],
    ["embedded credentials", "https://user:pw@integrate.api.nvidia.com/v1"],
    ["query string", "https://integrate.api.nvidia.com/v1?x=1"],
    ["not a url", "not a url"],
  ])("refuses an unsafe NVIDIA_API_BASE_URL (%s) so the key cannot be redirected", async (_label, url) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const env = { ...nvidiaEnv, NVIDIA_API_BASE_URL: url };
    expect(resolveNvidiaChatCompletionsUrl(env).ok).toBe(false);
    expect(isAiProviderConfiguredForUat(env)).toBe(false);
    const outcome = await improveDefectWithAi(request(), env);
    expect(outcome).toMatchObject({ ok: false, code: "provider_not_configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts a custom nvidia.com base URL and trims a trailing slash", () => {
    expect(resolveNvidiaChatCompletionsUrl({ NVIDIA_API_BASE_URL: "https://nim.region.nvidia.com/v1/" })).toEqual({
      ok: true,
      url: "https://nim.region.nvidia.com/v1/chat/completions",
    });
  });

  it("isAiProviderConfiguredForUat is true only when key, model and endpoint are valid", () => {
    expect(isAiProviderConfiguredForUat(nvidiaEnv)).toBe(true);
  });
});

describe("NVIDIA Nemotron — real AI rewriting", () => {
  it("calls the OpenAI-compatible endpoint with bearer auth, redacts secrets, and reports provider and mode", async () => {
    const leak = ["sk_test_", "9999999999abcdef"].join("");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(chatResponse(JSON.stringify(validFields)));
    const input = request({
      originalNotes: `Manage billing button clips at 375px. Debug token=${leak}`,
      pageUrl: "https://preview.mindmosaic.test/billing?access_token=secret123",
    });
    const snapshot = JSON.stringify(input);

    const outcome = await improveDefectWithAi(input, nvidiaEnv);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://integrate.api.nvidia.com/v1/chat/completions");
    const headers = init.headers as Record<string, string>;
    expect(headers.authorization).toBe(`Bearer ${FAKE_NVIDIA_KEY}`);
    expect(init.signal).toBeInstanceOf(AbortSignal);

    const sent = JSON.parse(String(init.body)) as { model: string; stream: boolean; messages: { content: string }[] };
    expect(sent.model).toBe(MODEL);
    expect(sent.stream).toBe(false);
    const prompt = sent.messages[0]?.content ?? "";
    expect(prompt).not.toContain(leak);
    expect(prompt).not.toContain("secret123");
    expect(prompt).toContain("[REDACTED");
    expect(prompt).toContain("Manage billing button clips at 375px");
    expect(String(init.body)).not.toContain(FAKE_NVIDIA_KEY);

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.draft.mode).toBe("ai");
      expect(outcome.draft.providerId).toBe("nvidia");
      expect(outcome.draft.modelId).toBe(MODEL);
      expect(outcome.draft.title).toBe(validFields.title);
      expect(outcome.draft.stepsToReproduce).toEqual(validFields.stepsToReproduce);
      expect(outcome.draft.severity).toBe("medium");
      expect(JSON.stringify(outcome.draft)).not.toContain(FAKE_NVIDIA_KEY);
    }
    // The tester's original observation is never mutated by the rewrite.
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("re-redacts secrets the model echoes back in its output", async () => {
    const leak = ["sk_test_", "1111111111abcdef"].join("");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      chatResponse(JSON.stringify({ ...validFields, description: `Token ${leak} was visible on screen.` })),
    );
    const outcome = await improveDefectWithAi(request(), nvidiaEnv);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.draft.description).not.toContain(leak);
  });

  it("strips Nemotron <think> reasoning blocks and code fences before parsing", async () => {
    const wrapped = `<think>The tester said the label clips. {not json}</think>\n\`\`\`json\n${JSON.stringify(validFields)}\n\`\`\``;
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(chatResponse(wrapped));
    const outcome = await improveDefectWithAi(request(), nvidiaEnv);
    expect(outcome.ok).toBe(true);
    expect(extractJsonObjectFromText(wrapped)).toMatchObject({ title: validFields.title });
  });
});

describe("NVIDIA Nemotron — failure handling", () => {
  it("maps 401 to a credential message without leaking the key", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("{}", { status: 401 }));
    const outcome = await improveDefectWithAi(request(), nvidiaEnv);
    expect(outcome).toMatchObject({ ok: false, code: "provider_failed" });
    if (!outcome.ok) {
      expect(outcome.message).toContain("rejected the configured credentials (401)");
      expect(outcome.message).not.toContain(FAKE_NVIDIA_KEY);
    }
  });

  it("maps 403, 429 and 5xx to distinct provider_failed messages", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockResolvedValueOnce(new Response("{}", { status: 403 }));
    spy.mockResolvedValueOnce(new Response("{}", { status: 429 }));
    spy.mockResolvedValueOnce(new Response("{}", { status: 503 }));
    const a = await improveDefectWithAi(request(), nvidiaEnv);
    const b = await improveDefectWithAi(request(), nvidiaEnv);
    const c = await improveDefectWithAi(request(), nvidiaEnv);
    expect(a.ok === false && a.message).toContain("(403)");
    expect(b.ok === false && b.message).toContain("rate limit");
    expect(c.ok === false && c.message).toBe("NVIDIA API returned 503.");
  });

  it("reports a timeout when the upstream does not answer", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new DOMException("The operation timed out.", "TimeoutError"));
    const outcome = await improveDefectWithAi(request(), nvidiaEnv);
    expect(outcome).toMatchObject({ ok: false, code: "provider_failed" });
    if (!outcome.ok) expect(outcome.message).toContain(`${UAT_AI_TIMEOUT_MS / 1000} seconds`);
  });

  it("arms a 30s abort signal and surfaces its abort as a timeout", async () => {
    const controller = new AbortController();
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          (init as RequestInit).signal?.addEventListener("abort", () => reject((init as RequestInit).signal?.reason));
        }),
    );
    const pending = improveDefectWithAi(request(), nvidiaEnv);
    controller.abort(new DOMException("The operation timed out.", "TimeoutError"));
    const outcome = await pending;
    expect(timeoutSpy).toHaveBeenCalledWith(UAT_AI_TIMEOUT_MS);
    expect(outcome).toMatchObject({ ok: false, code: "provider_failed" });
    if (!outcome.ok) expect(outcome.message).toContain("did not respond");
  });

  it("reports an unreachable endpoint on a network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("fetch failed"));
    const outcome = await improveDefectWithAi(request(), nvidiaEnv);
    expect(outcome).toMatchObject({ ok: false, code: "provider_failed" });
    if (!outcome.ok) expect(outcome.message).toBe("Could not reach the configured NVIDIA endpoint.");
  });

  it.each([
    ["prose, no JSON", chatResponse("Sorry, I cannot help with that.")],
    ["truncated JSON", chatResponse('{"title": "Billing button clips", "description": ')],
    ["schema mismatch", chatResponse(JSON.stringify({ ...validFields, severity: "catastrophic" }))],
    ["missing fields", chatResponse(JSON.stringify({ title: "Only a title here" }))],
  ])("returns malformed_output for %s and keeps notes safe", async (_label, response) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response);
    const outcome = await improveDefectWithAi(request(), nvidiaEnv);
    expect(outcome).toMatchObject({ ok: false, code: "malformed_output" });
    if (!outcome.ok) expect(outcome.message).toContain("original notes are safe");
  });

  it.each([
    ["null content", chatResponse(null)],
    ["empty content", chatResponse("   ")],
    ["no choices", new Response(JSON.stringify({ choices: [] }), { status: 200 })],
  ])("returns provider_failed for a response with %s", async (_label, response) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response);
    const outcome = await improveDefectWithAi(request(), nvidiaEnv);
    expect(outcome).toMatchObject({ ok: false, code: "provider_failed" });
  });

  it("disables Nemotron thinking so the structured answer is returned in message.content", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(chatResponse(JSON.stringify(validFields)));
    await improveDefectWithAi(request(), nvidiaEnv);
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(String(init.body)) as { chat_template_kwargs?: { enable_thinking?: boolean } };
    expect(sent.chat_template_kwargs).toEqual({ enable_thinking: false });
  });

  it("explains a truncated response (finish_reason length, empty content) distinctly and never exposes reasoning text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ finish_reason: "length", message: { content: null, reasoning_content: "secret chain of thought" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const outcome = await improveDefectWithAi(request(), nvidiaEnv);
    expect(outcome).toMatchObject({ ok: false, code: "provider_failed" });
    if (!outcome.ok) {
      expect(outcome.message).toMatch(/truncated/i);
      expect(outcome.message).not.toContain("chain of thought");
    }
  });

  it("does not throw when the response body is not JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("<html>gateway</html>", { status: 200 }));
    const outcome = await improveDefectWithAi(request(), nvidiaEnv);
    expect(outcome).toMatchObject({ ok: false, code: "provider_failed" });
  });
});

describe("Existing providers keep working alongside Nemotron", () => {
  it.each([
    ["anthropic", { QF_AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "k" }],
    ["openai", { QF_AI_PROVIDER: "openai", OPENAI_API_KEY: "k" }],
    ["gemini", { QF_AI_PROVIDER: "gemini", GEMINI_API_KEY: "k", QF_AI_GEMINI_MODEL: "m" }],
  ])("%s still resolves and is configured", (id, env) => {
    const outcome = resolveApprovedUatAiProvider(env);
    expect(outcome.ok && outcome.provider.providerId).toBe(id);
    expect(isAiProviderConfiguredForUat(env)).toBe(true);
  });

  it("unset and unknown providers fall back to the deterministic path", async () => {
    expect(isAiProviderConfiguredForUat({})).toBe(false);
    expect(isAiProviderConfiguredForUat({ QF_AI_PROVIDER: "mystery" })).toBe(false);
    const outcome = await improveDefectWithAi(request(), { QF_AI_PROVIDER: "mystery" });
    expect(outcome).toMatchObject({ ok: false, code: "provider_not_configured" });
  });

  it("applies the same timeout and credential messaging to the OpenAI provider", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockResolvedValueOnce(new Response("{}", { status: 401 }));
    spy.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"));
    const env = { QF_AI_PROVIDER: "openai", OPENAI_API_KEY: "k" };
    const a = await improveDefectWithAi(request(), env);
    const b = await improveDefectWithAi(request(), env);
    expect(a.ok === false && a.message).toContain("rejected the configured credentials (401)");
    expect(b.ok === false && b.message).toContain("did not respond");
  });
});
