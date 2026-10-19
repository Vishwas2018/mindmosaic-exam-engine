import type { SolverResult } from "./types";

export type NumberSeriesRule =
  | { kind: "arithmetic"; diff: number }
  | { kind: "geometric"; ratio: number }
  | { kind: "two_step_difference"; secondDiff: number }
  | { kind: "alternating"; oddRule: { diff?: number; ratio?: number }; evenRule: { diff?: number; ratio?: number } }
  | { kind: "fibonacci_like"; weights?: [number, number] };

export interface NumberSeriesParams {
  sequence: number[]; // Sequence with missing position at the end or explicit missingIndex
  rule?: NumberSeriesRule;
  targetIndex?: number; // Default is sequence.length (the next item)
}

/**
 * Solves and verifies number series:
 * - arithmetic (constant difference)
 * - geometric (constant ratio)
 * - two-step difference (differences form an arithmetic progression)
 * - alternating (interleaved sub-sequences)
 * - fibonacci-like (x[n] = a * x[n-1] + b * x[n-2], default [1, 1])
 */
export function solveNumberSeries(params: NumberSeriesParams): SolverResult<number> {
  const { sequence, rule, targetIndex = sequence.length } = params;

  if (!sequence || sequence.length < 3) {
    return { unique: false, error: "Sequence must contain at least 3 terms to establish a valid pattern" };
  }

  // If rule is explicitly provided, verify it holds on the prefix and extrapolate
  if (rule) {
    return verifyAndExtrapolate(sequence, rule, targetIndex);
  }

  // Otherwise, attempt rule deduction and ensure uniqueness among supported classes
  const candidateRules: { rule: NumberSeriesRule; nextVal: number }[] = [];

  // 1. Check Arithmetic
  const diff = sequence[1] - sequence[0];
  let isArith = true;
  for (let i = 2; i < sequence.length; i++) {
    if (sequence[i] - sequence[i - 1] !== diff) {
      isArith = false;
      break;
    }
  }
  if (isArith) {
    const steps = targetIndex - (sequence.length - 1);
    candidateRules.push({
      rule: { kind: "arithmetic", diff },
      nextVal: sequence[sequence.length - 1] + steps * diff,
    });
  }

  // 2. Check Geometric (non-zero terms, integer ratio)
  if (sequence[0] !== 0 && sequence[1] % sequence[0] === 0) {
    const ratio = sequence[1] / sequence[0];
    let isGeom = true;
    for (let i = 2; i < sequence.length; i++) {
      if (sequence[i - 1] === 0 || sequence[i] !== sequence[i - 1] * ratio) {
        isGeom = false;
        break;
      }
    }
    // Only accept geometric if ratio is not 1 (ratio 1 is arithmetic diff 0)
    if (isGeom && ratio !== 1) {
      let val = sequence[sequence.length - 1];
      for (let s = 0; s < targetIndex - (sequence.length - 1); s++) {
        val *= ratio;
      }
      candidateRules.push({
        rule: { kind: "geometric", ratio },
        nextVal: val,
      });
    }
  }

  // 3. Check Two-Step Difference (second differences constant)
  // Only check if geometric didn't already match with ratio != 1
  const isGeomMatch = candidateRules.some(c => c.rule.kind === "geometric");
  if (sequence.length >= 4 && !isGeomMatch) {
    const diffs: number[] = [];
    for (let i = 1; i < sequence.length; i++) {
      diffs.push(sequence[i] - sequence[i - 1]);
    }
    const secondDiff = diffs[1] - diffs[0];
    let isTwoStep = secondDiff !== 0; // if secondDiff == 0, it was arithmetic
    for (let i = 2; i < diffs.length; i++) {
      if (diffs[i] - diffs[i - 1] !== secondDiff) {
        isTwoStep = false;
        break;
      }
    }
    if (isTwoStep) {
      let curLast = sequence[sequence.length - 1];
      let curDiff = diffs[diffs.length - 1];
      for (let s = 0; s < targetIndex - (sequence.length - 1); s++) {
        curDiff += secondDiff;
        curLast += curDiff;
      }
      candidateRules.push({
        rule: { kind: "two_step_difference", secondDiff },
        nextVal: curLast,
      });
    }
  }

  // 4. Check Alternating (Interleaved: odd indices and even indices)
  // For automatic deduction without explicit rule, require at least 5 terms (3 evens, 2 odds or vice versa)
  // so at least one sub-sequence has 3 terms to establish a sub-pattern.
  if (sequence.length >= 5) {
    const evens: number[] = []; // index 0, 2, 4...
    const odds: number[] = [];  // index 1, 3, 5...
    for (let i = 0; i < sequence.length; i++) {
      if (i % 2 === 0) evens.push(sequence[i]);
      else odds.push(sequence[i]);
    }

    const checkSub = (sub: number[]): { isArith: boolean; diff?: number } => {
      if (sub.length < 2) return { isArith: false };
      const d = sub[1] - sub[0];
      for (let i = 2; i < sub.length; i++) {
        if (sub[i] - sub[i - 1] !== d) return { isArith: false };
      }
      return { isArith: true, diff: d };
    };

    const evenRes = checkSub(evens);
    const oddRes = checkSub(odds);
    if (evenRes.isArith && oddRes.isArith && evenRes.diff !== undefined && oddRes.diff !== undefined) {
      // Check that it's genuinely alternating and not just a single arithmetic sequence
      const isSimpleArith = isArith;
      if (!isSimpleArith) {
        const isTargetEven = targetIndex % 2 === 0;
        let nextVal: number;
        if (isTargetEven) {
          const lastEven = evens[evens.length - 1];
          nextVal = lastEven + evenRes.diff;
        } else {
          const lastOdd = odds[odds.length - 1];
          nextVal = lastOdd + oddRes.diff;
        }
        candidateRules.push({
          rule: {
            kind: "alternating",
            evenRule: { diff: evenRes.diff },
            oddRule: { diff: oddRes.diff },
          },
          nextVal,
        });
      }
    }
  }

  // 5. Check Fibonacci-like (x[n] = x[n-1] + x[n-2])
  if (sequence.length >= 4) {
    let isFib = true;
    for (let i = 2; i < sequence.length; i++) {
      if (sequence[i] !== sequence[i - 1] + sequence[i - 2]) {
        isFib = false;
        break;
      }
    }
    if (isFib) {
      const full = [...sequence];
      while (full.length <= targetIndex) {
        full.push(full[full.length - 1] + full[full.length - 2]);
      }
      candidateRules.push({
        rule: { kind: "fibonacci_like", weights: [1, 1] },
        nextVal: full[targetIndex],
      });
    }
  }

  if (candidateRules.length === 0) {
    return { unique: false, error: "No supported series pattern matches the given sequence" };
  }

  // Distinct answers check
  const distinctValues = Array.from(new Set(candidateRules.map(c => c.nextVal)));
  if (distinctValues.length > 1) {
    return {
      unique: false,
      error: `Multiple valid patterns produce contradictory answers: ${distinctValues.join(", ")}`,
      candidates: distinctValues,
    };
  }

  return {
    unique: true,
    value: distinctValues[0],
    explanation: `Series follows ${candidateRules[0].rule.kind} pattern with predicted next term ${distinctValues[0]}`,
  };
}

function verifyAndExtrapolate(
  sequence: number[],
  rule: NumberSeriesRule,
  targetIndex: number,
): SolverResult<number> {
  switch (rule.kind) {
    case "arithmetic": {
      for (let i = 1; i < sequence.length; i++) {
        if (sequence[i] - sequence[i - 1] !== rule.diff) {
          return { unique: false, error: `Sequence violates arithmetic diff ${rule.diff} at index ${i}` };
        }
      }
      const steps = targetIndex - (sequence.length - 1);
      return { unique: true, value: sequence[sequence.length - 1] + steps * rule.diff };
    }
    case "geometric": {
      for (let i = 1; i < sequence.length; i++) {
        if (sequence[i] !== sequence[i - 1] * rule.ratio) {
          return { unique: false, error: `Sequence violates geometric ratio ${rule.ratio} at index ${i}` };
        }
      }
      let val = sequence[sequence.length - 1];
      for (let s = 0; s < targetIndex - (sequence.length - 1); s++) {
        val *= rule.ratio;
      }
      return { unique: true, value: val };
    }
    case "two_step_difference": {
      const diffs: number[] = [];
      for (let i = 1; i < sequence.length; i++) {
        diffs.push(sequence[i] - sequence[i - 1]);
      }
      for (let i = 1; i < diffs.length; i++) {
        if (diffs[i] - diffs[i - 1] !== rule.secondDiff) {
          return { unique: false, error: `Sequence diffs violate second diff ${rule.secondDiff} at diff index ${i}` };
        }
      }
      let curVal = sequence[sequence.length - 1];
      let curDiff = diffs[diffs.length - 1];
      for (let s = 0; s < targetIndex - (sequence.length - 1); s++) {
        curDiff += rule.secondDiff;
        curVal += curDiff;
      }
      return { unique: true, value: curVal };
    }
    case "alternating": {
      const { oddRule, evenRule } = rule;
      for (let i = 2; i < sequence.length; i++) {
        const isEven = i % 2 === 0;
        const subRule = isEven ? evenRule : oddRule;
        if (subRule.diff !== undefined && sequence[i] - sequence[i - 2] !== subRule.diff) {
          return { unique: false, error: `Alternating sequence violates diff at index ${i}` };
        }
        if (subRule.ratio !== undefined && sequence[i] !== sequence[i - 2] * subRule.ratio) {
          return { unique: false, error: `Alternating sequence violates ratio at index ${i}` };
        }
      }
      const isTargetEven = targetIndex % 2 === 0;
      const subRule = isTargetEven ? evenRule : oddRule;
      const prevSubVal = sequence[targetIndex - 2];
      if (subRule.diff !== undefined) {
        return { unique: true, value: prevSubVal + subRule.diff };
      }
      if (subRule.ratio !== undefined) {
        return { unique: true, value: prevSubVal * subRule.ratio };
      }
      return { unique: false, error: "Invalid alternating rule specification" };
    }
    case "fibonacci_like": {
      const [w1, w2] = rule.weights ?? [1, 1];
      for (let i = 2; i < sequence.length; i++) {
        if (sequence[i] !== w1 * sequence[i - 1] + w2 * sequence[i - 2]) {
          return { unique: false, error: `Sequence violates fibonacci-like recurrence at index ${i}` };
        }
      }
      const full = [...sequence];
      while (full.length <= targetIndex) {
        full.push(w1 * full[full.length - 1] + w2 * full[full.length - 2]);
      }
      return { unique: true, value: full[targetIndex] };
    }
    default:
      return { unique: false, error: "Unknown series rule kind" };
  }
}
