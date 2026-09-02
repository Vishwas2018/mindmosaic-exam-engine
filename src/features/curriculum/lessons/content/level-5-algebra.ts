import type { Lesson } from "../schema";

export const LEVEL_5_ALGEBRA_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2M5A01: Multiplication and Division Inverse Families
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5A01",
    title: "Inverse Operations: Multiplication and Division Fact Families",
    strand: "algebra",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to use the inverse relationship between multiplication and division to solve equations and verify calculations.",
    successCriteria: [
      "I can explain that multiplication and division are inverse operations that reverse each other.",
      "I can construct complete multiplicative fact families for whole numbers, decimals, and fractions.",
      "I can use division to isolate an unknown in a multiplication equation, and multiplication to check division.",
    ],
    prerequisites: ["VC2M3A01", "VC2M5N02"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Algebra).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5a01-concept",
        heading: "Connecting Multiplication and Division",
        explanation:
          "Multiplication and division are inverse operations. If you multiply a starting number by a value (e.g. × 6) and then divide the result by that same value (÷ 6), you return back to the exact starting number.\n\nEvery multiplicative relationship creates a family of four connected equations:\n• Factor × Factor = Product (e.g. 14 × 7 = 98)\n• Factor × Factor = Product (e.g. 7 × 14 = 98, commutative property)\n• Product ÷ Factor = Factor (e.g. 98 ÷ 7 = 14)\n• Product ÷ Factor = Factor (e.g. 98 ÷ 14 = 7)\n\nThis inverse relationship extends directly to decimals (e.g. 0.6 × 4 = 2.4 and 2.4 ÷ 4 = 0.6) and fractions.",
        keyTerms: [
          {
            term: "Inverse Operations",
            definition: "Opposite operations that undo one another (multiplication undoes division, and division undoes multiplication).",
          },
          {
            term: "Commutative Property",
            definition: "The property that order does not change the product in multiplication (a × b = b × a).",
          },
          {
            term: "Fact Family",
            definition: "A set of four related multiplication and division equations built from three linked numbers.",
          },
        ],
        visualAsset: {
          id: "vc2m5a01-inverse-table",
          type: "table",
          altText: "Table showing the four related equations for numbers 15, 8, and 120.",
          title: "Multiplicative Fact Family for 15, 8, and 120",
          data: {
            headers: ["Equation Type", "Number Sentence", "Role of 120", "Role of 15 and 8"],
            rows: [
              ["Multiplication 1", "15 × 8 = 120", "Total Product", "Factors being multiplied"],
              ["Multiplication 2", "8 × 15 = 120", "Total Product", "Factors (order reversed)"],
              ["Division 1", "120 ÷ 8 = 15", "Starting Dividend", "8 is divisor, 15 is quotient"],
              ["Division 2", "120 ÷ 15 = 8", "Starting Dividend", "15 is divisor, 8 is quotient"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5a01-example",
        heading: "Worked Example: Solving an Unknown Multiplier Equation",
        problem: "Solve for the unknown value [ y ] in the equation: [ y ] × 16 = 384. Verify your solution.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the unknown and apply the inverse operation",
            working: "In [ y ] × 16 = 384, the product is 384 and one factor is 16. Apply inverse division: [ y ] = 384 ÷ 16.",
            why: "Dividing the product by the known factor isolates the unknown factor.",
          },
          {
            stepNumber: 2,
            label: "Calculate 384 ÷ 16 using chunking or short division",
            working:
              "• 16 × 20 = 320\n• Remaining: 384 - 320 = 64\n• 16 × 4 = 64\n• Total quotient: 20 + 4 = 24. So [ y ] = 24.",
            why: "Breaking the dividend into known friendly multiples of 16 (320 and 64) simplifies mental division.",
          },
          {
            stepNumber: 3,
            label: "Verify by multiplying back",
            working: "Check: 24 × 16 = 24 × (10 + 6) = 240 + 144 = 384. The check matches 384 perfectly.",
            why: "Substituting the solution back into the original equation proves correctness.",
          },
        ],
        finalAnswer: "y = 24.",
        commonError: {
          mistake: "Multiplying 384 × 16 instead of dividing.",
          whyItHappens: "Seeing a multiplication sign in the equation and performing multiplication automatically.",
          howToAvoid: "To find a missing factor, always apply the opposite (inverse) operation: division.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5a01-misconception",
        heading: "Misconception: Division Is Commutative",
        claim: "Just like 6 × 8 = 8 × 6, 24 ÷ 6 is the same as 6 ÷ 24.",
        whyWrong:
          "Multiplication is commutative (order does not matter), but division is NOT. 24 ÷ 6 = 4, whereas 6 ÷ 24 = 6/24 = 1/4 (0.25). 4 and 0.25 are completely different values.",
        correction:
          "In division, the total amount being shared (dividend) must always be placed first unless you intend to find a fractional fraction.",
        example: "12 ÷ 3 = 4, but 3 ÷ 12 = 0.25.",
      },
      {
        kind: "check",
        id: "vc2m5a01-check",
        heading: "Check Your Understanding",
        prompt: "Practise using inverse multiplication and division relationships to find unknowns and verify solutions.",
        curriculumCode: "VC2M5A01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2M5A02: Solving Unknown Values in Equations Using Properties
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5A02",
    title: "Solving Equations and Balancing Unknown Values",
    strand: "algebra",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to find unknown quantities in equations involving brackets and multiple operations using algebraic properties and maintaining balance.",
    successCriteria: [
      "I can explain that the equals sign (=) signifies equality and balance between the left and right expressions.",
      "I can apply the order of operations (BODMAS/BEDMAS: Brackets, Orders/Exponents, Division/Multiplication, Addition/Subtraction) correctly.",
      "I can perform equivalent operations to both sides of an equation to isolate the unknown value.",
    ],
    prerequisites: ["VC2M5A01", "VC2M5N06"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Algebra).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5a02-concept",
        heading: "The Balance Model of an Equation",
        explanation:
          "An equation is like a balanced set of weighing scales. The equals sign (=) does NOT mean 'here comes the answer'; it means 'the value on the left is equal to the value on the right'.\n\nTo find an unknown (represented by a symbol, letter, or bracketed box), whatever operation you do to one side of the equals sign, you must do to the other side to keep the scales in balance.\n\nOrder of Operations (BODMAS):\n1. Brackets first: evaluate anything inside ( ) before other operations.\n2. Multiplication and Division from left to right.\n3. Addition and Subtraction from left to right.\n\nExample: In 3 × (n + 4) = 33:\n• Divide both sides by 3: n + 4 = 11.\n• Subtract 4 from both sides: n = 7.",
        keyTerms: [
          {
            term: "Equation",
            definition: "A mathematical statement showing that two expressions have equal value, linked by an equals sign.",
          },
          {
            term: "Order of Operations",
            definition: "The agreed rules establishing which calculation is performed first (Brackets, Orders, Multiplication/Division, Addition/Subtraction).",
          },
          {
            term: "Balancing Method",
            definition: "Performing the exact same mathematical operation to both sides of an equation to keep equality true.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2m5a02-example",
        heading: "Worked Example: Solving an Equation with Brackets",
        problem: "Find the unknown value [ x ] in the equation: 4 × (x - 7) = 36.",
        steps: [
          {
            stepNumber: 1,
            label: "Undo the outer multiplication by dividing both sides by 4",
            working: "(4 × (x - 7)) ÷ 4 = 36 ÷ 4\nResult: x - 7 = 9.",
            why: "Dividing both sides by 4 maintains equality while removing the multiplying factor.",
          },
          {
            stepNumber: 2,
            label: "Isolate [ x ] by applying inverse addition",
            working: "x - 7 + 7 = 9 + 7\nResult: x = 16.",
            why: "Adding 7 cancels out - 7 on the left side and keeps the balance.",
          },
          {
            stepNumber: 3,
            label: "Substitute back into the original equation to verify",
            working: "Left side: 4 × (16 - 7) = 4 × 9 = 36. Right side: 36. 36 = 36 (Balanced).",
            why: "Evaluating the original equation with x = 16 confirms the solution is correct.",
          },
        ],
        finalAnswer: "x = 16.",
        commonError: {
          mistake: "Computing 4 × x - 7 = 36 without applying the 4 to the - 7 (distributive error).",
          whyItHappens: "Ignoring brackets and treating the expression as linear from left to right.",
          howToAvoid: "Either divide both sides by 4 first, or expand the brackets completely: 4x - 28 = 36.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5a02-misconception",
        heading: "Misconception: Equals Sign Means 'Compute the Answer'",
        claim: "The equals sign (=) means 'calculate what comes next'.",
        whyWrong:
          "Thinking of = as a 'do calculation' button leads to errors in equations like 8 + 4 = [ ? ] + 5 (many students write 12 instead of 7). The equals sign is a statement of balance: the total value on the left (12) must equal the total value on the right (7 + 5 = 12).",
        correction:
          "Always think of the equals sign as a balance scale: both sides must evaluate to the same total quantity.",
        example: "In 8 + 4 = ? + 5, since 8 + 4 = 12, the missing number must be 7 so that 7 + 5 = 12.",
      },
      {
        kind: "check",
        id: "vc2m5a02-check",
        heading: "Check Your Understanding",
        prompt: "Practise finding unknown values in equations using operational properties and maintaining balance.",
        curriculumCode: "VC2M5A02",
        practiceCount: 5,
      },
    ],
  },
]);
