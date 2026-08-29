import type { Lesson } from "../schema";

export const LEVEL_3_NUMBER_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2M3N01: Odd and Even Numbers (Parity & Patterns)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3N01",
    title: "Odd and Even Numbers: Parity and Addition Rules",
    strand: "number",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify odd and even numbers and predict what happens when we add or subtract them.",
    successCriteria: [
      "I can tell whether a whole number is odd or even by checking its ones digit.",
      "I can explain that even numbers split into equal pairs without leftovers, while odd numbers leave one remainder.",
      "I can use parity rules (Even + Even = Even, Odd + Odd = Even, Even + Odd = Odd) to check arithmetic answers.",
    ],
    prerequisites: [],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-29T10:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics.",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3n01-concept",
        heading: "What Makes a Number Odd or Even?",
        explanation:
          "Every whole number is either odd or even. An even number can always be divided into pairs with zero items left over. An odd number always leaves exactly one item left over when grouped into pairs.\n\nTo determine if any whole number is odd or even — no matter how large — you only need to inspect the ones digit (the final digit on the right):\n• Even digits: 0, 2, 4, 6, 8\n• Odd digits: 1, 3, 5, 7, 9\n\nWhen we combine numbers, their parity follows reliable rules:\n• Even + Even = Even (e.g. 6 + 4 = 10)\n• Odd + Odd = Even (e.g. 5 + 7 = 12, because the two leftover items form a new pair)\n• Even + Odd = Odd (e.g. 6 + 5 = 11, because one leftover item remains)",
        keyTerms: [
          {
            term: "Parity",
            definition: "The property of an integer being either odd or even.",
          },
          {
            term: "Ones digit",
            definition: "The rightmost digit in a whole number, which determines its parity.",
          },
        ],
        visualAsset: {
          id: "vc2m3n01-pairing-table",
          type: "table",
          altText:
            "Table comparing pairing of even number 8 into 4 equal pairs with zero leftover, versus odd number 9 into 4 pairs with 1 leftover.",
          title: "Pairing Model for 8 (Even) vs 9 (Odd)",
          data: {
            headers: ["Number", "Total Items", "Pairs Formed", "Leftover Remainder", "Classification"],
            rows: [
              ["8", 8, "4 pairs (2 + 2 + 2 + 2)", 0, "Even"],
              ["9", 9, "4 pairs + 1 item", 1, "Odd"],
              ["14", 14, "7 pairs", 0, "Even"],
              ["15", 15, "7 pairs + 1 item", 1, "Odd"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3n01-example",
        heading: "Worked Example: Checking Sum Parity Without Calculating",
        problem:
          "Without calculating the full addition, determine whether 348 + 517 will produce an odd or an even sum. Explain your reasoning step by step.",
        steps: [
          {
            stepNumber: 1,
            label: "Inspect the first number (348)",
            working: "The ones digit of 348 is 8. Since 8 is divisible by 2, 348 is an even number.",
            why: "The ones digit is the only digit that determines whether a whole number can be paired evenly.",
          },
          {
            stepNumber: 2,
            label: "Inspect the second number (517)",
            working: "The ones digit of 517 is 7. Since 7 leaves a remainder of 1 when paired, 517 is an odd number.",
            why: "Any number ending in 1, 3, 5, 7, or 9 is odd.",
          },
          {
            stepNumber: 3,
            label: "Apply the addition parity rule",
            working: "Even + Odd = Odd. 348 (even) + 517 (odd) = Odd sum.",
            why: "The pairs in 348 and 517 match up, leaving exactly the 1 leftover item from 517 unpaired.",
          },
          {
            stepNumber: 4,
            label: "Verify by checking the sum's ones digit",
            working: "8 + 7 = 15 (ones digit is 5, which is odd). 348 + 517 = 865 (ends in 5).",
            why: "Checking the arithmetic confirms our parity deduction was 100% accurate.",
          },
        ],
        finalAnswer:
          "The sum 348 + 517 is ODD because adding an even number and an odd number always results in an odd number (348 + 517 = 865, ending in 5).",
        commonError: {
          mistake: "Looking at the first digit (3 and 5) instead of the ones digit (8 and 7).",
          whyItHappens: "Students read from left to right and assume the hundreds digit sets the type of number.",
          howToAvoid: "Always jump straight to the rightmost (ones) column to test for odd or even.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3n01-misconception",
        heading: "Common Trap: Majority of Digits",
        claim: "A large number like 3,752 must be odd because three of its four digits (3, 7, 5) are odd.",
        whyWrong:
          "The digits in the thousands, hundreds, and tens places represent complete groups of 1,000, 100, and 10. Because 1,000, 100, and 10 are all even numbers, those groups are already completely paired up with zero leftovers.",
        correction:
          "Only the ones digit can leave an unpaired remainder. Because 3,752 ends in 2 (an even digit), the entire number is even.",
        example: "3,752 = 3,750 (which ends in 0, even) + 2 (even) = Even.",
      },
      {
        kind: "check",
        id: "vc2m3n01-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying odd and even numbers, checking sum rules, and solving parity word problems from our verified question bank.",
        curriculumCode: "VC2M3N01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2M3N02: Reading, Writing and Ordering Five-Digit Numbers
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3N02",
    title: "Place Value: Reading, Writing and Ordering up to 10,000",
    strand: "number",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to read, write, partition and compare whole numbers up to five digits.",
    successCriteria: [
      "I can state the value of each digit based on its place-value column (ten-thousands, thousands, hundreds, tens, ones).",
      "I can write numbers in standard form, expanded form, and words.",
      "I can compare and order multi-digit numbers by comparing digits starting from the highest place-value column.",
    ],
    prerequisites: ["VC2M3N01"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-29T10:00:00.000Z",
      originalityStatement:
        "Original Level 3 Mathematics place value instructional sequence designed for Victorian Curriculum F-10 v2.0.",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3n02-concept",
        heading: "Place-Value Columns up to 10,000",
        explanation:
          "Our number system is based on groups of ten (base 10). Each time you move one column to the left, the value of the place increases by ten times:\n• Ones (1s)\n• Tens (10s = 10 ones)\n• Hundreds (100s = 10 tens)\n• Thousands (1,000s = 10 hundreds)\n• Ten-Thousands (10,000s = 10 thousands)\n\nIn the number 6,408:\n• 6 is in the thousands place → value is 6,000\n• 4 is in the hundreds place → value is 400\n• 0 is in the tens place → value is 0 (it acts as a vital placeholder!)\n• 8 is in the ones place → value is 8\n\nExpanded form: 6,408 = 6,000 + 400 + 0 + 8 = 6,000 + 400 + 8.",
        keyTerms: [
          {
            term: "Expanded form",
            definition: "Writing a number to show the sum of the values of each of its digits.",
          },
          {
            term: "Placeholder zero",
            definition: "A zero holding a column so other digits keep their correct place value.",
          },
        ],
        visualAsset: {
          id: "vc2m3n02-place-value-table",
          type: "table",
          altText:
            "Place value chart showing Ten-Thousands, Thousands, Hundreds, Tens, and Ones columns for numbers 6408, 6048, and 6840.",
          title: "Place Value Column Chart",
          data: {
            headers: ["Number", "Ten-Thousands", "Thousands", "Hundreds", "Tens", "Ones"],
            rows: [
              ["6,408", 0, 6, 4, 0, 8],
              ["6,048", 0, 6, 0, 4, 8],
              ["6,840", 0, 6, 8, 4, 0],
              ["12,350", 1, 2, 3, 5, 0],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3n02-example",
        heading: "Worked Example: Ordering Numbers from Smallest to Largest",
        problem:
          "Order these four numbers from smallest to largest (ascending order): 7,305; 7,053; 7,530; 7,350.",
        steps: [
          {
            stepNumber: 1,
            label: "Compare the highest place-value column (Thousands)",
            working: "All four numbers have '7' in the thousands place (7,000). Since they are equal, move to the hundreds column.",
            why: "We always compare digits starting from the largest value column on the left.",
          },
          {
            stepNumber: 2,
            label: "Compare the Hundreds column",
            working: "• 7,053 has 0 hundreds\n• 7,305 has 3 hundreds\n• 7,350 has 3 hundreds\n• 7,530 has 5 hundreds\n\nSmallest is 7,053. Largest is 7,530.",
            why: "0 hundreds < 3 hundreds < 5 hundreds.",
          },
          {
            stepNumber: 3,
            label: "Compare the Tens column for the tied numbers (7,305 vs 7,350)",
            working: "• 7,305 has 0 tens (value 0)\n• 7,350 has 5 tens (value 50)\nTherefore, 7,305 is smaller than 7,350.",
            why: "When the hundreds digits tie, the tens digit breaks the tie.",
          },
          {
            stepNumber: 4,
            label: "Assemble the complete ascending sequence",
            working: "7,053 < 7,305 < 7,350 < 7,530.",
            why: "Order verified across every column from left to right.",
          },
        ],
        finalAnswer:
          "The ascending order from smallest to largest is: 7,053; 7,305; 7,350; 7,530.",
        commonError: {
          mistake: "Ignoring placeholder zeros and treating 7,053 as 753.",
          whyItHappens: "Omitting the zero in the hundreds column turns a four-digit number into a three-digit number.",
          howToAvoid: "Count total digits first: all four numbers have 4 digits, so 7,053 has seven thousands and zero hundreds.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3n02-misconception",
        heading: "Common Trap: Digit Value vs Face Value",
        claim: "In the number 4,921, the digit 9 is larger than the digit 4 because 9 > 4.",
        whyWrong:
          "The digit '9' has a face value of 9, but because it sits in the hundreds place, its actual value is 900. The digit '4' sits in the thousands place, so its actual value is 4,000.",
        correction:
          "A digit's true value depends entirely on the column it occupies. 4,000 is much larger than 900.",
        example: "4,000 (value of 4) > 900 (value of 9).",
      },
      {
        kind: "check",
        id: "vc2m3n02-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise reading, partitioning, and ordering four- and five-digit numbers from our verified question bank.",
        curriculumCode: "VC2M3N02",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2M3N03: Unit Fractions and Completing the Whole
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3N03",
    title: "Fractions: Unit Fractions and Building the Whole",
    strand: "number",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify unit fractions, understand equal parts, and combine fractions to make one whole.",
    successCriteria: [
      "I can explain that a unit fraction represents 1 equal part out of total equal parts (1/n).",
      "I can recognise that a larger denominator means the whole has been split into smaller parts.",
      "I can combine unit fractions to make non-unit fractions and complete the whole (e.g. 3/4 + 1/4 = 4/4 = 1).",
    ],
    prerequisites: ["VC2M3N02"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-29T10:00:00.000Z",
      originalityStatement:
        "Original visual fraction models and explanations authored for Victorian Curriculum Level 3 Mathematics.",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3n03-concept",
        heading: "What is a Unit Fraction?",
        explanation:
          "A fraction represents one or more equal parts of a whole shape or collection.\n\nEvery fraction has two numbers:\n• The Denominator (bottom number): tells you how many EQUAL parts the whole has been cut or shared into.\n• The Numerator (top number): tells you how many of those equal parts you are counting or considering.\n\nA UNIT fraction always has a numerator of 1 (such as 1/2, 1/3, 1/4, 1/5, 1/8, 1/10).\n\nKey Rule of Denominators:\nThe MORE parts you cut a whole into, the SMALLER each individual slice becomes:\n1/2 > 1/3 > 1/4 > 1/5 > 1/8 > 1/10\n\nTo make ONE complete whole, you need all the parts:\n• Two halves make 1 whole (2/2 = 1)\n• Three thirds make 1 whole (3/3 = 1)\n• Four quarters make 1 whole (4/4 = 1)\n• Five fifths make 1 whole (5/5 = 1)",
        keyTerms: [
          {
            term: "Unit fraction",
            definition: "A fraction with a numerator of 1 (e.g. 1/2, 1/3, 1/4).",
          },
          {
            term: "Denominator",
            definition: "The bottom number showing the total number of equal parts in the whole.",
          },
          {
            term: "Numerator",
            definition: "The top number showing how many equal parts are selected.",
          },
        ],
        visualAsset: {
          id: "vc2m3n03-bar-model",
          type: "fraction_model",
          altText: "Fraction bar model showing 3 out of 4 equal segments shaded, representing three quarters.",
          title: "Three Quarters (3/4) of a Whole Bar",
          data: {
            numerator: 3,
            denominator: 4,
            model: "bar",
            colour: "#4B2E83",
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3n03-example",
        heading: "Worked Example: Finding the Missing Fraction to Complete the Whole",
        problem:
          "A fruit tart is cut into 8 equal slices. Chloe and her brother eat 5 slices between them. What fraction of the tart was eaten, and what fraction remains to complete the whole tart?",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the denominator",
            working: "The tart is cut into 8 equal slices, so the denominator is 8. One whole tart = 8/8.",
            why: "The total number of equal divisions defines the size of each unit slice (1/8).",
          },
          {
            stepNumber: 2,
            label: "Write the fraction eaten",
            working: "5 slices were eaten. 5 slices of size 1/8 = 5/8 of the tart.",
            why: "The numerator counts how many slices were taken.",
          },
          {
            stepNumber: 3,
            label: "Calculate the remaining slices",
            working: "Total slices (8) - Slices eaten (5) = 3 slices remaining.",
            why: "Subtracting the parts taken from the whole gives the missing parts.",
          },
          {
            stepNumber: 4,
            label: "Write the remaining fraction and verify sum to 1",
            working: "3 slices = 3/8. Check: 5/8 + 3/8 = (5 + 3)/8 = 8/8 = 1 whole tart.",
            why: "The eaten fraction plus the remaining fraction must always sum to 8/8 (one whole).",
          },
        ],
        finalAnswer:
          "5/8 of the tart was eaten, and 3/8 of the tart remains. 3/8 more is needed to complete the whole tart.",
        commonError: {
          mistake: "Writing the remaining fraction as 3/5 instead of 3/8.",
          whyItHappens: "Comparing remaining slices to eaten slices instead of to the whole tart.",
          howToAvoid: "Always keep the total number of parts (8) as the denominator.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3n03-misconception",
        heading: "Common Trap: Bigger Denominator Means Bigger Fraction",
        claim: "1/8 is larger than 1/4 because 8 is a bigger number than 4.",
        whyWrong:
          "The denominator represents division (sharing). If you share a pizza among 8 people, each person gets a much smaller slice than if you shared the same pizza among only 4 people.",
        correction:
          "As the denominator increases, the size of each equal unit part decreases: 1/4 is twice as large as 1/8.",
        example: "Two one-eighth pieces (1/8 + 1/8) equal one one-quarter piece (1/4).",
      },
      {
        kind: "check",
        id: "vc2m3n03-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying unit fractions, comparing equal parts, and completing the whole with questions from our verified question bank.",
        curriculumCode: "VC2M3N03",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. VC2M3N04: Addition and Subtraction with Place-Value Partitioning
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3N04",
    title: "Addition and Subtraction: Mental Partitioning Strategies",
    strand: "number",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to add and subtract two- and three-digit numbers by breaking numbers into place-value parts.",
    successCriteria: [
      "I can partition numbers into hundreds, tens, and ones to add efficiently.",
      "I can use an open number line jump strategy to add and subtract.",
      "I can regroup tens and hundreds correctly when calculating differences.",
    ],
    prerequisites: ["VC2M3N02"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-29T10:00:00.000Z",
      originalityStatement:
        "Original multi-digit mental computation and partitioning lesson authored for Victorian Curriculum Level 3 Mathematics.",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3n04-concept",
        heading: "Mental Addition and Subtraction Strategies",
        explanation:
          "When adding or subtracting 2-digit and 3-digit numbers in your head or on paper, breaking numbers into place-value parts makes the problem simple and reliable.\n\nStrategy 1: Split Strategy (Partitioning)\nTo solve 245 + 138:\n• Add the hundreds: 200 + 100 = 300\n• Add the tens: 40 + 30 = 70\n• Add the ones: 5 + 8 = 13\n• Combine the totals: 300 + 70 + 13 = 383.\n\nStrategy 2: Jump Strategy (Number Line)\nStart at 245, then jump forward by parts of 138:\n• Jump +100 → 345\n• Jump +30 → 375\n• Jump +8 → 383.\n\nStrategy 3: Subtraction by Partitioning\nTo solve 452 - 128:\n• 452 - 100 = 352\n• 352 - 20 = 332\n• 332 - 8 = 324.",
        keyTerms: [
          {
            term: "Partitioning",
            definition: "Breaking a number into smaller place-value components (e.g. 138 = 100 + 30 + 8).",
          },
          {
            term: "Regrouping",
            definition: "Exchanging 1 ten for 10 ones, or 1 hundred for 10 tens.",
          },
        ],
        visualAsset: {
          id: "vc2m3n04-jump-number-line",
          type: "number_line",
          altText:
            "Number line from 200 to 400 with highlighted values at 245, 345, 375, and 383 showing additive jumps.",
          title: "Jump Strategy on a Number Line: 245 + 138",
          data: {
            min: 200,
            max: 400,
            step: 25,
            highlightedValues: [245, 345, 375, 383],
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3n04-example",
        heading: "Worked Example: Solving 524 - 267 with Regrouping",
        problem:
          "Calculate 524 - 267 using place-value partitioning and explain each regrouping step.",
        steps: [
          {
            stepNumber: 1,
            label: "Partition the subtracted number (267)",
            working: "267 = 200 (hundreds) + 60 (tens) + 7 (ones).",
            why: "Breaking the subtrahend into standard place-value parts allows step-by-step subtraction.",
          },
          {
            stepNumber: 2,
            label: "Subtract the hundreds",
            working: "524 - 200 = 324.",
            why: "Subtracting the largest component first keeps numbers manageable.",
          },
          {
            stepNumber: 3,
            label: "Subtract the tens (requiring a regroup across 300)",
            working: "324 - 60 = (324 - 20) - 40 = 304 - 40 = 264.",
            why: "Splitting 60 into 20 + 40 lets us land on the friendly benchmark 304, then bridge down to 264.",
          },
          {
            stepNumber: 4,
            label: "Subtract the ones",
            working: "264 - 7 = (264 - 4) - 3 = 260 - 3 = 257.",
            why: "Splitting 7 into 4 + 3 bridges through the friendly benchmark 260.",
          },
          {
            stepNumber: 5,
            label: "Verify using inverse addition",
            working: "Check: 257 + 267 = (257 + 200) + 60 + 7 = 457 + 60 + 7 = 517 + 7 = 524.",
            why: "Addition confirms the difference 257 is correct.",
          },
        ],
        finalAnswer: "524 - 267 = 257.",
        commonError: {
          mistake: "Subtracting the smaller digit from the larger digit in the ones place (7 - 4 = 3).",
          whyItHappens: "Avoiding regrouping when the top digit is smaller than the bottom digit.",
          howToAvoid: "Remember you are taking away 7 from 4, which requires bridging through the previous ten.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3n04-misconception",
        heading: "Common Trap: Forgetting the Changed Column After Regrouping",
        claim: "When you regroup 1 ten into 10 ones in 52 - 37, the tens column still has 5 tens.",
        whyWrong:
          "When you trade 1 ten for 10 ones, the tens column reduces by 1 ten (5 tens becomes 4 tens).",
        correction:
          "Always record the reduction in the tens column immediately (4 tens - 3 tens = 1 ten; 12 ones - 7 ones = 5 ones → 15).",
        example: "52 - 37: (40 + 12) - (30 + 7) = (40 - 30) + (12 - 7) = 10 + 5 = 15.",
      },
      {
        kind: "check",
        id: "vc2m3n04-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise 2-digit and 3-digit mental addition and subtraction problems from our verified question bank.",
        curriculumCode: "VC2M3N04",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. VC2M3N05: Multiplication & Division with Arrays and Number Sentences
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3N05",
    title: "Multiplication and Division: Arrays and Fact Families",
    strand: "number",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to represent multiplication and division using rectangular arrays, equal groups, and related number sentences.",
    successCriteria: [
      "I can model multiplication as rows and columns in an array.",
      "I can use the commutative property: 4 × 6 = 6 × 4 = 24.",
      "I can write the four fact family sentences for an array (2 multiplication, 2 division).",
    ],
    prerequisites: ["VC2M3N04"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-29T10:00:00.000Z",
      originalityStatement:
        "Original multiplicative reasoning and array modelling lesson authored for Victorian Curriculum Level 3 Mathematics.",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3n05-concept",
        heading: "Arrays and Multiplicative Fact Families",
        explanation:
          "Multiplication is repeated addition of equal groups. A powerful way to visualise multiplication is an ARRAY — an arrangement of objects in equal rows and columns.\n\nKey Concepts:\n• Rows go across horizontally (→)\n• Columns go down vertically (↓)\n\nAn array with 4 rows and 6 items in each row has:\n4 × 6 = 24 items in total.\n\nCommutative Property:\nIf you rotate the array, you get 6 rows of 4 items:\n6 × 4 = 24.\nThe total is identical!\n\nInverse Relationship (Division):\nDivision undoes multiplication:\n• 24 shared into 4 equal rows = 6 items per row (24 ÷ 4 = 6)\n• 24 shared into 6 equal columns = 4 items per column (24 ÷ 6 = 4)\n\nTogether, these form a complete Fact Family:\n1. 4 × 6 = 24\n2. 6 × 4 = 24\n3. 24 ÷ 4 = 6\n4. 24 ÷ 6 = 4",
        keyTerms: [
          {
            term: "Array",
            definition: "An orderly grid of objects arranged in equal rows and equal columns.",
          },
          {
            term: "Fact family",
            definition: "A set of four related multiplication and division number sentences using the same three numbers.",
          },
        ],
        visualAsset: {
          id: "vc2m3n05-array-table",
          type: "table",
          altText: "A 4 by 6 array grid showing 4 rows and 6 columns totaling 24 items.",
          title: "4 × 6 Array Grid Model (24 Total)",
          data: {
            headers: ["Row", "Col 1", "Col 2", "Col 3", "Col 4", "Col 5", "Col 6", "Row Total"],
            rows: [
              ["Row 1", "●", "●", "●", "●", "●", "●", 6],
              ["Row 2", "●", "●", "●", "●", "●", "●", 6],
              ["Row 3", "●", "●", "●", "●", "●", "●", 6],
              ["Row 4", "●", "●", "●", "●", "●", "●", 6],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3n05-example",
        heading: "Worked Example: Building a Fact Family from a Word Problem",
        problem:
          "A gardener plants 35 flower seedlings in 5 equal rows. How many seedlings are in each row? Write the complete 4-sentence fact family for this situation.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the known total and number of groups",
            working: "Total seedlings = 35. Number of equal rows (groups) = 5.",
            why: "The problem asks to share a known total (35) into 5 equal groups (division).",
          },
          {
            stepNumber: 2,
            label: "Calculate the items per row using division",
            working: "35 ÷ 5 = 7 seedlings per row.",
            why: "Count by 5s to 35: 5, 10, 15, 20, 25, 30, 35 (7 groups).",
          },
          {
            stepNumber: 3,
            label: "Write the related multiplication sentences",
            working: "• 5 rows × 7 seedlings = 35 seedlings (5 × 7 = 35)\n• 7 seedlings × 5 rows = 35 seedlings (7 × 5 = 35)",
            why: "Multiplication and division are inverse operations.",
          },
          {
            stepNumber: 4,
            label: "Write the two related division sentences",
            working: "• 35 ÷ 5 = 7\n• 35 ÷ 7 = 5",
            why: "Sharing 35 into 5 groups gives 7; sharing 35 into 7 groups gives 5.",
          },
        ],
        finalAnswer:
          "There are 7 seedlings in each row. The complete fact family is:\n1) 5 × 7 = 35\n2) 7 × 5 = 35\n3) 35 ÷ 5 = 7\n4) 35 ÷ 7 = 5.",
        commonError: {
          mistake: "Writing division sentences with the smaller numbers first, e.g. 5 ÷ 35 = 7.",
          whyItHappens: "Mixing up the total (dividend) with the group size (divisor).",
          howToAvoid: "In whole number division, the total collection (35) always comes first before the division sign.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3n05-misconception",
        heading: "Common Trap: Thinking Division is Commutative",
        claim: "Since 4 × 6 = 6 × 4, it must also be true that 24 ÷ 4 = 4 ÷ 24.",
        whyWrong:
          "Order matters in division! Sharing 24 apples among 4 people gives 6 apples each. Sharing 4 apples among 24 people gives each person only a tiny slice (1/6 of an apple).",
        correction:
          "Multiplication is commutative (a × b = b × a), but division is NOT commutative (a ÷ b ≠ b ÷ a).",
        example: "24 ÷ 4 = 6, whereas 4 ÷ 24 = 1/6.",
      },
      {
        kind: "check",
        id: "vc2m3n05-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise multiplication facts, array interpretations, and division problems from our verified question bank.",
        curriculumCode: "VC2M3N05",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. VC2M3N06: Estimation Strategies and Checking Reasonableness
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3N06",
    title: "Estimation: Rounding and Checking Calculation Reasonableness",
    strand: "number",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to use rounding and mental benchmarks to estimate calculations and check whether answers make sense.",
    successCriteria: [
      "I can round 2-digit and 3-digit numbers to the nearest 10 or 100.",
      "I can calculate an estimated sum or difference before finding the exact answer.",
      "I can compare an exact result against an estimate to catch calculation errors.",
    ],
    prerequisites: ["VC2M3N04"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-29T10:00:00.000Z",
      originalityStatement:
        "Original estimation strategies, rounding rules, and reasonableness checks authored for Victorian Curriculum Level 3 Mathematics.",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3n06-concept",
        heading: "The Power of Estimation",
        explanation:
          "Estimation is not random guessing — it is smart mathematical approximation. Making an estimate before you calculate gives you a mental benchmark to immediately spot whether your final answer is reasonable.\n\nRounding to the Nearest 10:\nLook at the ones digit:\n• If the ones digit is 0, 1, 2, 3, or 4 → round DOWN to the lower ten (e.g. 43 rounds to 40).\n• If the ones digit is 5, 6, 7, 8, or 9 → round UP to the higher ten (e.g. 47 rounds to 50).\n\nRounding to the Nearest 100:\nLook at the tens digit:\n• If the tens digit is 0–4 → round DOWN (e.g. 348 rounds to 300).\n• If the tens digit is 5–9 → round UP (e.g. 372 rounds to 400).\n\nChecking Reasonableness:\nIf you calculate 189 + 124 and your calculator or pencil shows 413, check your estimate:\n190 + 120 = 310. An answer of 413 is over 100 away from your estimate, proving an error was made!",
        keyTerms: [
          {
            term: "Rounding",
            definition: "Adjusting a number to the nearest friendly benchmark (ten or hundred) to make calculations simpler.",
          },
          {
            term: "Reasonableness",
            definition: "Judging whether a mathematical result is sensible and close to expected benchmark values.",
          },
        ],
        visualAsset: {
          id: "vc2m3n06-rounding-number-line",
          type: "number_line",
          altText:
            "Number line from 200 to 300 showing 248 rounding down to 250 and 276 rounding up to 280.",
          title: "Rounding Numbers to the Nearest Ten on a Number Line",
          data: {
            min: 200,
            max: 300,
            step: 10,
            highlightedValues: [248, 250, 276, 280],
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3n06-example",
        heading: "Worked Example: Checking If a Receipt Total is Reasonable",
        problem:
          "Liam buys a soccer ball for $38, shin pads for $24, and a water bottle for $19. The store clerk requests $121. Use rounding to the nearest ten to estimate the total and determine if $121 is reasonable.",
        steps: [
          {
            stepNumber: 1,
            label: "Round each item price to the nearest ten",
            working: "• $38 has ones digit 8 (≥ 5) → rounds up to $40\n• $24 has ones digit 4 (< 5) → rounds down to $20\n• $19 has ones digit 9 (≥ 5) → rounds up to $20",
            why: "Rounding to friendly tens makes mental addition instant.",
          },
          {
            stepNumber: 2,
            label: "Calculate the estimated sum",
            working: "Estimated Total = $40 + $20 + $20 = $80.",
            why: "Adding rounded values produces a reliable benchmark.",
          },
          {
            stepNumber: 3,
            label: "Compare the estimate to the requested amount ($121)",
            working: "The estimate is $80. The clerk's request is $121. The difference is $121 - $80 = $41 (over 50% higher than expected).",
            why: "A valid exact answer should sit very close to $80.",
          },
          {
            stepNumber: 4,
            label: "Calculate exact sum to prove the error",
            working: "Exact Total = $38 + $24 + $19 = $62 + $19 = $81.",
            why: "Exact sum $81 is within $1 of our $80 estimate, showing the clerk overcharged by $40.",
          },
        ],
        finalAnswer:
          "The clerk's request of $121 is NOT reasonable. The estimated total is $80, and the exact total is $81 ($121 was $40 too high).",
        commonError: {
          mistake: "Rounding numbers always up, regardless of whether the digit is under 5.",
          whyItHappens: "Believing rounding always means making a number bigger.",
          howToAvoid: "Check the decision rule: 0, 1, 2, 3, 4 round DOWN; 5, 6, 7, 8, 9 round UP.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3n06-misconception",
        heading: "Common Trap: Rounding Intermediate Steps Multiple Times",
        claim: "When rounding 345 to the nearest hundred, round to 350 first (round up), then round 350 to 400 (round up again).",
        whyWrong:
          "Double rounding creates compounding errors. 345 is closer to 300 (distance 45) than to 400 (distance 55).",
        correction:
          "Always look directly at the original number's tens digit (4). Because 4 < 5, 345 rounds directly down to 300.",
        example: "345 to nearest 100 = 300 (since 45 < 50).",
      },
      {
        kind: "check",
        id: "vc2m3n06-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise rounding to 10 and 100, estimating calculation outcomes, and testing answer reasonableness from our question bank.",
        curriculumCode: "VC2M3N06",
        practiceCount: 4,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. VC2M3N07: Dollar and Cent Relationships and Monetary Calculations
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3N07",
    title: "Money: Dollar and Cent Relationships and Calculating Change",
    strand: "number",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to represent money in dollars and cents, convert between units, and calculate change from whole dollar notes.",
    successCriteria: [
      "I can state that 100 cents equals 1 dollar ($1.00 = 100c).",
      "I can write money values in decimal notation (e.g. $4.75).",
      "I can calculate change from $5, $10, or $20 notes using the count-up strategy.",
    ],
    prerequisites: ["VC2M3N04"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-29T10:00:00.000Z",
      originalityStatement:
        "Original Australian currency and financial reasoning instructional content authored for Victorian Curriculum Level 3 Mathematics.",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3n07-concept",
        heading: "Australian Dollars and Cents",
        explanation:
          "In Australia, money is measured in dollars ($) and cents (c):\n• 100 cents = $1.00\n• 50c + 50c = $1.00\n• Five 20c coins = $1.00\n• Ten 10c coins = $1.00\n\nWriting Money in Decimal Notation:\nWhen writing prices with a dollar sign ($), the decimal point separates whole dollars from cents:\n• $3.85 means 3 whole dollars and 85 cents.\n• $0.50 means zero dollars and 50 cents (50c).\n• $4.05 means 4 dollars and 5 cents (the 0 is a vital placeholder for tens of cents!).\n\nCalculating Change Using the 'Count-Up' Strategy:\nTo find change from a note, count up from the price to the note:\n1. Count cents up to the next whole dollar.\n2. Count whole dollars up to the paid note.\n3. Add the two parts together.",
        keyTerms: [
          {
            term: "Decimal notation",
            definition: "Writing dollars and cents with a decimal point (e.g. $6.40).",
          },
          {
            term: "Change",
            definition: "The difference returned to the customer when they pay more than the cost of an item.",
          },
        ],
        visualAsset: {
          id: "vc2m3n07-coins-table",
          type: "table",
          altText: "Table showing Australian coin values and how many of each make one whole dollar.",
          title: "Australian Coin Equivalents to $1.00 (100 cents)",
          data: {
            headers: ["Coin Denomination", "Value in Cents", "Coins Needed for $1.00", "Decimal Notation"],
            rows: [
              ["5 cent coin", 5, 20, "$0.05"],
              ["10 cent coin", 10, 10, "$0.10"],
              ["20 cent coin", 20, 5, "$0.20"],
              ["50 cent coin", 50, 2, "$0.50"],
              ["$1 dollar coin", 100, 1, "$1.00"],
              ["$2 dollar coin", 200, "1 coin = $2.00", "$2.00"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3n07-example",
        heading: "Worked Example: Calculating Change from a $10 Note",
        problem:
          "Zoe buys a book costing $6.35 and pays with a $10.00 note. Calculate her change using the count-up strategy.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify cost and payment",
            working: "Item cost = $6.35. Amount paid = $10.00.",
            why: "We need to find the difference: $10.00 - $6.35.",
          },
          {
            stepNumber: 2,
            label: "Count up to the next whole dollar ($7.00)",
            working: "From $6.35 to $7.00:\n100 cents - 35 cents = 65 cents ($0.65).",
            why: "Adding 65c brings the amount from $6.35 to exactly $7.00.",
          },
          {
            stepNumber: 3,
            label: "Count up from $7.00 to the paid note ($10.00)",
            working: "From $7.00 to $10.00:\n$10.00 - $7.00 = $3.00 (3 whole dollars).",
            why: "Counting whole dollars is simple and error-free.",
          },
          {
            stepNumber: 4,
            label: "Combine whole dollars and cents",
            working: "$3.00 + $0.65 = $3.65 change.",
            why: "Adding the two jump intervals gives the exact total change.",
          },
          {
            stepNumber: 5,
            label: "Verify by addition",
            working: "Check: $6.35 (cost) + $3.65 (change) = $6.00 + $3.00 + 0.35 + 0.65 = $9.00 + $1.00 = $10.00.",
            why: "The cost plus change must equal the paid amount.",
          },
        ],
        finalAnswer: "Zoe receives $3.65 change ($3.00 and 65 cents).",
        commonError: {
          mistake: "Calculating change as $4.65 by doing 10 - 6 = 4 and 100 - 35 = 65.",
          whyItHappens: "Forgetting that the 65 cents required borrowing $1.00 from the $10 note, leaving only $9.00 - $6.00 = $3.00.",
          howToAvoid: "Always count UP from the cost to avoid column borrowing traps with zeros.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3n07-misconception",
        heading: "Common Trap: Missing Placeholder Zero in Cents",
        claim: "$5.8 means 5 dollars and 8 cents.",
        whyWrong:
          "Because 100 cents make a dollar, the first decimal place represents tens of cents (dimes). $5.8 is $5.80 (5 dollars and 80 cents).",
        correction: "8 cents is 8 hundredths of a dollar, written with a leading zero as $0.08. 5 dollars and 8 cents is $5.08.",
        example: "$5.80 = $5 and 80c vs $5.08 = $5 and 8c.",
      },
      {
        kind: "check",
        id: "vc2m3n07-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise converting money, making equivalent amounts with coins, and calculating change from our verified question bank.",
        curriculumCode: "VC2M3N07",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. VC2M3N08: Mathematical Modelling in Practical Contexts
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3N08",
    title: "Mathematical Modelling: Multi-Step Real-World Problem Solving",
    strand: "number",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to model and solve multi-step everyday practical problems using addition, subtraction, and multiplication.",
    successCriteria: [
      "I can break a word problem into known information, the hidden question, and the final goal.",
      "I can choose the correct operation (add, subtract, multiply, share) for each stage of a problem.",
      "I can explain my answer with units and check that it makes sense in the real-world context.",
    ],
    prerequisites: ["VC2M3N04", "VC2M3N07"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-29T10:00:00.000Z",
      originalityStatement:
        "Original mathematical modelling and multi-step practical reasoning lesson authored for Victorian Curriculum Level 3 Mathematics.",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3n08-concept",
        heading: "The 4-Step Problem-Solving Cycle",
        explanation:
          "Mathematical modelling is the process of using mathematics to solve authentic real-world situations. When faced with a multi-step problem, follow this 4-step cycle:\n\n1. UNDERSTAND: Read carefully. What facts do you know? What is the problem actually asking for?\n2. PLAN: Identify the hidden question. What do you need to calculate first before you can find the final answer? What operations (+, -, ×, ÷) will you use?\n3. SOLVE: Carry out the calculations step by step with clear labels and units.\n4. CHECK & INTERPRET: Look back at the original question. Does your number answer the question? Are the units correct (e.g. dollars, kilograms, children)?",
        keyTerms: [
          {
            term: "Mathematical modelling",
            definition: "Translating a real-world scenario into mathematical operations to find a practical solution.",
          },
          {
            term: "Hidden question",
            definition: "An intermediate calculation that must be solved before answering the main problem.",
          },
        ],
        visualAsset: {
          id: "vc2m3n08-modelling-table",
          type: "table",
          altText:
            "Table displaying the 4-step problem solving cycle: Understand, Plan, Solve, and Check.",
          title: "The 4-Step Mathematical Modelling Process",
          data: {
            headers: ["Stage", "Key Action", "Guiding Question"],
            rows: [
              ["1. Understand", "Highlight knowns and unknowns", "What information is given, and what do I need to find?"],
              ["2. Plan", "Identify intermediate sub-goals", "What do I need to calculate first?"],
              ["3. Solve", "Execute step-by-step arithmetic", "Are my calculations accurate and clearly labelled?"],
              ["4. Check", "Reflect on reasonableness and units", "Does this answer make sense in the real situation?"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3n08-example",
        heading: "Worked Example: School Fete Tuckshop Budgeting",
        problem:
          "The Year 3 class is preparing snack bags for the school sports day. They buy 4 boxes of juice poppers with 6 poppers in each box, and 3 boxes of muesli bars with 8 bars in each box. If there are 45 students in total, are there enough snacks for every student to receive one juice popper AND one muesli bar? How many more of each are needed, if any?",
        steps: [
          {
            stepNumber: 1,
            label: "Understand the target and given facts",
            working: "Target: 45 juice poppers and 45 muesli bars (1 of each for 45 students).\nGiven Juice: 4 boxes of 6.\nGiven Muesli: 3 boxes of 8.",
            why: "Listing the two separate items prevents confusing their quantities.",
          },
          {
            stepNumber: 2,
            label: "Calculate total juice poppers available",
            working: "Juice total = 4 boxes × 6 poppers = 24 poppers.",
            why: "Multiplication finds the total in equal boxes.",
          },
          {
            stepNumber: 3,
            label: "Calculate total muesli bars available",
            working: "Muesli total = 3 boxes × 8 bars = 24 bars.",
            why: "Multiplication finds the total in equal boxes.",
          },
          {
            stepNumber: 4,
            label: "Compare to student requirement (45 needed)",
            working: "• Juice shortage: 45 - 24 = 21 more juice poppers needed.\n• Muesli shortage: 45 - 24 = 21 more muesli bars needed.",
            why: "Subtracting available stock from demand reveals the shortfall.",
          },
        ],
        finalAnswer:
          "No, there are not enough snacks. The class has 24 juice poppers and 24 muesli bars. They need 21 more juice poppers and 21 more muesli bars to give all 45 students one of each.",
        commonError: {
          mistake: "Adding all numbers together (4 + 6 + 3 + 8 = 21) instead of multiplying items per box.",
          whyItHappens: "Treating box counts and item counts as the same unit.",
          howToAvoid: "Always write units beside numbers: 4 boxes × 6 poppers/box = 24 poppers.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3n08-misconception",
        heading: "Common Trap: Stopping After the First Step",
        claim: "Once you calculate 4 × 6 = 24, the problem is finished.",
        whyWrong:
          "24 is only the juice total (the answer to the hidden question). It does not answer whether there are enough for 45 students.",
        correction:
          "Multi-step problems require answering the sub-questions first, then completing the final comparison step.",
        example: "Step 1 finds stock (24); Step 2 finds shortage (45 - 24 = 21).",
      },
      {
        kind: "check",
        id: "vc2m3n08-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise solving multi-step practical and financial modelling problems from our verified question bank.",
        curriculumCode: "VC2M3N08",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 9. VC2M3N09: Algorithms, Decision Sequences and Number Patterns
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3N09",
    title: "Patterns & Algorithms: Step-by-Step Rules and Decision Sequences",
    strand: "number",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to create, follow, and predict number patterns and step-by-step algorithmic rules.",
    successCriteria: [
      "I can identify the rule governing a growing, repeating, or function pattern.",
      "I can follow a two-step rule to find output values from given inputs.",
      "I can work backwards (using inverse operations) to find the starting input from an output.",
    ],
    prerequisites: ["VC2M3N01", "VC2M3N05"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-29T10:00:00.000Z",
      originalityStatement:
        "Original algorithmic thinking, function machines, and pattern investigation lesson authored for Victorian Curriculum Level 3 Mathematics.",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3n09-concept",
        heading: "What is a Mathematical Algorithm?",
        explanation:
          "An algorithm is a precise, ordered sequence of instructions or rules used to solve a problem or generate a pattern.\n\nFunction Machines (Input → Rule → Output):\nA function machine takes an input number, applies a consistent rule, and produces an output number.\n\nExample 1: Single-Step Rule\nRule: 'Add 7'\n• Input 5 → Output 12\n• Input 8 → Output 15\n\nExample 2: Two-Step Rule\nRule: 'Multiply by 3, then add 2'\n• Input 1 → (1 × 3) + 2 = 5\n• Input 2 → (2 × 3) + 2 = 8\n• Input 3 → (3 × 3) + 2 = 11\n• Input 4 → (4 × 3) + 2 = 14\nNotice the outputs form a growing sequence with a constant difference of +3!\n\nWorking Backwards:\nTo find an input from an output, reverse each step using inverse operations in reverse order:\n• Reverse of '+ 2' is '- 2'\n• Reverse of '× 3' is '÷ 3'.",
        keyTerms: [
          {
            term: "Algorithm",
            definition: "An unambiguous set of step-by-step rules to perform a calculation or process.",
          },
          {
            term: "Inverse operation",
            definition: "An opposite operation that reverses another (+ and -, × and ÷).",
          },
        ],
        visualAsset: {
          id: "vc2m3n09-function-table",
          type: "table",
          altText:
            "Input-output table for the rule Multiply by 3 then add 2, showing inputs 1 to 5 mapping to outputs 5 to 17.",
          title: "Function Machine Table: Rule = (Input × 3) + 2",
          data: {
            headers: ["Input (n)", "Step 1 (n × 3)", "Step 2 (+ 2)", "Final Output"],
            rows: [
              [1, 3, 5, 5],
              [2, 6, 8, 8],
              [3, 9, 11, 11],
              [4, 12, 14, 14],
              [5, 15, 17, 17],
              [10, 30, 32, 32],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3n09-example",
        heading: "Worked Example: Working Backwards Through a Two-Step Rule",
        problem:
          "A number machine uses the rule: 'Multiply the input by 4, then subtract 5'.\nPart A: If the input is 7, what is the output?\nPart B: If the output is 31, what was the starting input?",
        steps: [
          {
            stepNumber: 1,
            label: "Solve Part A: Forward calculation for input = 7",
            working: "Step 1: Multiply by 4 → 7 × 4 = 28.\nStep 2: Subtract 5 → 28 - 5 = 23.",
            why: "Following the algorithm in forward order produces the output.",
          },
          {
            stepNumber: 2,
            label: "Plan Part B: Determine inverse operations in reverse order",
            working: "Original rule: [Input] → (× 4) → (- 5) → [Output]\nInverse rule: [Output] → (+ 5) → (÷ 4) → [Input]",
            why: "To reverse the machine, we undo the last operation first.",
          },
          {
            stepNumber: 3,
            label: "Execute Part B: Undo subtraction with addition",
            working: "Output = 31. Undo '- 5' by adding 5: 31 + 5 = 36.",
            why: "36 was the number before 5 was subtracted.",
          },
          {
            stepNumber: 4,
            label: "Execute Part B: Undo multiplication with division",
            working: "Undo '× 4' by dividing by 4: 36 ÷ 4 = 9.",
            why: "Dividing by 4 isolates the original input.",
          },
          {
            stepNumber: 5,
            label: "Verify Part B with a forward check",
            working: "Check input 9: (9 × 4) - 5 = 36 - 5 = 31 (matches output!).",
            why: "A forward run confirms input 9 produces output 31.",
          },
        ],
        finalAnswer:
          "Part A: When the input is 7, the output is 23.\nPart B: When the output is 31, the starting input was 9.",
        commonError: {
          mistake: "Dividing before adding when working backwards (e.g. 31 ÷ 4 then + 5).",
          whyItHappens: "Not reversing the sequence of operations.",
          howToAvoid: "Always reverse BOTH the operations AND the order in which they are applied.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3n09-misconception",
        heading: "Common Trap: Pattern Rules Are Always Simple Addition",
        claim: "The sequence 3, 6, 12, 24 follows the rule 'add 3'.",
        whyWrong:
          "Testing only the first two terms (3 + 3 = 6) fails for subsequent terms (6 + 3 = 9, not 12).",
        correction:
          "Always test your rule across at least three consecutive terms. The rule here is 'multiply by 2' (3 × 2 = 6, 6 × 2 = 12, 12 × 2 = 24).",
        example: "3 (×2) → 6 (×2) → 12 (×2) → 24 (×2) → 48.",
      },
      {
        kind: "check",
        id: "vc2m3n09-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise continuing number patterns, finding function rules, and solving number machine problems from our verified question bank.",
        curriculumCode: "VC2M3N09",
        practiceCount: 5,
      },
    ],
  },
]);
