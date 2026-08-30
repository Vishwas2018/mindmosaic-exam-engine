import type { Lesson } from "../schema";

export const LEVEL_3_PROBABILITY_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2M3P01: Qualitative Chance Language
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3P01",
    title: "Language of Chance: Certain, Likely, Equal, Unlikely, and Impossible",
    strand: "probability",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to describe and order the likelihood of everyday events using precise probability terms along a chance spectrum.",
    successCriteria: [
      "I can place chance terms along a spectrum from Impossible (0 chance) to Certain (100% will happen).",
      "I can classify everyday events as impossible, unlikely, equal chance (fifty-fifty), likely, or certain.",
      "I can explain why an event has an equal chance when all possible outcomes are equally probable (like flipping heads on a fair coin).",
    ],
    prerequisites: ["VC2M3N03"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Probability).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3p01-concept",
        heading: "The Chance Continuum and Probability Vocabulary",
        explanation:
          "Chance describes how likely it is that an event will occur. In Level 3, we arrange events along a qualitative **Chance Spectrum** from left (will never happen) to right (will definitely happen):\n\n1. **Impossible (0% chance):** The event cannot happen under any circumstances (e.g. rolling a 7 on a standard 6-sided dice; seeing a live dinosaur walking down the street).\n2. **Unlikely (Low chance):** The event could happen, but probably will not (e.g. winning the top prize in a 500-ticket school raffle with 1 ticket; rolling a 6 on a single dice roll).\n3. **Equal Chance / Fifty-Fifty (Even chance):** There are two equally likely outcomes (e.g. flipping heads on a fair Australian 20c coin; guessing whether a hidden playing card is red or black).\n4. **Likely (High chance):** The event is very expected to happen (e.g. pulling a red counter from a bag with 9 red counters and 1 blue counter).\n5. **Certain (100% chance):** The event is guaranteed to happen (e.g. the sun will rise in the east tomorrow; rolling a number less than 7 on a standard 6-sided dice).",
        keyTerms: [
          {
            term: "Likelihood",
            definition: "The degree of possibility that a specific event or outcome will occur.",
          },
          {
            term: "Equal Chance (Even Chance)",
            definition: "A situation where two or more outcomes are equally balanced and have the exact same likelihood of happening.",
          },
          {
            term: "Outcome",
            definition: "A possible result of a chance event or experiment.",
          },
        ],
        visualAsset: {
          id: "vc2m3p01-chance-spectrum-table",
          type: "table",
          altText:
            "Table displaying the 5-point chance spectrum from Impossible to Certain with definitions and spinner examples.",
          title: "The 5-Point Chance Spectrum & Practical Models",
          data: {
            headers: ["Chance Term", "Likelihood Level", "Definition", "Spinner Model Example (8 Equal Sectors)"],
            rows: [
              ["Impossible", "0% (Zero chance)", "Cannot happen", "Spinning green on a spinner with only red and blue"],
              ["Unlikely", "Low probability", "Might happen, but doubt it", "Spinning yellow on a spinner with 1 yellow and 7 blue"],
              ["Equal Chance", "50% (Even / Balanced)", "Equally likely to happen as not", "Spinning red on a spinner with 4 red and 4 blue"],
              ["Likely", "High probability", "Very expected to happen", "Spinning blue on a spinner with 7 blue and 1 yellow"],
              ["Certain", "100% (Guaranteed)", "Will definitely happen", "Spinning a colour on a fully coloured spinner"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3p01-example",
        heading: "Worked Example: Classifying Likelihood with Marbles in a Bag",
        problem:
          "An opaque bag contains 10 marbles: 7 are blue, 2 are green, 1 is yellow, and 0 are red. You reach in without looking and select one marble. Classify the likelihood of drawing: (a) A blue marble, (b) A red marble, (c) A yellow marble, (d) A marble that is not red.",
        steps: [
          {
            stepNumber: 1,
            label: "Evaluate the total number of outcomes",
            working:
              "Total marbles = 7 + 2 + 1 + 0 = 10 marbles in total. Each marble has an equal chance of being picked.",
            why: "Knowing the total denominator (10) allows comparison of each category's share.",
          },
          {
            stepNumber: 2,
            label: "Classify drawing a Blue marble (7 out of 10)",
            working:
              "Blue occupies 7 out of 10 marbles (more than half). Drawing blue is LIKELY.",
            why: "When an outcome represents the vast majority of possibilities, it is classified as likely.",
          },
          {
            stepNumber: 3,
            label: "Classify drawing a Red marble (0 out of 10)",
            working:
              "There are 0 red marbles in the bag. Drawing red is IMPOSSIBLE.",
            why: "An outcome with 0 items cannot occur under any circumstances.",
          },
          {
            stepNumber: 4,
            label: "Classify drawing Yellow (1 out of 10) and Not Red (10 out of 10)",
            working:
              "Yellow (1/10) is UNLIKELY (possible, but rare). Not Red (10/10) is CERTAIN (every marble in the bag is not red).",
            why: "1 out of 10 is low probability (unlikely); 10 out of 10 covers every item in the bag (certain).",
          },
        ],
        finalAnswer:
          "(a) Blue: LIKELY (7/10). (b) Red: IMPOSSIBLE (0/10). (c) Yellow: UNLIKELY (1/10). (d) Not Red: CERTAIN (10/10).",
        commonError: {
          mistake: "Calling an unlikely event 'impossible' (e.g. saying drawing a yellow marble is impossible because there is only 1).",
          whyItHappens:
            "Confusing a low probability with zero probability.",
          howToAvoid:
            "If there is at least ONE item, it is possible (unlikely), NOT impossible. Impossible means strictly zero.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3p01-misconception",
        heading: "Common Trap: 'Fifty-Fifty' Meaning Any Unknown Event",
        claim: "Any event with two outcomes (like winning the lottery: you win or you lose) has a fifty-fifty equal chance.",
        whyWrong:
          "Just because there are 2 named outcomes does not mean they are equally likely. Winning a lottery involves 1 winning ticket among millions of losing tickets.",
        correction:
          "An event only has an 'equal chance' (50-50) if both outcomes have the exact same number of opportunities or physical balance.",
        example: "Flipping heads vs tails on a balanced coin is 50-50, but rain vs snow in summer is not 50-50.",
      },
      {
        kind: "check",
        id: "vc2m3p01-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise classifying chance events using impossible, unlikely, equal chance, likely, and certain.",
        curriculumCode: "VC2M3P01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2M3P02: Repeated Chance Trials and Observed Variation
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3P02",
    title: "Chance Experiments: Conducting Repeated Trials and Tracking Frequencies",
    strand: "probability",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to conduct repeated chance trials (e.g. coin tosses, spinner spins), record observed outcomes, and recognize natural random variation.",
    successCriteria: [
      "I can conduct a chance experiment and record outcomes systematically in a tally table.",
      "I can explain that in a short experiment (e.g. 10 coin flips), the results will vary and might not split into exactly equal numbers (e.g. 6 heads and 4 tails).",
      "I can explain that as the number of trials increases (e.g. 100 flips), the experimental results get closer to the expected theoretical balance.",
    ],
    prerequisites: ["VC2M3P01"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Probability).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3p02-concept",
        heading: "Conducting Chance Trials and Understanding Variation",
        explanation:
          "When we test chance in real life, we conduct **trials** (repeated tests under the exact same conditions):\n\n• **Trial:** A single test in a probability experiment (e.g. one spin of a spinner, one roll of a dice, or one coin flip).\n• **Theoretical Expectation:** What should happen mathematically in a perfect world. For a fair coin, each flip has an expected 50% chance of heads.\n• **Observed Experimental Results & Variation:** In real-life short experiments, random chance causes natural variation. If you flip a coin 10 times, you will rarely get exactly 5 heads and 5 tails every time — you might get 6 heads and 4 tails, or 7 heads and 3 tails.\n• **Independence of Trials:** Coins and dice have no memory! If a coin lands on heads 3 times in a row, the 4th flip still has the exact same 50-50 chance of landing on heads.",
        keyTerms: [
          {
            term: "Trial",
            definition: "A single performance or repetition of a chance experiment.",
          },
          {
            term: "Variation",
            definition: "The natural differences observed between experimental trial results and theoretical expectations.",
          },
          {
            term: "Independence",
            definition: "The principle that the outcome of one trial has no influence on the outcome of future trials.",
          },
        ],
        visualAsset: {
          id: "vc2m3p02-trials-comparison-table",
          type: "table",
          altText:
            "Table showing results of 20 spins on an equal 4-colour spinner compared against theoretical expectation.",
          title: "Spinner Experiment Results (20 Repeated Spins on 4 Equal Sectors)",
          data: {
            headers: ["Spinner Colour", "Theoretical Expected (20 ÷ 4)", "Observed Tally", "Observed Frequency", "Variation from Expected"],
            rows: [
              ["Red", 5, "卌 |", 6, "+1 (slight random increase)"],
              ["Blue", 5, "||||", 4, "-1 (slight random decrease)"],
              ["Yellow", 5, "卌 ||", 7, "+2 (random variation)"],
              ["Green", 5, "|||", 3, "-2 (random variation)"],
              ["Total Trials", 20, "20 spins recorded", 20, "Balanced across all 20 spins"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3p02-example",
        heading: "Worked Example: Analyzing Coin Toss Trial Data",
        problem:
          "Jack flipped a standard Australian $1 coin 20 times. His results were 13 Heads and 7 Tails. Jack claims: 'This coin is broken because a fair coin must give exactly 10 Heads and 10 Tails.' Evaluate Jack's claim using probability reasoning.",
        steps: [
          {
            stepNumber: 1,
            label: "State the theoretical expectation",
            working:
              "A fair coin has 2 equal sides (Heads and Tails), giving a 50% theoretical probability for each. For 20 flips, the expected average is 20 ÷ 2 = 10 Heads and 10 Tails.",
            why: "Theoretical probability calculates the long-term expected average.",
          },
          {
            stepNumber: 2,
            label: "Examine the experimental sample size",
            working:
              "20 flips is a small sample size. In short experiments, random chance causes natural variation (streaks of heads or tails).",
            why: "Small samples naturally exhibit fluctuation away from the exact 50-50 split.",
          },
          {
            stepNumber: 3,
            label: "Evaluate if 13 Heads is a normal variation",
            working:
              "13 Heads is only 3 more than the expected 10. A difference of 3 is completely normal in a 20-flip experiment.",
            why: "Random variation allows reasonable fluctuation around the midpoint.",
          },
          {
            stepNumber: 4,
            label: "Explain how to test the coin fairly",
            working:
              "To truly test if the coin is biased, Jack should conduct a much larger experiment (e.g. 100 or 500 flips). Over many trials, the ratio of Heads to Tails will settle much closer to 50%.",
            why: "Larger numbers of trials smooth out short-term random streaks.",
          },
        ],
        finalAnswer:
          "Jack's claim is incorrect. The coin is not broken; 13 Heads and 7 Tails is a normal example of random variation in a small 20-flip experiment. Over hundreds of flips, the results will level out close to 50%.",
        commonError: {
          mistake: "Believing that because Heads landed 4 times in a row, the next flip MUST be Tails (the 'gambler's fallacy').",
          whyItHappens:
            "Thinking the coin 'remembers' previous flips and tries to balance itself out immediately.",
          howToAvoid:
            "Remember that coins have no memory: every single flip is an independent event with an exact 50-50 chance.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3p02-misconception",
        heading: "Common Trap: The 'Due for a Turn' Fallacy",
        claim: "If you roll a standard 6-sided dice 5 times without getting a 6, the next roll is guaranteed to be a 6.",
        whyWrong:
          "Every roll of a dice is an independent trial. The dice cannot remember past rolls.",
        correction:
          "On every single roll of a fair 6-sided dice, the probability of rolling a 6 remains exactly 1 in 6.",
        example: "Even after rolling 1, 2, 3, 4, 5, the chance of rolling a 6 on the 6th roll is still just 1 in 6.",
      },
      {
        kind: "check",
        id: "vc2m3p02-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise recording chance trial frequencies and interpreting experimental results and variation.",
        curriculumCode: "VC2M3P02",
        practiceCount: 5,
      },
    ],
  },
]);
