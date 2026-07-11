/**
 * Blueprint field bounds. Superseded by `question-factory/config` once it
 * lands later in this mission — kept as named constants (not inline magic
 * numbers) so that refactor is a mechanical import swap.
 */
export const BLUEPRINT_LIMITS = Object.freeze({
  MIN_TARGET_COUNT: 1,
  MAX_TARGET_COUNT: 200,
  MIN_MARKS: 1,
  MAX_MARKS: 20,
  MIN_ESTIMATED_TIME_SECONDS: 10,
  MAX_ESTIMATED_TIME_SECONDS: 3600,
  MIN_REASONING_STEPS: 1,
  MAX_REASONING_STEPS: 10,
  MAX_MISCONCEPTION_TARGETS: 10,
  MAX_VOCABULARY_CONSTRAINTS: 20,
  MAX_ACCESSIBILITY_CONSTRAINTS: 20,
  MAX_ORIGINALITY_CONSTRAINTS: 20,
  MAX_GENERATION_CONSTRAINTS: 20,
  MAX_LEARNING_OBJECTIVE_LENGTH: 500,
  MAX_CONSTRAINT_TEXT_LENGTH: 300,
});
