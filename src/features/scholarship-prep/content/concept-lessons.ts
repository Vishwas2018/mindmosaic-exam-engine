export interface VihaanConceptLesson {
  readonly id: string;
  readonly subject: "numeracy" | "numerical_reasoning" | "verbal_reasoning" | "reading" | "writing";
  readonly subjectLabel: string;
  readonly skillId?: string;
  readonly tagFilter?: string;
  readonly title: string;
  readonly durationMinutes: number;
  readonly summary: string;
  readonly workedExample: {
    readonly problem: string;
    readonly steps: readonly string[];
    readonly answer: string;
  };
  readonly commonTrap: string;
}

export const VIHAAN_CONCEPT_LESSONS: readonly VihaanConceptLesson[] = [
  // Mathematics (3)
  {
    id: "lesson-math-fractions-remainder",
    subject: "numeracy",
    subjectLabel: "Mathematics",
    skillId: "scholarship.maths-fractions-decimals",
    title: "Multi-step fractions of a remainder & working backwards",
    durationMinutes: 15,
    summary:
      "When a problem takes a fraction of the original amount and then a fraction of what remains, update the remaining quantity after each step — never add both fractions together against the starting total.",
    workedExample: {
      problem:
        "A library box holds 90 books. One third are borrowed on Monday, then two fifths of the remainder on Tuesday. How many remain?",
      steps: [
        "After Monday, 1 − 1/3 = 2/3 of 90 = 60 books remain.",
        "On Tuesday, 2/5 of 60 = 24 books are borrowed.",
        "Subtract 24 from 60 to leave 36 books.",
      ],
      answer: "36 books",
    },
    commonTrap: "Distractors commonly compute 1/3 + 2/5 of 90 against the whole instead of the remainder.",
  },
  {
    id: "lesson-math-ratios-differences",
    subject: "numeracy",
    subjectLabel: "Mathematics",
    skillId: "scholarship.maths-ratios-rates",
    title: "Scaling ratios from part differences and total parts",
    durationMinutes: 15,
    summary:
      "Find the value of one ratio part first by equating the stated difference (or total) to the corresponding number of ratio parts.",
    workedExample: {
      problem:
        "Juniors and seniors are in the ratio 4:7. There are 18 more seniors than juniors. How many students are there in total?",
      steps: [
        "Difference in parts: 7 − 4 = 3 parts represent 18 students.",
        "1 part = 18 ÷ 3 = 6 students.",
        "Total parts = 4 + 7 = 11 parts, so total students = 11 × 6 = 66.",
      ],
      answer: "66 students",
    },
    commonTrap: "Computing only the larger group (7 × 6 = 42) or dividing 18 by 7 instead of (7 − 4).",
  },
  {
    id: "lesson-math-algebra-percentages",
    subject: "numeracy",
    subjectLabel: "Mathematics",
    skillId: "scholarship.maths-percentages",
    title: "Sequential percentage discounts, mark-ups & non-discounted fees",
    durationMinutes: 15,
    summary:
      "Apply percentage changes one at a time on the updated base, and keep fixed flat fees (such as shipping or booking charges) outside percentage reductions unless stated otherwise.",
    workedExample: {
      problem:
        "A jacket priced at $80 is discounted by 25%, then a $7 flat delivery fee is added. What is the total cost?",
      steps: [
        "25% of $80 is $20, so the discounted price is $80 − $20 = $60.",
        "Delivery is not discounted, so add $7 to obtain $67.",
      ],
      answer: "$67",
    },
    commonTrap: "Taking 25% off ($80 + $7) together, or reporting only the $20 discount instead of final cost.",
  },

  // Numerical Reasoning (3)
  {
    id: "lesson-nr-differences",
    subject: "numerical_reasoning",
    subjectLabel: "Numerical Reasoning",
    skillId: "scholarship.nr-number-series",
    title: "Second-order differences & alternating number series",
    durationMinutes: 15,
    summary:
      "Always write first differences between consecutive terms. If first differences change steadily, take second differences; if signs or magnitudes jump erratically, split odd and even positions.",
    workedExample: {
      problem: "Find the next term in the sequence: 4, 7, 13, 22, 34, ?",
      steps: [
        "First differences: +3, +6, +9, +12.",
        "Differences increase by +3 each step, so the next difference is +15.",
        "Next term = 34 + 15 = 49.",
      ],
      answer: "49",
    },
    commonTrap: "Assuming a constant difference (+12) without checking the trend across differences.",
  },
  {
    id: "lesson-nr-matrices",
    subject: "numerical_reasoning",
    subjectLabel: "Numerical Reasoning",
    skillId: "scholarship.nr-number-matrices",
    title: "Discovering row/column rules in 3-entry grids & matrices",
    durationMinutes: 15,
    summary:
      "Test linear combinations and product-plus-offset rules across at least two complete rows or columns before applying the confirmed rule to the missing cell.",
    workedExample: {
      problem: "Each row follows the same rule: (3, 5, 17), (4, 6, 26), (5, 8, ?). Find ?.",
      steps: [
        "Check Row 1: 3 × 5 + 2 = 17.",
        "Verify Row 2: 4 × 6 + 2 = 26 (consistent across both given rows).",
        "Apply to Row 3: 5 × 8 + 2 = 42.",
      ],
      answer: "42",
    },
    commonTrap: "Picking a rule that matches Row 1 by coincidence (e.g. a + 3b − 1 = 17) without checking Row 2.",
  },
  {
    id: "lesson-nr-deduction",
    subject: "numerical_reasoning",
    subjectLabel: "Numerical Reasoning",
    skillId: "scholarship.nr-logic-deduction-numbers",
    title: "Eliminating unknowns in balance & digit puzzles",
    durationMinutes: 15,
    summary:
      "Represent equal items with a variable or cancel identical items from both sides of a balance equation to isolate one unknown cleanly.",
    workedExample: {
      problem:
        "Two identical parcels plus 5 kg weigh the same as 19 kg. What is the mass of one parcel?",
      steps: [
        "Remove 5 kg from both sides: two parcels = 19 − 5 = 14 kg.",
        "Divide by 2: one parcel = 7 kg.",
      ],
      answer: "7 kg",
    },
    commonTrap: "Dividing 19 − 5 without dividing by 2 when two identical objects are weighed together.",
  },

  // Verbal Reasoning (3)
  {
    id: "lesson-vr-analogies",
    subject: "verbal_reasoning",
    subjectLabel: "Verbal Reasoning",
    skillId: "scholarship.vr-analogies",
    title: "Precision bridge sentences for word analogies",
    durationMinutes: 15,
    summary:
      "Formulate a tight sentence relating the first pair (A -> B: part-to-whole, tool-to-material, cause-to-effect, or degree) and test direction strictly on the second pair.",
    workedExample: {
      problem: "Sieve is to flour as filter is to ____ (liquid / bucket / paper / funnel).",
      steps: [
        "Bridge sentence: 'A sieve separates unwanted pieces from flour.'",
        "Test same role and direction: 'A filter separates unwanted particles from liquid.'",
      ],
      answer: "liquid",
    },
    commonTrap: "Reversed direction or functional materials (e.g. 'paper') that are part of a filter rather than what is purified.",
  },
  {
    id: "lesson-vr-logic",
    subject: "verbal_reasoning",
    subjectLabel: "Verbal Reasoning",
    skillId: "scholarship.vr-sentence-logic",
    title: "Conditional rules, contrapositives & avoiding invalid reversals",
    durationMinutes: 15,
    summary:
      "From 'If P then Q' (All Ps are Q), only P -> Q and its contrapositive 'not Q -> not P' follow with certainty. Never assume 'Q -> P' (affirming the consequent).",
    workedExample: {
      problem:
        "Every choir member brings a blue folder. No one with a blue folder leaves it in the courtyard. Maya is in the choir. What must be true?",
      steps: [
        "Maya is in the choir -> Maya brings a blue folder.",
        "Nobody with a blue folder leaves it in the courtyard -> Maya does not leave her folder in the courtyard.",
      ],
      answer: "Maya does not leave her folder in the courtyard.",
    },
    commonTrap: "Distractors claim 'If someone has a blue folder, they are in the choir' — an invalid converse.",
  },
  {
    id: "lesson-vr-vocabulary",
    subject: "verbal_reasoning",
    subjectLabel: "Verbal Reasoning",
    skillId: "scholarship.vr-synonyms-antonyms",
    title: "Contrast clues and register in context vocabulary",
    durationMinutes: 15,
    summary:
      "Read contrast conjunctions (although, rather than, despite, whereas) to pin exact meaning and tone before testing each choice back into the sentence.",
    workedExample: {
      problem:
        "In 'Although surprised, Priya offered a measured response rather than an outburst', what does 'measured' mean?",
      steps: [
        "Notice contrast signal 'rather than an outburst'.",
        "'Calm and restrained' contrasts directly with 'outburst', whereas 'tall' or 'counted' misreads register.",
      ],
      answer: "calm / controlled",
    },
    commonTrap: "Choosing the most common physical definition ('measured with a ruler') instead of contextual fit.",
  },

  // Reading Comprehension (3)
  {
    id: "lesson-rc-inference",
    subject: "reading",
    subjectLabel: "Reading Comprehension",
    skillId: "scholarship.rc-factual-inference",
    title: "Text-grounded inference without over-reaching",
    durationMinutes: 15,
    summary:
      "An inference must combine at least two stated clues without contradicting details or importing unstated absolutes ('always', 'never', 'only').",
    workedExample: {
      problem:
        "A character pockets her phone mid-text when her grandmother begins telling a familiar story. What does this action suggest?",
      steps: [
        "Pocketing the phone ends a distraction deliberately.",
        "Connecting this to her grandmother speaking shows quiet attentiveness despite hearing the story before.",
      ],
      answer: "She chooses to give her grandmother full attention.",
    },
    commonTrap: "Extreme options using 'bored forever' or unsupported claims outside the paragraph.",
  },
  {
    id: "lesson-rc-craft",
    subject: "reading",
    subjectLabel: "Reading Comprehension",
    skillId: "scholarship.rc-authorial-craft",
    title: "Why a writer includes a contrasting action or detail",
    durationMinutes: 15,
    summary:
      "Ask what function a seemingly small action plays in the narrative arc: does it foreshadow a lesson, reveal patience, or test an assumption?",
    workedExample: {
      problem:
        "Why does a passage mention a volunteer putting unused glue back on the shelf after tightening one loose screw?",
      steps: [
        "Earlier, the narrator had expected glue would be needed.",
        "Returning it unused highlights that careful inspection beats rushing into an unnecessary fix.",
      ],
      answer: "To emphasise inspecting a problem before choosing a tool.",
    },
    commonTrap: "Distractors confuse a symbolic detail with an unrelated plot claim elsewhere in the scene.",
  },
  {
    id: "lesson-rc-argument",
    subject: "reading",
    subjectLabel: "Reading Comprehension",
    skillId: "scholarship.rc-argument-evaluation",
    title: "Distinguishing evidence, opinion & counter-arguments",
    durationMinutes: 15,
    summary:
      "Separate measurable observations from persuasive claims, and identify when a speaker concedes a fair point only to qualify it.",
    workedExample: {
      problem:
        "Notice states: 'The garden stays locked on Mondays for soil rest; weekend access remains open.' How does the writer support Monday closure?",
      steps: [
        "Identify purpose: soil recovery on Mondays.",
        "Notice limitation/safeguard: weekend access stays open so visitors are still accommodated.",
      ],
      answer: "By pairing a clear conservation reason with preserved weekend access.",
    },
    commonTrap: "Treating a balanced concession as total opposition to visitors.",
  },

  // Written Expression (3)
  {
    id: "lesson-writing-narrative",
    subject: "writing",
    subjectLabel: "Written Expression",
    tagFilter: "narrative",
    title: "Narrative focus: turning point, tension & meaningful ending",
    durationMinutes: 15,
    summary:
      "Spend 3 minutes planning one clear obstacle and decision, 9–10 minutes showing character response through concrete verbs and dialogue, and 2–3 minutes editing punctuation and Australian spelling.",
    workedExample: {
      problem: "Prompt: Write about a moment when a difficult choice changes an ordinary plan.",
      steps: [
        "Plan: setting + goal -> complication tempting a shortcut -> specific choice + consequence.",
        "Construct 4 clear paragraphs (opening hook, complication, turning point, resolution).",
        "Edit: check speech marks, comma splices, consistent tense, and 1–5 rubric criteria.",
      ],
      answer: "Parent marks independently on the 6 criteria (1–5 scale, total out of 30).",
    },
    commonTrap: "Rushing through three unrelated events instead of developing one turning point deeply.",
  },
  {
    id: "lesson-writing-persuasive",
    subject: "writing",
    subjectLabel: "Written Expression",
    tagFilter: "persuasive",
    title: "Persuasive structure: reasons, evidence & fair rebuttal",
    durationMinutes: 15,
    summary:
      "State a clear position, develop two distinct reasons with plausible concrete examples (never invented statistics), acknowledge a fair counter-point, and close with an actionable request.",
    workedExample: {
      problem:
        "Prompt: Recommend whether your school converts a spare room into a reading space or a project studio.",
      steps: [
        "Opening: state audience, clear recommendation, and purpose.",
        "Body 1 & 2: two separate benefits with concrete school-day examples.",
        "Rebuttal + Close: concede one genuine advantage of the alternative and offer a practical safeguard.",
      ],
      answer: "Parent marks independently on the 6 criteria (1–5 scale, total out of 30).",
    },
    commonTrap: "Repeating the same point in two paragraphs or dismissing the opposing view unfairly.",
  },
  {
    id: "lesson-writing-craft",
    subject: "writing",
    subjectLabel: "Written Expression",
    tagFilter: "descriptive",
    title: "Descriptive & expository precision: viewpoint, structure & editing",
    durationMinutes: 15,
    summary:
      "Control sentence variety (short punchy sentences alongside complex clauses), anchor descriptions to a consistent sensory viewpoint, and use exact punctuation intentionally.",
    workedExample: {
      problem: "Prompt: Describe a quiet morning schoolyard just before the first bus arrives.",
      steps: [
        "Choose a fixed vantage point (e.g. beside the verandah bench).",
        "Layer sound, light, temperature, and texture details before introducing the arriving bus.",
        "Edit spelling, apostrophes, and paragraph transitions.",
      ],
      answer: "Parent marks independently on the 6 criteria (1–5 scale, total out of 30).",
    },
    commonTrap: "Listing disconnected adjectives instead of building a unified atmosphere or sequence.",
  },
];
