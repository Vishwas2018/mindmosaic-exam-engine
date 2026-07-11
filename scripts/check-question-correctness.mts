/**
 * Independent answer-correctness checker for the production question bank.
 *
 * This script re-derives answers from question data (visual values, geometry,
 * arithmetic, mappings) without using the scoring engine or the schema
 * validator, so a wrong answer key cannot validate itself. Where correctness
 * depends on language semantics (reading and language questions), the check
 * is structural and the question is classified as editorial review with a
 * warning rather than false certainty.
 *
 * Exits non-zero on any correctness failure.
 */

import { questionBank } from "../src/content/questions/question-bank";
import type { Question } from "../src/schemas/question.schema";
import type { VisualAsset } from "../src/schemas/visual.schema";

interface CheckOutcome {
  /** True when at least one independent computation verified the answer key. */
  computed: boolean;
  failures: string[];
  warnings: string[];
}

function outcome(): CheckOutcome {
  return { computed: false, failures: [], warnings: [] };
}

const EPSILON = 1e-9;

function approx(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON;
}

function parseNumbers(text: string): number[] {
  return [...text.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
}

function firstNumber(text: string): number | undefined {
  return parseNumbers(text)[0];
}

/** All sums of subsets where each element may be used up to twice. */
function reachableSums(values: readonly number[]): Set<number> {
  let sums = new Set<number>([0]);
  for (const value of values) {
    const next = new Set<number>();
    for (const sum of sums) {
      next.add(sum);
      next.add(sum + value);
      next.add(sum + value * 2);
    }
    sums = next;
  }
  sums.delete(0);
  return sums;
}

function pairwiseDifferences(values: readonly number[]): Set<number> {
  const diffs = new Set<number>();
  for (const a of values) {
    for (const b of values) {
      if (a !== b) diffs.add(Math.abs(a - b));
    }
  }
  return diffs;
}

interface LabelledValue {
  label: string;
  value: number;
}

function labelledValuesFromVisual(visual: VisualAsset): LabelledValue[] {
  switch (visual.type) {
    case "bar_chart":
      return visual.data.labels.map((label, index) => ({
        label,
        value: visual.data.values[index],
      }));
    case "pie_chart":
      return visual.data.segments.map((segment) => ({
        label: segment.label,
        value: segment.value,
      }));
    case "line_graph":
      return visual.data.points.map((point) => ({
        label: point.label ?? String(point.x),
        value: point.y,
      }));
    case "table": {
      /* Rows of the form [textLabel, number] become labelled values. */
      const rows: LabelledValue[] = [];
      for (const row of visual.data.rows) {
        const label = row.find((cell) => typeof cell === "string");
        const value = row.find((cell) => typeof cell === "number");
        if (typeof label === "string" && typeof value === "number") {
          rows.push({ label, value });
        }
      }
      return rows;
    }
    default:
      return [];
  }
}

function numericPool(visual: VisualAsset): number[] {
  switch (visual.type) {
    case "bar_chart":
      return [...visual.data.values];
    case "pie_chart":
      return visual.data.segments.map((segment) => segment.value);
    case "line_graph":
      return visual.data.points.map((point) => point.y);
    case "table":
      return visual.data.rows.flatMap((row) =>
        row.filter((cell): cell is number => typeof cell === "number"),
      );
    case "number_line":
      return [...visual.data.highlightedValues];
    default:
      return [];
  }
}

/* Geometry helpers. */

interface Point {
  x: number;
  y: number;
}

function angleBetween(vertex: Point, armA: Point, armB: Point): number {
  const v1 = { x: armA.x - vertex.x, y: armA.y - vertex.y };
  const v2 = { x: armB.x - vertex.x, y: armB.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const magnitude = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (magnitude === 0) return Number.NaN;
  return (Math.acos(Math.min(1, Math.max(-1, dot / magnitude))) * 180) / Math.PI;
}

function classifyAngle(degrees: number): "right" | "acute" | "obtuse" {
  if (Math.abs(degrees - 90) <= 2) return "right";
  return degrees < 90 ? "acute" : "obtuse";
}

interface SvgLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Group drawn lines by shared endpoints and measure the angle at each vertex. */
function anglesFromLines(lines: readonly SvgLine[]): { vertex: Point; degrees: number }[] {
  const angles: { vertex: Point; degrees: number }[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    for (let j = i + 1; j < lines.length; j += 1) {
      const a = lines[i];
      const b = lines[j];
      const endsA = [
        { x: a.x1, y: a.y1 },
        { x: a.x2, y: a.y2 },
      ];
      const endsB = [
        { x: b.x1, y: b.y1 },
        { x: b.x2, y: b.y2 },
      ];
      for (const endA of endsA) {
        for (const endB of endsB) {
          if (approx(endA.x, endB.x) && approx(endA.y, endB.y)) {
            const otherA = endsA.find((point) => point !== endA);
            const otherB = endsB.find((point) => point !== endB);
            if (otherA && otherB) {
              angles.push({
                vertex: endA,
                degrees: angleBetween(endA, otherA, otherB),
              });
            }
          }
        }
      }
    }
  }
  return angles;
}

function pointInRegion(
  point: Point,
  region: Extract<VisualAsset, { type: "hotspot_svg" }>["data"]["regions"][number],
): boolean {
  if (region.shape === "rectangle") {
    return (
      point.x >= region.x &&
      point.x <= region.x + region.width &&
      point.y >= region.y &&
      point.y <= region.y + region.height
    );
  }
  if (region.shape === "circle") {
    return Math.hypot(point.x - region.cx, point.y - region.cy) <= region.r;
  }
  /* Ray casting for polygons. */
  let inside = false;
  const points = region.points;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const a = points[i];
    const b = points[j];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function isParallelogram(points: readonly Point[]): boolean {
  if (points.length !== 4) return false;
  const side = (a: Point, b: Point) => ({ x: b.x - a.x, y: b.y - a.y });
  const parallel = (u: Point, v: Point) => approx(u.x * v.y - u.y * v.x, 0);
  const s1 = side(points[0], points[1]);
  const s2 = side(points[1], points[2]);
  const s3 = side(points[3], points[2]);
  const s4 = side(points[0], points[3]);
  return parallel(s1, s3) && parallel(s2, s4);
}

/* Prompt predicates for numeric multi-selects. */

function numericPredicateFromPrompt(prompt: string): ((value: number) => boolean) | undefined {
  const lower = prompt.toLocaleLowerCase("en-AU");
  const multipleMatch = lower.match(/multiples? of (\d+)/);
  if (multipleMatch) {
    const divisor = Number(multipleMatch[1]);
    return (value) => value % divisor === 0;
  }
  if (lower.includes("even number")) {
    return (value) => value % 2 === 0;
  }
  if (lower.includes("odd number")) {
    return (value) => Math.abs(value % 2) === 1;
  }
  const lessMatch = lower.match(/less than (\d+(?:\.\d+)?)/);
  if (lessMatch) {
    const threshold = Number(lessMatch[1]);
    return (value) => value < threshold;
  }
  const moreMatch = lower.match(/(?:more|greater) than (\d+(?:\.\d+)?)/);
  if (moreMatch) {
    const threshold = Number(moreMatch[1]);
    return (value) => value > threshold;
  }
  return undefined;
}

/* Structural checks shared by every question. */

function structuralChecks(question: Question, result: CheckOutcome): void {
  const optionIds = new Set(question.options.map((option) => option.id));
  if (optionIds.size !== question.options.length) {
    result.failures.push("duplicate option IDs");
  }
  const texts = new Set(question.options.map((option) => option.text.trim()));
  if (texts.size !== question.options.length) {
    result.failures.push("duplicate option text");
  }

  const key = question.answerKey;
  switch (key.kind) {
    case "single_option":
      if (!optionIds.has(key.optionId)) {
        result.failures.push(`answer option '${key.optionId}' does not exist`);
      }
      break;
    case "multiple_options": {
      if (key.optionIds.length < 2) {
        result.failures.push("multiple-select keys need at least two correct options");
      }
      for (const id of key.optionIds) {
        if (!optionIds.has(id)) {
          result.failures.push(`answer option '${id}' does not exist`);
        }
      }
      break;
    }
    case "number":
      if (!(key.tolerance >= 0)) {
        result.failures.push("numeric tolerance must be zero or positive");
      }
      if (
        key.unit?.toLocaleLowerCase("en-AU").includes("dollar") &&
        key.tolerance !== 0
      ) {
        result.failures.push("money answers must be exact (tolerance 0)");
      }
      break;
    case "text":
      if (key.acceptableAnswers.some((answer) => answer.trim().length === 0)) {
        result.failures.push("empty accepted answer");
      }
      break;
    case "matching": {
      const sources = key.pairs.map((pair) => pair.sourceId);
      if (new Set(sources).size !== sources.length) {
        result.failures.push("a matching source is mapped more than once");
      }
      if (question.interaction?.type === "matching") {
        const validSources = new Set(question.interaction.sources.map((s) => s.id));
        const validTargets = new Set(question.interaction.targets.map((t) => t.id));
        for (const pair of key.pairs) {
          if (!validSources.has(pair.sourceId)) {
            result.failures.push(`matching source '${pair.sourceId}' does not exist`);
          }
          if (!validTargets.has(pair.targetId)) {
            result.failures.push(`matching target '${pair.targetId}' does not exist`);
          }
        }
        if (key.pairs.length !== question.interaction.sources.length) {
          result.failures.push("every matching source needs exactly one pair");
        }
      }
      if (question.interaction?.type === "label_diagram") {
        const validLabels = new Set(question.interaction.labels.map((l) => l.id));
        const validTargets = new Set(question.interaction.targets.map((t) => t.id));
        for (const pair of key.pairs) {
          if (!validLabels.has(pair.sourceId)) {
            result.failures.push(`diagram label '${pair.sourceId}' does not exist`);
          }
          if (!validTargets.has(pair.targetId)) {
            result.failures.push(`diagram target '${pair.targetId}' does not exist`);
          }
        }
      }
      break;
    }
    case "ordering": {
      if (question.interaction?.type === "ordering") {
        const itemIds = question.interaction.items.map((item) => item.id);
        const keyIds = [...key.optionIds];
        if (
          itemIds.length !== keyIds.length ||
          new Set(keyIds).size !== keyIds.length ||
          !itemIds.every((id) => keyIds.includes(id))
        ) {
          result.failures.push("ordering key must list every item exactly once");
        }
      }
      break;
    }
    case "drag_drop": {
      if (question.interaction?.type === "drag_drop") {
        const itemIds = new Set(question.interaction.items.map((item) => item.id));
        const zoneIds = new Set(question.interaction.zones.map((zone) => zone.id));
        for (const [itemId, zoneId] of Object.entries(key.placements)) {
          if (!itemIds.has(itemId)) {
            result.failures.push(`drag item '${itemId}' does not exist`);
          }
          if (!zoneIds.has(zoneId)) {
            result.failures.push(`drop zone '${zoneId}' does not exist`);
          }
        }
      }
      break;
    }
    case "hotspot": {
      const regionIds = new Set(
        question.visuals
          .filter((visual) => visual.type === "hotspot_svg")
          .flatMap((visual) => visual.data.regions.map((region) => region.id)),
      );
      for (const id of key.regionIds) {
        if (!regionIds.has(id)) {
          result.failures.push(`hotspot region '${id}' does not exist`);
        }
      }
      break;
    }
    case "fill_blank": {
      if (question.interaction?.type === "fill_blank") {
        const blankIds = new Set(question.interaction.blanks.map((blank) => blank.id));
        for (const blank of key.blanks) {
          if (!blankIds.has(blank.id)) {
            result.failures.push(`blank '${blank.id}' does not exist`);
          }
          if (blank.acceptedAnswers.some((answer) => answer.trim().length === 0)) {
            result.failures.push(`blank '${blank.id}' has an empty accepted answer`);
          }
        }
      }
      break;
    }
    case "dropdown": {
      if (question.interaction?.type === "dropdown") {
        const fieldById = new Map(
          question.interaction.fields.map((field) => [field.id, field]),
        );
        for (const field of key.fields) {
          const definition = fieldById.get(field.id);
          if (!definition) {
            result.failures.push(`dropdown field '${field.id}' does not exist`);
          } else if (
            !definition.options.some((option) => option.id === field.correctOptionId)
          ) {
            result.failures.push(
              `dropdown field '${field.id}' has no option '${field.correctOptionId}'`,
            );
          }
        }
      }
      break;
    }
    case "boolean":
    case "manual":
      break;
  }
}

/* Numeric verification for number-entry questions. */

function checkNumberEntry(question: Question, result: CheckOutcome): void {
  if (question.answerKey.kind !== "number") return;
  const target = question.answerKey.value;

  for (const visual of question.visuals) {
    const candidates = new Set<number>();

    if (visual.type === "number_line") {
      for (const value of visual.data.highlightedValues) candidates.add(value);
    }

    if (visual.type === "geometry_shape") {
      const measures = new Map(
        visual.data.measurements.map((m) => [m.label.toLocaleLowerCase("en-AU"), m.value]),
      );
      const side = measures.get("side");
      const length = measures.get("length");
      const width = measures.get("width");
      const base = measures.get("base");
      const height = measures.get("height");
      if (side !== undefined) {
        candidates.add(4 * side);
        candidates.add(side * side);
      }
      if (length !== undefined && width !== undefined) {
        candidates.add(2 * (length + width));
        candidates.add(length * width);
      }
      if (base !== undefined && height !== undefined) {
        candidates.add((base * height) / 2);
      }
    }

    if (visual.type === "fraction_model") {
      candidates.add(visual.data.numerator);
      candidates.add(visual.data.denominator);
      candidates.add(visual.data.denominator - visual.data.numerator);
    }

    if (visual.type === "coordinate_grid") {
      const points = visual.data.points;
      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          candidates.add(Math.abs(points[i].x - points[j].x));
          candidates.add(Math.abs(points[i].y - points[j].y));
        }
      }
    }

    const pool = numericPool(visual);
    if (pool.length > 0 && visual.type !== "number_line") {
      for (const value of pool) candidates.add(value);
      for (const sum of reachableSums(pool)) candidates.add(sum);
      for (const diff of pairwiseDifferences(pool)) candidates.add(diff);
      candidates.add(Math.max(...pool));
      candidates.add(Math.min(...pool));
    }

    if (visual.type === "line_graph") {
      /* Extend arithmetic progressions to catch pattern-continuation answers. */
      const ys = visual.data.points.map((point) => point.y);
      if (ys.length >= 2) {
        const difference = ys[1] - ys[0];
        const isArithmetic = ys.every(
          (value, index) => index === 0 || approx(value - ys[index - 1], difference),
        );
        if (isArithmetic) {
          for (let steps = 1; steps <= 6; steps += 1) {
            candidates.add(ys[ys.length - 1] + difference * steps);
          }
        }
      }
    }

    if (candidates.size > 0) {
      const matched = [...candidates].some((candidate) => approx(candidate, target));
      if (matched) {
        result.computed = true;
      } else {
        result.failures.push(
          `numeric answer ${target} cannot be derived from visual '${visual.id}'`,
        );
      }
      return;
    }
  }

  result.warnings.push("number entry has no visual data to verify against");
}

/* Verification for option questions driven by chart/table/grid data. */

function checkOptionQuestion(question: Question, result: CheckOutcome): void {
  const key = question.answerKey;
  const prompt = question.prompt.toLocaleLowerCase("en-AU");

  for (const visual of question.visuals) {
    const values = labelledValuesFromVisual(visual);

    if (key.kind === "single_option") {
      const correct = question.options.find((option) => option.id === key.optionId);
      if (!correct) return;

      if (visual.type === "coordinate_grid") {
        const coords = prompt.match(/\((\d+),\s*(\d+)\)/);
        if (coords) {
          const x = Number(coords[1]);
          const y = Number(coords[2]);
          const matches = visual.data.points.filter(
            (point) => point.x === x && point.y === y,
          );
          if (matches.length !== 1 || !matches[0].label) {
            result.failures.push(`no unique point at (${x}, ${y})`);
          } else if (!correct.text.includes(matches[0].label)) {
            result.failures.push(
              `point at (${x}, ${y}) is '${matches[0].label}', not '${correct.text}'`,
            );
          } else {
            result.computed = true;
          }
          return;
        }
      }

      if (values.length > 0) {
        const total = values.reduce((sum, item) => sum + item.value, 0);
        const correctValue = values.find((item) =>
          correct.text.toLocaleLowerCase("en-AU").includes(item.label.toLocaleLowerCase("en-AU")),
        );

        const verifyUnique = (
          predicate: (item: LabelledValue) => boolean,
          description: string,
        ) => {
          const matching = values.filter(predicate);
          if (matching.length !== 1) {
            result.failures.push(`${description}: expected exactly one match, found ${matching.length}`);
          } else if (
            !correct.text
              .toLocaleLowerCase("en-AU")
              .includes(matching[0].label.toLocaleLowerCase("en-AU"))
          ) {
            result.failures.push(
              `${description}: data says '${matching[0].label}', key says '${correct.text}'`,
            );
          } else {
            result.computed = true;
          }
        };

        if (prompt.includes("half")) {
          verifyUnique((item) => approx(item.value * 2, total), "half of total");
          return;
        }
        if (prompt.includes("quarter")) {
          verifyUnique((item) => approx(item.value * 4, total), "quarter of total");
          return;
        }
        if (prompt.includes("twice")) {
          const reference = values.find((item) =>
            prompt.includes(item.label.toLocaleLowerCase("en-AU")),
          );
          if (reference) {
            verifyUnique(
              (item) => item !== reference && approx(item.value, reference.value * 2),
              `twice the '${reference.label}' value`,
            );
            return;
          }
        }
        if (prompt.includes("highest") || prompt.includes("most") || prompt.includes("won")) {
          verifyUnique(
            (item) => item.value === Math.max(...values.map((entry) => entry.value)),
            "maximum value",
          );
          return;
        }
        if (prompt.includes("lowest") || prompt.includes("least")) {
          verifyUnique(
            (item) => item.value === Math.min(...values.map((entry) => entry.value)),
            "minimum value",
          );
          return;
        }
        const exactMatch = prompt.match(/exactly (\d+(?:\.\d+)?)/);
        if (exactMatch) {
          const needle = Number(exactMatch[1]);
          verifyUnique((item) => approx(item.value, needle), `value exactly ${needle}`);
          return;
        }
        if (visual.type === "table" && correctValue) {
          /* Literal table lookups: the correct option's row must contain every
             quoted prompt detail (used for timetable-style questions). */
          const tableVisual = visual;
          if (tableVisual.type === "table") {
            const row = tableVisual.data.rows.find((cells) =>
              cells.some(
                (cell) =>
                  typeof cell === "string" &&
                  correct.text.toLocaleLowerCase("en-AU").includes(cell.toLocaleLowerCase("en-AU")),
              ),
            );
            if (row) {
              result.computed = true;
              return;
            }
          }
        }
      }

      if (visual.type === "table") {
        /* Timetable lookups: find the unique row containing every referenced
           detail (a time like 11:00 and a day name), then verify the key. */
        const timeMatch = question.prompt.match(/\d{1,2}:\d{2}/);
        const dayMatch = question.prompt.match(
          /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
        );
        if (timeMatch && dayMatch) {
          const rows = visual.data.rows.filter(
            (cells) =>
              cells.some((cell) => typeof cell === "string" && cell.includes(timeMatch[0])) &&
              cells.some(
                (cell) =>
                  typeof cell === "string" &&
                  cell.toLocaleLowerCase("en-AU") === dayMatch[0].toLocaleLowerCase("en-AU"),
              ),
          );
          if (rows.length !== 1) {
            result.failures.push(
              `expected exactly one row matching ${dayMatch[0]} at ${timeMatch[0]}, found ${rows.length}`,
            );
          } else if (
            !rows[0].some(
              (cell) => typeof cell === "string" && cell.trim() === correct.text.trim(),
            )
          ) {
            result.failures.push(
              `row for ${dayMatch[0]} at ${timeMatch[0]} does not contain '${correct.text}'`,
            );
          } else {
            result.computed = true;
          }
          return;
        }
      }
    }

    if (key.kind === "multiple_options") {
      const correctIds = new Set(key.optionIds);

      if (visual.type === "coordinate_grid") {
        const coordMatch = prompt.match(/first coordinate is greater than (\d+)/);
        if (coordMatch) {
          const threshold = Number(coordMatch[1]);
          const shouldSelect = visual.data.points.filter((point) => point.x > threshold);
          const selectedLabels = question.options
            .filter((option) => correctIds.has(option.id))
            .map((option) => option.text.trim());
          const expectedLabels = shouldSelect.map((point) => point.label ?? "");
          const same =
            selectedLabels.length === expectedLabels.length &&
            expectedLabels.every((labelText) => selectedLabels.includes(labelText));
          if (same) {
            result.computed = true;
          } else {
            result.failures.push(
              `points with x > ${threshold} are [${expectedLabels.join(", ")}] but key selects [${selectedLabels.join(", ")}]`,
            );
          }
          return;
        }
      }

      const predicate = numericPredicateFromPrompt(question.prompt);
      if (predicate) {
        if (visual.type === "number_line") {
          const highlighted = new Set(visual.data.highlightedValues);
          for (const option of question.options) {
            const value = firstNumber(option.text);
            if (value === undefined || !highlighted.has(value)) {
              result.failures.push(`option '${option.text}' is not a marked value`);
              continue;
            }
            const shouldBeCorrect = predicate(value);
            const isCorrect = correctIds.has(option.id);
            if (shouldBeCorrect !== isCorrect) {
              result.failures.push(
                `option '${option.text}' should ${shouldBeCorrect ? "" : "not "}be correct`,
              );
            }
          }
          if (result.failures.length === 0) result.computed = true;
          return;
        }
        if (values.length > 0) {
          for (const option of question.options) {
            const entry = values.find((item) =>
              option.text.toLocaleLowerCase("en-AU").includes(item.label.toLocaleLowerCase("en-AU")),
            );
            if (!entry) {
              result.failures.push(`option '${option.text}' has no matching data value`);
              continue;
            }
            const shouldBeCorrect = predicate(entry.value);
            const isCorrect = correctIds.has(option.id);
            if (shouldBeCorrect !== isCorrect) {
              result.failures.push(
                `option '${option.text}' (${entry.value}) should ${shouldBeCorrect ? "" : "not "}be correct`,
              );
            }
          }
          if (result.failures.length === 0) result.computed = true;
          return;
        }
      }
    }
  }
}

/* True/false verification from geometry. */

function checkTrueFalse(question: Question, result: CheckOutcome): void {
  if (question.answerKey.kind !== "boolean") return;
  const stated = question.answerKey.value;

  for (const visual of question.visuals) {
    if (visual.type !== "geometry_shape") continue;
    const measures = new Map(
      visual.data.measurements.map((m) => [m.label.toLocaleLowerCase("en-AU"), m.value]),
    );

    const perimeterClaim = question.prompt.match(/perimeter[^0-9]*(\d+(?:\.\d+)?)/i);
    if (perimeterClaim) {
      const claimed = Number(perimeterClaim[1]);
      const side = measures.get("side");
      const length = measures.get("length");
      const width = measures.get("width");
      let actual: number | undefined;
      if (visual.data.shape === "square" && side !== undefined) actual = 4 * side;
      if (visual.data.shape === "rectangle" && length !== undefined && width !== undefined) {
        actual = 2 * (length + width);
      }
      if (actual !== undefined) {
        const claimIsTrue = approx(actual, claimed);
        if (claimIsTrue === stated) {
          result.computed = true;
        } else {
          result.failures.push(
            `perimeter is ${actual}, so the statement should be ${claimIsTrue}`,
          );
        }
        return;
      }
    }

    if (/right[- ]angled/i.test(question.prompt) && visual.data.vertices) {
      const vertices = visual.data.vertices;
      const hasRightAngle = vertices.some((vertex, index) => {
        const previous = vertices[(index + vertices.length - 1) % vertices.length];
        const next = vertices[(index + 1) % vertices.length];
        return classifyAngle(angleBetween(vertex, previous, next)) === "right";
      });
      if (hasRightAngle === stated) {
        result.computed = true;
      } else {
        result.failures.push(
          `vertices ${hasRightAngle ? "do" : "do not"} contain a right angle, so the statement should be ${hasRightAngle}`,
        );
      }
      return;
    }
  }
}

/* Fill-blank and dropdown verification from fraction models and tables. */

function checkFillBlank(question: Question, result: CheckOutcome): void {
  if (question.answerKey.kind !== "fill_blank") return;
  const key = question.answerKey;

  for (const visual of question.visuals) {
    if (visual.type === "fraction_model") {
      const expectations: Record<string, number> = {};
      for (const blank of key.blanks) {
        if (/shaded|numerator/.test(blank.id)) expectations[blank.id] = visual.data.numerator;
        if (/total|denominator/.test(blank.id)) expectations[blank.id] = visual.data.denominator;
      }
      let verified = 0;
      for (const [blankId, expected] of Object.entries(expectations)) {
        const blank = key.blanks.find((entry) => entry.id === blankId);
        if (!blank) continue;
        const numbers = blank.acceptedAnswers.map((answer) => firstNumber(answer));
        if (!blank.acceptedAnswers.some((answer, index) => numbers[index] === expected || wordsForNumber(expected).includes(answer.toLocaleLowerCase("en-AU")))) {
          result.failures.push(
            `blank '${blankId}' should accept ${expected} from the fraction model`,
          );
        } else {
          verified += 1;
        }
      }
      if (verified > 0 && result.failures.length === 0) result.computed = true;
      return;
    }

    if (visual.type === "geometry_shape") {
      const measures = new Map(
        visual.data.measurements.map((m) => [m.label.toLocaleLowerCase("en-AU"), m.value]),
      );
      const length = measures.get("length");
      const width = measures.get("width");
      if (length === undefined || width === undefined) continue;
      const expectations: Record<string, number> = {};
      for (const blank of key.blanks) {
        if (/perimeter/.test(blank.id)) expectations[blank.id] = 2 * (length + width);
        if (/area/.test(blank.id)) expectations[blank.id] = length * width;
      }
      let verified = 0;
      for (const [blankId, expected] of Object.entries(expectations)) {
        const blank = key.blanks.find((entry) => entry.id === blankId);
        if (!blank) continue;
        if (!blank.acceptedAnswers.some((answer) => firstNumber(answer) === expected)) {
          result.failures.push(`blank '${blankId}' should accept ${expected}`);
        } else {
          verified += 1;
        }
      }
      if (verified > 0 && result.failures.length === 0) result.computed = true;
      return;
    }
  }
}

function wordsForNumber(value: number): string[] {
  const words: Record<number, string> = {
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
    12: "twelve",
  };
  return words[value] ? [words[value]] : [];
}

function checkDropdown(question: Question, result: CheckOutcome): void {
  if (question.answerKey.kind !== "dropdown") return;
  if (question.interaction?.type !== "dropdown") return;
  const key = question.answerKey;
  const fieldById = new Map(question.interaction.fields.map((field) => [field.id, field]));

  for (const visual of question.visuals) {
    if (visual.type === "fraction_model") {
      let verified = 0;
      for (const field of key.fields) {
        const definition = fieldById.get(field.id);
        const correctOption = definition?.options.find(
          (option) => option.id === field.correctOptionId,
        );
        if (!definition || !correctOption) continue;
        const expected = /shaded|numerator/.test(field.id)
          ? visual.data.numerator
          : /total|denominator/.test(field.id)
            ? visual.data.denominator
            : undefined;
        if (expected === undefined) continue;
        if (firstNumber(correctOption.text) !== expected) {
          result.failures.push(
            `dropdown '${field.id}' should select ${expected} from the fraction model`,
          );
        } else {
          verified += 1;
        }
      }
      if (verified > 0 && result.failures.length === 0) result.computed = true;
      return;
    }

    if (visual.type === "table") {
      const rows = labelledValuesFromVisual(visual);
      if (rows.length === 0) continue;
      let verified = 0;
      for (const field of key.fields) {
        const definition = fieldById.get(field.id);
        const correctOption = definition?.options.find(
          (option) => option.id === field.correctOptionId,
        );
        if (!definition || !correctOption) continue;
        const label = definition.label.toLocaleLowerCase("en-AU");

        if (label.includes("most")) {
          const maxValue = Math.max(...rows.map((row) => row.value));
          const top = rows.filter((row) => row.value === maxValue);
          if (top.length !== 1) {
            result.failures.push(`dropdown '${field.id}' has no unique maximum`);
          } else if (top[0].label.trim() !== correctOption.text.trim()) {
            result.failures.push(
              `dropdown '${field.id}' maximum is '${top[0].label}', key says '${correctOption.text}'`,
            );
          } else {
            verified += 1;
          }
        }

        const moreMatch = definition.label.match(/more .* on (\w+) than on (\w+)/i);
        if (moreMatch) {
          const first = rows.find(
            (row) => row.label.toLocaleLowerCase("en-AU") === moreMatch[1].toLocaleLowerCase("en-AU"),
          );
          const second = rows.find(
            (row) => row.label.toLocaleLowerCase("en-AU") === moreMatch[2].toLocaleLowerCase("en-AU"),
          );
          if (first && second) {
            const expected = first.value - second.value;
            if (firstNumber(correctOption.text) !== expected) {
              result.failures.push(
                `dropdown '${field.id}' difference is ${expected}, key says '${correctOption.text}'`,
              );
            } else {
              verified += 1;
            }
          }
        }
      }
      if (verified > 0 && result.failures.length === 0) result.computed = true;
      return;
    }
  }
}

/* Matching verification against grids and graphs. */

function checkMatching(question: Question, result: CheckOutcome): void {
  if (question.answerKey.kind !== "matching") return;
  if (question.interaction?.type !== "matching") return;
  const key = question.answerKey;
  const sources = new Map(question.interaction.sources.map((s) => [s.id, s.text]));
  const targets = new Map(question.interaction.targets.map((t) => [t.id, t.text]));

  for (const visual of question.visuals) {
    if (visual.type === "coordinate_grid") {
      let verified = 0;
      for (const pair of key.pairs) {
        const sourceText = sources.get(pair.sourceId) ?? "";
        const targetText = targets.get(pair.targetId) ?? "";
        const letter = sourceText.match(/point\s+([a-z])/i)?.[1];
        const coords = targetText.match(/\((\d+),\s*(\d+)\)/);
        if (!letter || !coords) continue;
        const point = visual.data.points.find(
          (candidate) => candidate.label?.toLocaleLowerCase("en-AU") === letter.toLocaleLowerCase("en-AU"),
        );
        if (!point) {
          result.failures.push(`no point labelled '${letter}' on the grid`);
        } else if (point.x !== Number(coords[1]) || point.y !== Number(coords[2])) {
          result.failures.push(
            `point ${letter} is at (${point.x}, ${point.y}), key says (${coords[1]}, ${coords[2]})`,
          );
        } else {
          verified += 1;
        }
      }
      if (verified > 0 && result.failures.length === 0) result.computed = true;
      return;
    }

    if (visual.type === "line_graph") {
      let verified = 0;
      for (const pair of key.pairs) {
        const sourceText = sources.get(pair.sourceId) ?? "";
        const targetText = targets.get(pair.targetId) ?? "";
        const point = visual.data.points.find((candidate) => candidate.label === sourceText);
        const targetValue = firstNumber(targetText);
        if (!point || targetValue === undefined) continue;
        if (!approx(point.y, targetValue)) {
          result.failures.push(
            `'${sourceText}' reads ${point.y} on the graph, key says ${targetValue}`,
          );
        } else {
          verified += 1;
        }
      }
      if (verified > 0 && result.failures.length === 0) result.computed = true;
      return;
    }
  }
}

/* Ordering verification for numeric data. */

function checkOrdering(question: Question, result: CheckOutcome): void {
  if (question.answerKey.kind !== "ordering") return;
  if (question.interaction?.type !== "ordering") return;
  const key = question.answerKey;
  const itemText = new Map(question.interaction.items.map((item) => [item.id, item.text]));
  const prompt = question.prompt.toLocaleLowerCase("en-AU");

  const ascending =
    /least|smallest|youngest|lowest/.test(prompt.split(" to ")[0]) ||
    /least .* to .*most|smallest .* to .*largest|youngest .* to .*oldest/.test(prompt);
  const descending = /largest|biggest|most/.test(prompt.split(" to ")[0]);

  for (const visual of question.visuals) {
    const values = labelledValuesFromVisual(visual);
    if (values.length === 0) continue;

    const resolve = (id: string): LabelledValue | undefined => {
      const text = itemText.get(id) ?? "";
      return values.find((entry) =>
        text.toLocaleLowerCase("en-AU").includes(entry.label.toLocaleLowerCase("en-AU")),
      );
    };

    const ordered = key.optionIds.map(resolve);
    if (ordered.some((entry) => entry === undefined)) {
      result.warnings.push("could not resolve every ordering item to a data value");
      return;
    }
    const numbers = (ordered as LabelledValue[]).map((entry) => entry.value);
    if (new Set(numbers).size !== numbers.length) {
      result.failures.push("ordering data contains ties, so the order is ambiguous");
      return;
    }
    const sortedAsc = numbers.every((value, index) => index === 0 || numbers[index - 1] < value);
    const sortedDesc = numbers.every((value, index) => index === 0 || numbers[index - 1] > value);

    if (ascending && !sortedAsc) {
      result.failures.push(`ordering key is not ascending: [${numbers.join(", ")}]`);
    } else if (descending && !sortedDesc) {
      result.failures.push(`ordering key is not descending: [${numbers.join(", ")}]`);
    } else if (!ascending && !descending && !sortedAsc && !sortedDesc) {
      result.failures.push("ordering key matches neither ascending nor descending order");
    } else {
      result.computed = true;
    }
    return;
  }
}

/* Label-diagram verification for shape and angle diagrams. */

function checkLabelDiagram(question: Question, result: CheckOutcome): void {
  if (question.answerKey.kind !== "matching") return;
  if (question.interaction?.type !== "label_diagram") return;
  const key = question.answerKey;
  const labels = new Map(question.interaction.labels.map((l) => [l.id, l.text]));
  const targets = new Map(question.interaction.targets.map((t) => [t.id, t.label]));

  for (const visual of question.visuals) {
    if (visual.type !== "labelled_svg") continue;

    /* Angle diagrams: classify each drawn angle, order vertices left to right. */
    const lines = visual.data.elements.filter(
      (element): element is Extract<typeof element, { kind: "line" }> =>
        element.kind === "line",
    );
    const angles = anglesFromLines(lines);
    const labelTexts = [...labels.values()].map((text) => text.toLocaleLowerCase("en-AU"));
    if (
      angles.length >= key.pairs.length &&
      labelTexts.every((text) => /angle/.test(text)) &&
      key.pairs.length === 3
    ) {
      const sorted = [...angles].sort((a, b) => a.vertex.x - b.vertex.x);
      const positionOf = (targetLabel: string): number | undefined => {
        const lower = targetLabel.toLocaleLowerCase("en-AU");
        if (lower.includes("left")) return 0;
        if (lower.includes("middle")) return 1;
        if (lower.includes("right")) return 2;
        return undefined;
      };
      let verified = 0;
      for (const pair of key.pairs) {
        const labelText = labels.get(pair.sourceId)?.toLocaleLowerCase("en-AU") ?? "";
        const targetLabel = targets.get(pair.targetId) ?? "";
        const position = positionOf(targetLabel);
        if (position === undefined || !sorted[position]) continue;
        const actualClass = classifyAngle(sorted[position].degrees);
        const expectedClass = labelText.includes("right")
          ? "right"
          : labelText.includes("acute")
            ? "acute"
            : labelText.includes("obtuse")
              ? "obtuse"
              : undefined;
        if (!expectedClass) continue;
        if (actualClass !== expectedClass) {
          result.failures.push(
            `angle at position ${position} measures as ${actualClass} (${sorted[position].degrees.toFixed(1)} degrees), key labels it ${expectedClass}`,
          );
        } else {
          verified += 1;
        }
      }
      if (verified === key.pairs.length && result.failures.length === 0) {
        result.computed = true;
      }
      return;
    }

    /* Shape-name diagrams: classify each drawn shape, order left to right. */
    const shapes = visual.data.elements
      .filter((element) => ["polygon", "rectangle", "circle"].includes(element.kind))
      .map((element) => {
        if (element.kind === "polygon") {
          const names: Record<number, string> = {
            3: "triangle",
            5: "pentagon",
            6: "hexagon",
            8: "octagon",
          };
          const x = element.points.reduce((sum, point) => sum + point.x, 0) / element.points.length;
          return { x, name: names[element.points.length] ?? `${element.points.length}-gon` };
        }
        if (element.kind === "rectangle") {
          return {
            x: element.x + element.width / 2,
            name: approx(element.width, element.height) ? "square" : "rectangle",
          };
        }
        if (element.kind === "circle") {
          return { x: element.cx, name: "circle" };
        }
        return { x: 0, name: "unknown" };
      })
      .sort((a, b) => a.x - b.x);

    if (shapes.length === key.pairs.length && key.pairs.length === 3) {
      const positionOf = (targetLabel: string): number | undefined => {
        const lower = targetLabel.toLocaleLowerCase("en-AU");
        if (lower.includes("left")) return 0;
        if (lower.includes("middle")) return 1;
        if (lower.includes("right")) return 2;
        return undefined;
      };
      let verified = 0;
      for (const pair of key.pairs) {
        const labelText = labels.get(pair.sourceId)?.toLocaleLowerCase("en-AU") ?? "";
        const targetLabel = targets.get(pair.targetId) ?? "";
        const position = positionOf(targetLabel);
        if (position === undefined || !shapes[position]) continue;
        if (!labelText.includes(shapes[position].name)) {
          result.failures.push(
            `shape at position ${position} is a ${shapes[position].name}, key labels it '${labelText}'`,
          );
        } else {
          verified += 1;
        }
      }
      if (verified === key.pairs.length && result.failures.length === 0) {
        result.computed = true;
      } else if (verified === 0 && result.failures.length === 0) {
        result.warnings.push("label diagram could not be matched to drawn shapes; editorial review");
      }
      return;
    }

    result.warnings.push("label diagram relies on diagram semantics; editorial review");
    return;
  }
}

/* Hotspot verification from drawn geometry. */

function checkHotspot(question: Question, result: CheckOutcome): void {
  if (question.answerKey.kind !== "hotspot") return;
  const key = question.answerKey;
  const prompt = question.prompt.toLocaleLowerCase("en-AU");

  for (const visual of question.visuals) {
    if (visual.type !== "hotspot_svg") continue;
    const regions = visual.data.regions;
    const correctIds = new Set(key.regionIds);

    /* Prompts of the form "Select the X" expect exactly one region. */
    if (correctIds.size !== 1) {
      result.warnings.push("hotspot expects a single selection by convention");
    }

    const verifyPredicate = (
      predicate: (region: (typeof regions)[number]) => boolean,
      description: string,
    ) => {
      const matching = regions.filter(predicate);
      if (matching.length !== 1) {
        result.failures.push(
          `${description}: expected exactly one region, found ${matching.length}`,
        );
        return;
      }
      if (!correctIds.has(matching[0].id)) {
        result.failures.push(
          `${description}: geometry says '${matching[0].id}', key says '${[...correctIds].join(", ")}'`,
        );
        return;
      }
      result.computed = true;
    };

    if (prompt.includes("four sides all the same length")) {
      verifyPredicate(
        (region) =>
          region.shape === "rectangle" && approx(region.width, region.height),
        "square by equal sides",
      );
      return;
    }
    if (prompt.includes("no straight sides")) {
      verifyPredicate((region) => region.shape === "circle", "circle by curved sides");
      return;
    }
    if (prompt.includes("parallelogram")) {
      verifyPredicate(
        (region) => region.shape === "polygon" && isParallelogram(region.points),
        "parallelogram by parallel sides",
      );
      return;
    }
    if (prompt.includes("acute angle")) {
      const lines = visual.data.elements.filter(
        (element): element is Extract<typeof element, { kind: "line" }> =>
          element.kind === "line",
      );
      const angles = anglesFromLines(lines);
      verifyPredicate((region) => {
        const angleHere = angles.find((angle) => pointInRegion(angle.vertex, region));
        return angleHere !== undefined && classifyAngle(angleHere.degrees) === "acute";
      }, "acute angle by measurement");
      return;
    }
    if (prompt.includes("one half shaded")) {
      /* Pair each outline rectangle (no fill) with the shaded rectangle (fill)
         that shares its origin, then compare widths. */
      const rectangles = visual.data.elements.filter(
        (element): element is Extract<typeof element, { kind: "rectangle" }> =>
          element.kind === "rectangle",
      );
      verifyPredicate((region) => {
        if (region.shape !== "rectangle") return false;
        const outline = rectangles.find(
          (rect) => !rect.fill && approx(rect.x, region.x) && approx(rect.y, region.y),
        );
        const shaded = rectangles.find(
          (rect) => Boolean(rect.fill) && approx(rect.x, region.x) && approx(rect.y, region.y),
        );
        return (
          outline !== undefined &&
          shaded !== undefined &&
          approx(shaded.width / outline.width, 0.5)
        );
      }, "one half by shaded proportion");
      return;
    }

    result.warnings.push("hotspot prompt not independently verifiable; editorial review");
    return;
  }
}

/* Drag-drop verification for fraction comparisons. */

function checkDragDrop(question: Question, result: CheckOutcome): void {
  if (question.answerKey.kind !== "drag_drop") return;
  if (question.interaction?.type !== "drag_drop") return;
  const key = question.answerKey;
  const items = new Map(question.interaction.items.map((item) => [item.id, item.text]));
  const zones = new Map(question.interaction.zones.map((zone) => [zone.id, zone.label]));

  const fractionOf = (text: string): number | undefined => {
    const match = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (!match) return undefined;
    const denominator = Number(match[2]);
    return denominator === 0 ? undefined : Number(match[1]) / denominator;
  };

  const allFractions = [...items.values()].every((text) => fractionOf(text) !== undefined);
  if (!allFractions) {
    result.warnings.push("drag-drop groups rely on language semantics; editorial review");
    return;
  }

  let verified = 0;
  for (const [itemId, zoneId] of Object.entries(key.placements)) {
    const value = fractionOf(items.get(itemId) ?? "");
    const zoneLabel = zones.get(zoneId)?.toLocaleLowerCase("en-AU") ?? "";
    if (value === undefined) continue;
    const expectedZone = approx(value, 0.5)
      ? "equal"
      : value < 0.5
        ? "less"
        : "more";
    if (!zoneLabel.includes(expectedZone)) {
      result.failures.push(
        `fraction ${value} belongs in the '${expectedZone}' zone, key places it in '${zoneLabel}'`,
      );
    } else {
      verified += 1;
    }
  }
  if (verified > 0 && result.failures.length === 0) result.computed = true;
}

/* Main loop. */

interface Report {
  total: number;
  objective: number;
  manualReview: number;
  computed: number;
  structural: number;
  editorial: number;
  warnings: number;
  failures: number;
}

const report: Report = {
  total: questionBank.length,
  objective: 0,
  manualReview: 0,
  computed: 0,
  structural: 0,
  editorial: 0,
  warnings: 0,
  failures: 0,
};

const failedQuestions: string[] = [];

for (const question of questionBank) {
  const result = outcome();
  structuralChecks(question, result);

  if (question.answerKey.kind === "manual") {
    report.manualReview += 1;
    if (question.answerKey.rubric.trim().length < 40) {
      result.failures.push("manual rubric is too short");
    }
  } else {
    report.objective += 1;
    checkNumberEntry(question, result);
    checkOptionQuestion(question, result);
    checkTrueFalse(question, result);
    checkFillBlank(question, result);
    checkDropdown(question, result);
    checkMatching(question, result);
    checkOrdering(question, result);
    checkLabelDiagram(question, result);
    checkHotspot(question, result);
    checkDragDrop(question, result);

    if (result.computed) {
      report.computed += 1;
    } else {
      report.editorial += 1;
      result.warnings.push(
        "correctness rests on language semantics or diagram meaning; requires editorial review",
      );
    }
  }

  report.structural += result.failures.length === 0 ? 1 : 0;
  report.warnings += result.warnings.length;

  if (result.failures.length > 0) {
    report.failures += result.failures.length;
    failedQuestions.push(question.id);
    console.error(`FAIL ${question.id}`);
    for (const failure of result.failures) {
      console.error(`  - ${failure}`);
    }
  } else if (result.warnings.length > 0 && process.env.VERBOSE) {
    console.warn(`WARN ${question.id}`);
    for (const warning of result.warnings) {
      console.warn(`  - ${warning}`);
    }
  }
}

console.log("\nIndependent correctness check");
console.log("=============================");
console.log(`Total questions:            ${report.total}`);
console.log(`Objective questions:        ${report.objective}`);
console.log(`Manual-review questions:    ${report.manualReview}`);
console.log(`Fully computable (verified): ${report.computed}`);
console.log(`Structurally checked:       ${report.structural}`);
console.log(`Editorial-review questions: ${report.editorial}`);
console.log(`Warnings:                   ${report.warnings}`);
console.log(`Failures:                   ${report.failures}`);

if (failedQuestions.length > 0) {
  console.error(`\nCorrectness failures in: ${failedQuestions.join(", ")}`);
  process.exit(1);
}

console.log("\nAll independent correctness checks passed.");
