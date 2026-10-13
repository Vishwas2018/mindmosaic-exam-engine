import type { SolverResult } from "./types";

export type CodeType = "caesar_shift" | "substitution" | "number_substitution" | "reverse";

export interface CodeParams {
  type: CodeType;
  // For Caesar / positional shift:
  shift?: number;
  // For substitution mapping:
  mapping?: Record<string, string>; // e.g. { "C": "X", "A": "Z", "T": "G" }
  // Examples given in question stem for deduction:
  examples?: { plain: string; coded: string }[];
  // Target to encode or decode:
  target: string;
  operation?: "encode" | "decode"; // Default is encode
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Solves and verifies substitution and shift codes:
 * - Caesar / positional shifts (e.g. +3, -2)
 * - Number substitution (A=1, B=2 ... or word-level code)
 * - Bijective letter-to-letter substitution derived from examples
 * - Reverse cipher
 */
export function solveCode(params: CodeParams): SolverResult<string> {
  const { type, shift, mapping, examples, target, operation = "encode" } = params;

  if (!target) {
    return { unique: false, error: "Target string cannot be empty" };
  }

  const upperTarget = target.toUpperCase();

  switch (type) {
    case "caesar_shift": {
      let resolvedShift = shift;
      if (resolvedShift === undefined) {
        if (!examples || examples.length === 0) {
          return { unique: false, error: "Caesar shift requires either explicit shift or examples" };
        }
        // Deduce shift from examples
        const deducedShifts = new Set<number>();
        for (const ex of examples) {
          const plain = ex.plain.toUpperCase();
          const coded = ex.coded.toUpperCase();
          if (plain.length !== coded.length) {
            return { unique: false, error: "Example plain and coded lengths do not match" };
          }
          for (let i = 0; i < plain.length; i++) {
            const pIdx = ALPHABET.indexOf(plain[i]);
            const cIdx = ALPHABET.indexOf(coded[i]);
            if (pIdx === -1 || cIdx === -1) {
              return { unique: false, error: `Non-alphabetic character in example: '${plain[i]}' -> '${coded[i]}'` };
            }
            let s = (cIdx - pIdx) % 26;
            if (s < 0) s += 26;
            deducedShifts.add(s);
          }
        }
        if (deducedShifts.size !== 1) {
          return { unique: false, error: `Inconsistent or ambiguous shift in examples: ${Array.from(deducedShifts).join(", ")}` };
        }
        resolvedShift = Array.from(deducedShifts)[0];
      }

      const normShift = ((resolvedShift! % 26) + 26) % 26;
      const effectiveShift = operation === "encode" ? normShift : (26 - normShift) % 26;
      let output = "";
      for (const ch of upperTarget) {
        const idx = ALPHABET.indexOf(ch);
        if (idx === -1) {
          output += ch; // keep spaces or punctuation unchanged
        } else {
          output += ALPHABET[(idx + effectiveShift) % 26];
        }
      }

      return {
        unique: true,
        value: output,
        explanation: `Caesar shift of ${resolvedShift} (${operation}): ${upperTarget} -> ${output}`,
      };
    }

    case "substitution": {
      // Build substitution map
      const encMap = new Map<string, string>();
      const decMap = new Map<string, string>();

      if (mapping) {
        for (const [k, v] of Object.entries(mapping)) {
          encMap.set(k.toUpperCase(), v.toUpperCase());
          decMap.set(v.toUpperCase(), k.toUpperCase());
        }
      }

      if (examples) {
        for (const ex of examples) {
          const plain = ex.plain.toUpperCase();
          const coded = ex.coded.toUpperCase();
          if (plain.length !== coded.length) {
            return { unique: false, error: "Example plain and coded lengths must match" };
          }
          for (let i = 0; i < plain.length; i++) {
            const p = plain[i];
            const c = coded[i];
            if (encMap.has(p) && encMap.get(p) !== c) {
              return { unique: false, error: `Contradictory substitution for character '${p}': '${encMap.get(p)}' vs '${c}'` };
            }
            if (decMap.has(c) && decMap.get(c) !== p) {
              return { unique: false, error: `Non-bijective substitution mapping to '${c}': '${decMap.get(c)}' vs '${p}'` };
            }
            encMap.set(p, c);
            decMap.set(c, p);
          }
        }
      }

      const activeMap = operation === "encode" ? encMap : decMap;
      let output = "";
      for (const ch of upperTarget) {
        if (!activeMap.has(ch)) {
          return { unique: false, error: `Missing substitution mapping for character '${ch}'` };
        }
        output += activeMap.get(ch)!;
      }

      return {
        unique: true,
        value: output,
        explanation: `Substitution cipher (${operation}): ${upperTarget} -> ${output}`,
      };
    }

    case "number_substitution": {
      // Standard A=1, B=2 ... Z=26 or letter-number substitution
      if (operation === "encode") {
        const parts: string[] = [];
        for (const ch of upperTarget) {
          const idx = ALPHABET.indexOf(ch);
          if (idx === -1) {
            return { unique: false, error: `Invalid character '${ch}' for number substitution` };
          }
          parts.push(String(idx + 1));
        }
        const val = parts.join("-");
        return { unique: true, value: val, explanation: `A=1..Z=26 encoding: ${upperTarget} -> ${val}` };
      } else {
        // Decoding: format "1-2-3" or list of numbers
        const nums = upperTarget.split(/[-,\s]+/).map(s => parseInt(s, 10));
        let decoded = "";
        for (const n of nums) {
          if (isNaN(n) || n < 1 || n > 26) {
            return { unique: false, error: `Invalid number code '${n}' (must be 1-26)` };
          }
          decoded += ALPHABET[n - 1];
        }
        return { unique: true, value: decoded, explanation: `A=1..Z=26 decoding: ${upperTarget} -> ${decoded}` };
      }
    }

    case "reverse": {
      const reversed = upperTarget.split("").reverse().join("");
      return {
        unique: true,
        value: reversed,
        explanation: `Reverse cipher: ${upperTarget} -> ${reversed}`,
      };
    }

    default:
      return { unique: false, error: `Unknown code type '${type}'` };
  }
}
