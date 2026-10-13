import type { SolverResult } from "./types";

export type MatrixOrientation = "row" | "column" | "diagonal";

export interface NumberMatrixParams {
  grid: (number | null)[][]; // 3x3 grid with exactly one null (representing '?')
  ruleOrientation?: MatrixOrientation;
  ruleOperation?: "sum" | "product" | "linear" | "diff";
}

/**
 * Solves a 3x3 number matrix puzzle with row, column, or diagonal rules.
 * Supported rule types:
 * - Constant sum: row sums, col sums, or diag sums are all equal.
 * - Constant product: row products or col products are all equal.
 * - Linear combination / two-term operation: e.g. R3 = R1 + R2, or col3 = 2 * col1 + col2, or cell3 = cell1 + 2*cell2.
 * - Constant row / col difference: cell3 - cell2 = cell2 - cell1 across all rows or columns.
 */
export function solveNumberMatrix(params: NumberMatrixParams): SolverResult<number> {
  const { grid } = params;

  if (!grid || grid.length !== 3 || grid.some(row => !row || row.length !== 3)) {
    return { unique: false, error: "Matrix must be a 3x3 grid" };
  }

  // Find the unique null position
  let nullRow = -1;
  let nullCol = -1;
  let nullCount = 0;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[r][c] === null) {
        nullRow = r;
        nullCol = c;
        nullCount++;
      }
    }
  }

  if (nullCount !== 1) {
    return { unique: false, error: `Matrix must contain exactly one null cell (found ${nullCount})` };
  }

  const solutions = new Map<number, string>();

  const completeRowSums: number[] = [];
  for (let r = 0; r < 3; r++) {
    if (r !== nullRow) {
      completeRowSums.push(grid[r][0]! + grid[r][1]! + grid[r][2]!);
    }
  }

  const completeColSums: number[] = [];
  for (let c = 0; c < 3; c++) {
    if (c !== nullCol) {
      completeColSums.push(grid[0][c]! + grid[1][c]! + grid[2][c]!);
    }
  }

  // Check 1: Row constant sum
  if (!params.ruleOrientation || params.ruleOrientation === "row") {
    if (completeRowSums.length === 2 && completeRowSums[0] === completeRowSums[1]) {
      const targetSum = completeRowSums[0];
      const otherSum = (grid[nullRow][0] ?? 0) + (grid[nullRow][1] ?? 0) + (grid[nullRow][2] ?? 0);
      const ans = targetSum - otherSum;
      solutions.set(ans, `Row sum rule: each row sums to ${targetSum}`);
    }
  }

  // Check 2: Column constant sum
  if (!params.ruleOrientation || params.ruleOrientation === "column") {
    if (completeColSums.length === 2 && completeColSums[0] === completeColSums[1]) {
      const targetSum = completeColSums[0];
      const otherSum = (grid[0][nullCol] ?? 0) + (grid[1][nullCol] ?? 0) + (grid[2][nullCol] ?? 0);
      const ans = targetSum - otherSum;
      solutions.set(ans, `Column sum rule: each column sums to ${targetSum}`);
    }
  }

  // Check 3: Row arithmetic progression / constant difference across cells (c2 - c1 == c3 - c2)
  if (!params.ruleOrientation || params.ruleOrientation === "row") {
    const completeRowDiffs: number[] = [];
    for (let r = 0; r < 3; r++) {
      if (r !== nullRow) {
        const d1 = grid[r][1]! - grid[r][0]!;
        const d2 = grid[r][2]! - grid[r][1]!;
        if (d1 === d2) completeRowDiffs.push(d1);
      }
    }
    if (completeRowDiffs.length === 2 && completeRowDiffs[0] === completeRowDiffs[1]) {
      const d = completeRowDiffs[0];
      let ans: number;
      if (nullCol === 2) ans = grid[nullRow][1]! + d;
      else if (nullCol === 1) ans = grid[nullRow][0]! + d;
      else ans = grid[nullRow][1]! - d;
      solutions.set(ans, `Row difference rule: cells increase by ${d} across each row`);
    }
  }

  // Check 4: Column arithmetic progression / constant difference down cells (r2 - r1 == r3 - r2)
  if (!params.ruleOrientation || params.ruleOrientation === "column") {
    const completeColDiffs: number[] = [];
    for (let c = 0; c < 3; c++) {
      if (c !== nullCol) {
        const d1 = grid[1][c]! - grid[0][c]!;
        const d2 = grid[2][c]! - grid[1][c]!;
        if (d1 === d2) completeColDiffs.push(d1);
      }
    }
    if (completeColDiffs.length === 2 && completeColDiffs[0] === completeColDiffs[1]) {
      const d = completeColDiffs[0];
      let ans: number;
      if (nullRow === 2) ans = grid[1][nullCol]! + d;
      else if (nullRow === 1) ans = grid[0][nullCol]! + d;
      else ans = grid[1][nullCol]! - d;
      solutions.set(ans, `Column difference rule: cells increase by ${d} down each column`);
    }
  }

  // Check 5: Row linear combination: cell3 = a * cell1 + b * cell2
  if (!params.ruleOrientation || params.ruleOrientation === "row") {
    for (let a = -5; a <= 5; a++) {
      for (let b = -5; b <= 5; b++) {
        if (a === 0 && b === 0) continue;
        let holds = true;
        for (let r = 0; r < 3; r++) {
          if (r !== nullRow) {
            if (grid[r][2]! !== a * grid[r][0]! + b * grid[r][1]!) {
              holds = false;
              break;
            }
          }
        }
        if (holds) {
          let ans: number | null = null;
          if (nullCol === 2) ans = a * grid[nullRow][0]! + b * grid[nullRow][1]!;
          else if (nullCol === 1 && b !== 0) {
            const rem = grid[nullRow][2]! - a * grid[nullRow][0]!;
            if (rem % b === 0) ans = rem / b;
          } else if (nullCol === 0 && a !== 0) {
            const rem = grid[nullRow][2]! - b * grid[nullRow][1]!;
            if (rem % a === 0) ans = rem / a;
          }
          if (ans !== null) {
            solutions.set(ans, `Row combination rule: cell[2] = ${a}*cell[0] + ${b}*cell[1]`);
          }
        }
      }
    }
  }

  // Check 6: Column linear combination: r3 = a * r1 + b * r2
  if (!params.ruleOrientation || params.ruleOrientation === "column") {
    for (let a = -5; a <= 5; a++) {
      for (let b = -5; b <= 5; b++) {
        if (a === 0 && b === 0) continue;
        let holds = true;
        for (let c = 0; c < 3; c++) {
          if (c !== nullCol) {
            if (grid[2][c]! !== a * grid[0][c]! + b * grid[1][c]!) {
              holds = false;
              break;
            }
          }
        }
        if (holds) {
          let ans: number | null = null;
          if (nullRow === 2) ans = a * grid[0][nullCol]! + b * grid[1][nullCol]!;
          else if (nullRow === 1 && b !== 0) {
            const rem = grid[2][nullCol]! - a * grid[0][nullCol]!;
            if (rem % b === 0) ans = rem / b;
          } else if (nullRow === 0 && a !== 0) {
            const rem = grid[2][nullCol]! - b * grid[1][nullCol]!;
            if (rem % a === 0) ans = rem / a;
          }
          if (ans !== null) {
            solutions.set(ans, `Column combination rule: row[2] = ${a}*row[0] + ${b}*row[1]`);
          }
        }
      }
    }
  }

  // Check 7: Main diagonals (checked when orientation is explicitly diagonal or when complete diagonal matches row/col magic sum)
  const onDiag1 = nullRow === nullCol;
  const onDiag2 = nullRow + nullCol === 2;

  if (onDiag1 || onDiag2) {
    if (params.ruleOrientation === "diagonal") {
      if (!onDiag1 && onDiag2) {
        const d1Sum = grid[0][0]! + grid[1][1]! + grid[2][2]!;
        const otherSum = (grid[0][2] ?? 0) + (grid[1][1] ?? 0) + (grid[2][0] ?? 0);
        const ans = d1Sum - otherSum;
        solutions.set(ans, `Diagonal sum rule: diagonals sum to ${d1Sum}`);
      } else if (onDiag1 && !onDiag2) {
        const d2Sum = grid[0][2]! + grid[1][1]! + grid[2][0]!;
        const otherSum = (grid[0][0] ?? 0) + (grid[1][1] ?? 0) + (grid[2][2] ?? 0);
        const ans = d2Sum - otherSum;
        solutions.set(ans, `Diagonal sum rule: diagonals sum to ${d2Sum}`);
      }
    } else if (completeRowSums.length === 2 && completeRowSums[0] === completeRowSums[1]) {
      // If row sums already hold, only consider diagonal if diagonal sum matches that same magic sum
      const magicSum = completeRowSums[0];
      if (!onDiag1 && onDiag2) {
        const d1Sum = grid[0][0]! + grid[1][1]! + grid[2][2]!;
        if (d1Sum === magicSum) {
          const otherSum = (grid[0][2] ?? 0) + (grid[1][1] ?? 0) + (grid[2][0] ?? 0);
          const ans = magicSum - otherSum;
          solutions.set(ans, `Magic square rule: rows and diagonals sum to ${magicSum}`);
        }
      } else if (onDiag1 && !onDiag2) {
        const d2Sum = grid[0][2]! + grid[1][1]! + grid[2][0]!;
        if (d2Sum === magicSum) {
          const otherSum = (grid[0][0] ?? 0) + (grid[1][1] ?? 0) + (grid[2][2] ?? 0);
          const ans = magicSum - otherSum;
          solutions.set(ans, `Magic square rule: rows and diagonals sum to ${magicSum}`);
        }
      }
    }
  }

  if (solutions.size === 0) {
    return { unique: false, error: "No consistent 3x3 matrix row/column/diagonal rule found" };
  }

  const distinctAnswers = Array.from(solutions.keys());
  if (distinctAnswers.length > 1) {
    return {
      unique: false,
      error: `Multiple contradictory matrix solutions: ${distinctAnswers.join(", ")}`,
      candidates: distinctAnswers,
    };
  }

  const answer = distinctAnswers[0];
  return {
    unique: true,
    value: answer,
    explanation: solutions.get(answer),
  };
}

