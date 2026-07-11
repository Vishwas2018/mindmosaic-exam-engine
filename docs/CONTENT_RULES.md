# Content Rules

These rules apply to every MindMosaic question, stimulus, option, answer, explanation, dataset, and visual asset.

## Original content only

- Create all content specifically for MindMosaic.
- Never copy or closely paraphrase official NAPLAN or ICAS questions, textbooks, websites, commercial question banks, or other protected material.
- Do not reconstruct a recognisable source question by changing only names, numbers, or surface wording.
- Record and comply with licences for any permitted third-party asset; prefer original assets and data.
- Use “NAPLAN-style” and “ICAS-style” only to describe practice modes, not to suggest official status, endorsement, or affiliation.

## Australian English

- Use Australian spelling, punctuation, vocabulary, measurements, currency, and date conventions.
- Use familiar Australian contexts where they support comprehension, but avoid stereotypes or context that disadvantages students from a particular region or background.
- Keep terminology consistent within a question, its visual, its answer, and its explanation.

## Age suitability

- Assign content deliberately to Grade 3 or Grade 5 and match vocabulary, reading load, concepts, and cognitive demand to that year level.
- Keep sentences direct and instructions explicit without removing the intended reasoning challenge.
- Use safe, inclusive scenarios. Avoid frightening, discriminatory, sexual, exploitative, or otherwise inappropriate material.
- Avoid unnecessary cultural, financial, or specialist knowledge that is not the skill being assessed.

## Answer accuracy

- Verify that every machine-scored question has one unambiguous answer set under its stated rules.
- Check calculations, units, labels, option identifiers, matching pairs, sequences, tolerances, and visual data against the answer key.
- Ensure distractors are plausible but demonstrably incorrect and that no unintended option is defensible.
- State rounding, precision, units, case sensitivity, ordering, and multiple-selection requirements when they affect marking.
- Route genuinely open-ended responses to manual review rather than forcing an unreliable automatic mark.
- Review question data and answer keys independently before publication.

## Explanation required

- Every published question requires an original, age-appropriate explanation.
- Explain why the correct answer follows, not merely which answer is correct.
- Show the essential reasoning or working in clear steps and address a likely misconception when useful.
- Keep the explanation consistent with the prompt, answer key, visual, terminology, units, and year level.

## Visual consistency

- Use the shared MindMosaic design tokens and renderer conventions for colour, typography, spacing, labels, axes, legends, line weights, and interaction states.
- Represent visuals as schema-validated structured data and render them deterministically through React or SVG.
- Keep scale, geometry, labels, and data faithful to the question and answer key.
- Do not add decorative detail that creates ambiguity or increases cognitive load.
- Never accept arbitrary unsanitised SVG.

## Accessibility

- Use clear instructions and accessible semantic HTML.
- Provide meaningful alternative text for every assessment-relevant visual and hide purely decorative content from assistive technology.
- Do not rely on colour, position, sound, or pointer interaction alone to communicate meaning.
- Maintain readable contrast, comfortable text sizing, visible keyboard focus, logical focus order, and comfortable touch targets.
- Ensure every response control and interactive visual is labelled, keyboard operable, and understandable without animation.
- Use tables, headings, lists, form labels, error messages, and status announcements with appropriate semantics.
- Avoid excessive motion; respect reduced-motion preferences where motion is present.

## Content lifecycle

Every question moves through the recorded lifecycle before joining the production bank:

```text
draft → schema validated → correctness checked → editorially reviewed → published
```

- **Schema validated**: `npm run validate:questions` enforces the full production contract — exact distribution, visual coverage minimums, metadata completeness, uniqueness of IDs, prompts and explanations, and lifecycle fields.
- **Correctness checked**: `npm run check:answers` independently re-derives answers from question data (chart values, table arithmetic, geometry, fraction models, mappings) without the scoring engine. Language and reading answers that cannot be computed are flagged for editorial review rather than asserted correct.
- **Editorially reviewed**: a person confirms originality, Australian English, age suitability and semantic answer correctness for language material.

Statuses `reviewed` and `rejected` are available for staged review; there is no backend workflow in this phase.

## Publication checklist

A question may be marked published only when its originality, Australian English, age suitability, answer accuracy, explanation, visual consistency, and accessibility have all been reviewed. Draft status must be retained whenever any required check is incomplete.
