import type { ScholarshipSolverEntry, ScholarshipAnswerUnit } from "./scholarship-attestation";

/**
 * First-party recompute solvers for the forty Year 6 scholarship mathematics draft items (maths-001..maths-040).
 *
 * Same guardrails as the numerical-reasoning registry: nothing here reads the answer key, an option, a sidecar
 * `correctValue` or any candidate-supplied constraint string. Each solver recomputes the answer from the numbers the
 * prompt states, by a method that is independent of the draft explanation (forward simulation, enumeration over a
 * story-level domain, Cramer's rule, exact integer arithmetic). A result that is not an exact integer, a domain that
 * admits zero or several solutions, or an out-of-range given all throw, so the gate fails closed rather than guessing.
 *
 * `givens` is the prompt's own number set: the gate refuses to attest an item whose prompt states different numbers.
 * Numbers a prompt gives only in words ("three pieces", "twice") and constants of the domain (180 degrees in a
 * triangle, 60 minutes in an hour) are named constants inside the solver, never read from the key.
 */

const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, index) => from + index);

/** Exactly one value in `domain` may satisfy `holds`; zero or several is a defect, never a guess. */
function onlyValue(domain: readonly number[], holds: (value: number) => boolean, label: string): number {
  const hits = domain.filter(holds);
  if (hits.length !== 1) throw new Error(`${label}: expected exactly one solution, found ${hits.length}`);
  return hits[0];
}

/** Integer division that refuses to round: a non-integer quotient means the item or the solver is wrong. */
function exactDiv(numerator: number, denominator: number, label: string): number {
  if (denominator === 0) throw new Error(`${label}: division by zero`);
  const quotient = numerator / denominator;
  if (!Number.isInteger(quotient)) throw new Error(`${label}: ${numerator} / ${denominator} is not a whole number`);
  return quotient;
}

/** Whole cents from a stated dollar or decimal amount, refusing anything finer than one hundredth. */
function toHundredths(value: number, label: string): number {
  const scaled = Math.round(value * 100);
  if (Math.abs(scaled - value * 100) > 1e-9) throw new Error(`${label}: ${value} has more than two decimal places`);
  return scaled;
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

const DEGREES_IN_TRIANGLE = 180;
const DEGREES_ON_STRAIGHT_LINE = 180;
const MINUTES_PER_HOUR = 60;

function entry(
  givens: readonly number[],
  unit: ScholarshipAnswerUnit | undefined,
  solve: (givens: readonly number[]) => number,
): ScholarshipSolverEntry {
  return { givens, solve, tokens: "quantities", ...(unit ? { unit } : {}) };
}

const celsius: ScholarshipAnswerUnit = { suffix: "°C" };
const degrees: ScholarshipAnswerUnit = { suffix: "°" };
const dollars: ScholarshipAnswerUnit = { prefix: "$" };
const percent: ScholarshipAnswerUnit = { suffix: "%" };
const metres: ScholarshipAnswerUnit = { suffix: " m" };
const squareMetres: ScholarshipAnswerUnit = { suffix: " m²" };
const centimetres: ScholarshipAnswerUnit = { suffix: " cm" };

export const SCHOLARSHIP_MATHS_FIRST_PARTY_SOLVERS: Readonly<Record<string, ScholarshipSolverEntry>> = {
  // -6 degrees at dawn, rises 14, then falls 11
  "scholarship-y6-maths-001": entry([-6, 14, 11], celsius, ([start, rise, fall]) => {
    let temperature = start;
    temperature += rise;
    temperature -= fall;
    return temperature;
  }),
  // depth -180 m (stated as 180 m below sea level), ascends 65, dives 45, ascends 90
  "scholarship-y6-maths-002": entry([180, -180, 65, 45, 90], metres, ([below, signed, up, down, upAgain]) => {
    if (signed !== -below) throw new Error("maths-002: signed depth does not match the stated depth below sea level");
    let level = signed;
    level += up;
    level -= down;
    level += upAgain;
    return level;
  }),
  // (-12) - (-25) + (-8) - 14
  "scholarship-y6-maths-003": entry([-12, -25, -8, 14], undefined, ([a, b, c, d]) => a - b + c - d),
  // summit 2228 m, Lake Eyre 15 m below sea level (-15 m); difference in elevation
  "scholarship-y6-maths-004": entry([2228, 15, -15], metres, ([summit, below, signed]) => {
    if (signed !== -below) throw new Error("maths-004: signed elevation does not match the stated depth below sea level");
    return summit - signed;
  }),
  // descends from 0 m at 4 m/s for 45 s, simulated second by second
  "scholarship-y6-maths-005": entry([0, 4, 45], metres, ([start, speed, seconds]) => {
    let elevation = start;
    for (let second = 1; second <= seconds; second += 1) elevation -= speed;
    return elevation;
  }),
  // 1200 L tank, 3/8 full, 350 L pumped out
  "scholarship-y6-maths-006": entry([1200, 3, 8, 350], { suffix: " L" }, ([capacity, numerator, denominator, pumped]) =>
    exactDiv(capacity * numerator, denominator, "maths-006") - pumped,
  ),
  // $160 jacket, 25% off, then a further 10% off the sale price (cents-exact)
  "scholarship-y6-maths-007": entry([160, 25, 10], dollars, ([price, firstOff, secondOff]) => {
    const afterFirst = exactDiv(price * (100 - firstOff), 100, "maths-007 first discount");
    return exactDiv(afterFirst * (100 - secondOff), 100, "maths-007 second discount");
  }),
  // 360 votes, winner 55%, second 35%; how many more votes did the winner get
  "scholarship-y6-maths-008": entry([360, 55, 35], undefined, ([votes, winnerPercent, secondPercent]) =>
    exactDiv(votes * winnerPercent, 100, "maths-008 winner") - exactDiv(votes * secondPercent, 100, "maths-008 second"),
  ),
  // 4.8 m plank, three 85 cm pieces and one 1.25 m piece cut off; remainder in centimetres
  "scholarship-y6-maths-009": entry([4.8, 85, 1.25], centimetres, ([plankMetres, pieceCentimetres, longPieceMetres]) => {
    const pieces = 3; // "three pieces" is stated in words
    return toHundredths(plankMetres, "maths-009 plank") - pieces * pieceCentimetres - toHundredths(longPieceMetres, "maths-009 piece");
  }),
  // population 12,000 (2015) to 15,000 (2025); percentage increase over the decade
  "scholarship-y6-maths-010": entry([12000, 15000, 2015, 2025], percent, ([before, after, fromYear, toYear]) => {
    if (toYear - fromYear !== 10) throw new Error("maths-010: the stated years are not a decade apart");
    return exactDiv((after - before) * 100, before, "maths-010");
  }),
  // 420 books; 3/7 astronomy, 1/4 biology, no book in both; how many are neither
  "scholarship-y6-maths-011": entry([420, 3, 7, 1, 4], undefined, ([books, astroTop, astroBottom, bioTop, bioBottom]) => {
    const astronomy = exactDiv(books * astroTop, astroBottom, "maths-011 astronomy");
    const biology = exactDiv(books * bioTop, bioBottom, "maths-011 biology");
    const both = 0; // "No book is in both groups"
    return books - (astronomy + biology - both);
  }),
  // $72,000 shared in the ratio 2 : 3 : 4; the garden is the second project
  "scholarship-y6-maths-012": entry([72000, 2, 3, 4], dollars, ([total, ...parts]) =>
    exactDiv(total * parts[1], sum(parts), "maths-012"),
  ),
  // 210 km in 75 minutes at constant speed; distance in 100 minutes
  "scholarship-y6-maths-013": entry([210, 75, 100], { suffix: " km" }, ([distance, minutes, newMinutes]) =>
    exactDiv(distance * newMinutes, minutes, "maths-013"),
  ),
  // sprinters : distance runners = 5 : 3, sprinters outnumber runners by 30; athletes altogether
  "scholarship-y6-maths-014": entry([5, 3, 30], undefined, ([sprinterParts, runnerParts, gap]) => {
    const unit = onlyValue(range(1, 1000), (size) => sprinterParts * size - runnerParts * size === gap, "maths-014");
    return (sprinterParts + runnerParts) * unit;
  }),
  // brand A 750 g for $6.00, brand B 1200 g for $8.40; how many cents cheaper per 100 g is B
  "scholarship-y6-maths-015": entry([750, 6, 1200, 8.4, 100], { suffix: " cents" }, ([gramsA, dollarsA, gramsB, dollarsB, perGrams]) => {
    const perHundredA = exactDiv(toHundredths(dollarsA, "maths-015 A") * perGrams, gramsA, "maths-015 A per 100 g");
    const perHundredB = exactDiv(toHundredths(dollarsB, "maths-015 B") * perGrams, gramsB, "maths-015 B per 100 g");
    return perHundredA - perHundredB;
  }),
  // 6 painters take 12 days; 3 more painters join; days for the larger team (work is conserved)
  "scholarship-y6-maths-016": entry([6, 12, 3], { suffix: " days" }, ([painters, days, extra]) => {
    const workload = painters * days;
    const team = painters + extra;
    return onlyValue(range(1, workload), (candidate) => team * candidate === workload, "maths-016");
  }),
  // cement : sand : gravel = 1 : 2 : 3 in 2400 kg; sand is the second ingredient
  "scholarship-y6-maths-017": entry([1, 2, 3, 2400], { suffix: " kg" }, ([cement, sand, gravel, total]) =>
    exactDiv(total * sand, cement + sand + gravel, "maths-017"),
  ),
  // 4x + 19 = 71
  "scholarship-y6-maths-018": entry([4, 19, 71], undefined, ([coefficient, added, result]) =>
    onlyValue(range(-1000, 1000), (x) => coefficient * x + added === result, "maths-018"),
  ),
  // Ethan is 4 years older than Mia; the ages sum to 32; Ethan's age
  "scholarship-y6-maths-019": entry([4, 32], { suffix: " years old" }, ([gap, total]) => {
    const mia = onlyValue(range(0, total), (age) => age + (age + gap) === total, "maths-019");
    return mia + gap;
  }),
  // 7y - 15 = 3y + 29
  "scholarship-y6-maths-020": entry([7, 15, 3, 29], undefined, ([left, takeAway, right, plus]) =>
    onlyValue(range(-1000, 1000), (y) => left * y - takeAway === right * y + plus, "maths-020"),
  ),
  // three consecutive odd numbers sum to 87; the largest
  "scholarship-y6-maths-021": entry([87], undefined, ([total]) => {
    const count = 3; // "three consecutive odd numbers" is stated in words
    const first = onlyValue(
      range(1, total).filter((n) => n % 2 === 1),
      (start) => sum(range(0, count - 1).map((step) => start + 2 * step)) === total,
      "maths-021",
    );
    return first + 2 * (count - 1);
  }),
  // 3 apples + 2 mangoes = $12 and 1 apple + 4 mangoes = $14; Cramer's rule for the mango
  "scholarship-y6-maths-022": entry([3, 2, 12, 1, 4, 14], dollars, ([a1, m1, c1, a2, m2, c2]) => {
    const determinant = a1 * m2 - m1 * a2;
    if (determinant === 0) throw new Error("maths-022: singular system");
    return exactDiv(a1 * c2 - c1 * a2, determinant, "maths-022");
  }),
  // p = 5, q = 3, r = 4: 3p + 2qr - 7
  "scholarship-y6-maths-023": entry([5, 3, 4, 3, 2, 7], undefined, ([p, q, r, pCoefficient, qrCoefficient, taken]) => {
    const terms = [pCoefficient * p, qrCoefficient * q * r];
    return sum(terms) - taken;
  }),
  // (2w + 5) / 3 = 11
  "scholarship-y6-maths-024": entry([2, 5, 3, 11], undefined, ([coefficient, added, divisor, result]) =>
    onlyValue(range(-1000, 1000), (w) => (coefficient * w + added) % divisor === 0 && (coefficient * w + added) / divisor === result, "maths-024"),
  ),
  // 6n - 14 = 18 more than twice n
  "scholarship-y6-maths-025": entry([6, 14, 18], undefined, ([multiple, decrease, extra]) => {
    const twice = 2; // "twice the number" is stated in words
    return onlyValue(range(-1000, 1000), (n) => multiple * n - decrease === twice * n + extra, "maths-025");
  }),
  // vertically opposite angles (3x + 15) and (5x - 25) are equal
  "scholarship-y6-maths-026": entry([3, 15, 5, 25], degrees, ([a, b, c, d]) => {
    const x = onlyValue(range(1, 90), (candidate) => a * candidate + b === c * candidate - d, "maths-026");
    return a * x + b;
  }),
  // angle A = 2B, angle C = B + 20, angles of a triangle sum to 180; the size of A
  "scholarship-y6-maths-027": entry([20], degrees, ([extra]) => {
    const factor = 2; // "twice angle B" is stated in words
    const b = onlyValue(range(1, DEGREES_IN_TRIANGLE), (angle) => factor * angle + angle + (angle + extra) === DEGREES_IN_TRIANGLE, "maths-027");
    return factor * b;
  }),
  // perimeter 96 m, length 12 m more than width; area
  "scholarship-y6-maths-028": entry([96, 12], squareMetres, ([perimeter, extra]) => {
    const width = onlyValue(range(1, perimeter / 2), (w) => 2 * (w + (w + extra)) === perimeter, "maths-028");
    return width * (width + extra);
  }),
  // adjacent angles on a straight line: one is 36 less than three times the other; the smaller angle
  "scholarship-y6-maths-029": entry([36], degrees, ([less]) => {
    const multiple = 3; // "three times" is stated in words
    const x = onlyValue(range(1, DEGREES_ON_STRAIGHT_LINE - 1), (angle) => angle + (multiple * angle - less) === DEGREES_ON_STRAIGHT_LINE, "maths-029");
    return Math.min(x, multiple * x - less);
  }),
  // 80 cm x 50 cm base, 45 cm tall tank, 120 L poured in (1 L = 1000 cm3); water height
  "scholarship-y6-maths-030": entry([80, 50, 45, 120, 1, 1000], centimetres, ([length, width, tankHeight, litres, litreCount, cubicCentimetres]) => {
    const volume = exactDiv(litres * cubicCentimetres, litreCount, "maths-030 volume");
    const height = exactDiv(volume, length * width, "maths-030 height");
    if (height > tankHeight) throw new Error("maths-030: the water would overflow the tank");
    return height;
  }),
  // 40 m square park with a 12 m square pavilion; grassed area
  "scholarship-y6-maths-031": entry([40, 12], squareMetres, ([park, pavilion]) => park * park - pavilion * pavilion),
  // interior angle of a regular octagon: exterior angles of any convex polygon sum to 360
  "scholarship-y6-maths-032": entry([8], degrees, ([sides]) => {
    const turnAroundShape = 360; // exterior angles of a convex polygon
    return DEGREES_ON_STRAIGHT_LINE - exactDiv(turnAroundShape, sides, "maths-032");
  }),
  // 7 red, 9 blue, 4 green; probability (percent) that a marble is not green, by enumerating marbles
  "scholarship-y6-maths-033": entry([7, 9, 4], percent, ([red, blue, green]) => {
    const bag = [...Array(red).fill("red"), ...Array(blue).fill("blue"), ...Array(green).fill("green")] as string[];
    const notGreen = bag.filter((colour) => colour !== "green").length;
    return exactDiv(notGreen * 100, bag.length, "maths-033");
  }),
  // two dice; outcomes (of 36) whose sum is 7 or 8, by enumeration
  "scholarship-y6-maths-034": entry([7, 8, 36], { suffix: " outcomes" }, ([first, second, outcomes]) => {
    const faces = range(1, 6);
    const all = faces.flatMap((a) => faces.map((b) => a + b));
    if (all.length !== outcomes) throw new Error("maths-034: the stated number of outcomes does not match two six-sided dice");
    return all.filter((total) => total === first || total === second).length;
  }),
  // 30 students; 18 soccer, 15 basketball, 7 both; how many play neither
  "scholarship-y6-maths-035": entry([30, 18, 15, 7], { suffix: " students" }, ([students, soccer, basketball, both]) =>
    onlyValue(range(0, students), (neither) => soccer - both + (basketball - both) + both + neither === students, "maths-035"),
  ),
  // 18 km uphill at 12 km/h and back at 36 km/h; total minutes
  "scholarship-y6-maths-036": entry([18, 12, 36], { suffix: " minutes" }, ([distance, uphill, back]) =>
    exactDiv(distance * MINUTES_PER_HOUR, uphill, "maths-036 uphill") + exactDiv(distance * MINUTES_PER_HOUR, back, "maths-036 return"),
  ),
  // 24 degrees, cooled by 7 per minute for 5 minutes, then heated by 3
  "scholarship-y6-maths-037": entry([24, 7, 5, 3], celsius, ([start, cooling, minutes, heating]) => {
    let temperature = start;
    for (let minute = 1; minute <= minutes; minute += 1) temperature -= cooling;
    return temperature + heating;
  }),
  // price including 10% GST is $440; price before GST
  "scholarship-y6-maths-038": entry([10, 440], dollars, ([gstPercent, finalPrice]) =>
    onlyValue(range(1, finalPrice), (before) => before * (100 + gstPercent) === finalPrice * 100, "maths-038"),
  ),
  // isosceles triangle with sides (2k + 3), (2k + 3) and (k + 5), perimeter 46
  "scholarship-y6-maths-039": entry([2, 3, 5, 46], undefined, ([coefficient, added, thirdAdded, perimeter]) => {
    const thirdCoefficient = 1; // the third side is "(k + 5)"
    return onlyValue(
      range(1, perimeter),
      (k) => 2 * (coefficient * k + added) + (thirdCoefficient * k + thirdAdded) === perimeter,
      "maths-039",
    );
  }),
  // PIN: first digit from {2, 4, 6}, second from {1, 3, 5, 7, 9}; distinct two-digit codes
  "scholarship-y6-maths-040": entry([2, 4, 6, 1, 3, 5, 7, 9], undefined, (digits) => {
    if (digits.some((digit) => !Number.isInteger(digit) || digit < 0 || digit > 9)) throw new Error("maths-040: a stated PIN digit is not a single digit");
    const firstDigits = digits.slice(0, 3);
    const secondDigits = digits.slice(3);
    const codes = new Set(firstDigits.flatMap((first) => secondDigits.map((second) => `${first}${second}`)));
    return codes.size;
  }),
};
