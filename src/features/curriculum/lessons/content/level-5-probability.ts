import type { Lesson } from "../schema";

export const LEVEL_5_PROBABILITY_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2M5P01: Equally Likely and Unequal Chance Experiment Outcomes
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5P01",
    title: "Theoretical Probability: Equal and Unequal Chance Outcomes",
    strand: "probability",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify all possible outcomes of a chance experiment and express theoretical probabilities using fractions, decimals, and percentages from 0 (impossible) to 1 (certain).",
    successCriteria: [
      "I can list the complete sample space of a single-stage chance experiment.",
      "I can calculate theoretical probability as: P(event) = (favourable outcomes) / (total possible outcomes).",
      "I can distinguish between equally likely outcomes (fair spinner) and unequal outcomes (weighted or unequal sectors).",
    ],
    prerequisites: ["VC2M3P01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Probability).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5p01-concept",
        heading: "The Numerical Scale of Probability",
        explanation:
          "Probability is the measure of the likelihood that an event will occur. In mathematics, probability is quantified on a scale from 0 to 1:\n• 0 (0%): Impossible (can never happen, e.g. rolling a 7 on a standard 6-sided die).\n• 0.5 (50%, 1/2): Even chance (equally likely to occur or not occur, e.g. flipping heads on a fair coin).\n• 1 (100%): Certain (guaranteed to happen, e.g. pulling a red marble from a bag of 10 red marbles).\n\nFormula for Theoretical Probability:\nProbability of Event P(E) = (Number of favourable outcomes) ÷ (Total number of possible equally likely outcomes)\n\nEqually Likely vs Unequal Outcomes:\n• A fair 6-sided die has 6 equally likely outcomes (1, 2, 3, 4, 5, 6). Probability of rolling an even number (2, 4, 6) = 3/6 = 1/2 = 0.5 = 50%.\n• A spinner with 1 half coloured Blue and 2 quarters coloured Red and Green has unequal outcomes: P(Blue) = 1/2 (50%), P(Red) = 1/4 (25%), P(Green) = 1/4 (25%).",
        keyTerms: [
          {
            term: "Theoretical Probability",
            definition: "The calculated likelihood of an event occurring based on mathematical reasoning and possible outcomes.",
          },
          {
            term: "Sample Space",
            definition: "The set of all possible outcomes of a chance experiment.",
          },
          {
            term: "Favourable Outcome",
            definition: "An outcome that satisfies the specific condition being investigated in a probability question.",
          },
          {
            term: "Equally Likely",
            definition: "Outcomes that have the exact same chance of occurring.",
          },
        ],
        visualAsset: {
          id: "vc2m5p01-spinner-table",
          type: "table",
          altText: "Table showing spinner sector fractions, decimal probabilities, and percentage chances.",
          title: "Theoretical Probabilities for an 8-Sector Spinner",
          data: {
            headers: ["Colour", "Number of Sectors", "Fraction P(E)", "Decimal", "Percentage"],
            rows: [
              ["Blue", "4 sectors", "4/8 = 1/2", "0.50", "50%"],
              ["Red", "2 sectors", "2/8 = 1/4", "0.25", "25%"],
              ["Yellow", "1 sector", "1/8", "0.125", "12.5%"],
              ["Green", "1 sector", "1/8", "0.125", "12.5%"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5p01-example",
        heading: "Worked Example: Calculating Probability from a Bag of Marbles",
        problem:
          "A bag contains 5 red marbles, 3 blue marbles, and 2 green marbles. (a) What is the total sample space? (b) What is the probability of randomly drawing a red marble, expressed as a fraction and percentage? (c) What is the probability of NOT drawing a green marble?",
        steps: [
          {
            stepNumber: 1,
            label: "Calculate total possible outcomes (Sample Space)",
            working: "Total marbles = 5 red + 3 blue + 2 green = 10 marbles in total.",
            why: "The denominator of our probability fraction is the total number of items.",
          },
          {
            stepNumber: 2,
            label: "Calculate probability of drawing a red marble",
            working: "• Favourable outcomes (red) = 5.\n• P(Red) = 5/10 = 1/2 = 0.5 = 50%.",
            why: "Dividing favourable red marbles by total marbles gives theoretical probability.",
          },
          {
            stepNumber: 3,
            label: "Calculate probability of NOT drawing a green marble (Complementary Event)",
            working:
              "• Non-green marbles = 5 red + 3 blue = 8 marbles (or Total - Green = 10 - 2 = 8).\n• P(Not Green) = 8/10 = 4/5 = 0.8 = 80%.",
            why: "The probability of an event NOT happening is 1 - P(event) = 1 - 2/10 = 8/10.",
          },
        ],
        finalAnswer: "P(Red) = 1/2 (50%); P(Not Green) = 4/5 (80%).",
        commonError: {
          mistake: "Writing the ratio of red to other colours (5/5 = 1) instead of red to the total (5/10).",
          whyItHappens: "Confusing odds (part-to-part ratio) with probability (part-to-whole fraction).",
          howToAvoid: "The denominator in probability is ALWAYS the total count of all possible outcomes.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5p01-misconception",
        heading: "Misconception: '50/50 Chance' Applies to Any Two Possibilities",
        claim: "Either it will rain today or it won't, so there is a 50% chance of rain.",
        whyWrong:
          "Just because there are two possible outcomes does NOT mean they are equally likely! The probability depends on weather conditions and atmospheric data, which is rarely an exact 50% coin toss.",
        correction:
          "Two outcomes only have a 50% probability if they are proven to be equally likely (like a fair coin).",
        example: "Buying a lottery ticket has two outcomes (win or lose), but the chance of winning is vastly less than 50%!",
      },
      {
        kind: "check",
        id: "vc2m5p01-check",
        heading: "Check Your Understanding",
        prompt: "Practise calculating theoretical probabilities, determining sample spaces, and comparing chance outcomes.",
        curriculumCode: "VC2M5P01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2M5P02: Repeated Chance Trials and Experimental Probability
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5P02",
    title: "Experimental Probability: Repeated Trials and Frequency",
    strand: "probability",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to conduct repeated chance trials, calculate experimental probability (relative frequency), and explain why larger numbers of trials get closer to theoretical probability (Law of Large Numbers).",
    successCriteria: [
      "I can calculate experimental probability as: Relative Frequency = (number of times event occurred) / (total number of trials).",
      "I can compare experimental results with expected theoretical probabilities and explain variations.",
      "I can explain why increasing the number of trials makes the experimental frequency more reliable and closer to the theoretical prediction.",
    ],
    prerequisites: ["VC2M5P01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Probability).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5p02-concept",
        heading: "Theoretical vs Experimental Probability",
        explanation:
          "There is a crucial distinction in statistics between what SHOULD happen and what ACTUALLY happens:\n\n• Theoretical Probability: What we expect to happen based on mathematical symmetry (e.g. flipping a coin should give heads 50% of the time).\n• Experimental Probability (Relative Frequency): The actual proportion observed in a real experiment:\n  Relative Frequency = (Observed Occurrences) ÷ (Total Trials Conducted)\n\nVariability in Small Samples vs Large Samples:\n• In 10 coin tosses, getting 7 Heads (70%) is common due to random variation.\n• In 1,000 coin tosses, the result will almost always be very close to 500 Heads (around 49% to 51%).\n• The Law of Large Numbers states that as the number of trials increases, the experimental probability gets closer and closer to the theoretical probability.",
        keyTerms: [
          {
            term: "Experimental Probability",
            definition: "The ratio of the number of times an event occurs to the total number of trials conducted.",
          },
          {
            term: "Relative Frequency",
            definition: "How often an outcome happens divided by the total number of observations.",
          },
          {
            term: "Law of Large Numbers",
            definition: "The principle that experimental results approach theoretical probability as the number of trials grows large.",
          },
          {
            term: "Trial",
            definition: "A single performance of a chance experiment (e.g. one coin toss or one die roll).",
          },
        ],
        visualAsset: {
          id: "vc2m5p02-trials-table",
          type: "table",
          altText: "Comparison table showing coin flip results across 10, 100, and 1,000 trials approaching 50%.",
          title: "Coin Toss Experiments Across Increasing Trial Counts",
          data: {
            headers: ["Number of Trials", "Observed Heads", "Experimental Probability", "Theoretical Probability"],
            rows: [
              ["10 trials", "7", "7/10 = 70.0%", "50.0%"],
              ["100 trials", "54", "54/100 = 54.0%", "50.0%"],
              ["1,000 trials", "503", "503/1,000 = 50.3%", "50.0%"],
              ["10,000 trials", "5,012", "5,012/10,000 = 50.1%", "50.0%"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5p02-example",
        heading: "Worked Example: Testing a Die for Fairness",
        problem:
          "A student rolls a 6-sided die 200 times and records a '6' exactly 42 times. (a) What is the experimental probability of rolling a 6? (b) What was the expected theoretical count of sixes? (c) Is the die reasonably fair?",
        steps: [
          {
            stepNumber: 1,
            label: "Calculate the experimental probability (relative frequency)",
            working: "Relative Frequency = 42 ÷ 200 = 21/100 = 0.21 = 21%.",
            why: "Observed sixes divided by total trials gives the experimental proportion.",
          },
          {
            stepNumber: 2,
            label: "Calculate theoretical probability and expected count",
            working:
              "• Theoretical P(6) = 1/6 ≈ 16.7%.\n• Expected count in 200 rolls = 1/6 × 200 = 33.33 ≈ 33 sixes.",
            why: "Multiplying theoretical probability by total trials gives the expected frequency.",
          },
          {
            stepNumber: 3,
            label: "Evaluate experimental variation",
            working: "42 sixes is slightly higher than the expected 33, but in 200 rolls, a small random fluctuation of +9 is normal and consistent with a fair die.",
            why: "Experimental probability naturally fluctuates around theoretical expectation in random processes.",
          },
        ],
        finalAnswer: "Experimental probability is 21% (42/200); Expected count is ~33; The result shows normal experimental variation for a fair die.",
        commonError: {
          mistake: "Believing that rolling 5 sixes in a row means the next roll is 'due' to be a different number (Gambler's Fallacy).",
          whyItHappens: "Thinking the die has a memory of past rolls.",
          howToAvoid: "Each roll of a die is completely independent; previous results never affect future rolls.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5p02-misconception",
        heading: "Misconception: The 'Gambler's Fallacy' (The 'Due' Number Fallacy)",
        claim: "If you flip a coin and get 5 Tails in a row, the next flip is more likely to be Heads because Heads is 'due'.",
        whyWrong:
          "Coins and dice have no memory. The coin does not know what happened on previous flips. Every individual flip is completely independent, with the exact same 50% chance of Heads.",
        correction:
          "Past outcomes in independent events do not influence future probabilities.",
        example: "On the 6th flip of a fair coin, P(Heads) is still exactly 1/2 (50%).",
      },
      {
        kind: "check",
        id: "vc2m5p02-check",
        heading: "Check Your Understanding",
        prompt: "Practise calculating experimental probability, analyzing repeated trials, and comparing observations with theoretical models.",
        curriculumCode: "VC2M5P02",
        practiceCount: 5,
      },
    ],
  },
]);
