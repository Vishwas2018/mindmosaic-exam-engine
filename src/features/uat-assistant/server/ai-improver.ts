import "server-only";

import { z } from "zod";

import { ANTHROPIC_DEFAULT_MODEL } from "@/features/question-factory/ai/anthropic-provider";
import { OPENAI_DEFAULT_MODEL } from "@/features/question-factory/ai/openai-provider";

import {
  UAT_ISSUE_CATEGORIES,
  UAT_ISSUE_SEVERITIES,
  type UatAiDraft,
  type UatImproveRequest,
} from "../types";
import { redactSensitiveText, sanitizeUrlForReport } from "../utils/redaction";

const aiGeneratedFieldsSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(5).max(4000),
  stepsToReproduce: z.array(z.string().trim().min(2).max(600)).min(1).max(15),
  actualResult: z.string().trim().min(3).max(2000),
  expectedResult: z.string().trim().min(3).max(2000),
  severity: z.enum(UAT_ISSUE_SEVERITIES),
  category: z.enum(UAT_ISSUE_CATEGORIES),
});

export type ImproveDefectOutcome =
  | { readonly ok: true; readonly draft: UatAiDraft }
  | {
      readonly ok: false;
      readonly code: "provider_not_configured" | "provider_failed" | "malformed_output";
      readonly message: string;
    };

type EnvMap = Readonly<Record<string, string | undefined>>;

interface ResolvedUatAiProvider {
  readonly providerId: "anthropic" | "openai" | "gemini";
  readonly modelId: string;
  callText(prompt: string): Promise<{ ok: true; text: string } | { ok: false; message: string }>;
}

/**
 * Reuses MindMosaic's approved server-side AI provider environment contract
 * (`QF_AI_PROVIDER=anthropic|openai|gemini` and matching server-only API keys,
 * with optional `MM_UAT_AI_PROVIDER` override among those same three approved
 * providers). Never introduces an unapproved provider or client-side key.
 */
export function resolveApprovedUatAiProvider(
  env: EnvMap = process.env,
): { ok: true; provider: ResolvedUatAiProvider } | { ok: false; message: string } {
  const providerId = (env.MM_UAT_AI_PROVIDER ?? env.QF_AI_PROVIDER)?.trim().toLowerCase();

  if (providerId === "anthropic") {
    const apiKey = env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return { ok: false, message: "ANTHROPIC_API_KEY is not configured on the server." };
    }
    const modelId = env.QF_AI_ANTHROPIC_MODEL?.trim() || ANTHROPIC_DEFAULT_MODEL;
    return {
      ok: true,
      provider: {
        providerId: "anthropic",
        modelId,
        async callText(prompt) {
          try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
              },
              body: JSON.stringify({
                model: modelId,
                max_tokens: 1500,
                messages: [{ role: "user", content: prompt }],
              }),
            });
            if (!response.ok) {
              return { ok: false, message: `Anthropic API returned ${response.status}.` };
            }
            const body = (await response.json()) as {
              content?: readonly { type?: string; text?: string }[];
            };
            const text = body.content?.find((b) => b.type === "text" && typeof b.text === "string")?.text;
            if (!text) return { ok: false, message: "Anthropic response contained no text block." };
            return { ok: true, text };
          } catch {
            return { ok: false, message: "Could not reach the configured Anthropic endpoint." };
          }
        },
      },
    };
  }

  if (providerId === "openai") {
    const apiKey = env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return { ok: false, message: "OPENAI_API_KEY is not configured on the server." };
    }
    const modelId = env.QF_AI_OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL;
    return {
      ok: true,
      provider: {
        providerId: "openai",
        modelId,
        async callText(prompt) {
          try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: modelId,
                temperature: 0.1,
                messages: [{ role: "user", content: prompt }],
              }),
            });
            if (!response.ok) {
              return { ok: false, message: `OpenAI API returned ${response.status}.` };
            }
            const body = (await response.json()) as {
              choices?: readonly { message?: { content?: string } }[];
            };
            const text = body.choices?.[0]?.message?.content;
            if (typeof text !== "string") {
              return { ok: false, message: "OpenAI response contained no message content." };
            }
            return { ok: true, text };
          } catch {
            return { ok: false, message: "Could not reach the configured OpenAI endpoint." };
          }
        },
      },
    };
  }

  if (providerId === "gemini") {
    const apiKey = (env.GEMINI_API_KEY || env.GOOGLE_API_KEY)?.trim();
    const modelId = env.QF_AI_GEMINI_MODEL?.trim();
    if (!apiKey || !modelId) {
      return {
        ok: false,
        message: "QF_AI_PROVIDER=gemini requires GEMINI_API_KEY (or GOOGLE_API_KEY) and QF_AI_GEMINI_MODEL.",
      };
    }
    return {
      ok: true,
      provider: {
        providerId: "gemini",
        modelId,
        async callText(prompt) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent`,
              {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  "x-goog-api-key": apiKey,
                },
                body: JSON.stringify({
                  contents: [{ role: "user", parts: [{ text: prompt }] }],
                  generationConfig: { temperature: 0.1 },
                }),
              },
            );
            if (!response.ok) {
              return { ok: false, message: `Gemini API returned ${response.status}.` };
            }
            const body = (await response.json()) as {
              candidates?: readonly { content?: { parts?: readonly { text?: string }[] } }[];
            };
            const text = body.candidates?.[0]?.content?.parts?.find((p) => typeof p.text === "string")?.text;
            if (!text) return { ok: false, message: "Gemini response contained no text part." };
            return { ok: true, text };
          } catch {
            return { ok: false, message: "Could not reach the configured Gemini endpoint." };
          }
        },
      },
    };
  }

  return {
    ok: false,
    message:
      "No server AI provider is configured (QF_AI_PROVIDER). You can structure the report locally or edit fields directly.",
  };
}

export function buildDefectImprovementPrompt(request: UatImproveRequest): string {
  const sanitizedNotes = redactSensitiveText(request.originalNotes);
  const sanitizedUrl = sanitizeUrlForReport(request.pageUrl);
  const elementBlock = request.element
    ? JSON.stringify(
        {
          locator: request.element.locator,
          strategy: request.element.locatorStrategy,
          tagName: request.element.tagName,
          role: request.element.role,
          accessibleName: request.element.accessibleName,
          visibleSnippet: redactSensitiveText(request.element.visibleSnippet),
        },
        null,
        2,
      )
    : "No specific element selected.";

  return [
    "You are a senior QA engineer formatting a manual User Acceptance Testing (UAT) observation for MindMosaic into a clear, factual defect report.",
    "",
    "STRICT NON-HALLUCINATION RULES (MANDATORY):",
    "1. Use ONLY the tester's verbatim observation notes and the captured technical context below.",
    "2. NEVER invent observations, console errors, HTTP status codes, database states, root causes, or user actions that the tester did not state.",
    "3. Keep `actualResult` strictly faithful to what the tester observed.",
    "4. If the tester did not explicitly state the expected behaviour, state the direct, conservative expectation implied by their note (or prefix with 'To verify:') without inventing new product specifications.",
    "5. Write in plain, concise Australian English.",
    "6. Respond with ONLY a single valid JSON object (no markdown code fences, no commentary) matching this exact schema:",
    JSON.stringify({
      title: "Short specific defect summary (max 120 chars)",
      description: "Clear factual summary of the discrepancy grounded only in the tester's notes and context",
      stepsToReproduce: ["Step 1...", "Step 2..."],
      actualResult: "What actually occurred according to the tester",
      expectedResult: "Expected behaviour (conservative, never invented)",
      severity: "critical | high | medium | low",
      category:
        "ui_visual | functional | accessibility | content | performance | responsive | auth_permissions | other",
    }),
    "",
    "CAPTURED CONTEXT:",
    `- Portal: ${request.portal}`,
    `- Route: ${request.route}`,
    `- Sanitized URL: ${sanitizedUrl}`,
    `- Browser: ${request.browser}`,
    `- Viewport: ${request.viewport.width}x${request.viewport.height}`,
    `- Selected Element: ${elementBlock}`,
    "",
    "TESTER'S ORIGINAL NOTES (VERBATIM):",
    sanitizedNotes,
  ].join("\n");
}

export function extractJsonObjectFromText(raw: string): unknown {
  const trimmed = raw.trim();
  const stripped = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(stripped.slice(start, end + 1));
    }
    throw new Error("Response did not contain a valid JSON object.");
  }
}

export async function improveDefectWithAi(
  request: UatImproveRequest,
  env: EnvMap = process.env,
): Promise<ImproveDefectOutcome> {
  const providerOutcome = resolveApprovedUatAiProvider(env);
  if (!providerOutcome.ok) {
    return {
      ok: false,
      code: "provider_not_configured",
      message: providerOutcome.message,
    };
  }

  const prompt = buildDefectImprovementPrompt(request);
  const callResult = await providerOutcome.provider.callText(prompt);
  if (!callResult.ok) {
    return {
      ok: false,
      code: "provider_failed",
      message: callResult.message,
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = extractJsonObjectFromText(callResult.text);
  } catch {
    return {
      ok: false,
      code: "malformed_output",
      message: "The AI provider returned an unreadable response. Your original notes are safe.",
    };
  }

  const validated = aiGeneratedFieldsSchema.safeParse(parsedJson);
  if (!validated.success) {
    return {
      ok: false,
      code: "malformed_output",
      message: "The AI response did not match the required defect schema. Your original notes are safe.",
    };
  }

  return {
    ok: true,
    draft: {
      title: redactSensitiveText(validated.data.title),
      description: redactSensitiveText(validated.data.description),
      stepsToReproduce: validated.data.stepsToReproduce.map((s) => redactSensitiveText(s)),
      actualResult: redactSensitiveText(validated.data.actualResult),
      expectedResult: redactSensitiveText(validated.data.expectedResult),
      severity: validated.data.severity,
      category: validated.data.category,
      generatedAt: new Date().toISOString(),
      providerId: providerOutcome.provider.providerId,
      modelId: providerOutcome.provider.modelId,
      mode: "ai",
    },
  };
}
