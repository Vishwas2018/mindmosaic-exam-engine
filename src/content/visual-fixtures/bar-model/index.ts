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

const buildPartWholeFixture = (
  name: string,
  yearLevel: 3 | 5,
  title: string,
  altText: string,
  total: number,
  known: number,
  missingLabel = "Unknown part",
): ValidBarModelFixture => {
  const missing = total - known;
  return {
    name,
    yearLevel,
    target: whole(missing),
    warningCodes: [],
    visual: {
      id: `bar-model-pilot-${name}`,
      type: "bar_model",
      title,
      altText,
      data: {
        layout: {mode: "schematic"},
        bars: [
          {
            id: `bar-${name}`,
            label: "Bar",
            segments: [
              {
                id: `known-${name}`,
                label: "Known part",
                value: known,
                display: "value",
              },
              {
                id: `missing-${name}`,
                label: missingLabel,
                unknown: "p",
                display: "unknown",
                target: true,
              },
            ],
          },
        ],
        braces: [
          {
            id: `whole-${name}`,
            kind: "total",
            label: "Whole",
            value: total,
            display: "value",
            spans: [`known-${name}`, `missing-${name}`],
          },
        ],
      },
    },
  };
};

const buildEqualUnitsFixture = (
  name: string,
  yearLevel: 3 | 5,
  title: string,
  altText: string,
  unitCount: number,
  total: number,
): ValidBarModelFixture => {
  const targetValue = total / unitCount;
  const segments = Array.from({length: unitCount}, (_, index) => ({
    id: `unit-${name}-${index + 1}`,
    label: `Unit ${index + 1}`,
    unknown: "u",
    display: "unknown",
    ...(index === 0 ? {target: true} : {}),
  }));

  return {
    name,
    yearLevel,
    target: whole(targetValue),
    warningCodes: [],
    visual: {
      id: `bar-model-pilot-${name}`,
      type: "bar_model",
      title,
      altText,
      data: {
        layout: {mode: "schematic"},
        bars: [
          {
            id: `group-${name}`,
            label: "Group",
            segments,
          },
        ],
        braces: [
          {
            id: `total-${name}`,
            kind: "total",
            label: "Total",
            value: total,
            display: "value",
            spans: segments.map((segment) => segment.id),
          },
        ],
      },
    },
  };
};

const buildBeforeAfterFixture = (
  name: string,
  yearLevel: 3 | 5,
  title: string,
  altText: string,
  endValue: number,
  changeValue: number,
  beforeIsUnknown: boolean,
): ValidBarModelFixture => {
  const beforeValue = beforeIsUnknown
    ? endValue - changeValue
    : endValue + changeValue;
  return {
    name,
    yearLevel,
    target: whole(beforeValue),
    warningCodes: [],
    visual: {
      id: `bar-model-pilot-${name}`,
      type: "bar_model",
      title,
      altText,
      data: {
        layout: {mode: "schematic"},
        groups: [
          {id: `group-${name}`, barIds: [`before-${name}`, `after-${name}`]},
        ],
        quantities: [
          {
            id: `change-${name}`,
            label: "Change",
            value: changeValue,
            display: "value",
          },
        ],
        bars: [
          {
            id: `before-${name}`,
            label: "Before",
            stage: "before",
            segments: [
              {
                id: `start-${name}`,
                label: "Start",
                unknown: "s",
                display: "unknown",
                target: true,
              },
            ],
          },
          {
            id: `after-${name}`,
            label: "After",
            stage: "after",
            segments: [
              {
                id: `end-${name}`,
                label: "End",
                value: endValue,
                display: "value",
              },
            ],
          },
        ],
        relationships: [
          {
            kind: beforeIsUnknown ? "add" : "remove",
            fromStage: `before-${name}`,
            toStage: `after-${name}`,
            quantityId: `change-${name}`,
          },
        ],
      },
    },
  };
};

const buildTransferFixture = (
  name: string,
  yearLevel: 3 | 5,
  title: string,
  altText: string,
  startValue: number,
  movedValue: number,
  endValue: number,
): ValidBarModelFixture => {
  return {
    name,
    yearLevel,
    target: whole(startValue),
    warningCodes: [],
    visual: {
      id: `bar-model-pilot-${name}`,
      type: "bar_model",
      title,
      altText,
      data: {
        layout: {mode: "schematic"},
        groups: [
          {id: `group-${name}`, barIds: [`before-${name}`, `after-${name}`]},
        ],
        quantities: [
          {
            id: `moved-${name}`,
            label: "Moved",
            value: movedValue,
            display: "value",
          },
        ],
        bars: [
          {
            id: `before-${name}`,
            label: "Before",
            stage: "before",
            segments: [
              {
                id: `start-${name}`,
                label: "Start",
                unknown: "s",
                display: "unknown",
                target: true,
              },
            ],
          },
          {
            id: `after-${name}`,
            label: "After",
            stage: "after",
            segments: [
              {
                id: `left-${name}`,
                label: "Left",
                value: endValue,
                display: "value",
              },
            ],
          },
        ],
        relationships: [
          {
            kind: "remove",
            fromStage: `before-${name}`,
            toStage: `after-${name}`,
            quantityId: `moved-${name}`,
          },
        ],
      },
    },
  };
};

export const barModelPilotFixtures: readonly ValidBarModelFixture[] = [
  buildPartWholeFixture(
    "y3-pilot-01",
    3,
    "Muffins on a tray",
    "A tray of muffins has 24 in total. 9 muffins are chocolate and the rest are blueberry. How many blueberry muffins are there?",
    24,
    9,
  ),
  buildPartWholeFixture(
    "y3-pilot-02",
    3,
    "Pencils in a jar",
    "A jar has 31 pencils altogether. 13 are green and the rest are yellow. How many yellow pencils are there?",
    31,
    13,
  ),
  buildPartWholeFixture(
    "y3-pilot-03",
    3,
    "Books on a shelf",
    "A shelf holds 42 books. 18 are fiction books and the rest are non-fiction. How many non-fiction books are there?",
    42,
    18,
  ),
  buildPartWholeFixture(
    "y3-pilot-04",
    3,
    "Stickers in a pack",
    "A pack has 27 stickers. 9 are star stickers and the others are heart stickers. How many heart stickers are there?",
    27,
    9,
  ),
  buildPartWholeFixture(
    "y3-pilot-05",
    3,
    "Art tiles",
    "A mosaic uses 35 tiles in all. 16 are blue tiles and the rest are green. How many green tiles are there?",
    35,
    16,
  ),
  buildPartWholeFixture(
    "y3-pilot-06",
    3,
    "Leaves in a collection",
    "A collector has 28 leaves. 11 are oak leaves and the rest are maple leaves. How many maple leaves are there?",
    28,
    11,
  ),
  buildPartWholeFixture(
    "y3-pilot-07",
    3,
    "Crayons in a box",
    "A box contains 46 crayons. 19 are red crayons and the rest are blue. How many blue crayons are there?",
    46,
    19,
  ),
  buildPartWholeFixture(
    "y3-pilot-08",
    3,
    "Balloons at a party",
    "There are 39 balloons altogether. 17 are yellow balloons and the rest are purple. How many purple balloons are there?",
    39,
    17,
  ),
  buildPartWholeFixture(
    "y3-pilot-09",
    3,
    "Counters in a tin",
    "A tin holds 33 counters. 14 are silver and the rest are gold. How many gold counters are there?",
    33,
    14,
  ),
  buildPartWholeFixture(
    "y3-pilot-10",
    3,
    "Cups on a table",
    "A table has 26 cups. 12 are large and the rest are small. How many small cups are there?",
    26,
    12,
  ),
  buildPartWholeFixture(
    "y3-pilot-11",
    3,
    "Peaches in a basket",
    "A basket has 41 peaches. 24 are ripe and the rest are unripe. How many unripe peaches are there?",
    41,
    24,
  ),
  buildPartWholeFixture(
    "y3-pilot-12",
    3,
    "Stamps in an album",
    "An album has 32 stamps. 15 are Australian stamps and the rest are overseas stamps. How many overseas stamps are there?",
    32,
    15,
  ),
  buildPartWholeFixture(
    "y3-pilot-13",
    3,
    "Eggs in a carton",
    "A carton contains 48 eggs. 21 are brown eggs and the rest are white. How many white eggs are there?",
    48,
    21,
  ),
  buildPartWholeFixture(
    "y3-pilot-14",
    3,
    "Buttons in a jar",
    "A jar has 30 buttons. 8 are red buttons and the rest are blue. How many blue buttons are there?",
    30,
    8,
  ),
  buildPartWholeFixture(
    "y3-pilot-15",
    3,
    "Straws in a bundle",
    "A bundle contains 45 straws. 27 are long straws and the rest are short. How many short straws are there?",
    45,
    27,
  ),
  buildEqualUnitsFixture(
    "y5-pilot-01",
    5,
    "Tea bags in equal jars",
    "Four jars hold the same number of tea bags. Together they contain 28 tea bags. How many tea bags are in one jar?",
    4,
    28,
  ),
  buildBeforeAfterFixture(
    "y5-pilot-02",
    5,
    "Saving money",
    "Ava had some money saved. She added $18 and now has $54. How much money did she start with?",
    54,
    18,
    true,
  ),
  buildTransferFixture(
    "y5-pilot-03",
    5,
    "Books moved to a shelf",
    "A library shelf had some books. 12 books were moved to another shelf and 28 books were left on the shelf. How many books were on the shelf at first?",
    40,
    12,
    28,
  ),
  buildEqualUnitsFixture(
    "y5-pilot-04",
    5,
    "Rows of chairs",
    "There are 5 equal rows of chairs in the hall and 35 chairs in total. How many chairs are in each row?",
    5,
    35,
  ),
  buildBeforeAfterFixture(
    "y5-pilot-05",
    5,
    "Cups in a stack",
    "A stack had some cups. 11 cups were taken away and 23 cups remain. How many cups were in the stack to begin with?",
    23,
    11,
    false,
  ),
  buildTransferFixture(
    "y5-pilot-06",
    5,
    "Marbles shared out",
    "A box had some marbles. 16 marbles were given away and 29 were left. How many marbles were in the box at the start?",
    45,
    16,
    29,
  ),
  buildEqualUnitsFixture(
    "y5-pilot-07",
    5,
    "Bags of apples",
    "Three equal bags hold 24 apples altogether. How many apples are in one bag?",
    3,
    24,
  ),
  buildBeforeAfterFixture(
    "y5-pilot-08",
    5,
    "Playlist songs",
    "A playlist had some songs. 15 more songs were added and the playlist now has 63 songs. How many songs were there at first?",
    63,
    15,
    true,
  ),
  buildTransferFixture(
    "y5-pilot-09",
    5,
    "Lollies in a box",
    "A box of lollies had some lollies. 9 lollies were eaten and 31 lollies remained. How many lollies were in the box at first?",
    40,
    9,
    31,
  ),
  buildEqualUnitsFixture(
    "y5-pilot-10",
    5,
    "Packets of stickers",
    "Six equal packets contain 54 stickers altogether. How many stickers are in each packet?",
    6,
    54,
  ),
  buildBeforeAfterFixture(
    "y5-pilot-11",
    5,
    "Frog eggs",
    "A pond started with some frog eggs. 7 eggs were lost and now 19 eggs remain. How many eggs were there to start with?",
    19,
    7,
    false,
  ),
  buildTransferFixture(
    "y5-pilot-12",
    5,
    "Birds on a fence",
    "A fence had some birds resting on it. 14 birds flew away and 26 birds stayed. How many birds were there at first?",
    40,
    14,
    26,
  ),
  buildEqualUnitsFixture(
    "y5-pilot-13",
    5,
    "Jelly beans in jars",
    "Five equal jars hold 45 jelly beans altogether. How many jelly beans are in each jar?",
    5,
    45,
  ),
  buildBeforeAfterFixture(
    "y5-pilot-14",
    5,
    "Points in a game",
    "A player had some points. She won 22 points and ended with 68 points. How many points did she have at the start?",
    68,
    22,
    true,
  ),
  buildTransferFixture(
    "y5-pilot-15",
    5,
    "Tickets sold",
    "A stall had some tickets for sale. 18 tickets were sold and 33 tickets remained. How many tickets were there at the beginning?",
    51,
    18,
    33,
  ),
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
