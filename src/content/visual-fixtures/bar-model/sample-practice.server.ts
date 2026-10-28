/**
 * Server-only sample-practice backing for the Singapore Maths student route.
 *
 * Imports the full (answer-bearing) pilot fixtures from `index.ts`. This module
 * carries its own `import "server-only"` (see below), so it and everything
 * that imports it can never be reached by a browser bundle.
 *
 * Three surfaces are exposed:
 *
 *   - `samplePracticeFixtures(yearLevel)` — answer-stripped fixtures safe to
 *     send to the client (no `privateAnswerKey`, no `workedExplanation`).
 *   - `validateSampleAnswer(questionId, answer)` — server-authoritative
 *     correctness check against the server's own copy of the answer key.
 *   - `sampleExplanation(questionId)` — worked explanation, only released
 *     after the caller has already demonstrated knowledge of the answer.
 */
import "server-only";

import {barModelPilotFixtures} from "./index";

export interface SamplePracticeFixture {
  name: string;
  yearLevel: 3 | 5;
  skill: (typeof barModelPilotFixtures)[number]["skill"];
  difficulty: (typeof barModelPilotFixtures)[number]["difficulty"];
  unit: string;
  prompt: string;
  visual: unknown;
}

const fixturesByName = new Map(
  barModelPilotFixtures.map((fixture) => [fixture.name, fixture]),
);

/** Answer-stripped fixtures for one year level, safe to send to the client. */
export function samplePracticeFixtures(
  yearLevel: 3 | 5,
): readonly SamplePracticeFixture[] {
  return barModelPilotFixtures
    .filter((fixture) => fixture.yearLevel === yearLevel)
    .map(({name, yearLevel, skill, difficulty, unit, prompt, visual}) => ({
      name,
      yearLevel,
      skill,
      difficulty,
      unit,
      prompt,
      visual,
    }));
}

/** Server-authoritative correctness check. Never returns the answer key. */
export function validateSampleAnswer(
  questionId: string,
  answer: number,
): {correct: boolean} {
  const fixture = fixturesByName.get(questionId);
  if (!fixture) return {correct: false};
  return {correct: fixture.privateAnswerKey === answer};
}

/** Worked explanation for a question. Only safe to return after a valid
 * submission — the caller must already know the answer to receive this. */
export function sampleExplanation(questionId: string): string | null {
  const fixture = fixturesByName.get(questionId);
  return fixture ? fixture.workedExplanation : null;
}
