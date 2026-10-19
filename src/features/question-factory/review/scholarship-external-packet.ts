import { z } from "zod";

/**
 * Checks a returned answer-withheld packet response (docs/reviews/scholarship-2026-10-18/external-review) before any
 * of it is treated as evidence. This verifies shape, coverage, packet binding and reviewer independence; it records
 * nothing, and a response that passes is still only an input to the governed review-ingest workflow.
 */
export const EXTERNAL_PACKET_VERDICTS = ["PASS", "REVISE", "REJECT"] as const;
const OPTION_IDS = ["a", "b", "c", "d", "e", "none"] as const;

export const externalPacketResponseSchema = z
  .object({
    reviewer: z
      .object({
        provider: z.string().trim().min(1),
        model: z.string().trim().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        freshSession: z.literal(true),
        packetSha256: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict(),
    items: z.array(
      z
        .object({
          id: z.string().min(1),
          myAnswer: z.enum(OPTION_IDS),
          reasoning: z.string().trim().min(1),
          singleDefensibleAnswer: z.boolean(),
          issues: z.string(),
          difficulty: z.enum(["easy", "medium", "challenging"]),
          verdict: z.enum(EXTERNAL_PACKET_VERDICTS),
          fix: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

export type ExternalPacketResponse = z.infer<typeof externalPacketResponseSchema>;

export interface ExternalPacketManifest {
  readonly packetSha256: string;
  readonly items: readonly { readonly id: string }[];
}

export interface DeclaredItem {
  readonly id: string;
  readonly key: string;
  readonly difficulty: string;
}

export interface ExternalPacketReport {
  readonly valid: boolean;
  readonly problems: readonly string[];
  readonly summary?: {
    readonly reviewer: string;
    readonly items: number;
    readonly agreeWithKey: number;
    readonly disagree: readonly string[];
    readonly notSingleAnswer: readonly string[];
    readonly revise: readonly string[];
    readonly reject: readonly string[];
    readonly difficultyDiffers: readonly { id: string; declared: string; reviewer: string }[];
  };
}

/** Anthropic and its models are never different-provider evidence for Claude-generated content. */
const SAME_PROVIDER = /\b(anthropic|claude|opus|sonnet|haiku|fable)\b/i;

export function checkScholarshipExternalResponse(
  raw: unknown,
  manifest: ExternalPacketManifest,
  declared: readonly DeclaredItem[],
): ExternalPacketReport {
  const parsed = externalPacketResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return { valid: false, problems: parsed.error.issues.map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`) };
  }
  const response = parsed.data;
  const problems: string[] = [];

  if (SAME_PROVIDER.test(response.reviewer.provider) || SAME_PROVIDER.test(response.reviewer.model)) {
    problems.push(
      `reviewer '${response.reviewer.provider} / ${response.reviewer.model}' is the generator's provider; a different provider is required`,
    );
  }
  if (response.reviewer.packetSha256 !== manifest.packetSha256) {
    problems.push("packetSha256 does not match this release's packet: the review was given different content");
  }

  const expected = new Set(manifest.items.map((item) => item.id));
  const seen = new Set<string>();
  for (const item of response.items) {
    if (!expected.has(item.id)) problems.push(`${item.id}: not in the packet`);
    if (seen.has(item.id)) problems.push(`${item.id}: reviewed more than once`);
    seen.add(item.id);
  }
  for (const id of expected) if (!seen.has(id)) problems.push(`${id}: missing from the response`);

  if (problems.length) return { valid: false, problems };

  const byId = new Map(declared.map((item) => [item.id, item]));
  const disagree: string[] = [];
  const notSingle: string[] = [];
  const revise: string[] = [];
  const reject: string[] = [];
  const difficultyDiffers: { id: string; declared: string; reviewer: string }[] = [];
  let agree = 0;
  for (const item of response.items) {
    const want = byId.get(item.id);
    if (!want) {
      problems.push(`${item.id}: no declared key to compare with`);
      continue;
    }
    if (item.myAnswer === want.key) agree += 1;
    else disagree.push(item.id);
    if (!item.singleDefensibleAnswer) notSingle.push(item.id);
    if (item.verdict === "REVISE") revise.push(item.id);
    if (item.verdict === "REJECT") reject.push(item.id);
    if (item.difficulty !== want.difficulty) difficultyDiffers.push({ id: item.id, declared: want.difficulty, reviewer: item.difficulty });
  }
  return {
    valid: problems.length === 0,
    problems,
    summary: {
      reviewer: `${response.reviewer.provider} / ${response.reviewer.model} (${response.reviewer.date})`,
      items: response.items.length,
      agreeWithKey: agree,
      disagree,
      notSingleAnswer: notSingle,
      revise,
      reject,
      difficultyDiffers,
    },
  };
}
