# Singapore Maths foundation

Status: **coming soon**. This change registers authoring scaffolding only. It authors no questions, grants no approvals, creates no manifests, and enables no student programme.

- Runtime vocabulary: `singapore_style` / `singapore_mathematics`, Years 3?6. These are internal identifiers, not an assertion of official syllabus alignment.
- Internal curriculum/pattern contract: `src/features/curriculum/singapore-foundation.ts`. Model-method skills cover part-whole, additive comparison and equal units. There is no timed exam contract or student pattern registration; question count and duration remain unspecified.
- Factory template: `content/question-factory/blueprints/singapore-y3-part-whole-foundation-seed-001.json`. A durable seed template for future authoring, not a generated question or an instruction to run generation. Its item-time estimate is authoring guidance, not a programme duration.
- `bar_model` can now pass factory structural validation and deterministic correctness verification. Shape, references, solvability, target uniqueness and descriptive-text answer leaks are checked; the exact rational target is independently compared with the numeric or uniquely matching single-option key. Invalid or unsupported models fail closed.
- The serving boundary withholds this authoring-only style even if a question later reaches the published source with approval evidence. Catalogue expansion and coverage readiness cannot activate it; public selection options and the existing coming-soon card remain unchanged.

Future content still needs the full governed provenance, originality, age-fit, review and human-approval publication lifecycle. Programme enablement is a separate task; adding content or registering vocabulary does not enable it.
