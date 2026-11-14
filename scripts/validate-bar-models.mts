/**
 * Validate every bar_model fixture through all three layers
 * (schema -> structural -> mathematical) and check each lands where it is
 * meant to: valid fixtures pass with an exact whole-number target, warning
 * fixtures raise exactly their declared warnings, and every invalid fixture
 * is rejected by its intended layer with its intended code.
 *
 *   npm run visuals:validate-bar-models
 */
import {
  barModelPilotFixtures,
  invalidBarModelFixtures,
  validBarModelFixtures,
  warningBarModelFixtures,
} from "../src/content/visual-fixtures/bar-model";
import {validateBarModelVisual} from "../src/features/visuals/bar-model/pipeline";

let failures = 0;
const fail = (message: string) => {
  failures += 1;
  console.error(`  FAIL ${message}`);
};

const fraction = (target: {numerator: string; denominator: string} | null) =>
  target === null
    ? "none"
    : target.denominator === "1"
      ? target.numerator
      : `${target.numerator}/${target.denominator}`;

console.log("=== bar_model fixture validation ===\n");

console.log("Valid fixtures");
for (const fixture of validBarModelFixtures) {
  const result = validateBarModelVisual(fixture.visual);
  const expected = fraction(fixture.target);
  const actual = fraction(result.solution?.target ?? null);
  console.log(
    `  ${fixture.name.padEnd(36)} layer=${result.layer} target=${actual} warnings=[${result.warningCodes}]`,
  );
  if (!result.ok)
    fail(
      `${fixture.name}: rejected at ${result.layer}: ${result.errorCodes.join(", ")}`,
    );
  if (actual !== expected)
    fail(`${fixture.name}: target ${actual}, expected ${expected}`);
  if (result.warningCodes.length > 0)
    fail(
      `${fixture.name}: unexpected warnings ${result.warningCodes.join(", ")}`,
    );
  if (result.ok && !result.solution?.isWhole)
    fail(`${fixture.name}: Phase 1 valid fixtures need a whole-number target`);
}

console.log("\nValid fixtures that raise warnings");
for (const fixture of warningBarModelFixtures) {
  const result = validateBarModelVisual(fixture.visual);
  const expected = fraction(fixture.target);
  const actual = fraction(result.solution?.target ?? null);
  console.log(
    `  ${fixture.name.padEnd(36)} layer=${result.layer} target=${actual} warnings=[${result.warningCodes}]`,
  );
  if (!result.ok)
    fail(
      `${fixture.name}: rejected at ${result.layer}: ${result.errorCodes.join(", ")}`,
    );
  if (actual !== expected)
    fail(`${fixture.name}: target ${actual}, expected ${expected}`);
  if (
    JSON.stringify([...result.warningCodes].sort()) !==
    JSON.stringify([...fixture.warningCodes].sort())
  ) {
    fail(
      `${fixture.name}: warnings [${result.warningCodes}], expected [${fixture.warningCodes}]`,
    );
  }
}

console.log("\nPilot fixtures");
for (const fixture of barModelPilotFixtures) {
  const result = validateBarModelVisual(fixture.visual);
  const expected = String(fixture.privateAnswerKey);
  const actual = result.solution?.target?.numerator ?? "none";
  console.log(
    `  ${fixture.name.padEnd(32)} year=${fixture.yearLevel} skill=${fixture.skill.padEnd(12)} ` +
      `layer=${result.layer} target=${actual} valid=${result.ok} warnings=[${result.warningCodes}]`,
  );
  if (!result.ok)
    fail(
      `${fixture.name}: rejected at ${result.layer}: ${result.errorCodes.join(", ")}`,
    );
  if (actual !== expected)
    fail(`${fixture.name}: target ${actual}, expected ${expected}`);
  if (result.warningCodes.length > 0)
    fail(
      `${fixture.name}: unexpected warnings ${result.warningCodes.join(", ")}`,
    );
  if (result.ok && !result.solution?.isWhole)
    fail(`${fixture.name}: pilot fixture target must be whole-number`);
}

console.log("\nInvalid fixtures");
for (const fixture of invalidBarModelFixtures) {
  const result = validateBarModelVisual(fixture.visual);
  console.log(
    `  ${fixture.name.padEnd(40)} layer=${result.layer} codes=[${result.errorCodes}]`,
  );
  if (result.ok)
    fail(`${fixture.name}: accepted, expected rejection at ${fixture.layer}`);
  else if (result.layer !== fixture.layer)
    fail(
      `${fixture.name}: rejected at ${result.layer}, expected ${fixture.layer}`,
    );
  for (const code of fixture.errorCodes) {
    if (!result.errorCodes.includes(code))
      fail(`${fixture.name}: missing code ${code}; got [${result.errorCodes}]`);
  }
}

const total =
  validBarModelFixtures.length +
  warningBarModelFixtures.length +
  invalidBarModelFixtures.length +
  barModelPilotFixtures.length;
console.log(
  failures === 0
    ? `\nAll ${total} bar_model fixtures behave as intended (including the 30 pilot items).`
    : `\n${failures} bar_model fixture check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
