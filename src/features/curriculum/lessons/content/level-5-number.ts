import type { Lesson } from "../schema";

export const LEVEL_5_NUMBER_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2M5N01: Decimal Place Value & Number Line Positioning
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5N01",
    title: "Decimal Place Value: Tenths, Hundredths and Thousandths",
    strand: "number",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to read, write, compare, and position decimals to thousandths on a number line.",
    successCriteria: [
      "I can explain the place value of digits to the right of the decimal point (tenths, hundredths, thousandths).",
      "I can compare and order decimals by comparing place value columns from left to right.",
      "I can accurately position and plot decimals with up to three decimal places on a scaled number line.",
    ],
    prerequisites: ["VC2M3N02"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Number).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5n01-concept",
        heading: "Understanding Decimals as Parts of a Whole",
        explanation:
          "Our base-10 number system extends to the right of the decimal point. Each step to the right represents a place value that is ten times smaller:\n\n• Tenths (0.1): one whole divided into 10 equal parts (1/10).\n• Hundredths (0.01): one whole divided into 100 equal parts (1/100), or one tenth divided into 10.\n• Thousandths (0.001): one whole divided into 1,000 equal parts (1/1,000), or one hundredth divided into 10.\n\nWhen comparing decimal numbers like 0.45 and 0.405, we compare digits starting from the highest place value (leftmost) to the lowest. 0.45 has 4 tenths and 5 hundredths, whereas 0.405 has 4 tenths, 0 hundredths, and 5 thousandths. Since 5 hundredths is greater than 0 hundredths, 0.45 is greater than 0.405.",
        keyTerms: [
          {
            term: "Decimal Point",
            definition: "A dot used to separate whole number place values from fractional place values.",
          },
          {
            term: "Tenths",
            definition: "The first place value to the right of the decimal point, representing 1 out of 10 equal parts.",
          },
          {
            term: "Hundredths",
            definition: "The second place value to the right of the decimal point, representing 1 out of 100 equal parts.",
          },
          {
            term: "Thousandths",
            definition: "The third place value to the right of the decimal point, representing 1 out of 1,000 equal parts.",
          },
        ],
        visualAsset: {
          id: "vc2m5n01-number-line",
          type: "number_line",
          altText: "Number line from 0.4 to 0.5 showing increments of 0.01 with marked points 0.42, 0.45, and 0.48.",
          title: "Decimal Increments of Hundredths between 0.4 and 0.5",
          data: {
            min: 0.4,
            max: 0.5,
            step: 0.01,
            labels: [
              { value: 0.4, text: "0.40" },
              { value: 0.45, text: "0.45" },
              { value: 0.5, text: "0.50" },
            ],
            highlightedValues: [0.42, 0.45, 0.48],
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5n01-example",
        heading: "Worked Example: Ordering Decimals from Smallest to Largest",
        problem:
          "Arrange the following decimal numbers in ascending order (smallest to largest): 0.72, 0.708, 0.7, 0.715.",
        steps: [
          {
            stepNumber: 1,
            label: "Pad decimals with trailing zeros to make lengths equal",
            working:
              "Write each number with 3 decimal places (to the thousandths column):\n• 0.72 = 0.720\n• 0.708 = 0.708\n• 0.7 = 0.700\n• 0.715 = 0.715",
            why: "Aligning numbers to the same place value allows a direct, digit-by-digit comparison without confusion.",
          },
          {
            stepNumber: 2,
            label: "Compare the tenths column",
            working:
              "All numbers have 7 in the tenths place (0.7). Move to the hundredths column.",
            why: "When the highest place value is identical, the next place value determines relative size.",
          },
          {
            stepNumber: 3,
            label: "Compare the hundredths and thousandths columns",
            working:
              "• 0.700 has 0 hundredths and 0 thousandths (smallest)\n• 0.708 has 0 hundredths and 8 thousandths\n• 0.715 has 1 hundredth and 5 thousandths\n• 0.720 has 2 hundredths and 0 thousandths (largest)",
            why: "0 hundredths < 1 hundredth < 2 hundredths, and 700 thousandths < 708 thousandths.",
          },
          {
            stepNumber: 4,
            label: "Write the final ordered list in original form",
            working: "0.7, 0.708, 0.715, 0.72",
            why: "Returning to original notation produces the clear and standard mathematical answer.",
          },
        ],
        finalAnswer: "Ascending order: 0.7, 0.708, 0.715, 0.72.",
        commonError: {
          mistake: "Thinking 0.708 is bigger than 0.72 because 708 has more digits than 72.",
          whyItHappens: "Applying whole-number rules where more digits usually mean a larger number.",
          howToAvoid: "Pad decimals with zeros so both numbers have the same number of decimal places before comparing.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5n01-misconception",
        heading: "Misconception: 'Longer' Decimals are Always Larger",
        claim: "A decimal with more digits after the point is always greater than a decimal with fewer digits.",
        whyWrong:
          "In decimals, the value of each place decreases by a factor of 10 as you move right. 0.8 has 8 tenths (equivalent to 800 thousandths), whereas 0.375 only has 3 tenths and 75 thousandths. Therefore, 0.8 is much larger than 0.375 despite having fewer written digits.",
        correction:
          "Always compare the digits from left to right starting at the tenths column, rather than counting the total number of digits.",
        example: "0.9 is greater than 0.899 because 9 tenths is greater than 8 tenths.",
      },
      {
        kind: "check",
        id: "vc2m5n01-check",
        heading: "Check Your Understanding",
        prompt: "Practise reading, ordering, and positioning decimals to tenths, hundredths, and thousandths.",
        curriculumCode: "VC2M5N01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2M5N02: Factors, Multiples & Divisibility Rules
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5N02",
    title: "Factors, Multiples and Divisibility Rules",
    strand: "number",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify factors and multiples of natural numbers and apply divisibility tests for 2, 3, 4, 5, 6, 9, and 10.",
    successCriteria: [
      "I can list all factor pairs of whole numbers up to 100 systematically.",
      "I can find common multiples and the lowest common multiple (LCM) of two numbers.",
      "I can use divisibility tests (e.g. sum of digits for 3 and 9, last digits for 2, 4, 5, 10) to determine factors without long division.",
    ],
    prerequisites: ["VC2M3N05"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Number).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5n02-concept",
        heading: "The Building Blocks: Factors and Multiples",
        explanation:
          "Factors and multiples are closely connected operations:\n\n• Factors are whole numbers that divide evenly into another number without leaving a remainder. For example, the factors of 24 are 1, 2, 3, 4, 6, 8, 12, and 24.\n• Multiples are the products resulting from multiplying a number by natural numbers (1, 2, 3, ...). The multiples of 6 are 6, 12, 18, 24, 30, ...\n\nDivisibility rules allow quick factor checks:\n• Divisible by 2: Last digit is even (0, 2, 4, 6, 8).\n• Divisible by 3: The sum of the digits is divisible by 3 (e.g. 153 -> 1+5+3=9, which is divisible by 3).\n• Divisible by 4: The last two digits form a number divisible by 4 (e.g. 324 -> 24 is divisible by 4).\n• Divisible by 5: Last digit is 0 or 5.\n• Divisible by 6: Number is divisible by both 2 AND 3.\n• Divisible by 9: The sum of the digits is divisible by 9 (e.g. 738 -> 7+3+8=18, which is divisible by 9).\n• Divisible by 10: Last digit is 0.",
        keyTerms: [
          {
            term: "Factor",
            definition: "A whole number that divides exactly into another number with no remainder.",
          },
          {
            term: "Multiple",
            definition: "The product of a given number multiplied by any whole number.",
          },
          {
            term: "Divisibility Rule",
            definition: "A shortcut rule to test whether a number can be evenly divided by another without performing division.",
          },
          {
            term: "Prime Number",
            definition: "A natural number greater than 1 that has exactly two distinct factors: 1 and itself.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2m5n02-example",
        heading: "Worked Example: Finding All Factors of 48",
        problem: "Find all the factor pairs of 48 and list them in ascending order.",
        steps: [
          {
            stepNumber: 1,
            label: "Test systematically starting with 1",
            working: "1 × 48 = 48 (Factor pair: 1 and 48)",
            why: "1 is always a factor of every natural number.",
          },
          {
            stepNumber: 2,
            label: "Test consecutive integers (2, 3, 4, 5, 6...)",
            working:
              "• 48 is even, so 2 × 24 = 48\n• 4 + 8 = 12 (divisible by 3), so 3 × 16 = 48\n• 48 / 4 = 12, so 4 × 12 = 48\n• Last digit is 8 (not 0 or 5), so 5 is NOT a factor\n• Divisible by 2 and 3, so 6 × 8 = 48\n• 48 / 7 = 6 remainder 6, so 7 is NOT a factor",
            why: "Testing in order guarantees no factor pairs are missed before factors begin to repeat.",
          },
          {
            stepNumber: 3,
            label: "Stop when factors cross over",
            working: "The next integer to test is 8, which is already in our list (6 × 8). All pairs are found.",
            why: "Once the test number meets the partner factor, all factor pairs have been identified.",
          },
          {
            stepNumber: 4,
            label: "Compile and order all unique factors",
            working: "1, 2, 3, 4, 6, 8, 12, 16, 24, 48.",
            why: "Listing from smallest to largest provides a clear and complete factor catalogue.",
          },
        ],
        finalAnswer: "The factors of 48 are 1, 2, 3, 4, 6, 8, 12, 16, 24, and 48.",
        commonError: {
          mistake: "Confusing factors with multiples (e.g. thinking 96 is a factor of 48).",
          whyItHappens: "Mixing up dividing into a number (factors) with multiplying from a number (multiples).",
          howToAvoid: "Remember: factors are smaller than or equal to the number; multiples are greater than or equal to the number.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5n02-misconception",
        heading: "Misconception: All Odd Numbers are Prime",
        claim: "Any odd number that cannot be divided by 2 must be a prime number.",
        whyWrong:
          "While all prime numbers greater than 2 are odd, many odd numbers are composite because they have other factors like 3, 5, or 7. For example, 9 (3×3), 15 (3×5), 21 (3×7), 25 (5×5), and 27 (3×9) are all odd, but none of them are prime.",
        correction:
          "An odd number is only prime if its ONLY factors are 1 and itself. Always check divisibility by 3, 5, and 7 before deciding a number is prime.",
        example: "35 is odd, but 5 × 7 = 35, so 35 is composite, not prime.",
      },
      {
        kind: "check",
        id: "vc2m5n02-check",
        heading: "Check Your Understanding",
        prompt: "Practise finding factors, common multiples, and applying divisibility tests.",
        curriculumCode: "VC2M5N02",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2M5N03: Comparing and Ordering Fractions with Related Denominators
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5N03",
    title: "Comparing and Ordering Fractions and Mixed Numerals",
    strand: "number",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to compare and order fractions and mixed numerals where one denominator is a multiple of another.",
    successCriteria: [
      "I can convert fractions to have a common denominator when denominators are related (e.g. 1/3 and 5/6).",
      "I can compare proper fractions, improper fractions, and mixed numerals.",
      "I can order a set of fractions from smallest to largest using equivalent fractions and benchmark numbers.",
    ],
    prerequisites: ["VC2M3N03"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Number).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5n03-concept",
        heading: "Working with Related Denominators",
        explanation:
          "When comparing fractions with different denominators, we cannot simply compare numerators. We must first convert them so they describe equal-sized slices — this means giving them a common denominator.\n\nDenominators are 'related' when one denominator is a multiple of the other (for example, 4 and 12, or 3 and 6):\n• To compare 3/4 and 7/12, multiply both numerator and denominator of 3/4 by 3: (3 × 3) / (4 × 3) = 9/12.\n• Now compare 9/12 and 7/12: since 9 is greater than 7, 3/4 is greater than 7/12.\n\nMixed numerals (like 1 3/8) and improper fractions (like 11/8) can also be compared by converting mixed numerals into improper fractions: 1 3/8 = (1 × 8 + 3)/8 = 11/8.",
        keyTerms: [
          {
            term: "Related Denominators",
            definition: "Denominators where one is a direct multiple of the other (e.g. 4 and 8, or 3 and 9).",
          },
          {
            term: "Equivalent Fractions",
            definition: "Fractions that represent the exact same value or proportion, obtained by multiplying or dividing the top and bottom by the same non-zero number.",
          },
          {
            term: "Mixed Numeral",
            definition: "A number written as a whole number combined with a proper fraction (e.g. 2 1/4).",
          },
          {
            term: "Improper Fraction",
            definition: "A fraction where the numerator is greater than or equal to the denominator (e.g. 9/4).",
          },
        ],
        visualAsset: {
          id: "vc2m5n03-fraction-comparison",
          type: "table",
          altText: "Table showing equivalent fractions for thirds, sixths, and twelfths.",
          title: "Equivalent Fractions for Related Denominators (3, 6, 12)",
          data: {
            headers: ["Thirds (/3)", "Sixths (/6)", "Twelfths (/12)", "Decimal Value"],
            rows: [
              ["1/3", "2/6", "4/12", "≈ 0.333"],
              ["2/3", "4/6", "8/12", "≈ 0.667"],
              ["3/3 (1 whole)", "6/6 (1 whole)", "12/12 (1 whole)", "1.000"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5n03-example",
        heading: "Worked Example: Ordering Fractions with Related Denominators",
        problem: "Order the fractions 2/3, 5/6, and 7/12 from smallest to largest.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the common denominator",
            working: "The denominators are 3, 6, and 12. 12 is a multiple of both 3 (3 × 4 = 12) and 6 (6 × 2 = 12). So 12 is our common denominator.",
            why: "Finding the lowest common multiple provides the easiest equivalent fraction base.",
          },
          {
            stepNumber: 2,
            label: "Convert 2/3 and 5/6 to equivalent fractions with denominator 12",
            working:
              "• 2/3 = (2 × 4) / (3 × 4) = 8/12\n• 5/6 = (5 × 2) / (6 × 2) = 10/12\n• 7/12 is already in twelfths.",
            why: "Multiplying numerator and denominator by the same factor preserves fraction value.",
          },
          {
            stepNumber: 3,
            label: "Compare the numerators",
            working: "7/12 < 8/12 < 10/12",
            why: "When parts are the same size (twelfths), more parts indicate a greater total amount.",
          },
          {
            stepNumber: 4,
            label: "State the answer in original fraction form",
            working: "7/12 < 2/3 < 5/6",
            why: "Returning to original terms completes the comparison clearly.",
          },
        ],
        finalAnswer: "Ascending order: 7/12, 2/3, 5/6.",
        commonError: {
          mistake: "Thinking 7/12 is the largest because 7 and 12 are the largest individual numbers.",
          whyItHappens: "Comparing numerators or denominators separately without making parts equal.",
          howToAvoid: "Always convert to equivalent fractions with identical denominators before comparing.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5n03-misconception",
        heading: "Misconception: Larger Denominators Mean Larger Fractions",
        claim: "1/8 is larger than 1/4 because 8 is larger than 4.",
        whyWrong:
          "The denominator tells us how many equal parts the whole is divided into. Dividing a cake into 8 pieces produces smaller slices than dividing the same cake into 4 pieces. Therefore, 1/4 is twice as large as 1/8.",
        correction:
          "As the denominator increases, each unit fraction becomes smaller because the whole is shared among more parts.",
        example: "1/4 is equal to 2/8, which is larger than 1/8.",
      },
      {
        kind: "check",
        id: "vc2m5n03-check",
        heading: "Check Your Understanding",
        prompt: "Practise comparing and ordering fractions and mixed numerals with related denominators.",
        curriculumCode: "VC2M5N03",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. VC2M5N04: Percentage Representations & Fraction-Decimal Conversions
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5N04",
    title: "Percentages: Fraction and Decimal Connections",
    strand: "number",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to represent percentages as fractions and decimals and convert between all three forms.",
    successCriteria: [
      "I can define percentage as 'parts per hundred' (out of 100).",
      "I can convert between common percentages, fractions, and decimals (e.g. 50% = 1/2 = 0.5; 25% = 1/4 = 0.25; 10% = 1/10 = 0.1).",
      "I can calculate simple percentages of quantities using benchmark fractions (10%, 25%, 50%).",
    ],
    prerequisites: ["VC2M5N01", "VC2M5N03"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Number).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5n04-concept",
        heading: "What Does 'Per Cent' Mean?",
        explanation:
          "'Percent' comes from the Latin 'per centum', meaning 'out of one hundred'. The symbol % means 'divided by 100'.\n\nEvery percentage can be written as a fraction with a denominator of 100, and as a two-place decimal:\n• 75% = 75/100 = 3/4 = 0.75\n• 40% = 40/100 = 2/5 = 0.40 (or 0.4)\n• 5% = 5/100 = 1/20 = 0.05\n\nKey benchmark equivalences:\n• 100% = 1 whole = 1.0\n• 50% = 1/2 = 0.5\n• 25% = 1/4 = 0.25\n• 75% = 3/4 = 0.75\n• 10% = 1/10 = 0.1\n• 20% = 1/5 = 0.2\n• 1% = 1/100 = 0.01",
        keyTerms: [
          {
            term: "Percent (%)",
            definition: "A ratio comparing a number to 100, meaning 'out of 100'.",
          },
          {
            term: "Benchmark Equivalence",
            definition: "A well-known matching fraction, decimal, and percentage triple used to estimate and solve problems quickly.",
          },
        ],
        visualAsset: {
          id: "vc2m5n04-equivalence-table",
          type: "table",
          altText: "Benchmark equivalence table showing matching fraction, decimal, and percentage values.",
          title: "Benchmark Fraction, Decimal, and Percentage Equivalences",
          data: {
            headers: ["Fraction", "Simplified Fraction", "Decimal", "Percentage"],
            rows: [
              ["100/100", "1", "1.0", "100%"],
              ["50/100", "1/2", "0.5", "50%"],
              ["25/100", "1/4", "0.25", "25%"],
              ["75/100", "3/4", "0.75", "75%"],
              ["10/100", "1/10", "0.1", "10%"],
              ["20/100", "1/5", "0.2", "20%"],
              ["5/100", "1/20", "0.05", "5%"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5n04-example",
        heading: "Worked Example: Finding 25% of an Amount",
        problem: "A skateboard originally costs $80. In a sale, it is discounted by 25%. How much money is discounted, and what is the sale price?",
        steps: [
          {
            stepNumber: 1,
            label: "Connect 25% to its equivalent benchmark fraction",
            working: "25% = 25/100 = 1/4.",
            why: "Finding 1/4 of a number is quick and straightforward through division by 4.",
          },
          {
            stepNumber: 2,
            label: "Calculate 1/4 of $80",
            working: "$80 ÷ 4 = $20 (or half of $80 is $40, and half of $40 is $20).",
            why: "Dividing the whole quantity into 4 equal shares finds 1 fourth (25%).",
          },
          {
            stepNumber: 3,
            label: "Subtract the discount from the original price",
            working: "Sale price = $80 - $20 = $60.",
            why: "A discount reduces the original cost by the calculated savings.",
          },
        ],
        finalAnswer: "The discount is $20, and the sale price is $60.",
        commonError: {
          mistake: "Writing 5% as 0.5 instead of 0.05.",
          whyItHappens: "Confusing 50% (5 tenths = 0.5) with 5% (5 hundredths = 0.05).",
          howToAvoid: "Remember: 5% means 5 out of 100, which must have the 5 in the hundredths place (0.05).",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5n04-misconception",
        heading: "Misconception: Percentages Cannot Exceed 100%",
        claim: "You can never have a percentage greater than 100%.",
        whyWrong:
          "100% represents 1 whole. If a quantity grows or exceeds its original value, it can be represented by a percentage greater than 100%. For instance, 150% means 1.5 times the original amount (one and a half wholes), and 200% means double the original amount.",
        correction:
          "Percentages over 100% represent quantities larger than one whole.",
        example: "If a plant was 10 cm and is now 20 cm, its height is 200% of its original height.",
      },
      {
        kind: "check",
        id: "vc2m5n04-check",
        heading: "Check Your Understanding",
        prompt: "Practise converting between fractions, decimals, and percentages and finding percentages of amounts.",
        curriculumCode: "VC2M5N04",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. VC2M5N05: Addition & Subtraction of Fractions with Related Denominators
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5N05",
    title: "Adding and Subtracting Fractions with Related Denominators",
    strand: "number",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to add and subtract fractions and mixed numerals where one denominator is a multiple of another.",
    successCriteria: [
      "I can identify the common denominator when one denominator divides evenly into another.",
      "I can rename one fraction into an equivalent fraction before adding or subtracting.",
      "I can simplify answers or convert improper fractions to mixed numerals.",
    ],
    prerequisites: ["VC2M5N03"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Number).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5n05-concept",
        heading: "The Golden Rule of Fraction Addition and Subtraction",
        explanation:
          "To add or subtract fractions, the parts must be the exact same size — they must share a common denominator. You CANNOT simply add the denominators together.\n\nStrategy for related denominators:\n1. Check the denominators (e.g. in 3/8 + 1/4, the denominators are 8 and 4).\n2. Since 8 is a multiple of 4 (4 × 2 = 8), rename 1/4 into eighths: 1/4 = 2/8.\n3. Add or subtract only the numerators while keeping the denominator the same: 3/8 + 2/8 = 5/8.\n4. Simplify the result if possible.",
        keyTerms: [
          {
            term: "Common Denominator",
            definition: "A shared denominator that allows fractions to be added or subtracted directly.",
          },
          {
            term: "Simplifying",
            definition: "Dividing both numerator and denominator by their greatest common factor to express the fraction in simplest form.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2m5n05-example",
        heading: "Worked Example: Subtracting Fractions with Related Denominators",
        problem: "Calculate: 7/10 - 2/5. Express your answer in simplest form.",
        steps: [
          {
            stepNumber: 1,
            label: "Find the common denominator",
            working: "Denominators are 10 and 5. 10 is a multiple of 5 (5 × 2 = 10), so the common denominator is 10.",
            why: "Only fractions with equal denominators represent equal part sizes that can be subtracted.",
          },
          {
            stepNumber: 2,
            label: "Convert 2/5 to tenths",
            working: "2/5 = (2 × 2) / (5 × 2) = 4/10.",
            why: "Multiplying top and bottom by 2 creates an equivalent fraction with denominator 10.",
          },
          {
            stepNumber: 3,
            label: "Subtract the numerators",
            working: "7/10 - 4/10 = (7 - 4)/10 = 3/10.",
            why: "When subtracting eighths from eighths or tenths from tenths, the denominator remains unchanged.",
          },
          {
            stepNumber: 4,
            label: "Check for simplification",
            working: "3 and 10 share no common factor other than 1. 3/10 is in simplest form.",
            why: "A fraction is simplest when numerator and denominator are coprime.",
          },
        ],
        finalAnswer: "7/10 - 2/5 = 3/10.",
        commonError: {
          mistake: "Adding or subtracting denominators (e.g. 7/10 - 2/5 = 5/5 = 1).",
          whyItHappens: "Treating fractions as separate independent numbers rather than parts of a whole.",
          howToAvoid: "Always keep the denominator unchanged once a common denominator is established.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5n05-misconception",
        heading: "Misconception: Adding Numerators and Denominators Directly",
        claim: "1/2 + 1/4 = 2/6 = 1/3.",
        whyWrong:
          "If you have half a pizza and add a quarter of a pizza, you have three-quarters of a pizza (3/4). 1/3 would mean you ended up with LESS than half a pizza, which is impossible after adding more pizza!",
        correction:
          "Convert 1/2 into 2/4 first, then add: 2/4 + 1/4 = 3/4.",
        example: "1/2 + 1/4 = 2/4 + 1/4 = 3/4.",
      },
      {
        kind: "check",
        id: "vc2m5n05-check",
        heading: "Check Your Understanding",
        prompt: "Practise adding and subtracting fractions and mixed numerals with related denominators.",
        curriculumCode: "VC2M5N05",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. VC2M5N06: Multi-Digit Multiplication Strategies & Reasonableness
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5N06",
    title: "Multi-Digit Multiplication and Estimation",
    strand: "number",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to multiply two-digit and three-digit numbers by two-digit numbers using efficient mental and written strategies, and validate answers through estimation.",
    successCriteria: [
      "I can use the area model and partial products algorithm for multi-digit multiplication.",
      "I can use the standard written algorithm with correct place value alignment and carrying.",
      "I can estimate products using rounding to check the reasonableness of my calculated answer.",
    ],
    prerequisites: ["VC2M3N04", "VC2M3N05"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Number).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5n06-concept",
        heading: "Multiplying Larger Numbers Using Place Value",
        explanation:
          "Multiplying multi-digit numbers relies on the distributive property: breaking numbers into place-value parts, multiplying each part, and summing the partial products.\n\nFor example, to solve 46 × 28:\n1. Split 46 into (40 + 6) and 28 into (20 + 8).\n2. Calculate the four partial products:\n   • 40 × 20 = 800\n   • 40 × 8 = 320\n   • 6 × 20 = 120\n   • 6 × 8 = 48\n3. Add all partial products: 800 + 320 + 120 + 48 = 1,288.\n\nAlways estimate first: 46 rounds to 50, 28 rounds to 30. 50 × 30 = 1,500. Since 1,288 is close to 1,500, our result is reasonable.",
        keyTerms: [
          {
            term: "Partial Products",
            definition: "The products obtained by multiplying each place-value component of one factor by each component of another.",
          },
          {
            term: "Distributive Property",
            definition: "The mathematical rule showing that multiplying a sum by a number gives the same result as multiplying each addend separately (e.g. a × (b + c) = ab + ac).",
          },
          {
            term: "Reasonableness",
            definition: "Checking whether an answer makes sense and is mathematically realistic based on estimation.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2m5n06-example",
        heading: "Worked Example: Calculating 235 × 24",
        problem: "Calculate 235 × 24 using the standard algorithm, checking reasonableness with an estimate.",
        steps: [
          {
            stepNumber: 1,
            label: "Estimate the product",
            working: "Round 235 to 240 (or 200) and 24 to 20. 200 × 20 = 4,000. 250 × 20 = 5,000. Our answer should be around 5,000.",
            why: "Estimating before calculating provides a safeguard against place-value errors.",
          },
          {
            stepNumber: 2,
            label: "Multiply by the ones digit (4)",
            working:
              "• 4 × 5 = 20 (write 0, carry 2 tens)\n• 4 × 3 = 12, plus 2 carried = 14 (write 4, carry 1 hundred)\n• 4 × 2 = 8, plus 1 carried = 9 (write 9)\nFirst line: 235 × 4 = 940.",
            why: "Multiplying by the ones digit calculates the first partial product.",
          },
          {
            stepNumber: 3,
            label: "Multiply by the tens digit (2 tens = 20)",
            working:
              "Place a zero in the ones column to show multiplication by 20:\n• 2 × 5 = 10 (write 0, carry 1)\n• 2 × 3 = 6, plus 1 carried = 7 (write 7)\n• 2 × 2 = 4 (write 4)\nSecond line: 235 × 20 = 4,700.",
            why: "Placing a placeholder 0 shifts all digits into their correct place values for tens multiplication.",
          },
          {
            stepNumber: 4,
            label: "Add the partial products together",
            working: "940 + 4,700 = 5,640. Compare with estimate (~5,000): 5,640 is reasonable.",
            why: "Summing 235 × 4 and 235 × 20 gives the total product 235 × 24.",
          },
        ],
        finalAnswer: "235 × 24 = 5,640.",
        commonError: {
          mistake: "Forgetting to place a 0 in the ones column when multiplying by the tens digit.",
          whyItHappens: "Treating the 2 in 24 as 2 ones rather than 2 tens (20).",
          howToAvoid: "Always write the placeholder zero on the second row before multiplying the digits.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5n06-misconception",
        heading: "Misconception: 'Adding a Zero' Multiplies by 10",
        claim: "Multiplying a number by 10 just means putting a 0 at the end.",
        whyWrong:
          "While writing a zero at the end works for whole numbers (e.g. 34 × 10 = 340), it fails completely for decimals! 3.4 × 10 is NOT 3.40 (which is the exact same number). Multiplying by 10 moves every digit one place value to the left.",
        correction:
          "Understand multiplication by 10, 100, and 1,000 as shifting digits to higher place value columns, not as a visual trick.",
        example: "3.4 × 10 = 34 (digits shift one place left across the decimal point).",
      },
      {
        kind: "check",
        id: "vc2m5n06-check",
        heading: "Check Your Understanding",
        prompt: "Practise multi-digit multiplication and checking reasonableness with estimation.",
        curriculumCode: "VC2M5N06",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. VC2M5N07: Division Strategies & Contextual Remainder Interpretation
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5N07",
    title: "Division Strategies and Interpreting Remainders",
    strand: "number",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to divide three-digit and four-digit numbers by single-digit and two-digit numbers, expressing and interpreting remainders based on the context.",
    successCriteria: [
      "I can perform short and long division with and without remainders.",
      "I can express remainders as whole numbers, fractions, or decimals.",
      "I can interpret what a remainder means in real-world contexts (e.g. rounding up for bus seats, ignoring leftover money).",
    ],
    prerequisites: ["VC2M3N05", "VC2M5N02"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Number).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5n07-concept",
        heading: "What Should We Do with the Remainder?",
        explanation:
          "Division represents equal sharing or equal grouping. Often, numbers do not divide perfectly, leaving a remainder.\n\nIn mathematics, a remainder can be written in three formats:\n• Whole remainder: 15 ÷ 4 = 3 remainder 3\n• Fraction: 15 ÷ 4 = 3 3/4 (remainder divided by divisor)\n• Decimal: 15 ÷ 4 = 3.75\n\nIn real life, the context dictates how the remainder must be treated:\n1. Round UP to the next whole number: e.g. 50 students on a trip where each bus seats 20 requires 3 buses (since 2 buses only hold 40).\n2. Drop/ignore the remainder: e.g. If you have $15 and books cost $4 each, you can only buy 3 books.\n3. Share as fractions or decimals: e.g. Sharing 5 pizzas equally among 4 people gives 1 1/4 pizzas per person.",
        keyTerms: [
          {
            term: "Dividend",
            definition: "The total number being divided into parts.",
          },
          {
            term: "Divisor",
            definition: "The number by which the dividend is being divided.",
          },
          {
            term: "Quotient",
            definition: "The result obtained from dividing one number by another.",
          },
          {
            term: "Remainder",
            definition: "The amount left over after division when numbers cannot be divided into exact whole parts.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2m5n07-example",
        heading: "Worked Example: Contextual Remainder Problem",
        problem:
          "A school has 146 students attending an athletics carnival. Each minivan can carry 8 students. How many minivans are needed to transport all 146 students?",
        steps: [
          {
            stepNumber: 1,
            label: "Set up the division problem",
            working: "Calculate 146 ÷ 8.",
            why: "Total students divided by capacity per minivan gives the required vehicles.",
          },
          {
            stepNumber: 2,
            label: "Perform short division",
            working:
              "• 1 ÷ 8 = 0 remainder 1\n• 14 ÷ 8 = 1 remainder 6\n• 66 ÷ 8 = 8 remainder 2 (since 8 × 8 = 64, and 66 - 64 = 2).\nResult: 18 remainder 2.",
            why: "Standard division finds exact full vans and the leftover students.",
          },
          {
            stepNumber: 3,
            label: "Interpret the remainder in context",
            working:
              "18 minivans will carry 18 × 8 = 144 students. There are 2 students still waiting for transport. A 19th minivan is required so every student can travel.",
            why: "In transport contexts, leftover passengers cannot be left behind, so the quotient must be rounded up.",
          },
        ],
        finalAnswer: "19 minivans are needed to transport all 146 students.",
        commonError: {
          mistake: "Saying 18 minivans are needed and forgetting the 2 leftover students.",
          whyItHappens: "Focusing purely on the whole number quotient without thinking about the real-world scenario.",
          howToAvoid: "Ask yourself: 'What happens to the remainder?' Can people or items be left behind?",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5n07-misconception",
        heading: "Misconception: Remainder Can Be Larger Than the Divisor",
        claim: "A remainder of 9 is acceptable when dividing by 7.",
        whyWrong:
          "If the remainder is greater than or equal to the divisor (9 ≥ 7), you could have made at least one more full group of 7. The division is incomplete.",
        correction:
          "The remainder in any division problem must always be strictly less than the divisor.",
        example: "When dividing by 6, the only possible remainders are 0, 1, 2, 3, 4, or 5.",
      },
      {
        kind: "check",
        id: "vc2m5n07-check",
        heading: "Check Your Understanding",
        prompt: "Practise short and long division and interpreting remainders in real-world scenarios.",
        curriculumCode: "VC2M5N07",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. VC2M5N08: Estimation & Validation in Financial Contexts
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5N08",
    title: "Financial Mathematics and Money Estimation",
    strand: "number",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to create budgets, calculate change, compare unit pricing, and validate financial calculations through estimation.",
    successCriteria: [
      "I can calculate the total cost of multi-item purchases and determine correct change.",
      "I can use rounding to the nearest dollar or 10 cents to estimate total shopping costs before purchasing.",
      "I can compare 'best buys' and unit pricing (e.g. cost per 100g or cost per item).",
    ],
    prerequisites: ["VC2M3N07", "VC2M5N01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Number).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5n08-concept",
        heading: "Money Calculations and Smart Shopping",
        explanation:
          "Financial mathematics connects decimal place value to everyday currency. In Australia, money calculations are recorded to two decimal places (cents) and rounded to the nearest 5 cents for cash transactions.\n\nKey financial strategies:\n• Front-End Estimation: Rounding each item up or down to the nearest whole dollar to ensure you have enough money before reaching the checkout.\n• Unit Pricing / Value Comparison: Finding the cost of 1 unit (e.g. 1 item, 100 g, 1 litre) to determine which product size offers better value:\n  Unit Price = Total Cost ÷ Quantity.\n• Calculating Change: Change = Amount Paid - Total Cost.",
        keyTerms: [
          {
            term: "Budget",
            definition: "A plan that sets out how much money is available to spend across different items.",
          },
          {
            term: "Unit Price",
            definition: "The cost per single unit of weight, volume, or count (e.g. price per 100 grams or price per item).",
          },
          {
            term: "Discount",
            definition: "A reduction from the original selling price of an item.",
          },
        ],
        visualAsset: {
          id: "vc2m5n08-shopping-receipt",
          type: "table",
          altText: "Table showing itemised grocery prices, estimated rounded costs, and total calculations.",
          title: "Shopping Basket Price Comparison and Estimation",
          data: {
            headers: ["Item", "Actual Price", "Rounded to Nearest $1", "Category"],
            rows: [
              ["Wholemeal Bread", "$3.85", "$4.00", "Bakery"],
              ["Milk (2 Litres)", "$3.20", "$3.00", "Dairy"],
              ["Bananas (1 kg)", "$4.95", "$5.00", "Produce"],
              ["Yoghurt Tub", "$5.75", "$6.00", "Dairy"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5n08-example",
        heading: "Worked Example: Best Buy Comparison",
        problem:
          "Brand A sells a 500 g box of cereal for $4.50. Brand B sells a 1 kg (1,000 g) box of the same cereal for $8.20. Which box is better value per 100 g?",
        steps: [
          {
            stepNumber: 1,
            label: "Calculate unit cost for Brand A per 100 g",
            working: "500 g contains five 100 g units. Cost per 100 g = $4.50 ÷ 5 = $0.90 (90 cents).",
            why: "Dividing total cost by the number of 100 g portions finds unit rate.",
          },
          {
            stepNumber: 2,
            label: "Calculate unit cost for Brand B per 100 g",
            working: "1,000 g contains ten 100 g units. Cost per 100 g = $8.20 ÷ 10 = $0.82 (82 cents).",
            why: "1 kg equals 1,000 grams, containing 10 portions of 100 grams.",
          },
          {
            stepNumber: 3,
            label: "Compare unit rates to find the best buy",
            working: "$0.82 < $0.90. Brand B is 8 cents cheaper per 100 g.",
            why: "A lower cost per standard unit indicates better economic value.",
          },
        ],
        finalAnswer: "Brand B is better value at $0.82 per 100 g compared to Brand A at $0.90 per 100 g.",
        commonError: {
          mistake: "Assuming Brand A is cheaper simply because $4.50 is less than $8.20.",
          whyItHappens: "Comparing total pack prices without considering the difference in pack weights.",
          howToAvoid: "Always convert prices to a standard unit rate (like price per 100 g or price per kg) before comparing.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5n08-misconception",
        heading: "Misconception: Larger Packs are Always Cheaper per Unit",
        claim: "Buying the largest size package in a supermarket is always the cheapest option per unit.",
        whyWrong:
          "While bulk items are often discounted, supermarkets sometimes run special promotions on smaller sizes that make the smaller box cheaper per 100 grams. Always check the unit price label.",
        correction:
          "Calculate or check the unit price (e.g. price per 100g) on shelf tags rather than assuming size guarantees value.",
        example: "Two 250 g packs on sale for $1.50 each ($3.00 total) beats one 500 g pack priced at $3.50.",
      },
      {
        kind: "check",
        id: "vc2m5n08-check",
        heading: "Check Your Understanding",
        prompt: "Practise calculating change, estimating totals, and finding best buys in financial contexts.",
        curriculumCode: "VC2M5N08",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 9. VC2M5N09: Mathematical Modelling in Multi-Step Problems
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5N09",
    title: "Mathematical Modelling: Additive and Multiplicative Scenarios",
    strand: "number",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to use mathematical modelling to plan, structure, and solve authentic multi-step problems involving additive and multiplicative situations.",
    successCriteria: [
      "I can formulate a mathematical model from a word problem by identifying key variables and operations.",
      "I can select and sequence multiple operations (addition, subtraction, multiplication, division) logically.",
      "I can evaluate my model's solution against the original problem constraints.",
    ],
    prerequisites: ["VC2M3N08", "VC2M5N06", "VC2M5N07"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Number).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5n09-concept",
        heading: "The Mathematical Modelling Cycle",
        explanation:
          "Mathematical modelling is the process of translating a real-world scenario into mathematics to make decisions or solve problems.\n\nThe 4-Step Modelling Framework:\n1. Understand and Formulate: What is the question asking? What information is given, what is missing, and what assumptions must be made?\n2. Mathematise: Translate words into numbers, tables, diagrams, or equations with variables.\n3. Compute and Solve: Perform the operations in the correct order (BEDMAS/BODMAS).\n4. Interpret and Validate: Does the mathematical answer make sense in the real-world context? Did we satisfy all constraints?",
        keyTerms: [
          {
            term: "Mathematical Model",
            definition: "A mathematical representation (using equations, diagrams, or tables) of a real-world situation.",
          },
          {
            term: "Constraint",
            definition: "A condition, limit, or rule that must be satisfied in a problem (e.g. budget limit, time limit).",
          },
          {
            term: "Variable",
            definition: "A quantity that can change or vary in value within a scenario.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2m5n09-example",
        heading: "Worked Example: School Garden Fence and Seedlings",
        problem:
          "A class is creating a rectangular vegetable garden measuring 8 metres by 5 metres. Timber edging costs $6 per metre. Seedling punnets cost $4 each, and they need 15 punnets. What is the total cost of the project?",
        steps: [
          {
            stepNumber: 1,
            label: "Break problem into sub-tasks (edging and seedlings)",
            working: "Total Cost = Cost of Timber Edging + Cost of Seedling Punnets.",
            why: "Decomposing complex word problems into clear sub-tasks makes solving manageable.",
          },
          {
            stepNumber: 2,
            label: "Calculate the perimeter for timber edging",
            working: "Perimeter = 2 × (Length + Width) = 2 × (8 m + 5 m) = 2 × 13 m = 26 m.",
            why: "Edging goes around the boundary of the rectangular garden.",
          },
          {
            stepNumber: 3,
            label: "Calculate the cost of edging",
            working: "26 metres × $6 per metre = $156.",
            why: "Multiplying perimeter by unit cost gives total edging expenditure.",
          },
          {
            stepNumber: 4,
            label: "Calculate the cost of seedlings",
            working: "15 punnets × $4 per punnet = $60.",
            why: "Multiplying punnet count by individual unit cost gives seedling expenditure.",
          },
          {
            stepNumber: 5,
            label: "Sum the total project cost",
            working: "Total Cost = $156 + $60 = $216.",
            why: "Adding all component costs produces the complete project budget.",
          },
        ],
        finalAnswer: "The total cost of the school garden project is $216.",
        commonError: {
          mistake: "Calculating area (8 × 5 = 40) instead of perimeter for the fence edging.",
          whyItHappens: "Confusing space inside a shape (area) with distance around the outside (perimeter).",
          howToAvoid: "Remember: fences, borders, and edging go around the outside (perimeter).",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5n09-misconception",
        heading: "Misconception: Word Problems Must Be Solved in One Calculation",
        claim: "Every math word problem can be solved in a single step using the numbers provided.",
        whyWrong:
          "Realistic mathematical modelling problems frequently require multiple distinct steps: finding an intermediate quantity (like a perimeter or subtotal) before the final question can be answered.",
        correction:
          "Identify intermediate values required along the journey and plan your calculation sequence step by step.",
        example: "Finding total ticket cost for 3 adults and 4 children requires calculating adult total, child total, and then adding them.",
      },
      {
        kind: "check",
        id: "vc2m5n09-check",
        heading: "Check Your Understanding",
        prompt: "Practise multi-step mathematical modelling with real-world additive and multiplicative scenarios.",
        curriculumCode: "VC2M5N09",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 10. VC2M5N10: Computational Algorithms, Branching & Iteration
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5N10",
    title: "Computational Algorithms: Branching, Iteration and Patterns",
    strand: "number",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to design, follow, and trace computational algorithms using sequence, branching (decision making), and iteration (repetition) to explore mathematical patterns.",
    successCriteria: [
      "I can follow and trace flowcharts and step-by-step pseudo-code algorithms with given inputs.",
      "I can identify and use branching conditions (IF / THEN / ELSE) to direct different pathways.",
      "I can use iteration (loops / REPEAT UNTIL / WHILE) to generate and test number sequences.",
    ],
    prerequisites: ["VC2M3N09"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Number).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5n10-concept",
        heading: "Core Building Blocks of Algorithms",
        explanation:
          "An algorithm is a precise, ordered set of step-by-step instructions designed to solve a problem or complete a computation.\n\nThree fundamental control structures:\n1. Sequence: Executing instructions in exact linear order, one after the other.\n2. Branching (Selection / Conditionals): Choosing between two or more paths based on whether a condition is TRUE or FALSE (e.g. IF input is even, THEN divide by 2, ELSE multiply by 3 and add 1).\n3. Iteration (Repetition / Loops): Repeating a set of instructions until a specific stopping condition is met (e.g. REPEAT 5 times, or WHILE number > 1).\n\nTracing algorithms step-by-step with a trace table helps detect patterns and verify accuracy.",
        keyTerms: [
          {
            term: "Algorithm",
            definition: "A step-by-step procedure or set of rules for solving a problem or performing a computation.",
          },
          {
            term: "Branching",
            definition: "A decision point in an algorithm where execution takes one of multiple paths based on a conditional test.",
          },
          {
            term: "Iteration",
            definition: "The repetition of a sequence of computer instructions or mathematical operations.",
          },
          {
            term: "Trace Table",
            definition: "A table used to record the step-by-step values of variables as an algorithm executes.",
          },
        ],
        visualAsset: {
          id: "vc2m5n10-flowchart-table",
          type: "table",
          altText: "Trace table showing algorithm steps, input values, decision outcomes, and updated variable states.",
          title: "Trace Table for Number Pattern Algorithm",
          data: {
            headers: ["Step", "Current Number (N)", "Condition: Is N even?", "Action Taken", "New Value of N"],
            rows: [
              ["Start", "6", "Yes (Even)", "Divide by 2", "3"],
              ["Iteration 1", "3", "No (Odd)", "Multiply by 3, add 1", "10"],
              ["Iteration 2", "10", "Yes (Even)", "Divide by 2", "5"],
              ["Iteration 3", "5", "No (Odd)", "Multiply by 3, add 1", "16"],
              ["Iteration 4", "16", "Yes (Even)", "Divide by 2", "8"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5n10-example",
        heading: "Worked Example: Tracing a Branching Number Algorithm",
        problem:
          "Follow this algorithm with input N = 7:\n1. Start with N.\n2. IF N is even, THEN N = N ÷ 2.\n3. ELSE (if N is odd), THEN N = (N × 3) + 1.\n4. Repeat steps 2-3 until N = 1.\nList the complete sequence of numbers generated.",
        steps: [
          {
            stepNumber: 1,
            label: "Initial Step: N = 7 (Odd)",
            working: "7 is odd. Action: (7 × 3) + 1 = 21 + 1 = 22.",
            why: "Condition 'is odd' is True, so follow the ELSE branch.",
          },
          {
            stepNumber: 2,
            label: "Step 2: N = 22 (Even)",
            working: "22 is even. Action: 22 ÷ 2 = 11.",
            why: "Condition 'is even' is True, so follow the THEN branch.",
          },
          {
            stepNumber: 3,
            label: "Step 3: N = 11 (Odd)",
            working: "11 is odd. Action: (11 × 3) + 1 = 33 + 1 = 34.",
            why: "Odd condition triggers (N × 3) + 1.",
          },
          {
            stepNumber: 4,
            label: "Step 4: N = 34 (Even)",
            working: "34 is even. Action: 34 ÷ 2 = 17.",
            why: "Even condition triggers halving.",
          },
          {
            stepNumber: 5,
            label: "Step 5: N = 17 (Odd)",
            working: "17 is odd. Action: (17 × 3) + 1 = 51 + 1 = 52.",
            why: "Odd branch executed.",
          },
          {
            stepNumber: 6,
            label: "Continue tracing through even numbers to reach 1",
            working:
              "• 52 is even -> 52 ÷ 2 = 26\n• 26 is even -> 26 ÷ 2 = 13\n• 13 is odd -> (13 × 3) + 1 = 40\n• 40 is even -> 20\n• 20 is even -> 10\n• 10 is even -> 5\n• 5 is odd -> (5 × 3) + 1 = 16\n• 16 -> 8 -> 4 -> 2 -> 1 (Stop).",
            why: "Loop repeats until the stopping condition (N = 1) is achieved.",
          },
        ],
        finalAnswer: "The sequence generated from N = 7 is: 7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1.",
        commonError: {
          mistake: "Applying both the THEN and ELSE instructions in the same step.",
          whyItHappens: "Not understanding that branching means choosing ONE path exclusively based on the condition.",
          howToAvoid: "Evaluate the condition first: if True, take the first branch; only take the ELSE branch if False.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5n10-misconception",
        heading: "Misconception: Loops Run Infinitely without Stopping Rules",
        claim: "Any repeating loop will run forever unless you turn off the computer.",
        whyWrong:
          "Well-designed algorithms always include a termination condition (exit condition) such as 'REPEAT UNTIL N = 1' or 'FOR count = 1 TO 10'. The loop terminates automatically as soon as the condition is satisfied.",
        correction:
          "Every iterative algorithm must define a clear stopping condition to ensure it completes successfully.",
        example: "'REPEAT 5 TIMES' stops automatically after the fifth iteration.",
      },
      {
        kind: "check",
        id: "vc2m5n10-check",
        heading: "Check Your Understanding",
        prompt: "Practise tracing, designing, and debugging algorithms with sequence, branching, and iteration.",
        curriculumCode: "VC2M5N10",
        practiceCount: 5,
      },
    ],
  },
]);
