import type { SolverResult } from "./types";

export interface LetterSeriesParams {
  sequence: string[]; // e.g. ["A", "C", "E", "G"] or multi-letter clusters ["AB", "CD", "EF"]
  step?: number | number[]; // Optional declared step(s)
  targetIndex?: number;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Solves and verifies letter series and positional shift patterns:
 * - Single letter regular step: A (0), C (2), E (4), G (6) -> I (8)
 * - Multi-letter regular step: e.g. ["AB", "CD", "EF"] -> "GH"
 * - Two-step or variable regular difference
 * Wraps around cyclically modulo 26 (A-Z).
 */
export function solveLetterSeries(params: LetterSeriesParams): SolverResult<string> {
  const { sequence, targetIndex = sequence.length } = params;

  if (!sequence || sequence.length < 3) {
    return { unique: false, error: "Letter series must contain at least 3 terms" };
  }

  // Normalise to uppercase
  const upperSeq = sequence.map(s => s.trim().toUpperCase());

  // Check cluster length consistency
  const clusterLen = upperSeq[0].length;
  if (upperSeq.some(s => s.length !== clusterLen)) {
    return { unique: false, error: "All terms in letter series must have the same length" };
  }

  // Check valid letters A-Z
  for (const term of upperSeq) {
    for (const ch of term) {
      if (!ALPHABET.includes(ch)) {
        return { unique: false, error: `Invalid character '${ch}' in letter series` };
      }
    }
  }

  // Solve each position in the cluster independently
  const resultLetters: string[] = [];
  const explanations: string[] = [];

  for (let pos = 0; pos < clusterLen; pos++) {
    const posNums = upperSeq.map(term => ALPHABET.indexOf(term[pos]));

    // 1. Try constant modular step (step d in 1..25)
    const validDeltas: number[] = [];
    for (let d = 1; d <= 25; d++) {
      let valid = true;
      for (let i = 1; i < posNums.length; i++) {
        const expected = (posNums[i - 1] + d) % 26;
        if (posNums[i] !== expected) {
          valid = false;
          break;
        }
      }
      if (valid) validDeltas.push(d);
    }

    if (validDeltas.length === 1) {
      const d = validDeltas[0];
      const steps = targetIndex - (posNums.length - 1);
      const nextNum = (posNums[posNums.length - 1] + steps * d) % 26;
      resultLetters.push(ALPHABET[nextNum]);
      explanations.push(`Pos ${pos + 1}: step +${d}`);
      continue;
    }

    // 2. Try two-step difference (e.g. +1, +2, +3, +4)
    if (posNums.length >= 4) {
      // Find diffs mod 26 in standard range [-13..12]
      const diffs: number[] = [];
      let diffConsistent = true;
      for (let i = 1; i < posNums.length; i++) {
        let diff = (posNums[i] - posNums[i - 1]) % 26;
        if (diff < 0) diff += 26;
        diffs.push(diff);
      }
      const secondDiff = (diffs[1] - diffs[0] + 26) % 26;
      for (let i = 2; i < diffs.length; i++) {
        if ((diffs[i] - diffs[i - 1] + 26) % 26 !== secondDiff) {
          diffConsistent = false;
          break;
        }
      }
      if (diffConsistent) {
        let curDiff = diffs[diffs.length - 1];
        let curNum = posNums[posNums.length - 1];
        for (let s = 0; s < targetIndex - (posNums.length - 1); s++) {
          curDiff = (curDiff + secondDiff) % 26;
          curNum = (curNum + curDiff) % 26;
        }
        resultLetters.push(ALPHABET[curNum]);
        explanations.push(`Pos ${pos + 1}: increasing step (+${secondDiff} second diff)`);
        continue;
      }
    }

    // 3. Try alternating sub-series on odd/even positions
    if (posNums.length >= 4) {
      const evens = posNums.filter((_, i) => i % 2 === 0);
      const odds = posNums.filter((_, i) => i % 2 === 1);
      const checkSub = (sub: number[]) => {
        if (sub.length < 2) return null;
        const d = (sub[1] - sub[0] + 26) % 26;
        for (let i = 2; i < sub.length; i++) {
          if ((sub[i] - sub[i - 1] + 26) % 26 !== d) return null;
        }
        return d;
      };
      const evenStep = checkSub(evens);
      const oddStep = checkSub(odds);
      if (evenStep !== null && oddStep !== null) {
        const isTargetEven = targetIndex % 2 === 0;
        const sub = isTargetEven ? evens : odds;
        const step = isTargetEven ? evenStep : oddStep;
        const nextNum = (sub[sub.length - 1] + step) % 26;
        resultLetters.push(ALPHABET[nextNum]);
        explanations.push(`Pos ${pos + 1}: alternating step`);
        continue;
      }
    }

    return {
      unique: false,
      error: `Could not find a unique deterministic pattern for letter position ${pos + 1}`,
    };
  }

  const value = resultLetters.join("");
  return {
    unique: true,
    value,
    explanation: explanations.join("; "),
  };
}
