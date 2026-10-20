# Different-provider review of 80 Year 6 scholarship items (Verbal Reasoning 45, Reading 35)

Repo policy (docs/REVIEW_INDEPENDENCE_POLICY.md): AI-generated judgement content needs a reviewer from a DIFFERENT provider (ChatGPT, Gemini or Qwen). The Claude reviews on file are advisory evidence only and do NOT satisfy this.

**File to give the reviewer (and nothing else):** `C:\tmp\handoff\vr-rc-blind-packet.txt`
(same file in the repo at `docs/reviews/external-review/vr-rc-blind-packet.txt`). It holds IDs, full passages, prompts and options only: no keys, explanations, labels or earlier reviews. Use a FRESH session. Do not paste this README, the keys, or any Claude review into it.

## Prompt to paste ahead of the packet
> You are an independent blind reviewer of Year 6 scholarship-style practice questions (Australian, ages about 11). For every item in the packet: solve it yourself from the text only; decide whether exactly one option is defensible; check passages for factual errors; judge whether distractors are plausible and distinct and whether the correct option is identifiable merely by length or by copying a passage sentence; judge age-appropriateness and difficulty. Reply ONLY with a JSON object in the format below, covering all 80 items, with no commentary.

## Required response format
```json
{
  "reviewer": {"provider": "openai|google|alibaba", "model": "<exact model name shown by the product>", "date": "YYYY-MM-DD"},
  "packet": "vr-rc-blind-packet.txt",
  "items": [
    {
      "id": "scholarship-y6-vr-001",
      "myAnswer": "a|b|c|d|e|none",
      "reasoning": "one or two sentences",
      "singleDefensibleAnswer": true,
      "issues": "ambiguity, factual error, copied-sentence key, weak distractors, or empty string",
      "difficulty": "easy|medium|challenging",
      "verdict": "PASS|REVISE|REJECT",
      "fix": "precise suggested fix if REVISE, else empty string"
    }
  ]
}
```
Save the reply as `external-review-<provider>.json` and hand it back. Keys stay hidden from the reviewer; I compare `myAnswer` with the declared keys afterwards. The reviewer must be recorded with its real provider and model: nothing may be attributed to a provider that did not produce it.
