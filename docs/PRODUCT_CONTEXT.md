# Product Context

## Product scope

MindMosaic is a premium educational practice portal for students in Grade 3 and Grade 5. It is intended to provide clear, age-appropriate assessment experiences across tablet and desktop devices while remaining child-friendly without feeling childish.

The initial product supports two practice modes:

- NAPLAN-style practice, focused on familiar assessment patterns and curriculum-aligned skills.
- ICAS-style practice, focused on reasoning and challenge-oriented assessment patterns.

These labels describe the style and mode of original practice content. MindMosaic does not reproduce official assessment items and does not imply endorsement by or affiliation with the organisations that own those assessments.

## Original content requirement

Every question, passage, option set, answer, explanation, dataset, diagram, and other visual must be created originally for MindMosaic. Content must never be copied or closely paraphrased from official NAPLAN or ICAS materials, textbooks, websites, commercial question banks, or other protected sources.

Originality is a product requirement as well as a copyright requirement. Detailed authoring and review standards are defined in [Content Rules](CONTENT_RULES.md).

## Assessment-engine goal

The engine provides a reusable technical foundation for delivering structured educational assessments. It separates:

- validated question and visual data;
- question and visual rendering;
- response capture and client-side exam state;
- pure scoring logic;
- page-level exam and results experiences.

The current phase is deliberately a scaffold. It demonstrates the architecture with three sample questions and foundational renderer and schema support. It does not yet include the full 100-question bank, backend persistence, Supabase, authentication, payments, or AI API calls.

The long-term goal is an extensible assessment engine that can add question types, deterministic visuals, original content collections, and a future backend without embedding exam-specific rules in general UI components.
