import type { Question } from "@/schemas/question.schema";
import type { CandidateQuestion } from "../ingestion/candidate-question";
import { hashJson } from "../provenance";
import { solverValueMatches } from "./solver-verification";
import { SCHOLARSHIP_MATHS_FIRST_PARTY_SOLVERS } from "./scholarship-maths-solvers";

export type ScholarshipQuestionLike = Question | CandidateQuestion;

export interface ScholarshipAttestationResult {
  readonly ok: boolean;
  readonly computedValue?: number;
  readonly matchedOptionId?: string;
  readonly contentHash?: string;
  readonly error?:
    | "not_scholarship_attested_item"
    | "content_hash_mismatch"
    | "missing_first_party_solver"
    | "solver_execution_failed"
    | "prompt_givens_mismatch"
    | "unsupported_question_shape"
    | "option_match_ambiguous"
    | "key_mismatch";
  readonly message?: string;
}

/**
 * A first-party recompute entry. `givens` are the numbers stated in the item
 * prompt (the gate fails closed unless the prompt states exactly this set), and
 * `solve` recomputes the answer from them by a method that is independent of
 * the draft sidecar's constraint strings: forward simulation, exhaustive
 * enumeration over a story-level domain, Cramer's rule or reverse arithmetic.
 */
export interface ScholarshipSolverEntry {
  readonly givens: readonly number[];
  readonly solve: (givens: readonly number[]) => number;
  /** Fixed affixes every option of the item carries (for example `$` or `m²`); absent means bare numbers. */
  readonly unit?: ScholarshipAnswerUnit;
  /**
   * How the prompt's numbers are fingerprinted against `givens`. `integers` (default) is the original whole-number
   * tokeniser. `quantities` reads signed, comma-grouped and decimal quantities and is used by the mathematics registry.
   */
  readonly tokens?: "integers" | "quantities";
}

/** Exact prefix and suffix an option must carry around its number, so units are compared rather than stripped. */
export interface ScholarshipAnswerUnit {
  readonly prefix?: string;
  readonly suffix?: string;
}

/** Skills whose answers must be attested by a first-party solver rather than candidate-supplied solverParams. */
export const SCHOLARSHIP_ATTESTED_SKILLS: ReadonlySet<string> = new Set([
  "nr-arithmetical-reasoning",
  "nr-logic-deduction-numbers",
]);

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

/** Exactly one value in `domain` may satisfy `holds`; zero or several is a defect, never a guess. */
function onlyValue(domain: readonly number[], holds: (value: number) => boolean, label: string): number {
  const hits = domain.filter(holds);
  if (hits.length !== 1) throw new Error(`${label}: expected exactly one solution, found ${hits.length}`);
  return hits[0];
}

const digitsOf = (value: number): number[] => String(value).split("").map(Number);

const isPrime = (value: number): boolean => {
  if (value < 2) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor += 1) if (value % divisor === 0) return false;
  return true;
};

const permutations = (values: readonly number[]): number[][] =>
  values.length === 0
    ? [[]]
    : values.flatMap((value, index) =>
        permutations(values.filter((_, other) => other !== index)).map((rest) => [value, ...rest]),
      );

/**
 * Named first-party recompute solvers for scholarship numerical-reasoning items
 * nr-021..nr-040 (arithmetical reasoning and numeric logic deduction).
 *
 * Nothing here reads the answer key, an option, a sidecar `correctValue`, or
 * candidate-supplied logic. Each solver is a genuine computation over the
 * numbers stated in the prompt; an answer is accepted only if it equals the
 * key because the arithmetic says so.
 */
export const SCHOLARSHIP_FIRST_PARTY_SOLVERS: Readonly<Record<string, ScholarshipSolverEntry>> = {
  // heads 24, legs 68; chickens have 2 legs, sheep 4
  "scholarship-y6-nr-021": {
    givens: [24, 68],
    solve: ([heads, legs]) => onlyValue(range(0, heads), (sheep) => 2 * (heads - sheep) + 4 * sheep === legs, "nr-021"),
  },
  // Marcus is 3x Chloe; in 8 years Marcus is twice Chloe
  "scholarship-y6-nr-022": {
    givens: [8],
    solve: ([years]) =>
      onlyValue(range(1, 100), (chloe) => 3 * chloe + years === 2 * (chloe + years), "nr-022"),
  },
  // 3N + 2P = 19 and 2N + 4P = 18 solved by Cramer's rule
  "scholarship-y6-nr-023": {
    // purchases: a1 notebooks + b1 pens = c1, a2 notebooks + b2 pens = c2; the prompt also states "1 notebook"
    givens: [3, 2, 19, 2, 4, 18, 1],
    unit: { prefix: "$" },
    solve: ([a1, b1, c1, a2, b2, c2, unit]) => {
      const det = a1 * b2 - b1 * a2;
      if (det === 0) throw new Error("nr-023: singular system");
      return (unit * (c1 * b2 - b1 * c2)) / det;
    },
  },
  // 84 cm cut into two pieces, one 16 cm longer
  "scholarship-y6-nr-024": {
    givens: [84, 16],
    solve: ([total, extra]) => onlyValue(range(1, total), (shorter) => shorter + (shorter + extra) === total, "nr-024"),
  },
  // reverse the bus route from the final count
  "scholarship-y6-nr-025": {
    givens: [6, 10, 18],
    solve: ([off, on, final]) => {
      const beforeSecondStop = final * 2; // half got off
      return beforeSecondStop - on + off; // undo first stop (+10, -6)
    },
  },
  // five consecutive integers, sum 135; ask for the largest
  "scholarship-y6-nr-026": {
    givens: [135],
    solve: ([total]) => {
      const count = 5; // "five" is stated in words
      const first = onlyValue(
        range(1, total),
        (start) => range(start, start + count - 1).reduce((sum, value) => sum + value, 0) === total,
        "nr-026",
      );
      return first + count - 1;
    },
  },
  // apples $2, mangoes $5, 12 pieces for $39
  "scholarship-y6-nr-027": {
    givens: [2, 5, 12, 39],
    solve: ([applePrice, mangoPrice, pieces, paid]) =>
      onlyValue(range(0, pieces), (mangoes) => applePrice * (pieces - mangoes) + mangoPrice * mangoes === paid, "nr-027"),
  },
  // Ethan has twice Oliver's cards; after giving 15 they are equal
  "scholarship-y6-nr-028": {
    givens: [15],
    solve: ([given]) =>
      onlyValue(range(1, 500), (ethan) => ethan % 2 === 0 && ethan - given === ethan / 2 + given, "nr-028"),
  },
  // 30 questions, +4 correct, -1 wrong, all attempted, 85 marks
  "scholarship-y6-nr-029": {
    givens: [30, 4, 1, 85],
    solve: ([questions, right, wrong, score]) =>
      onlyValue(range(0, questions), (correct) => right * correct - wrong * (questions - correct) === score, "nr-029"),
  },
  // perimeter 54 m, length 7 m longer than width; ask for the length
  "scholarship-y6-nr-030": {
    givens: [54, 7],
    solve: ([perimeter, extra]) => {
      const width = onlyValue(range(1, perimeter / 2), (w) => 2 * (w + (w + extra)) === perimeter, "nr-030");
      return width + extra;
    },
  },
  // two-digit N: tens digit 3 more than units; N / digit-sum -> quotient 7 remainder 3
  "scholarship-y6-nr-031": {
    givens: [3, 7],
    solve: ([tensExtra, quotient]) =>
      onlyValue(
        range(10, 99),
        (n) => {
          const [tens, units] = digitsOf(n);
          const digitSum = tens + units;
          return tens - units === tensExtra && Math.floor(n / digitSum) === quotient && n % digitSum === tensExtra;
        },
        "nr-031",
      ),
  },
  // AB + A = 52 with distinct non-zero digits; ask for B
  "scholarship-y6-nr-032": {
    givens: [52],
    solve: ([total]) => {
      const matches = range(1, 9).flatMap((a) =>
        range(1, 9)
          .filter((b) => a !== b && 10 * a + b + a === total)
          .map((b) => b),
      );
      if (matches.length !== 1) throw new Error(`nr-032: expected exactly one solution, found ${matches.length}`);
      return matches[0];
    },
  },
  // 3-digit N: H = 3U, T = H - 2, digit sum 12
  "scholarship-y6-nr-033": {
    givens: [3, 2, 12],
    solve: ([multiple, drop, digitSum]) =>
      onlyValue(
        range(100, 999),
        (n) => {
          const [h, t, u] = digitsOf(n);
          return h === multiple * u && t === h - drop && h + t + u === digitSum;
        },
        "nr-033",
      ),
  },
  // N mod 5 = 3, N mod 7 = 2, N < 30
  "scholarship-y6-nr-034": {
    givens: [5, 3, 7, 2, 30],
    solve: ([m1, r1, m2, r2, limit]) =>
      onlyValue(range(1, limit - 1), (n) => n % m1 === r1 && n % m2 === r2, "nr-034"),
  },
  // Jack = Maya + 4, Noah = 2 x Maya, total 44
  "scholarship-y6-nr-035": {
    givens: [4, 44],
    solve: ([extra, total]) => onlyValue(range(1, total), (maya) => maya + (maya + extra) + 2 * maya === total, "nr-035"),
  },
  // 4A x 3 = 138 with A a single digit
  "scholarship-y6-nr-036": {
    givens: [4, 3, 138],
    solve: ([tens, factor, product]) => onlyValue(range(0, 9), (a) => (10 * tens + a) * factor === product, "nr-036"),
  },
  // two-digit prime whose digits multiply to 18 (primality, not digit order, singles out the number)
  "scholarship-y6-nr-037": {
    givens: [18],
    solve: ([product]) =>
      onlyValue(
        range(10, 99),
        (n) => {
          const [tens, units] = digitsOf(n);
          return isPrime(n) && tens * units === product;
        },
        "nr-037",
      ),
  },
  // X * Y = 72, X + Y = 18, X > Y; ask for X - Y
  "scholarship-y6-nr-038": {
    givens: [72, 18],
    solve: ([product, sum]) => {
      const pairs = range(1, product).flatMap((x) =>
        range(1, x - 1)
          .filter((y) => x * y === product && x + y === sum)
          .map((y) => x - y),
      );
      if (pairs.length !== 1) throw new Error(`nr-038: expected exactly one pair, found ${pairs.length}`);
      return pairs[0];
    },
  },
  // magic triangle, each side sums to 20, vertices 5, 7, 9; sum the three middle numbers
  "scholarship-y6-nr-039": {
    givens: [20, 5, 7, 9],
    solve: ([sideSum, v1, v2, v3]) => {
      const vertices = [v1, v2, v3];
      const middles = vertices.map((vertex, index) => sideSum - vertex - vertices[(index + 1) % 3]);
      if (middles.some((middle) => !Number.isInteger(middle) || middle <= 0)) throw new Error("nr-039: invalid middle number");
      return middles.reduce((total, middle) => total + middle, 0);
    },
  },
  // digits 1,3,5,8 once each; even; greater than 5000; smallest code
  "scholarship-y6-nr-040": {
    givens: [1, 3, 5, 8, 5000, 4],
    solve: ([d1, d2, d3, d4, floor, length]) => {
      if (length !== 4) throw new Error("nr-040: expected a 4-digit code");
      const codes = permutations([d1, d2, d3, d4])
        .map((digits) => Number(digits.join("")))
        .filter((code) => code % 2 === 0 && code > floor);
      if (codes.length === 0) throw new Error("nr-040: no code satisfies the conditions");
      return Math.min(...codes);
    },
  },
};

/** Numeric tokens stated in a prompt, as a set. */
export function promptNumbers(prompt: string): Set<number> {
  return new Set((prompt.match(/(?<![\d.,])\d+(?![\d])/g) ?? []).map(Number));
}

/**
 * Signed, comma-grouped and decimal quantities stated in a prompt, as a set. A leading minus counts only when it is
 * attached to the digits and follows a space, bracket or the start (so `(-12)` and `-6` are negative, `- 14` is not).
 */
export function promptQuantities(prompt: string): Set<number> {
  const tokens = prompt.match(/(?<![\w.,])-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g) ?? [];
  return new Set(tokens.map((token) => Number(token.replace(/,/g, ""))));
}

const UNIT_NUMBER = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;

/**
 * True when `text` is exactly `prefix + number + suffix` and the number equals `computed`.
 * Units are compared, never stripped: `$108` does not match a computed 108 with no unit, and `108 m` does not match `$`.
 */
export function optionMatchesQuantity(computed: number, text: string, unit: ScholarshipAnswerUnit = {}): boolean {
  if (!Number.isFinite(computed)) return false;
  const { prefix = "", suffix = "" } = unit;
  const normalised = text.trim().replace(/\u2212/g, "-");
  if (!normalised.startsWith(prefix) || !normalised.endsWith(suffix)) return false;
  const body = normalised.slice(prefix.length, normalised.length - suffix.length);
  if (!UNIT_NUMBER.test(body)) return false;
  return Number(body.replace(/,/g, "")) === computed;
}

/**
 * Scholarship numeracy items attested by the first-party mathematics registry (not NAPLAN/ICAS numeracy). Scoped to the
 * registered draft ids, so other scholarship numeracy candidates keep the existing solver-verification path.
 */
function isScholarshipMathsItem(question: ScholarshipQuestionLike): boolean {
  return (
    /^scholarship-y6-maths-\d{3}$/.test(question.id) &&
    question.metadata?.subject === "numeracy" &&
    question.examStyle === "scholarship_style" &&
    (question.metadata.skill ?? "").startsWith("maths-")
  );
}

/** True when the item is in scope for first-party scholarship attestation and must not use candidate solverParams. */
export function isScholarshipAttestedItem(question: ScholarshipQuestionLike): boolean {
  return (
    (question.metadata?.subject === "numerical_reasoning" && SCHOLARSHIP_ATTESTED_SKILLS.has(question.metadata.skill ?? "")) ||
    isScholarshipMathsItem(question)
  );
}

/**
 * Verifies a scholarship numerical-reasoning item against the first-party recompute registry.
 *
 * Guardrails (same as AMC attestation):
 * 1. Hash-bound: when `expectedContentHash` is supplied, current content must hash to it.
 * 2. Candidate logic is never executed: `solverParams` and any sidecar constraint strings are ignored.
 * 3. Fail closed: out-of-scope item, missing solver, throwing solver, non-finite or non-number result,
 *    prompt numbers that differ from the solver's givens, ambiguous option match or key mismatch all return ok: false.
 */
export function verifyFirstPartyScholarshipAttestation(
  question: ScholarshipQuestionLike,
  expectedContentHash?: string,
): ScholarshipAttestationResult {
  if (!isScholarshipAttestedItem(question)) {
    return {
      ok: false,
      error: "not_scholarship_attested_item",
      message: `Item '${question.id}' (subject '${question.metadata?.subject}', skill '${question.metadata?.skill}') is not a first-party attested scholarship item.`,
    };
  }

  const contentHash = hashJson(question);
  if (expectedContentHash !== undefined && contentHash !== expectedContentHash) {
    return {
      ok: false,
      error: "content_hash_mismatch",
      contentHash,
      message: `Attested content hash mismatch: question content hash is '${contentHash}', but expected '${expectedContentHash}'. Content was modified after attestation.`,
    };
  }

  // A numerical-reasoning item may only use the NR registry and a mathematics item only the mathematics registry.
  const registry = isScholarshipMathsItem(question) ? SCHOLARSHIP_MATHS_FIRST_PARTY_SOLVERS : SCHOLARSHIP_FIRST_PARTY_SOLVERS;
  const entry = Object.hasOwn(registry, question.id) ? registry[question.id] : undefined;
  if (!entry) {
    return {
      ok: false,
      error: "missing_first_party_solver",
      contentHash,
      message: `No first-party recompute solver registered for scholarship item '${question.id}'.`,
    };
  }

  const stated = entry.tokens === "quantities" ? promptQuantities(question.prompt) : promptNumbers(question.prompt);
  const given = new Set(entry.givens);
  const sameNumbers = stated.size === given.size && [...stated].every((value) => given.has(value));
  if (!sameNumbers) {
    return {
      ok: false,
      error: "prompt_givens_mismatch",
      contentHash,
      message: `Prompt states numbers {${[...stated].sort((a, b) => a - b).join(", ")}} but the registered solver for '${question.id}' is built on {${[...given].sort((a, b) => a - b).join(", ")}}.`,
    };
  }

  let computed: number;
  try {
    computed = entry.solve(entry.givens);
  } catch (error) {
    return {
      ok: false,
      error: "solver_execution_failed",
      contentHash,
      message: `First-party solver for '${question.id}' threw: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  if (typeof computed !== "number" || !Number.isFinite(computed)) {
    return {
      ok: false,
      error: "solver_execution_failed",
      contentHash,
      message: `First-party solver for '${question.id}' returned a non-finite or non-number value: ${String(computed)}`,
    };
  }

  if (question.type !== "multiple_choice" || question.answerKey.kind !== "single_option") {
    return {
      ok: false,
      error: "unsupported_question_shape",
      contentHash,
      message: `Unsupported type '${question.type}' / answerKey kind '${question.answerKey.kind}' for scholarship item '${question.id}'.`,
    };
  }

  const matches = (question.options ?? []).filter((option) =>
    entry.unit ? optionMatchesQuantity(computed, option.text, entry.unit) : solverValueMatches(computed, option.text),
  );
  if (matches.length === 0) {
    return {
      ok: false,
      error: "key_mismatch",
      computedValue: computed,
      contentHash,
      message: `First-party solver computed ${computed}, which matches no declared option.`,
    };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      error: "option_match_ambiguous",
      computedValue: computed,
      contentHash,
      message: `First-party solver computed ${computed}, which matches ${matches.length} options.`,
    };
  }
  if (matches[0].id !== question.answerKey.optionId) {
    return {
      ok: false,
      error: "key_mismatch",
      computedValue: computed,
      matchedOptionId: matches[0].id,
      contentHash,
      message: `First-party solver computed option '${matches[0].id}' (${matches[0].text}), but the declared key is '${question.answerKey.optionId}'.`,
    };
  }
  return { ok: true, computedValue: computed, matchedOptionId: matches[0].id, contentHash };
}
