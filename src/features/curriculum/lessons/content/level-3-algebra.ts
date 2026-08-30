import type { Lesson } from "../schema";

export const LEVEL_3_ALGEBRA_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2M3A01: Inverse Relationships (Addition & Subtraction)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3A01",
    title: "Inverse Operations: Connecting Addition and Subtraction",
    strand: "algebra",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to use the inverse relationship between addition and subtraction to find unknown numbers and check our calculations.",
    successCriteria: [
      "I can explain that addition and subtraction are inverse (opposite) operations that undo each other.",
      "I can write a complete family of four number facts using three related numbers (e.g. 24 + 16 = 40, 16 + 24 = 40, 40 - 16 = 24, 40 - 24 = 16).",
      "I can use subtraction to solve an addition problem with a missing addend, and addition to check a subtraction result.",
    ],
    prerequisites: ["VC2M3N04"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Algebra).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3a01-concept",
        heading: "How Addition and Subtraction Undo Each Other",
        explanation:
          "Addition and subtraction are inverse operations — this means they are opposites that completely reverse each other. When you add an amount to a starting number and then subtract that exact same amount, you return right back to where you started.\n\nBecause of this inverse connection, any three related numbers can form a 'fact family' of four equivalent equations (two addition and two subtraction):\n• Part + Part = Whole (e.g. 35 + 28 = 63)\n• Part + Part = Whole (e.g. 28 + 35 = 63)\n• Whole - Part = Part (e.g. 63 - 28 = 35)\n• Whole - Part = Part (e.g. 63 - 35 = 28)\n\nWhenever you encounter an equation with an unknown box (like ? + 47 = 112), you can use the inverse operation to solve it immediately: 112 - 47 = 65.",
        keyTerms: [
          {
            term: "Inverse Operation",
            definition: "An opposite operation that reverses the effect of another operation (addition undoes subtraction, and subtraction undoes addition).",
          },
          {
            term: "Fact Family",
            definition: "A set of four related addition and subtraction number sentences made from the same three numbers.",
          },
          {
            term: "Unknown / Missing Value",
            definition: "A number in an equation that is not yet known, often shown as a box, symbol, or question mark.",
          },
        ],
        visualAsset: {
          id: "vc2m3a01-fact-family-table",
          type: "table",
          altText:
            "Table displaying the four linked equations in the fact family for numbers 45, 38, and 83.",
          title: "Fact Family for Parts 45 and 38 Making Whole 83",
          data: {
            headers: ["Equation Type", "Number Sentence", "Role of 83", "Role of 45 and 38"],
            rows: [
              ["Addition 1", "45 + 38 = 83", "Total / Whole", "Parts being combined"],
              ["Addition 2", "38 + 45 = 83", "Total / Whole", "Parts being combined (commutative)"],
              ["Subtraction 1", "83 - 38 = 45", "Starting Whole", "38 subtracted, 45 remains"],
              ["Subtraction 2", "83 - 45 = 38", "Starting Whole", "45 subtracted, 38 remains"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3a01-example",
        heading: "Worked Example: Finding an Unknown Using Inverse Operations",
        problem:
          "Solve for the unknown value in the number sentence: [ ? ] + 68 = 154. Then, show how to verify your solution using addition.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the known whole and known part",
            working:
              "In the equation [ ? ] + 68 = 154, the total (whole) is 154 and one of the parts is 68. The missing value is the other part.",
            why: "Understanding the part-part-whole structure reveals which operation will isolate the unknown.",
          },
          {
            stepNumber: 2,
            label: "Apply the inverse operation (subtraction)",
            working:
              "To undo the addition of 68, subtract 68 from the total 154: [ ? ] = 154 - 68.",
            why: "Subtracting the known part from the whole leaves exactly the missing part.",
          },
          {
            stepNumber: 3,
            label: "Calculate the subtraction using partitioning",
            working:
              "154 - 60 = 94. Then 94 - 8 = 86. So [ ? ] = 86.",
            why: "Splitting 68 into tens (60) and ones (8) makes the mental or written subtraction clean and error-free.",
          },
          {
            stepNumber: 4,
            label: "Check the solution by substituting back into addition",
            working:
              "Check: 86 + 68 = (80 + 60) + (6 + 8) = 140 + 14 = 154. The check matches 154 perfectly.",
            why: "Substituting the answer back into the original problem proves mathematically that the unknown is correct.",
          },
        ],
        finalAnswer:
          "The unknown value is 86. We solved it using the inverse operation (154 - 68 = 86) and confirmed that 86 + 68 = 154.",
        commonError: {
          mistake: "Adding the two visible numbers together (154 + 68 = 222) instead of subtracting.",
          whyItHappens:
            "Students see the plus sign in the equation and instinctively perform addition on whatever numbers are written.",
          howToAvoid:
            "Always ask: 'Am I looking for the whole or a part?' If you already have the whole (the answer on the other side of =), you must subtract to find the missing part.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3a01-misconception",
        heading: "Common Trap: The Equal Sign as an 'Action' Button",
        claim: "The equal sign (=) means 'calculate the answer now' rather than 'both sides have the exact same value'.",
        whyWrong:
          "The equal sign is an equivalence balance, not a command to add. In 154 = [ ? ] + 68, the value on the left (154) must balance the total value on the right.",
        correction:
          "Think of = as a balance scale. Whatever value is on the left side of the scale must weigh exactly the same as the entire right side.",
        example: "In 100 = 75 + [ ? ], 100 is already the total, so the box must be 25 to balance 75 to 100.",
      },
      {
        kind: "check",
        id: "vc2m3a01-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise writing fact families, solving for missing addends, and applying inverse subtraction strategies.",
        curriculumCode: "VC2M3A01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2M3A02: Mental Strategies to 20 and Beyond
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3A02",
    title: "Mental Strategies: Jump, Split, and Bridging Decades",
    strand: "algebra",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to apply flexible mental strategies (make to ten, doubles, jump, and split) to solve addition and subtraction problems efficiently.",
    successCriteria: [
      "I can use 'make to ten' and 'bridging to the next ten' (e.g. 38 + 7 = 38 + 2 + 5 = 45).",
      "I can use doubles and near-doubles (e.g. 70 + 80 is double 70 plus 10 = 150).",
      "I can explain why splitting numbers into place-value chunks simplifies mental arithmetic.",
    ],
    prerequisites: ["VC2M3A01"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Algebra).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3a02-concept",
        heading: "Flexible Mental Calculation Strategies",
        explanation:
          "Mental calculation is not about doing standard column algorithms in your head. Instead, mathematicians use flexible number properties to make calculations simpler and faster:\n\n1. **Bridging through Ten / Friendly Decades:** Look for how many are needed to reach the next clean decade (10, 20, 30, 100), then add the rest. For example, to solve 47 + 8: add 3 to reach 50, then add the remaining 5 to get 55.\n2. **Near Doubles:** Use known doubles facts. For example, 35 + 36 is double 35 (70) plus 1 more = 71.\n3. **Compensation Strategy:** If you are adding a number close to a decade (like 19 or 38), round it up to the friendly decade and adjust at the end. For example, 56 + 19 is calculated as 56 + 20 = 76, then subtract 1 = 75.\n4. **Jump Strategy:** Keep the first number whole and jump forward or backward on an open number line by tens then ones.",
        keyTerms: [
          {
            term: "Bridging to Ten",
            definition: "Splitting a number so that the first part takes you to the nearest multiple of ten, making the remaining addition easy.",
          },
          {
            term: "Compensation",
            definition: "Adjusting a number to a friendlier landmark number (e.g. treating 29 as 30) and then compensating by adding or subtracting the difference.",
          },
          {
            term: "Near Doubles",
            definition: "Using a known double (such as 25 + 25 = 50) to solve an adjacent sum (such as 25 + 26 = 51).",
          },
        ],
        visualAsset: {
          id: "vc2m3a02-bridging-table",
          type: "table",
          altText:
            "Table outlining key mental addition strategies with problem examples and step-by-step mental workings.",
          title: "Core Mental Addition and Subtraction Strategies",
          data: {
            headers: ["Strategy Name", "Example Problem", "Mental Pathway", "Result"],
            rows: [
              ["Bridging Decade", "58 + 7", "58 + 2 (reaches 60) + 5", "65"],
              ["Compensation", "84 - 29", "84 - 30 (gives 54) + 1", "55"],
              ["Near Doubles", "45 + 46", "Double 45 (90) + 1", "91"],
              ["Split Strategy", "63 + 25", "(60 + 20) + (3 + 5) = 80 + 8", "88"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3a02-example",
        heading: "Worked Example: Bridging to the Next Decade",
        problem:
          "Use the bridging strategy to calculate 67 + 26 mentally. Show each step of your mental decomposition.",
        steps: [
          {
            stepNumber: 1,
            label: "Partition the second number into tens and ones",
            working:
              "Split 26 into 20 (two tens) and 6 (ones).",
            why: "Adding tens first makes the number line jump large and straightforward.",
          },
          {
            stepNumber: 2,
            label: "Add the tens to the starting number",
            working:
              "67 + 20 = 87.",
            why: "6 tens + 2 tens = 8 tens, keeping the 7 ones intact.",
          },
          {
            stepNumber: 3,
            label: "Bridge to the next decade using the ones",
            working:
              "From 87, we need 3 to reach the clean decade 90. Split the remaining 6 into 3 + 3.",
            why: "7 ones need exactly 3 ones to complete the next group of ten (87 + 3 = 90).",
          },
          {
            stepNumber: 4,
            label: "Complete the addition with the remaining ones",
            working:
              "90 + 3 = 93.",
            why: "Adding to a clean decade (90) is effortless and eliminates regrouping confusion.",
          },
        ],
        finalAnswer:
          "67 + 26 = 93. (Mental path: 67 + 20 = 87; 87 + 3 = 90; 90 + 3 = 93).",
        commonError: {
          mistake: "Counting on by ones 26 times (e.g. 68, 69, 70...) and losing count.",
          whyItHappens:
            "Relying on tallying or finger counting when the numbers become larger.",
          howToAvoid:
            "Chunk numbers into tens and friendly pairs that make ten (e.g. 7 + 3 = 10).",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3a02-misconception",
        heading: "Common Trap: Over-compensating in Subtraction",
        claim: "When subtracting 29 by doing -30, you must subtract 1 more at the end (e.g. 84 - 30 = 54, then 54 - 1 = 53).",
        whyWrong:
          "Subtracting 30 removed 1 too many items (you only needed to take away 29).",
        correction:
          "Because you subtracted 1 extra item, you must give that 1 item back by adding 1: 84 - 30 = 54, then 54 + 1 = 55.",
        example: "If you owe $29 and give a $30 note, you receive $1 change back ($54 + $1 = $55).",
      },
      {
        kind: "check",
        id: "vc2m3a02-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise bridging decades, using compensation, and applying near-doubles to solve addition and subtraction questions.",
        curriculumCode: "VC2M3A02",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2M3A03: Multiplication and Division Fact Families (3, 4, 5, 10)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3A03",
    title: "Fact Families: Multiplication and Division for 3, 4, 5 and 10",
    strand: "algebra",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to recall and use multiplication facts for 3, 4, 5 and 10, and connect them directly to their related division facts.",
    successCriteria: [
      "I can recall multiplication facts for the 3, 4, 5, and 10 times tables.",
      "I can use the commutative property of multiplication (e.g. 4 × 6 = 6 × 4 = 24).",
      "I can write the two division facts related to any multiplication fact (e.g. if 4 × 8 = 32, then 32 ÷ 4 = 8 and 32 ÷ 8 = 4).",
    ],
    prerequisites: ["VC2M3N05"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Algebra).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3a03-concept",
        heading: "Connecting Multiplication and Division Facts",
        explanation:
          "Multiplication is equal grouping (Total = Number of Groups × Group Size). Division is sharing into equal groups or finding how many groups can be made (Number of Groups = Total ÷ Group Size).\n\nBecause multiplication and division are inverse operations, every multiplication fact gives you division facts for free:\n• If 4 × 7 = 28, then 28 ÷ 4 = 7 and 28 ÷ 7 = 4.\n\nKey table strategies for Level 3:\n• **10s:** Multiply by 10 by shifting digits one place to the left (each digit is worth 10 times more; ends in 0).\n• **5s:** Exactly half of the 10 times table (e.g. 6 × 10 = 60, so 6 × 5 = 30). All multiples of 5 end in 0 or 5.\n• **4s:** The double-double strategy! To multiply by 4, double the number, then double it again (e.g. 7 × 4 → double 7 is 14, double 14 is 28).\n• **3s:** Double plus one more group (e.g. 6 × 3 = (6 × 2) + 6 = 12 + 6 = 18).",
        keyTerms: [
          {
            term: "Commutative Property",
            definition: "The mathematical rule that changing the order of factors does not change the product (e.g. 3 × 5 = 5 × 3 = 15).",
          },
          {
            term: "Quotient",
            definition: "The result of dividing one number by another (in 24 ÷ 4 = 6, the quotient is 6).",
          },
          {
            term: "Double-Double Strategy",
            definition: "Multiplying by 4 by doubling once and then doubling the result.",
          },
        ],
        visualAsset: {
          id: "vc2m3a03-fact-family-grid",
          type: "table",
          altText:
            "Table showing multiplication and division fact family triads for 3, 4, 5, and 10 times tables.",
          title: "Multiplication & Division Fact Family Triads",
          data: {
            headers: ["Factors", "Product", "Multiplication Sentences", "Related Division Sentences"],
            rows: [
              ["3 and 7", 21, "3 × 7 = 21 and 7 × 3 = 21", "21 ÷ 3 = 7 and 21 ÷ 7 = 3"],
              ["4 and 8", 32, "4 × 8 = 32 and 8 × 4 = 32", "32 ÷ 4 = 8 and 32 ÷ 8 = 4"],
              ["5 and 9", 45, "5 × 9 = 45 and 9 × 5 = 45", "45 ÷ 5 = 9 and 45 ÷ 9 = 5"],
              ["10 and 6", 60, "10 × 6 = 60 and 6 × 10 = 60", "60 ÷ 10 = 6 and 6 ÷ 6 = 10"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3a03-example",
        heading: "Worked Example: Solving Division Using a Multiplication Fact",
        problem:
          "A baker puts 36 fresh muffins equally into 4 presentation boxes. How many muffins go into each box? Show how to solve this using a multiplication fact family.",
        steps: [
          {
            stepNumber: 1,
            label: "Write the problem as a division sentence",
            working:
              "Total muffins = 36. Number of equal boxes = 4. Number sentence: 36 ÷ 4 = [ ? ].",
            why: "Sharing a total equally among groups is modeled by division.",
          },
          {
            stepNumber: 2,
            label: "Rephrase as a missing-factor multiplication sentence",
            working:
              "4 boxes × [ ? ] muffins per box = 36 muffins. So: 4 × [ ? ] = 36.",
            why: "Division asks: 'What number multiplied by 4 equals 36?'",
          },
          {
            stepNumber: 3,
            label: "Recall or calculate the 4 times table fact",
            working:
              "Use double-double: 4 × 9 → double 9 is 18, double 18 is 36. So 4 × 9 = 36.",
            why: "Since 4 × 9 = 36, the missing factor is 9.",
          },
          {
            stepNumber: 4,
            label: "State the division solution with units",
            working:
              "36 ÷ 4 = 9 muffins per box.",
            why: "Completing the fact family confirms that 36 divided into 4 equal groups yields 9 in each group.",
          },
        ],
        finalAnswer:
          "There are 9 muffins in each box because 36 ÷ 4 = 9 (connected to the multiplication fact 4 × 9 = 36).",
        commonError: {
          mistake: "Dividing by halving only once (e.g. 36 ÷ 2 = 18) and stopping there.",
          whyItHappens:
            "Dividing by 4 requires halving TWICE (half of 36 is 18, half of 18 is 9). Halving once only divides by 2.",
          howToAvoid:
            "Remember that 4 is 2 × 2, so dividing by 4 means halving twice (half-half strategy).",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3a03-misconception",
        heading: "Common Trap: Thinking Division is Commutative",
        claim: "You can swap the order of numbers in division just like in multiplication (e.g. 20 ÷ 4 is the same as 4 ÷ 20).",
        whyWrong:
          "Multiplication is commutative (4 × 5 = 5 × 4 = 20), but division is NOT commutative. 20 shared among 4 people gives 5 each, whereas 4 items shared among 20 people gives only a fraction of an item.",
        correction:
          "In whole-number division, the total being shared (the dividend) must always come first: Total ÷ Number of Groups = Group Size.",
        example: "24 ÷ 6 = 4, but 6 ÷ 24 = 0.25 (one quarter). Order matters in division!",
      },
      {
        kind: "check",
        id: "vc2m3a03-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise recalling multiplication tables for 3, 4, 5, and 10 and solving linked division word problems.",
        curriculumCode: "VC2M3A03",
        practiceCount: 5,
      },
    ],
  },
]);
