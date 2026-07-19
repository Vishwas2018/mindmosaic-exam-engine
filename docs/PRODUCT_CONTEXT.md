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

The scaffold phase is complete. The engine ships the full validated 100-question production bank, and a Supabase backend now provides authentication (sign-in/up, password reset, OAuth) and a role/RLS schema for four roles — student, parent, teacher, admin. Signed-in exam sessions are server-authoritative: selection, scoring, and attempt persistence happen server-side, not in the browser. See the technology stack and routes in the [README](../README.md), [Data model and roles](DATA_MODEL_AND_ROLES.md), and [Assessment security model](ASSESSMENT_SECURITY_MODEL.md) for what's built. Payments and AI-generated content are not yet built; see [Privacy and billing guardrails](PRIVACY_AND_BILLING_GUARDRAILS.md) for the guardrails written ahead of the payments phase.

The long-term goal is an extensible assessment engine that can add question types, deterministic visuals, original content collections, and further backend capability (autosaved in-progress attempts, assignment workflows, reporting) without embedding exam-specific rules in general UI components.
