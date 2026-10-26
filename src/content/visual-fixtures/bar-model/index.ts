/**
 * Bar-model fixtures (Phase 1). Worked examples and negative cases for the
 * schema, validators and renderer. NOT imported by any question bank, lesson
 * or catalogue: nothing here reaches a child.
 *
 * All contexts are original and in Australian English.
 */
import type {BarModelLayer} from "@/features/visuals/bar-model/validate";

import mathAnswerLeak from "./invalid/math-answer-leak-in-alt-text.json";
import mathContradiction from "./invalid/math-contradictory-givens.json";
import mathInfeasible from "./invalid/math-infeasible-negative.json";
import mathNotUnique from "./invalid/math-target-not-unique.json";
import mathConservation from "./invalid/math-transfer-breaks-conservation.json";
import schemaBlank from "./invalid/schema-blank-with-value.json";
import schemaMissingAlt from "./invalid/schema-missing-alt-text.json";
import schemaUnitsBounds from "./invalid/schema-units-out-of-bounds.json";
import structChange from "./invalid/structural-change-stored-twice.json";
import structUnitScale from "./invalid/structural-comparison-unit-mismatch.json";
import structDanglingQuantity from "./invalid/structural-dangling-quantity-id.json";
import structDanglingUnit from "./invalid/structural-dangling-unit-id.json";
import structUngrouped from "./invalid/structural-difference-ungrouped.json";
import structDuplicate from "./invalid/structural-duplicate-id.json";
import structNonContiguous from "./invalid/structural-non-contiguous-brace.json";
import structNoTarget from "./invalid/structural-no-target.json";
import structTwoTargets from "./invalid/structural-two-targets.json";
import y3Comparison from "./valid/y3-comparison.json";
import y3PartWhole from "./valid/y3-part-whole.json";
import y3TimesAsMany from "./valid/y3-times-as-many.json";
import y5BeforeAfter from "./valid/y5-before-after.json";
import y5EqualUnits from "./valid/y5-equal-units.json";
import y5Transfer from "./valid/y5-transfer.json";
import answerEqualsGiven from "./warning/answer-equals-given.json";
import fractionTarget from "./warning/fraction-target.json";

export interface RationalFixtureTarget {
  numerator: string;
  denominator: string;
}

export interface ValidBarModelFixture {
  name: string;
  yearLevel: 3 | 5;
  visual: unknown;
  /** The exact target the solver must produce. */
  target: RationalFixtureTarget;
  warningCodes: readonly string[];
}

export type BarModelPilotSkill =
  | "part-whole"
  | "comparison"
  | "times-as-many"
  | "equal-units"
  | "before-after"
  | "transfer";

export interface BarModelPilotFixture {
  name: string;
  yearLevel: 3 | 5;
  skill: BarModelPilotSkill;
  difficulty: "easy" | "medium" | "hard";
  unit: string;
  prompt: string;
  privateAnswerKey: number;
  workedExplanation: string;
  draftProvenance: string;
  visual: unknown;
}

export interface InvalidBarModelFixture {
  name: string;
  /** The single layer that must reject this input. */
  layer: BarModelLayer;
  errorCodes: readonly string[];
  why: string;
  visual: unknown;
}

const whole = (value: number): RationalFixtureTarget => ({
  numerator: String(value),
  denominator: "1",
});

const partWholeVisual = ({
  id,
  title,
  altText,
  total,
  knownPart,
}: {
  id: string;
  title: string;
  altText: string;
  total: number;
  knownPart: number;
}) => ({
  id: `bar-model-${id}`,
  type: "bar_model",
  title,
  altText,
  data: {
    layout: {mode: "schematic"},
    bars: [
      {
        id: `${id}-bar`,
        label: "Whole",
        segments: [
          {
            id: `${id}-known`,
            label: "Known",
            value: knownPart,
            display: "value",
          },
          {
            id: `${id}-unknown`,
            label: "Unknown",
            unknown: "x",
            display: "unknown",
            target: true,
          },
        ],
      },
    ],
    braces: [
      {
        id: `${id}-total`,
        kind: "total",
        label: "All",
        value: total,
        display: "value",
        spans: [`${id}-known`, `${id}-unknown`],
      },
    ],
  },
});

const comparisonVisual = ({
  id,
  title,
  altText,
  left,
  right,
}: {
  id: string;
  title: string;
  altText: string;
  left: number;
  right: number;
}) => ({
  id: `bar-model-${id}`,
  type: "bar_model",
  title,
  altText,
  data: {
    layout: {mode: "schematic"},
    groups: [{id: `${id}-group`, barIds: [`${id}-left`, `${id}-right`]}],
    bars: [
      {
        id: `${id}-left`,
        label: "Left",
        segments: [{id: `${id}-left-segment`, value: left, display: "value"}],
      },
      {
        id: `${id}-right`,
        label: "Right",
        segments: [{id: `${id}-right-segment`, value: right, display: "value"}],
      },
    ],
    braces: [
      {
        id: `${id}-difference`,
        kind: "difference",
        label: "Difference",
        unknown: "d",
        display: "unknown",
        target: true,
        longerBarId: `${id}-left`,
        shorterBarId: `${id}-right`,
      },
    ],
  },
});

const timesAsManyVisual = ({
  id,
  title,
  altText,
  bigGroups,
  smallGroups,
  total,
}: {
  id: string;
  title: string;
  altText: string;
  bigGroups: number;
  smallGroups: number;
  total: number;
}) => ({
  id: `bar-model-${id}`,
  type: "bar_model",
  title,
  altText,
  data: {
    layout: {mode: "schematic"},
    units: [{id: `${id}-unit`, label: "unit"}],
    groups: [{id: `${id}-group`, barIds: [`${id}-big`, `${id}-small`]}],
    bars: [
      {
        id: `${id}-big`,
        label: "Big",
        segments: [
          {
            id: `${id}-big-units`,
            units: bigGroups,
            unitId: `${id}-unit`,
            display: "blank",
          },
        ],
      },
      {
        id: `${id}-small`,
        label: "Small",
        segments: [
          {
            id: `${id}-small-units`,
            units: smallGroups,
            unitId: `${id}-unit`,
            display: "blank",
          },
        ],
      },
    ],
    braces: [
      {
        id: `${id}-together`,
        kind: "total",
        label: "Together",
        value: total,
        display: "value",
        barIds: [`${id}-big`, `${id}-small`],
      },
      {
        id: `${id}-target`,
        kind: "total",
        label: "Big",
        unknown: "b",
        display: "unknown",
        target: true,
        spans: [`${id}-big-units`],
      },
    ],
  },
});

const equalUnitsVisual = ({
  id,
  title,
  altText,
  bagsA,
  bagsB,
  total,
}: {
  id: string;
  title: string;
  altText: string;
  bagsA: number;
  bagsB: number;
  total: number;
}) => ({
  id: `bar-model-${id}`,
  type: "bar_model",
  title,
  altText,
  data: {
    layout: {mode: "schematic"},
    units: [{id: `${id}-bag`, label: "group"}],
    groups: [{id: `${id}-group`, barIds: [`${id}-a`, `${id}-b`]}],
    bars: [
      {
        id: `${id}-a`,
        label: "A",
        segments: [
          {
            id: `${id}-a-bags`,
            units: bagsA,
            unitId: `${id}-bag`,
            display: "blank",
          },
        ],
      },
      {
        id: `${id}-b`,
        label: "B",
        segments: [
          {
            id: `${id}-b-bags`,
            units: bagsB,
            unitId: `${id}-bag`,
            display: "blank",
          },
        ],
      },
    ],
    braces: [
      {
        id: `${id}-together`,
        kind: "total",
        label: "Together",
        value: total,
        display: "value",
        barIds: [`${id}-a`, `${id}-b`],
      },
      {
        id: `${id}-target`,
        kind: "total",
        label: "B",
        unknown: "b",
        display: "unknown",
        target: true,
        spans: [`${id}-b-bags`],
      },
    ],
  },
});

const beforeAfterVisual = ({
  id,
  title,
  altText,
  start,
  removed,
}: {
  id: string;
  title: string;
  altText: string;
  start: number;
  removed: number;
}) => ({
  id: `bar-model-${id}`,
  type: "bar_model",
  title,
  altText,
  data: {
    layout: {mode: "schematic"},
    groups: [{id: `${id}-group`, barIds: [`${id}-before`, `${id}-after`]}],
    quantities: [
      {id: `${id}-removed`, label: "Removed", value: removed, display: "value"},
    ],
    bars: [
      {
        id: `${id}-before`,
        label: "Before",
        stage: "before",
        segments: [
          {
            id: `${id}-start`,
            label: "Start",
            unknown: "s",
            display: "unknown",
            target: true,
          },
        ],
      },
      {
        id: `${id}-after`,
        label: "After",
        stage: "after",
        segments: [
          {
            id: `${id}-left`,
            label: "Left",
            value: start - removed,
            display: "value",
          },
        ],
      },
    ],
    relationships: [
      {
        kind: "remove",
        fromStage: `${id}-before`,
        toStage: `${id}-after`,
        quantityId: `${id}-removed`,
      },
    ],
  },
});

const transferVisual = ({
  id,
  title,
  altText,
  beforeA,
  beforeB,
  gift,
}: {
  id: string;
  title: string;
  altText: string;
  beforeA: number;
  beforeB: number;
  gift: number;
}) => ({
  id: `bar-model-${id}`,
  type: "bar_model",
  title,
  altText,
  data: {
    layout: {mode: "schematic"},
    groups: [
      {
        id: `${id}-group`,
        barIds: [
          `${id}-a-before`,
          `${id}-b-before`,
          `${id}-a-after`,
          `${id}-b-after`,
        ],
      },
    ],
    quantities: [
      {
        id: `${id}-gift`,
        label: "Gift",
        unknown: "g",
        display: "unknown",
        target: true,
      },
    ],
    bars: [
      {
        id: `${id}-a-before`,
        label: "A",
        stage: "before",
        segments: [
          {id: `${id}-a-keeps`, label: "Keeps", unknown: "k", display: "blank"},
          {
            id: `${id}-a-gives`,
            label: "Gives",
            quantityId: `${id}-gift`,
            display: "unknown",
            role: "change",
          },
        ],
      },
      {
        id: `${id}-b-before`,
        label: "B",
        stage: "before",
        segments: [
          {id: `${id}-b-before-amount`, value: beforeB, display: "value"},
        ],
      },
      {
        id: `${id}-a-after`,
        label: "A",
        stage: "after",
        segments: [
          {id: `${id}-a-after-amount`, unknown: "a", display: "blank"},
        ],
      },
      {
        id: `${id}-b-after`,
        label: "B",
        stage: "after",
        segments: [
          {id: `${id}-b-after-amount`, unknown: "b", display: "blank"},
        ],
      },
    ],
    braces: [
      {
        id: `${id}-a-total`,
        kind: "total",
        value: beforeA,
        display: "value",
        spans: [`${id}-a-keeps`, `${id}-a-gives`],
      },
    ],
    relationships: [
      {
        kind: "transfer",
        fromBar: `${id}-a-before`,
        toBar: `${id}-b-before`,
        quantityId: `${id}-gift`,
        beforeBars: [`${id}-a-before`, `${id}-b-before`],
        afterBars: [`${id}-a-after`, `${id}-b-after`],
      },
      {kind: "equal", barIds: [`${id}-a-after`, `${id}-b-after`]},
    ],
  },
});

export const barModelPilotFixtures: readonly BarModelPilotFixture[] = [
  {
    name: "pilot-y3-part-whole-01",
    yearLevel: 3,
    skill: "part-whole",
    difficulty: "easy",
    unit: "sticks",
    prompt:
      "A tray has 36 sticks. 14 are red and the rest are blue. How many blue sticks are there?",
    privateAnswerKey: 22,
    workedExplanation:
      "The whole tray is 36. One part is 14 red sticks, so subtract to find the remainder: 36 - 14 = 22 blue sticks.",
    draftProvenance:
      "Draft pilot item generated from a part-whole bar model review sheet; reviewed as a 3rd-year whole-part question.",
    visual: partWholeVisual({
      id: "pilot-y3-pw-01",
      title: "Blue sticks in a tray",
      altText:
        "A bar model showing a whole tray of 36 sticks. 14 are red and the rest are blue.",
      total: 36,
      knownPart: 14,
    }),
  },
  {
    name: "pilot-y3-comparison-01",
    yearLevel: 3,
    skill: "comparison",
    difficulty: "easy",
    unit: "shells",
    prompt:
      "Mia has 27 shells and Leo has 15 shells. How many more shells does Mia have?",
    privateAnswerKey: 12,
    workedExplanation:
      "Compare the two amounts: 27 - 15 = 12, so Mia has 12 more shells.",
    draftProvenance:
      "Draft pilot item generated from the comparison bar-model family; checked for a clean difference model.",
    visual: comparisonVisual({
      id: "pilot-y3-compare-01",
      title: "Shells",
      altText:
        "Two bars compare Mia and Leo's shells. Mia has 27 and Leo has 15. The difference is unknown.",
      left: 27,
      right: 15,
    }),
  },
  {
    name: "pilot-y3-times-as-many-01",
    yearLevel: 3,
    skill: "times-as-many",
    difficulty: "medium",
    unit: "tokens",
    prompt:
      "A box has 3 times as many tokens as another box. Together they have 24 tokens. How many tokens are in the larger box?",
    privateAnswerKey: 18,
    workedExplanation:
      "Three equal groups and one equal group make four equal groups in total. 24 ÷ 4 = 6, so the larger box has 3 × 6 = 18 tokens.",
    draftProvenance:
      "Draft pilot item generated from the same-unit multiplicative comparison pattern used in the 3rd-year pilot set.",
    visual: timesAsManyVisual({
      id: "pilot-y3-times-01",
      title: "Tokens in boxes",
      altText:
        "Two bars show a larger box with 3 equal units and a smaller box with 1 equal unit. Together the boxes total 24.",
      bigGroups: 3,
      smallGroups: 1,
      total: 24,
    }),
  },
  {
    name: "pilot-y3-part-whole-02",
    yearLevel: 3,
    skill: "part-whole",
    difficulty: "easy",
    unit: "apples",
    prompt:
      "A basket has 42 apples. 19 are green and the rest are red. How many red apples are there?",
    privateAnswerKey: 23,
    workedExplanation:
      "The total is 42. Subtract the green apples: 42 - 19 = 23 red apples.",
    draftProvenance:
      "Draft pilot item generated from a whole-part structure to confirm the Year 3 part-whole skill mix stays clear and valid.",
    visual: partWholeVisual({
      id: "pilot-y3-pw-02",
      title: "Red apples",
      altText:
        "A whole basket of 42 apples has 19 green apples and the rest red.",
      total: 42,
      knownPart: 19,
    }),
  },
  {
    name: "pilot-y3-comparison-02",
    yearLevel: 3,
    skill: "comparison",
    difficulty: "easy",
    unit: "flowers",
    prompt:
      "Ava planted 31 flowers and Ben planted 18. How many more flowers did Ava plant?",
    privateAnswerKey: 13,
    workedExplanation:
      "Find the difference: 31 - 18 = 13, so Ava planted 13 more flowers.",
    draftProvenance:
      "Draft pilot item generated under the comparison family and kept to a clean whole-number difference.",
    visual: comparisonVisual({
      id: "pilot-y3-compare-02",
      title: "Flowers planted",
      altText:
        "Ava planted 31 flowers and Ben planted 18. The difference is unknown.",
      left: 31,
      right: 18,
    }),
  },
  {
    name: "pilot-y3-times-as-many-02",
    yearLevel: 3,
    skill: "times-as-many",
    difficulty: "medium",
    unit: "books",
    prompt:
      "One shelf has 4 times as many books as the other shelf. Together they hold 35 books. How many books are on the larger shelf?",
    privateAnswerKey: 28,
    workedExplanation:
      "Four groups plus one group is five groups altogether. 35 ÷ 5 = 7, so the larger shelf has 4 × 7 = 28 books.",
    draftProvenance:
      "Draft pilot item generated to extend the times-as-many skill set without duplicating the same number family.",
    visual: timesAsManyVisual({
      id: "pilot-y3-times-02",
      title: "Book shelves",
      altText:
        "Two shelves show a larger shelf with 4 equal units and a smaller shelf with 1 equal unit. Together they have 35 books.",
      bigGroups: 4,
      smallGroups: 1,
      total: 35,
    }),
  },
  {
    name: "pilot-y3-part-whole-03",
    yearLevel: 3,
    skill: "part-whole",
    difficulty: "medium",
    unit: "marbles",
    prompt:
      "A jar contains 50 marbles. 17 are green and the rest are red. How many marbles are red?",
    privateAnswerKey: 33,
    workedExplanation:
      "Subtract the green marbles from the total: 50 - 17 = 33 red marbles.",
    draftProvenance:
      "Draft pilot item generated for the Year 3 pilot as a balanced part-whole remainder question.",
    visual: partWholeVisual({
      id: "pilot-y3-pw-03",
      title: "Marbles in a jar",
      altText:
        "A whole jar of 50 marbles contains 17 green marbles and the rest are red.",
      total: 50,
      knownPart: 17,
    }),
  },
  {
    name: "pilot-y3-comparison-03",
    yearLevel: 3,
    skill: "comparison",
    difficulty: "medium",
    unit: "stickers",
    prompt:
      "Noah has 44 stickers and Jay has 19. How many fewer stickers does Jay have?",
    privateAnswerKey: 25,
    workedExplanation:
      "The difference is 44 - 19 = 25, so Jay has 25 fewer stickers.",
    draftProvenance:
      "Draft pilot item generated from a comparison model with a clean whole-number difference.",
    visual: comparisonVisual({
      id: "pilot-y3-compare-03",
      title: "Stickers collected",
      altText:
        "Noah has 44 stickers and Jay has 19. The difference is unknown.",
      left: 44,
      right: 19,
    }),
  },
  {
    name: "pilot-y3-times-as-many-03",
    yearLevel: 3,
    skill: "times-as-many",
    difficulty: "hard",
    unit: "cards",
    prompt:
      "Brianna has 5 times as many cards as Eli. Together they have 54 cards. How many cards does Brianna have?",
    privateAnswerKey: 45,
    workedExplanation:
      "5 groups plus 1 group is 6 equal groups. 54 ÷ 6 = 9, so Brianna has 5 × 9 = 45 cards.",
    draftProvenance:
      "Draft pilot item generated from a larger multiplicative comparison to increase Year 3 challenge while keeping the answer whole.",
    visual: timesAsManyVisual({
      id: "pilot-y3-times-03",
      title: "Collecting cards",
      altText:
        "The larger pile has 5 equal units and the smaller pile has 1 equal unit. Together they total 54 cards.",
      bigGroups: 5,
      smallGroups: 1,
      total: 54,
    }),
  },
  {
    name: "pilot-y3-part-whole-04",
    yearLevel: 3,
    skill: "part-whole",
    difficulty: "easy",
    unit: "crayons",
    prompt:
      "A box has 28 crayons. 9 are blue and the rest are yellow. How many yellow crayons are there?",
    privateAnswerKey: 19,
    workedExplanation:
      "Take the blue crayons away from the total: 28 - 9 = 19 yellow crayons.",
    draftProvenance:
      "Draft pilot item generated for a simple part-whole remainder with an easy Year 3 calculation.",
    visual: partWholeVisual({
      id: "pilot-y3-pw-04",
      title: "Crayon box",
      altText: "A box has 28 crayons. 9 are blue and the rest are yellow.",
      total: 28,
      knownPart: 9,
    }),
  },
  {
    name: "pilot-y3-comparison-04",
    yearLevel: 3,
    skill: "comparison",
    difficulty: "medium",
    unit: "blocks",
    prompt:
      "Ruby stacked 37 blocks and Sam stacked 22. How many more blocks did Ruby stack?",
    privateAnswerKey: 15,
    workedExplanation:
      "The difference is 37 - 22 = 15, so Ruby stacked 15 more blocks.",
    draftProvenance:
      "Draft pilot item generated under the comparison family and checked for answer clarity.",
    visual: comparisonVisual({
      id: "pilot-y3-compare-04",
      title: "Stacked blocks",
      altText:
        "Ruby stacked 37 blocks and Sam stacked 22. The comparison difference is unknown.",
      left: 37,
      right: 22,
    }),
  },
  {
    name: "pilot-y3-times-as-many-04",
    yearLevel: 3,
    skill: "times-as-many",
    difficulty: "medium",
    unit: "pencils",
    prompt:
      "One pot has 2 times as many pencils as the other. Together there are 30 pencils. How many pencils are in the larger pot?",
    privateAnswerKey: 20,
    workedExplanation:
      "Three equal groups make 30, so one group is 10. The larger pot has 2 groups, so it holds 20 pencils.",
    draftProvenance:
      "Draft pilot item generated to ensure the Year 3 set includes a standard multiplicative comparison with clear equal-unit reasoning.",
    visual: timesAsManyVisual({
      id: "pilot-y3-times-04",
      title: "Pencil pots",
      altText:
        "The larger pot has 2 equal units and the smaller pot has 1 equal unit. Together they total 30 pencils.",
      bigGroups: 2,
      smallGroups: 1,
      total: 30,
    }),
  },
  {
    name: "pilot-y3-part-whole-05",
    yearLevel: 3,
    skill: "part-whole",
    difficulty: "hard",
    unit: "buttons",
    prompt:
      "A jar has 63 buttons. 26 are red and the rest are gold. How many gold buttons are there?",
    privateAnswerKey: 37,
    workedExplanation:
      "Subtract the red buttons from the whole amount: 63 - 26 = 37 gold buttons.",
    draftProvenance:
      "Draft pilot item generated as the highest-part-whole difficulty in the Year 3 set.",
    visual: partWholeVisual({
      id: "pilot-y3-pw-05",
      title: "Button jar",
      altText: "A jar has 63 buttons. 26 are red and the rest are gold.",
      total: 63,
      knownPart: 26,
    }),
  },
  {
    name: "pilot-y3-comparison-05",
    yearLevel: 3,
    skill: "comparison",
    difficulty: "hard",
    unit: "stick figures",
    prompt:
      "Harper drew 52 stick figures and Zoe drew 29. How many more stick figures did Harper draw?",
    privateAnswerKey: 23,
    workedExplanation:
      "Find the difference: 52 - 29 = 23, so Harper drew 23 more stick figures.",
    draftProvenance:
      "Draft pilot item generated for the stronger comparison items in the Year 3 pilot matrix.",
    visual: comparisonVisual({
      id: "pilot-y3-compare-05",
      title: "Stick figures",
      altText:
        "Harper drew 52 stick figures and Zoe drew 29. The difference is unknown.",
      left: 52,
      right: 29,
    }),
  },
  {
    name: "pilot-y3-times-as-many-05",
    yearLevel: 3,
    skill: "times-as-many",
    difficulty: "hard",
    unit: "bears",
    prompt:
      "One toy box has 3 times as many bears as the other toy box. Together they hold 48 bears. How many bears are in the larger box?",
    privateAnswerKey: 36,
    workedExplanation:
      "Four equal groups make 48, so one group is 12. The larger box has 3 groups, so it holds 36 bears.",
    draftProvenance:
      "Draft pilot item generated to complete the Year 3 spread across times-as-many and part-whole reasoning.",
    visual: timesAsManyVisual({
      id: "pilot-y3-times-05",
      title: "Toy boxes",
      altText:
        "The larger toy box has 3 equal units and the smaller one has 1 equal unit. Together they total 48 bears.",
      bigGroups: 3,
      smallGroups: 1,
      total: 48,
    }),
  },
  {
    name: "pilot-y5-equal-units-01",
    yearLevel: 5,
    skill: "equal-units",
    difficulty: "easy",
    unit: "biscuits",
    prompt:
      "Two packs contain the same number of biscuits in each bag. One pack has 3 bags and the other has 5 bags. Together they have 56 biscuits. How many biscuits are in the larger pack?",
    privateAnswerKey: 35,
    workedExplanation:
      "Three bags plus five bags makes eight equal bags. 56 ÷ 8 = 7 biscuits per bag. The larger pack has 5 × 7 = 35 biscuits.",
    draftProvenance:
      "Draft pilot item generated from the equal-units family with an easy whole-number divisor.",
    visual: equalUnitsVisual({
      id: "pilot-y5-equal-01",
      title: "Biscuits in packs",
      altText:
        "Two packs have 3 and 5 equal bags of biscuits. Together they total 56 biscuits.",
      bagsA: 3,
      bagsB: 5,
      total: 56,
    }),
  },
  {
    name: "pilot-y5-before-after-01",
    yearLevel: 5,
    skill: "before-after",
    difficulty: "easy",
    unit: "beans",
    prompt:
      "A class had some beans at the start of the week. They used 14 beans and were left with 31. How many beans did they start with?",
    privateAnswerKey: 45,
    workedExplanation:
      "Before minus used equals left, so start = 31 + 14 = 45 beans.",
    draftProvenance:
      "Draft pilot item generated for the before-after skill set with a positive start amount and clear subtraction structure.",
    visual: beforeAfterVisual({
      id: "pilot-y5-before-01",
      title: "Beans used",
      altText:
        "A bar model shows beans before and after. 14 were used and 31 remained.",
      start: 45,
      removed: 14,
    }),
  },
  {
    name: "pilot-y5-transfer-01",
    yearLevel: 5,
    skill: "transfer",
    difficulty: "easy",
    unit: "stickers",
    prompt:
      "Ari has 32 stickers and Tia has 18. Ari gives Tia some stickers so they end with the same number. How many stickers did Ari give away?",
    privateAnswerKey: 7,
    workedExplanation:
      "If they finish with the same number, the amount transferred makes Ari and Tia's end totals match. The total is 50, so each ends with 25. Ari gives away 32 - 25 = 7 stickers.",
    draftProvenance:
      "Draft pilot item generated from a genuine transfer model: one amount moves from before to after while total stays constant.",
    visual: transferVisual({
      id: "pilot-y5-transfer-01",
      title: "Stickers given away",
      altText:
        "Ari and Tia each have a before and after bar. Ari gives some stickers away so they finish with equal amounts.",
      beforeA: 32,
      beforeB: 18,
      gift: 7,
    }),
  },
  {
    name: "pilot-y5-equal-units-02",
    yearLevel: 5,
    skill: "equal-units",
    difficulty: "medium",
    unit: "coins",
    prompt:
      "Two bags hold bundles with the same number of coins in each bundle. One bag has 4 bundles and the other has 7 bundles. Together they hold 99 coins. How many coins are in the larger bag?",
    privateAnswerKey: 63,
    workedExplanation:
      "11 equal bundles make 99 coins, so each bundle is 9 coins. The larger bag has 7 × 9 = 63 coins.",
    draftProvenance:
      "Draft pilot item generated from the equal-units family and corrected to ensure a simple whole-number solution.",
    visual: equalUnitsVisual({
      id: "pilot-y5-equal-02",
      title: "Coin bundles",
      altText:
        "Two bags have 4 and 7 equal bundles of coins. Together they total 99 coins.",
      bagsA: 4,
      bagsB: 7,
      total: 99,
    }),
  },
  {
    name: "pilot-y5-before-after-02",
    yearLevel: 5,
    skill: "before-after",
    difficulty: "medium",
    unit: "marbles",
    prompt:
      "Mila had some marbles. She lost 23 marbles and then had 41 left. How many marbles did she begin with?",
    privateAnswerKey: 64,
    workedExplanation: "Start = left + lost = 41 + 23 = 64 marbles.",
    draftProvenance:
      "Draft pilot item generated to ensure before-after items remain clear and avoid repeated number patterns.",
    visual: beforeAfterVisual({
      id: "pilot-y5-before-02",
      title: "Lost marbles",
      altText:
        "A bar model shows marbles before and after. 23 were lost and 41 remain.",
      start: 64,
      removed: 23,
    }),
  },
  {
    name: "pilot-y5-transfer-02",
    yearLevel: 5,
    skill: "transfer",
    difficulty: "medium",
    unit: "tokens",
    prompt:
      "Zoe has 46 tokens and Josh has 24. Zoe gives Josh some tokens so they end with the same total. How many tokens does Zoe give away?",
    privateAnswerKey: 11,
    workedExplanation:
      "The total is 70 tokens, so each has 35 after trading. Zoe gives away 46 - 35 = 11 tokens.",
    draftProvenance:
      "Draft pilot item generated from a transfer model where both before and after totals remain valid and whole.",
    visual: transferVisual({
      id: "pilot-y5-transfer-02",
      title: "Tokens shared",
      altText:
        "Zoe and Josh each have a before and after bar. Zoe gives some tokens away until both totals match.",
      beforeA: 46,
      beforeB: 24,
      gift: 11,
    }),
  },
  {
    name: "pilot-y5-equal-units-03",
    yearLevel: 5,
    skill: "equal-units",
    difficulty: "easy",
    unit: "sticks",
    prompt:
      "Two teams collect sets with the same number of sticks in each set. One team has 2 sets and the other has 6 sets. Together they collect 48 sticks. How many sticks are in the larger team's sets?",
    privateAnswerKey: 36,
    workedExplanation:
      "Eight equal sets make 48, so one set is 6 sticks. The larger team has 6 × 6 = 36 sticks.",
    draftProvenance:
      "Draft pilot item generated for an equal-units question that tests grouping and total sharing clearly.",
    visual: equalUnitsVisual({
      id: "pilot-y5-equal-03",
      title: "Stick sets",
      altText:
        "Two teams collect 2 and 6 equal sets of sticks. Together they have 48 sticks.",
      bagsA: 2,
      bagsB: 6,
      total: 48,
    }),
  },
  {
    name: "pilot-y5-before-after-03",
    yearLevel: 5,
    skill: "before-after",
    difficulty: "hard",
    unit: "pencils",
    prompt:
      "A box started with some pencils. 27 were given away and 58 were left. How many pencils were in the box at the start?",
    privateAnswerKey: 85,
    workedExplanation: "Start = left + given away = 58 + 27 = 85 pencils.",
    draftProvenance:
      "Draft pilot item generated as a harder before-after item in the Year 5 set.",
    visual: beforeAfterVisual({
      id: "pilot-y5-before-03",
      title: "Pencils given away",
      altText:
        "A model shows the box before and after. 27 pencils were given away and 58 remain.",
      start: 85,
      removed: 27,
    }),
  },
  {
    name: "pilot-y5-transfer-03",
    yearLevel: 5,
    skill: "transfer",
    difficulty: "hard",
    unit: "marbles",
    prompt:
      "Luca has 51 marbles and Jina has 29. Luca gives Jina some marbles so they end up with the same amount. How many marbles does Luca give away?",
    privateAnswerKey: 11,
    workedExplanation:
      "The total is 80 marbles, so each ends with 40. Luca gives away 51 - 40 = 11 marbles.",
    draftProvenance:
      "Draft pilot item generated from a larger transfer question to expand the Year 5 transfer family.",
    visual: transferVisual({
      id: "pilot-y5-transfer-03",
      title: "Marbles shared",
      altText:
        "Luca and Jina each have a before and after bar. Luca transfers marbles so both end equal.",
      beforeA: 51,
      beforeB: 29,
      gift: 11,
    }),
  },
  {
    name: "pilot-y5-equal-units-04",
    yearLevel: 5,
    skill: "equal-units",
    difficulty: "medium",
    unit: "cups",
    prompt:
      "Two crates hold bottles containing the same amount of juice in each bottle. One crate has 3 bottles and the other has 7 bottles. Together there are 90 cups of juice. How many cups of juice are in the larger crate?",
    privateAnswerKey: 63,
    workedExplanation:
      "Ten equal bottles hold 90 cups, so one bottle holds 9 cups. The larger crate has 7 × 9 = 63 cups.",
    draftProvenance:
      "Draft pilot item generated to keep the equal-units set varied and mathematically consistent.",
    visual: equalUnitsVisual({
      id: "pilot-y5-equal-04",
      title: "Juice bottles",
      altText:
        "Two crates contain 3 and 7 equal bottles of juice. Together they hold 90 cups.",
      bagsA: 3,
      bagsB: 7,
      total: 90,
    }),
  },
  {
    name: "pilot-y5-before-after-04",
    yearLevel: 5,
    skill: "before-after",
    difficulty: "medium",
    unit: "stickers",
    prompt:
      "A student had some stickers. She gave away 18 stickers and then had 44 left. How many stickers did she have at the start?",
    privateAnswerKey: 62,
    workedExplanation:
      "Start - given away = left, so start = 44 + 18 = 62 stickers.",
    draftProvenance:
      "Draft pilot item generated for a before-after subtraction model that remains valid under the bar-model solver.",
    visual: beforeAfterVisual({
      id: "pilot-y5-before-04",
      title: "Stickers given away",
      altText:
        "A model shows before and after. 18 stickers were given away and 44 remained.",
      start: 62,
      removed: 18,
    }),
  },
  {
    name: "pilot-y5-transfer-04",
    yearLevel: 5,
    skill: "transfer",
    difficulty: "hard",
    unit: "buttons",
    prompt:
      "Eden has 58 buttons and Priya has 26. Eden gives Priya some buttons so they each finish with the same number. How many buttons does Eden give away?",
    privateAnswerKey: 16,
    workedExplanation:
      "The total is 84, so each ends with 42. Eden gives away 58 - 42 = 16 buttons.",
    draftProvenance:
      "Draft pilot item generated from an authentic transfer story with a clean same-end-total condition.",
    visual: transferVisual({
      id: "pilot-y5-transfer-04",
      title: "Buttons transferred",
      altText:
        "Eden and Priya both have before and after bars. Eden transfers buttons so they end equal.",
      beforeA: 58,
      beforeB: 26,
      gift: 16,
    }),
  },
  {
    name: "pilot-y5-equal-units-05",
    yearLevel: 5,
    skill: "equal-units",
    difficulty: "hard",
    unit: "sweets",
    prompt:
      "Two jars each hold equal packs of sweets. One jar has 6 packs and the other has 9 packs. Together they hold 120 sweets. How many sweets are in the larger jar?",
    privateAnswerKey: 72,
    workedExplanation:
      "Fifteen equal packs make 120, so one pack has 8 sweets. The larger jar has 9 × 8 = 72 sweets.",
    draftProvenance:
      "Draft pilot item generated to finish the equal-units series with a higher-multiplicity example.",
    visual: equalUnitsVisual({
      id: "pilot-y5-equal-05",
      title: "Sweet packs",
      altText:
        "Two jars have 6 and 9 equal packs of sweets. Together they total 120 sweets.",
      bagsA: 6,
      bagsB: 9,
      total: 120,
    }),
  },
  {
    name: "pilot-y5-before-after-05",
    yearLevel: 5,
    skill: "before-after",
    difficulty: "hard",
    unit: "lollies",
    prompt:
      "A tin started with some lollies. 34 were eaten and 47 were left. How many lollies were in the tin at the start?",
    privateAnswerKey: 81,
    workedExplanation: "Start = left + eaten = 47 + 34 = 81 lollies.",
    draftProvenance:
      "Draft pilot item generated as the final before-after check in the Year 5 pilot review sheet.",
    visual: beforeAfterVisual({
      id: "pilot-y5-before-05",
      title: "Lollies eaten",
      altText: "A before-after model shows 34 lollies eaten and 47 left.",
      start: 81,
      removed: 34,
    }),
  },
  {
    name: "pilot-y5-transfer-05",
    yearLevel: 5,
    skill: "transfer",
    difficulty: "hard",
    unit: "cards",
    prompt:
      "Mina has 64 cards and Omar has 28. Mina gives Omar some cards so they finish with the same number. How many cards does Mina give away?",
    privateAnswerKey: 18,
    workedExplanation:
      "The total is 92, so each ends with 46. Mina gives away 64 - 46 = 18 cards.",
    draftProvenance:
      "Draft pilot item generated as the concluding genuine-transfer example in the Year 5 pilot set.",
    visual: transferVisual({
      id: "pilot-y5-transfer-05",
      title: "Cards transferred",
      altText:
        "Mina and Omar each have before and after bars. Mina gives away cards so they finish equal.",
      beforeA: 64,
      beforeB: 28,
      gift: 18,
    }),
  },
];

export const validBarModelFixtures: readonly ValidBarModelFixture[] = [
  {
    name: "y3-part-whole",
    yearLevel: 3,
    visual: y3PartWhole,
    target: whole(27),
    warningCodes: [],
  },
  {
    name: "y3-comparison",
    yearLevel: 3,
    visual: y3Comparison,
    target: whole(13),
    warningCodes: [],
  },
  {
    name: "y3-times-as-many",
    yearLevel: 3,
    visual: y3TimesAsMany,
    target: whole(18),
    warningCodes: [],
  },
  {
    name: "y5-equal-units",
    yearLevel: 5,
    visual: y5EqualUnits,
    target: whole(40),
    warningCodes: [],
  },
  {
    name: "y5-before-after",
    yearLevel: 5,
    visual: y5BeforeAfter,
    target: whole(47),
    warningCodes: [],
  },
  {
    name: "y5-transfer",
    yearLevel: 5,
    visual: y5Transfer,
    target: whole(16),
    warningCodes: [],
  },
];

/** Valid, but the validator raises a warning an author must acknowledge. */
export const warningBarModelFixtures: readonly ValidBarModelFixture[] = [
  {
    name: "fraction-target",
    yearLevel: 5,
    visual: fractionTarget,
    target: {numerator: "9", denominator: "2"},
    warningCodes: ["fractional_target"],
  },
  {
    name: "answer-equals-given",
    yearLevel: 3,
    visual: answerEqualsGiven,
    target: whole(18),
    warningCodes: ["answer_equals_given"],
  },
];

interface InvalidJson {
  why: string;
  layer: string;
  errorCodes: string[];
  visual: unknown;
}

const invalid = (name: string, json: InvalidJson): InvalidBarModelFixture => ({
  name,
  layer: json.layer as BarModelLayer,
  errorCodes: json.errorCodes,
  why: json.why,
  visual: json.visual,
});

export const invalidBarModelFixtures: readonly InvalidBarModelFixture[] = [
  invalid("schema-blank-with-value", schemaBlank),
  invalid("schema-missing-alt-text", schemaMissingAlt),
  invalid("schema-units-out-of-bounds", schemaUnitsBounds),
  invalid("structural-duplicate-id", structDuplicate),
  invalid("structural-dangling-unit-id", structDanglingUnit),
  invalid("structural-dangling-quantity-id", structDanglingQuantity),
  invalid("structural-non-contiguous-brace", structNonContiguous),
  invalid("structural-no-target", structNoTarget),
  invalid("structural-two-targets", structTwoTargets),
  invalid("structural-change-stored-twice", structChange),
  invalid("structural-comparison-unit-mismatch", structUnitScale),
  invalid("structural-difference-ungrouped", structUngrouped),
  invalid("math-contradictory-givens", mathContradiction),
  invalid("math-target-not-unique", mathNotUnique),
  invalid("math-transfer-breaks-conservation", mathConservation),
  invalid("math-infeasible-negative", mathInfeasible),
  invalid("math-answer-leak-in-alt-text", mathAnswerLeak),
];
