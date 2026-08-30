import type { Lesson } from "../schema";

export const LEVEL_5_ENGLISH_LANGUAGE_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2E5LA01: Social Register, Contextual Choices & Interpersonal Roles
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LA01",
    title: "Social Register: Formal and Informal Language Choices",
    strand: "language",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to analyze and adjust language register (formal, informal, academic, consultative) depending on audience, purpose, and social context.",
    successCriteria: [
      "I can explain what register means and how audience and purpose shape our language choices.",
      "I can identify features of informal register (slang, colloquialisms, contractions, personal pronouns) and formal register (precise vocabulary, objective tone, full forms).",
      "I can rewrite informal text into an appropriate formal register for letters, reports, or speeches.",
    ],
    prerequisites: ["VC2E3LA01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5la01-concept",
        heading: "What Is Language Register?",
        explanation:
          "Language register refers to the level of formality and style we choose when speaking or writing. Just as you wear different clothes to a sports match compared to a formal ceremony, you select different words and sentence structures depending on who you are communicating with.\n\nKey Registers:\n• Informal Register: Used with friends and family in casual settings. Characteristics include contractions (can't, won't), idioms ('grab a bite'), slang, shorter sentences, and personal pronouns (I, you).\n• Formal Register: Used in professional, academic, civic, and official communications. Characteristics include full words (cannot, will not), precise technical terms, objective third-person perspective, passive constructions, and complex sentence structures.\n• Consultative Register: Polite, respectful dialogue used between students and teachers, or doctors and patients.",
        keyTerms: [
          {
            term: "Register",
            definition: "The degree of formality and linguistic style adopted for a specific social context, audience, and purpose.",
          },
          {
            term: "Colloquialism",
            definition: "An informal word or phrase common in casual conversation but unsuitable for formal writing.",
          },
          {
            term: "Objective Tone",
            definition: "A neutral, factual writing style that avoids personal bias and emotional exaggeration.",
          },
        ],
        visualAsset: {
          id: "vc2e5la01-register-comparison",
          type: "table",
          altText: "Comparison table contrasting informal casual expressions with formal academic equivalents.",
          title: "Informal vs Formal Language Register Comparison",
          data: {
            headers: ["Informal / Casual Expression", "Formal / Academic Alternative", "Context Example"],
            rows: [
              ["I reckon it's heaps better", "Evidence demonstrates significant improvement", "Persuasive Essay"],
              ["Can't wait to see ya", "We look forward to meeting with you", "Official Letter"],
              ["The gadget broke down", "The equipment malfunctioned unexpectedly", "Science Report"],
              ["A bunch of kids turned up", "Numerous students attended the event", "Newsletter Article"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e5la01-example",
        heading: "Worked Example: Transforming Casual Notes to a Formal Proposal",
        problem:
          "Transform this casual note into a formal proposal for the school principal: 'Hey Mr Davis, our playground is pretty boring right now. We really need some cool basketball hoops so the kids can shoot hoops at lunch. Cheers, Sam.'",
        steps: [
          {
            stepNumber: 1,
            label: "Identify informal words, contractions, and greetings",
            working:
              "• Informal greeting: 'Hey Mr Davis'\n• Casual adjectives and slang: 'pretty boring', 'cool', 'kids', 'shoot hoops'\n• Informal sign-off: 'Cheers, Sam'.",
            why: "Pinpointing colloquialisms highlights what must be replaced with professional vocabulary.",
          },
          {
            stepNumber: 2,
            label: "Substitute with respectful salutation and precise vocabulary",
            working:
              "• Salutation: 'Dear Principal Davis,'\n• Replace 'pretty boring' with 'currently lacks sufficient recreational facilities'\n• Replace 'cool basketball hoops' with 'additional basketball equipment'\n• Replace 'shoot hoops' with 'engage in active physical recreation'.",
            why: "Elevating vocabulary establishes an objective, persuasive, and respectful tone.",
          },
          {
            stepNumber: 3,
            label: "Assemble the complete formal proposal",
            working:
              "'Dear Principal Davis, I am writing to propose an enhancement to our school's playground facilities. Installing additional basketball courts would provide students with valuable opportunities for physical activity and teamwork during recess and lunchtime. Thank you for considering this proposal. Yours sincerely, Sam.'",
            why: "Complete sentences and professional formatting suit administrative correspondence.",
          },
        ],
        finalAnswer:
          "Dear Principal Davis, I am writing to propose an enhancement to our playground facilities. Installing additional basketball equipment would provide students with valuable opportunities for physical activity during lunch breaks. Thank you for your consideration. Yours sincerely, Sam.",
        commonError: {
          mistake: "Using overly archaic or bizarre 'thesaurus words' that sound unnatural (e.g. 'Greetings esteemed overseer').",
          whyItHappens: "Believing formal writing requires rare words rather than clear, precise, and polite language.",
          howToAvoid: "Aim for clarity, respectfulness, and standard vocabulary rather than artificial complexity.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5la01-misconception",
        heading: "Misconception: Formal Language Means Using Complex, Long Words",
        claim: "Formal writing is just informal writing with the longest possible dictionary words substituted in.",
        whyWrong:
          "Effective formal register prioritises clarity, conciseness, and precision. Pumping sentences full of complicated jargon makes writing confusing and difficult to read. The goal is professionalism and accuracy, not showing off.",
        correction:
          "Formal register is defined by correct grammar, objective tone, and clear vocabulary, not pretentiousness.",
        example: "'The team completed the experiment' is formal and clear; 'The cohort culminated the empirical trial' is needlessly convoluted.",
      },
      {
        kind: "check",
        id: "vc2e5la01-check",
        heading: "Check Your Understanding",
        prompt: "Practise identifying language register, eliminating colloquialisms, and rewriting texts for formal contexts.",
        curriculumCode: "VC2E5LA01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2E5LA02: Constructing Reasoned Arguments Using Evidence & Authority
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LA02",
    title: "Persuasive Arguments: Evidence, Reasoning and Authority",
    strand: "language",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to construct reasoned persuasive arguments supported by factual evidence, expert authority, statistical data, and logical reasoning.",
    successCriteria: [
      "I can formulate a clear thesis statement that defines a persuasive contention.",
      "I can distinguish between emotional appeals (pathos) and evidence-based logical reasoning (logos).",
      "I can integrate facts, expert quotes, and statistics using framing phrases (e.g. 'According to marine biologists...').",
    ],
    prerequisites: ["VC2E3LA02"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5la02-concept",
        heading: "Building Rock-Solid Persuasive Arguments",
        explanation:
          "An effective persuasive argument does not rely solely on opinions or exclamation marks. It builds credibility (ethos) and convinces the reader through structured reasoning and verifiable evidence.\n\nThe PEEL Paragraph Structure:\n• Point (Topic Sentence): State the main claim or reason clearly.\n• Evidence / Example: Provide factual data, research statistics, expert testimony, or concrete examples to back up the claim.\n• Explanation: Explain HOW the evidence proves your point and why it matters.\n• Link: Connect the paragraph back to the overall contention (thesis).\n\nAuthoritative Framing Language:\n• 'Research conducted by environmental scientists indicates that...'\n• 'Data published by the Department of Transport reveals that...'\n• 'According to paediatric health guidelines, children require...'",
        keyTerms: [
          {
            term: "Contention",
            definition: "The central point of view or thesis statement that a persuasive text argues for.",
          },
          {
            term: "Expert Authority",
            definition: "Citing the opinions, research, or findings of recognized specialists to lend weight to an argument.",
          },
          {
            term: "Logical Reasoning",
            definition: "Drawing sound, sensible conclusions based on factual evidence and rational premises.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5la02-example",
        heading: "Worked Example: Strengthening an Opinion with Evidence and Authority",
        problem:
          "Upgrade this weak opinion into a strong PEEL argument with evidence and authority: 'Plastic bags are terrible and everybody knows we should ban them completely.'",
        steps: [
          {
            stepNumber: 1,
            label: "Formulate a strong, objective Point (Topic Sentence)",
            working: "Point: Single-use plastic bags cause severe long-term harm to marine ecosystems and should be phased out entirely.",
            why: "A clear topic sentence establishes the argument without relying on vague emotional words like 'terrible'.",
          },
          {
            stepNumber: 2,
            label: "Incorporate expert evidence and specific statistics",
            working: "Evidence: According to marine conservation data, over 100,000 marine animals are injured or killed by plastic pollution in Australian waters each year.",
            why: "Specific numbers and authoritative attribution convert an opinion into verifiable fact.",
          },
          {
            stepNumber: 3,
            label: "Explain the causal link (Explanation)",
            working: "Explanation: Because thin plastic does not biodegrade, it breaks into toxic microplastics that enter the ocean food chain, poisoning marine habitats for centuries.",
            why: "Explaining the mechanism shows why the evidence matters and proves the initial claim.",
          },
          {
            stepNumber: 4,
            label: "Provide a concluding Link back to the contention",
            working: "Link: Mandating reusable alternatives is therefore a vital and urgent measure to protect our coastal biodiversity.",
            why: "The link sentence reinforces the call to action and unifies the paragraph.",
          },
        ],
        finalAnswer:
          "Single-use plastic bags cause severe long-term harm to marine ecosystems and should be phased out entirely. According to marine conservation researchers, over 100,000 marine animals in Australian waters are impacted by plastic debris annually. Because synthetic polymers do not biodegrade, they fragment into microplastics that poison oceanic food webs. Mandating reusable alternatives is therefore an urgent necessity to protect Australia's marine biodiversity.",
        commonError: {
          mistake: "Relying on sweeping generalizations like 'Everyone agrees' or 'It is obvious to everyone'.",
          whyItHappens: "Assuming that feeling strongly about a topic is equivalent to proving it.",
          howToAvoid: "Replace sweeping claims with cited data, case studies, or expert statements.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5la02-misconception",
        heading: "Misconception: Persuasion Is Won by Being the Loudest",
        claim: "Using lots of exclamation marks, ALL CAPS, and dramatic words makes an argument more persuasive.",
        whyWrong:
          "Exaggeration and aggressive language undermine credibility. Mature readers and assessors look for calm, well-reasoned evidence and logical deduction rather than shouting.",
        correction:
          "Persuade through compelling evidence, clear structure, and measured reasoning.",
        example: "'84% of surveyed teachers reported increased focus' is far more convincing than 'EVERYONE KNOWS THIS IS AMAZING!!!'",
      },
      {
        kind: "check",
        id: "vc2e5la02-check",
        heading: "Check Your Understanding",
        prompt: "Practise building reasoned arguments, integrating evidence, and applying the PEEL paragraph structure.",
        curriculumCode: "VC2E5LA02",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2E5LA03: Genre Stages, Structural Phases & Language Features
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LA03",
    title: "Text Structures and Genre Conventions in Complex Texts",
    strand: "language",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify the characteristic stages, structural phases, and language features of diverse text types (informative reports, explanations, discussions, narratives).",
    successCriteria: [
      "I can map the sequential stages of informative, explanatory, procedural, and persuasive genres.",
      "I can identify grammatical features specific to genres (e.g. timeless present tense and passive voice in scientific explanations; past tense and dialogue in narratives).",
      "I can evaluate whether a text successfully fulfills its social purpose through its structural organisation.",
    ],
    prerequisites: ["VC2E3LA03"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5la03-concept",
        heading: "Genre Architecture: How Purpose Drives Structure",
        explanation:
          "Every text genre has evolved to achieve a specific social purpose. The structure and grammatical choices reflect that purpose directly:\n\n1. Information Report (Classifies and describes phenomena):\n   • Stages: General Classification -> Technical Description (subheadings for habitat, diet, adaptations) -> Summary.\n   • Features: Present tense, domain-specific nouns, passive voice, factual descriptions.\n2. Sequential Explanation (Explains HOW or WHY something occurs):\n   • Stages: Phenomenon Identification -> Cause-and-Effect Sequential Steps -> Application/Summary.\n   • Features: Temporal connectives (subsequently, simultaneously), causal connectives (consequently, as a result), technical verbs.\n3. Discussion (Examines multiple perspectives on an issue):\n   • Stages: Statement of Issue -> Arguments For (with evidence) -> Arguments Against (with evidence) -> Balanced Recommendation/Conclusion.\n   • Features: Modality, contrasting connectives (however, in contrast, on the other hand).",
        keyTerms: [
          {
            term: "Genre Stages",
            definition: "The predictable organizational sections that a text moves through to achieve its purpose.",
          },
          {
            term: "Causal Connective",
            definition: "A conjunction or linking adverb that explains reasons and outcomes (e.g. because, consequently, therefore).",
          },
          {
            term: "Timeless Present Tense",
            definition: "Using present tense verbs to express universal scientific facts and ongoing realities (e.g. 'Trees absorb carbon').",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5la03-example",
        heading: "Worked Example: Analyzing the Structural Stages of an Explanation",
        problem:
          "Read this extract and identify its genre, stage, and two characteristic language features: 'During evaporation, thermal energy from the sun warms water molecules in oceans and lakes. As their temperature rises, the liquid molecules gain kinetic energy and transform into water vapour, subsequently ascending into the atmosphere.'",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the genre and its purpose",
            working: "The text explains HOW and WHY water changes state and rises into the air. Genre: Scientific Sequential Explanation.",
            why: "Explanations focus on processes, state changes, and causal mechanisms.",
          },
          {
            stepNumber: 2,
            label: "Identify the structural stage",
            working: "Stage: Explanation Sequence (the step-by-step causal phase describing thermal energy transfer and state transformation).",
            why: "It describes the sequential mechanism after the initial phenomenon has been introduced.",
          },
          {
            stepNumber: 3,
            label: "Identify key language features",
            working:
              "• Feature 1: Timeless present tense verbs ('warms', 'gain', 'transform', 'ascending')\n• Feature 2: Domain-specific scientific noun groups ('thermal energy', 'water molecules', 'water vapour')\n• Feature 3: Temporal and causal linking ('During', 'As', 'subsequently').",
            why: "Scientific explanations rely on technical nominalisations, present tense, and sequence markers.",
          },
        ],
        finalAnswer: "Genre: Scientific Explanation; Stage: Explanation Sequence; Language Features: Timeless present tense verbs and specialized domain-specific terminology.",
        commonError: {
          mistake: "Confusing an Information Report (which describes WHAT something is) with an Explanation (which explains HOW a process works).",
          whyItHappens: "Both text types are informative and use technical vocabulary.",
          howToAvoid: "Ask yourself: Does this describe features and categories (Report), or does it explain a step-by-step causal process (Explanation)?",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5la03-misconception",
        heading: "Misconception: All Informative Texts Follow the Same Template",
        claim: "Every non-fiction text should have the same structure: introduction, three paragraphs, and conclusion.",
        whyWrong:
          "A scientific procedure, a historical recount, a biographical narrative, and a balanced discussion require completely different structural stages to fulfill their unique communicative goals.",
        correction:
          "Match the text structure directly to the specific communicative purpose and audience.",
        example: "A recipe requires a goal, ingredient list, and numbered steps, whereas a discussion requires balanced opposing arguments.",
      },
      {
        kind: "check",
        id: "vc2e5la03-check",
        heading: "Check Your Understanding",
        prompt: "Practise identifying text genres, mapping structural stages, and analyzing specific grammatical conventions.",
        curriculumCode: "VC2E5LA03",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. VC2E5LA04: Theme Progression, Sentence Starters & Cohesive Sequencing
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LA04",
    title: "Text Cohesion: Theme Progression and Sentence Starters",
    strand: "language",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to create smooth text flow and cohesion by varying sentence starters (fronted adverbials) and using theme-rheme progression.",
    successCriteria: [
      "I can identify the 'theme' (starting information) and 'rheme' (new information) in a clause.",
      "I can use fronted adverbials (time, place, manner, cause) with correct comma punctuation to vary sentence openings.",
      "I can track pronouns and synonyms across paragraphs to ensure clear cohesive reference without repetitive phrasing.",
    ],
    prerequisites: ["VC2E3LA04"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5la04-concept",
        heading: "Theme, Rheme, and Information Flow",
        explanation:
          "Text cohesion is the glue that connects sentences together into a smooth, readable flow. In English grammar:\n• Theme (Topic): The starting element of a clause. It sets the scene or announces what the sentence is about.\n• Rheme (New Info): The remainder of the clause that delivers new details about the theme.\n\nIn skilled writing, the new information (rheme) from one sentence often becomes the starting theme of the next sentence (Theme-Rheme progression):\nExample: 'Deep within the rainforest grows the ancient Wollemi Pine [Theme -> Rheme]. This prehistoric tree [New Theme] was thought to be extinct for millions of years.'\n\nFronted Adverbials:\nMoving an adverbial phrase to the start of a sentence establishes context immediately:\n• Time: 'Early the following morning, the expedition departed.'\n• Place: 'Across the southern horizon, storm clouds gathered.'\n• Manner: 'With extreme precision, the surgeon completed the delicate procedure.'\n• Always place a comma after a fronted adverbial phrase.",
        keyTerms: [
          {
            term: "Cohesion",
            definition: "The grammatical and lexical linking within a text that creates a unified, smooth flow of ideas.",
          },
          {
            term: "Fronted Adverbial",
            definition: "An adverb, phrase, or clause moved to the very front of a sentence to provide context of time, place, manner, or reason.",
          },
          {
            term: "Theme-Rheme Flow",
            definition: "The method of linking sentences where new information in one clause becomes the starting focus of the next.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5la04-example",
        heading: "Worked Example: Improving Choppy Sentences with Cohesive Starters",
        problem:
          "Revise this choppy paragraph to improve flow using fronted adverbials and cohesive pronoun references: 'The rover landed on Mars. The rover started its camera. It took pictures of red rocks. The rocks had deep cracks. The scientists studied the cracks back on Earth.'",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the repetitive subject openings ('The rover', 'The rover', 'It')",
            working: "Every sentence starts with the same subject or noun, making the rhythm monotonous and stilted.",
            why: "Varying sentence openers enlivens prose and establishes setting and sequence.",
          },
          {
            stepNumber: 2,
            label: "Add fronted adverbials for time and location",
            working:
              "• Open with time: 'After a seven-month interplanetary voyage, the robotic rover touched down on Mars.'\n• Follow with sequence: 'Immediately upon landing, the vehicle activated its high-resolution panoramic cameras.'",
            why: "Adverbial phrases provide rich context before introducing the main action.",
          },
          {
            stepNumber: 3,
            label: "Connect new information to following sentences (Theme-Rheme linkage)",
            working:
              "'The initial photographs captured surrounding volcanic boulders marked with deep geological fractures. Back on Earth, planetary scientists analysed these ancient cracks for signs of prehistoric water.'",
            why: "Linking 'boulders marked with fractures' to 'these ancient cracks' creates unbroken textual continuity.",
          },
        ],
        finalAnswer:
          "After a seven-month interplanetary voyage, the robotic rover touched down safely on Mars. Immediately upon landing, the vehicle activated its high-resolution cameras to document the barren landscape. The resulting photographs revealed volcanic boulders marked with deep geological fractures. Back on Earth, planetary scientists eagerly analysed these ancient cracks for evidence of prehistoric water.",
        commonError: {
          mistake: "Forgetting the comma after a fronted adverbial (e.g. writing 'After midnight the storm began' without a comma).",
          whyItHappens: "Rushing past the natural spoken pause after an introductory clause.",
          howToAvoid: "Always insert a comma after an introductory adverbial phrase before the main subject.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5la04-misconception",
        heading: "Misconception: Every Sentence Must Start with 'The' or a Noun",
        claim: "Good sentences always start directly with the subject noun (like 'The boy went...').",
        whyWrong:
          "Beginning every sentence with the subject noun produces monotonous, repetitive prose. Varied writing integrates prepositional phrases, subordinate clauses, participial phrases (-ing), and adverbs at the front.",
        correction:
          "Deliberately vary sentence starters across a paragraph to enhance pacing and readability.",
        example: "'Silently gliding through the water, the dolphin...' vs 'The dolphin glided silently through the water.'",
      },
      {
        kind: "check",
        id: "vc2e5la04-check",
        heading: "Check Your Understanding",
        prompt: "Practise using fronted adverbials, punctuating introductory phrases, and creating cohesive theme-rheme progressions.",
        curriculumCode: "VC2E5LA04",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. VC2E5LA05: Complex Sentences with Dependent & Independent Clauses
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LA05",
    title: "Complex Sentence Architecture: Main and Subordinate Clauses",
    strand: "language",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to construct and punctuate complex sentences containing independent (main) and dependent (subordinate) clauses linked by subordinating conjunctions.",
    successCriteria: [
      "I can identify independent clauses (complete thoughts that can stand alone as a sentence) and dependent clauses (incomplete thoughts requiring a main clause).",
      "I can use subordinating conjunctions (e.g. although, because, while, since, whereas, unless, if) to express complex relationships of time, concession, and cause.",
      "I can place a comma when the dependent clause comes FIRST, and omit the comma when the independent clause comes first.",
    ],
    prerequisites: ["VC2E3LA05"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5la05-concept",
        heading: "Building Complex Sentences",
        explanation:
          "Sentences are categorized by their clause structure:\n• Simple Sentence: One independent clause (e.g. 'The solar panels generated electricity.').\n• Compound Sentence: Two independent clauses joined by a coordinating conjunction (FANBOYS: for, and, nor, but, or, yet, so) (e.g. 'The sun shone brightly, and the solar panels generated electricity.').\n• Complex Sentence: One independent (main) clause combined with at least one dependent (subordinate) clause introduced by a subordinating conjunction.\n\nSubordinating Conjunctions and Relationships:\n• Cause/Reason: because, since, as\n• Concession/Contrast: although, even though, whereas, while\n• Condition: if, unless, provided that\n• Time: while, when, whenever, before, after, until\n\nPunctuation Rule:\n• Dependent clause first -> COMMA required: 'Although the weather was freezing, the runners completed the marathon.'\n• Independent clause first -> NO comma needed: 'The runners completed the marathon although the weather was freezing.'",
        keyTerms: [
          {
            term: "Independent Clause",
            definition: "A clause containing a subject and a verb that expresses a complete thought and can stand alone as a sentence.",
          },
          {
            term: "Dependent Clause",
            definition: "A clause that starts with a subordinating conjunction and cannot stand alone as a complete sentence.",
          },
          {
            term: "Subordinating Conjunction",
            definition: "A connective word that introduces a dependent clause and links it to an independent clause.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5la05-example",
        heading: "Worked Example: Combining Simple Clauses into a Complex Sentence",
        problem:
          "Combine these two simple sentences into one complex sentence using the subordinating conjunction 'although', testing both clause orders: 'The wind was howling fiercely.' 'The rescue helicopter landed safely.'",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the subordinate relationship (Concession)",
            working: "'The wind was howling fiercely' is the obstacle/concession. Attach 'although' to create the dependent clause: 'Although the wind was howling fiercely'.",
            why: "Subordinating conjunctions attach to the contextual clause, leaving the main outcome in the independent clause.",
          },
          {
            stepNumber: 2,
            label: "Write with dependent clause at the front (Requires Comma)",
            working: "'Although the wind was howling fiercely, the rescue helicopter landed safely.'",
            why: "When a subordinate clause opens a sentence, a comma is mandatory before the main clause.",
          },
          {
            stepNumber: 3,
            label: "Write with independent clause at the front (No Comma)",
            working: "'The rescue helicopter landed safely although the wind was howling fiercely.'",
            why: "When the main clause leads, the subordinating conjunction acts as the natural boundary without a comma.",
          },
        ],
        finalAnswer:
          "Option 1: Although the wind was howling fiercely, the rescue helicopter landed safely. Option 2: The rescue helicopter landed safely although the wind was howling fiercely.",
        commonError: {
          mistake: "Writing a dependent clause alone as a sentence (Sentence Fragment: 'Because the rain started suddenly.').",
          whyItHappens: "Treating any capitalized line ending with a full stop as a complete sentence.",
          howToAvoid: "Check if the clause leaves you waiting for the main thought; if so, attach it to an independent clause.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5la05-misconception",
        heading: "Misconception: 'And' and 'Because' Do the Same Job",
        claim: "Compound and complex sentences are basically identical.",
        whyWrong:
          "Coordinating conjunctions (like 'and', 'but') connect two equal, independent ideas. Subordinating conjunctions (like 'because', 'although') establish an unequal, hierarchical relationship where one clause explains the condition, cause, or timing of the other.",
        correction:
          "Use compound sentences for equal balance; use complex sentences to show nuanced cause, condition, or contrast.",
        example: "'It rained and we got wet' (equal events) vs 'Because it rained, we got wet' (direct cause and effect).",
      },
      {
        kind: "check",
        id: "vc2e5la05-check",
        heading: "Check Your Understanding",
        prompt: "Practise identifying main and subordinate clauses, selecting subordinating conjunctions, and punctuating complex sentences.",
        curriculumCode: "VC2E5LA05",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. VC2E5LA06: Expanded Noun Groups for Detailed Description & Precision
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LA06",
    title: "Expanded Noun Groups: Modifiers, Classifiers and Qualifiers",
    strand: "language",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to build and analyze expanded noun groups using pre-modifiers (determiners, describing adjectives, classifying adjectives) and post-modifiers (prepositional phrases, relative clauses) for descriptive and technical precision.",
    successCriteria: [
      "I can identify the core head noun in an expanded noun group.",
      "I can use pre-modifying adjectives (describers and classifiers) in standard order.",
      "I can expand noun groups with post-modifying qualifiers (prepositional phrases and embedded relative clauses).",
    ],
    prerequisites: ["VC2E3LA06"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5la06-concept",
        heading: "The Anatomy of an Expanded Noun Group",
        explanation:
          "An expanded noun group packs rich, precise information into a single noun structure without needing multiple separate sentences.\n\nStructure of an Expanded Noun Group:\n1. Pointer / Determiner: The, a, those, several, three, my.\n2. Describing Adjectives (Pre-modifiers): Size, age, shape, colour, texture (e.g. 'massive, ancient, moss-covered').\n3. Classifying Adjective: Tells what TYPE or sub-category of thing it is (e.g. 'timber', 'solar', 'electric', 'granite').\n4. HEAD NOUN: The core person, place, or thing at the heart of the group.\n5. Qualifier / Post-modifier: Extra details attached after the head noun:\n   • Prepositional Phrase: '...with rusted iron hinges', '...beside the frozen lake'.\n   • Embedded Relative Clause: '...which had stood undisturbed for centuries'.\n\nComplete Example:\n[Those] [massive, ancient] [timber] [doors] [with rusted iron hinges that led to the secret library].",
        keyTerms: [
          {
            term: "Head Noun",
            definition: "The central noun in a noun group that all modifiers describe or qualify.",
          },
          {
            term: "Classifier",
            definition: "An adjective that identifies the specific type, class, or material of a noun (e.g. 'electric' car, 'wooden' spoon).",
          },
          {
            term: "Qualifier",
            definition: "A phrase or clause positioned after the head noun that provides additional defining information.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5la06-example",
        heading: "Worked Example: Expanding a Plain Noun into a Descriptive Noun Group",
        problem:
          "Expand the simple noun 'telescope' into a rich, technical noun group by adding a determiner, two describing adjectives, a classifier, and a qualifying prepositional phrase.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the Head Noun",
            working: "Head noun = 'telescope'.",
            why: "The head noun is the core subject being elaborated.",
          },
          {
            stepNumber: 2,
            label: "Select Determiner and Pre-modifiers (Describers + Classifier)",
            working:
              "• Determiner: 'The'\n• Describing adjectives: 'powerful, precision-crafted'\n• Classifier (Type of instrument): 'optical'.",
            why: "Arranging adjectives from general quality to specific classification creates standard English order.",
          },
          {
            stepNumber: 3,
            label: "Add a Post-modifying Qualifier (Prepositional Phrase)",
            working: "Qualifier: 'on the summit of the mountain observatory'.",
            why: "Post-modifiers provide spatial or defining context directly attached to the noun.",
          },
          {
            stepNumber: 4,
            label: "Assemble the complete expanded noun group",
            working: "'The powerful, precision-crafted optical telescope on the summit of the mountain observatory'.",
            why: "Combining all elements forms a single cohesive, high-information noun phrase.",
          },
        ],
        finalAnswer: "The powerful, precision-crafted optical telescope on the summit of the mountain observatory.",
        commonError: {
          mistake: "Placing a classifier before a describing adjective (e.g. 'The optical powerful telescope').",
          whyItHappens: "Ignoring the natural adjective order hierarchy in English.",
          howToAvoid: "Classifiers (identifying the type or material) always sit immediately next to the head noun.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5la06-misconception",
        heading: "Misconception: Piling Up Random Adjectives Always Improves Description",
        claim: "Using five adjectives for every noun makes writing more descriptive.",
        whyWrong:
          "Adjective overload ('The big, huge, massive, gigantic, enormous rock') creates wordy, repetitive clutter. Strong writing selects one or two precise adjectives combined with a descriptive post-modifying phrase.",
        correction:
          "Choose precise adjectives and use prepositional qualifiers rather than stacking synonymous adjectives.",
        example: "'The jagged granite boulder lodged in the riverbank' is far superior to 'The big hard grey rock'.",
      },
      {
        kind: "check",
        id: "vc2e5la06-check",
        heading: "Check Your Understanding",
        prompt: "Practise analyzing and constructing expanded noun groups with determiners, classifiers, and qualifiers.",
        curriculumCode: "VC2E5LA06",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. VC2E5LA07: Multimodal Cohesion: Sequence, Visual Design & Sound
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LA07",
    title: "Multimodal Literacy: Visual Layout, Navigation and Cohesion",
    strand: "language",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to analyze how written text, visual imagery, layout, typography, and sound combine to create cohesive meaning in multimodal digital and print media.",
    successCriteria: [
      "I can explain how visual elements (colour, salience, framing, vectors, typography) guide the reader's reading path.",
      "I can evaluate how captions, call-outs, infographics, and subheadings connect directly with written explanations.",
      "I can identify how digital multimodal features (hyperlinks, audio cues, interactive icons) support navigation and comprehension.",
    ],
    prerequisites: ["VC2E3LA07"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5la07-concept",
        heading: "How Multimodal Texts Create Meaning",
        explanation:
          "A multimodal text combines two or more communication modes:\n• Linguistic (Written/Spoken Language): Words, syntax, vocabulary.\n• Visual: Images, colour palette, symbols, vectors (leading lines), framing, and visual hierarchy.\n• Spatial: Layout, whitespace, alignment, positioning of text boxes and diagrams.\n• Audio / Digital: Sound effects, narration, interactive buttons, hyperlinks.\n\nKey Visual Design Concepts:\n• Salience: The element on a page that draws the viewer's attention first (due to brightness, size, contrast, or central placement).\n• Reading Path: The visual route the reader's eye takes across a page (often guided by gaze vectors, arrows, and headings from top-left to bottom-right).\n• Complementarity: When images and text work together to tell the complete story, rather than just repeating the same information.",
        keyTerms: [
          {
            term: "Multimodal Text",
            definition: "A text combining two or more semiotic modes (e.g. written words, illustrations, diagrams, sound, layout).",
          },
          {
            term: "Salience",
            definition: "The visual prominence of an element on a page that makes it catch the reader's eye first.",
          },
          {
            term: "Vector",
            definition: "A line or visual cue (such as an arrow, path, or eyeline gaze) that directs the viewer's attention to a specific feature.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5la07-example",
        heading: "Worked Example: Analyzing an Infographic Layout",
        problem:
          "An educational website features an interactive infographic about the Great Barrier Reef. At the centre is a vibrant colour photograph of a coral reef with arrows pointing to call-out text boxes around the edges. An audio button plays underwater dolphin sounds. How do these multimodal elements work together to achieve the page's educational purpose?",
        steps: [
          {
            stepNumber: 1,
            label: "Analyze the visual salience and central image",
            working: "The large, high-contrast central coral photograph has highest salience, immediately capturing interest and establishing the subject topic.",
            why: "Salient visual elements anchor the theme before detailed reading begins.",
          },
          {
            stepNumber: 2,
            label: "Trace the reading path created by vectors and call-outs",
            working: "The arrows (vectors) lead the viewer's gaze from specific coral features directly to the surrounding text explanations, creating a clear, structured reading path.",
            why: "Vectors connect visual evidence directly to linguistic definitions.",
          },
          {
            stepNumber: 3,
            label: "Evaluate the role of audio and spatial layout",
            working: "The ambient underwater audio immerses the learner, while the distributed call-out layout prevents text crowding and allows self-paced exploration.",
            why: "Multiple sensory modes reinforce engagement and comprehension without overloading working memory.",
          },
        ],
        finalAnswer:
          "The salient central coral photograph captures immediate interest, while vector arrows guide the reader systematically to explanatory call-out text. Combined with immersive audio, the layout creates a cohesive, interactive learning journey that balances visual evidence with scientific explanation.",
        commonError: {
          mistake: "Treating illustrations and graphics as mere 'decorations' rather than integral sources of information.",
          whyItHappens: "Focusing solely on written sentences and ignoring how graphics convey data.",
          howToAvoid: "Read charts, diagrams, and visual cues as essential components of the overall message.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5la07-misconception",
        heading: "Misconception: More Images and Animations Always Make a Page Better",
        claim: "Adding flashy animations, auto-playing videos, and lots of bright fonts always improves digital texts.",
        whyWrong:
          "Excessive visual clutter, flashing animations, and conflicting audio cause cognitive overload. Good multimodal design is purposeful: every element must support navigation, clarity, and the core message.",
        correction:
          "Effective design balances clean whitespace, legible typography, and purposeful imagery.",
        example: "A clean diagram with labelled arrows communicates scientific processes far better than busy animated clips.",
      },
      {
        kind: "check",
        id: "vc2e5la07-check",
        heading: "Check Your Understanding",
        prompt: "Practise analyzing visual salience, reading paths, and the interaction of text, image, and sound in multimodal media.",
        curriculumCode: "VC2E5LA07",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. VC2E5LA08: Specialised Terminology & Technical Vocabulary Precision
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LA08",
    title: "Specialised and Technical Vocabulary: Precision Across Disciplines",
    strand: "language",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify, understand, and use specialized subject-specific terminology and nominalisations in academic and scientific texts.",
    successCriteria: [
      "I can distinguish between everyday general vocabulary and discipline-specific technical terminology.",
      "I can use context clues, glossaries, and morphological roots to define unfamiliar technical words.",
      "I can use nominalisation (turning verbs and adjectives into nouns, e.g. pollute -> pollution; erode -> erosion) to make writing more concise and authoritative.",
    ],
    prerequisites: ["VC2E3LA08"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5la08-concept",
        heading: "The Power of Technical Precision and Nominalisation",
        explanation:
          "As texts become more specialized in Grade 5 science, humanities, and mathematics, language shifts from everyday descriptions to technical precision:\n• Everyday: 'Plants use sunlight to make food.'\n• Technical: 'Autotrophic organisms synthesize glucose through the biochemical process of photosynthesis.'\n\nNominalisation — Turning Actions into Concept Nouns:\nIn academic writing, verbs (actions) and adjectives (qualities) are frequently converted into abstract nouns (nominalisations):\n• Verb: 'The river eroded the valley walls.' -> Noun: 'Riverine erosion shaped the canyon.'\n• Verb: 'Chemicals polluted the groundwater.' -> Noun: 'Chemical pollution contaminated the aquifer.'\n• Adjective: 'The desert is arid.' -> Noun: 'The aridity of the climate limits vegetation.'\n\nNominalisation allows writers to condense complex actions into compact concept nouns that can be analyzed and discussed with authority.",
        keyTerms: [
          {
            term: "Technical Terminology",
            definition: "Words and phrases with precise, specialized meanings within a particular academic subject or professional field.",
          },
          {
            term: "Nominalisation",
            definition: "The grammatical process of forming a noun from a verb or adjective (e.g. condense -> condensation; transparent -> transparency).",
          },
          {
            term: "Domain-Specific Vocabulary",
            definition: "Words that belong specifically to a particular field of study (e.g. 'hypothesis' in science, 'denominator' in maths).",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5la08-example",
        heading: "Worked Example: Applying Nominalisation to Academic Writing",
        problem:
          "Transform this informal explanation into an authoritative scientific report sentence using nominalisation and technical terms: 'When water boils, it changes from a liquid into a gas because the temperature rises.'",
        steps: [
          {
            stepNumber: 1,
            label: "Identify verbs and actions suitable for nominalisation",
            working:
              "• Action 'water boils' -> Noun: 'boiling' / 'vaporization'\n• Action 'changes from a liquid into a gas' -> Noun: 'phase transition' / 'state change'\n• Action 'temperature rises' -> Noun: 'thermal elevation' / 'temperature increase'.",
            why: "Converting verbs to abstract nouns creates compact concept anchors.",
          },
          {
            stepNumber: 2,
            label: "Reconstruct the sentence with cause-and-effect structure",
            working: "'The increase in temperature causes a phase transition from liquid to gas through the process of vaporization.'",
            why: "Nominalised nouns can act as subjects and objects in formal scientific sentences.",
          },
        ],
        finalAnswer: "A rapid increase in temperature triggers a phase transition from liquid to gas via the process of vaporization.",
        commonError: {
          mistake: "Over-nominalising to the point where writing becomes unreadable and robotic.",
          whyItHappens: "Turning every single word into an abstract noun.",
          howToAvoid: "Use nominalisation strategically for key concepts while keeping sentence verbs active and clear.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5la08-misconception",
        heading: "Misconception: Technical Terms Are Just Hard Words for Common Things",
        claim: "Technical terms are just fancy synonyms used to sound smart.",
        whyWrong:
          "Specialized terms carry exact, unambiguous scientific definitions that everyday words lack. For example, 'mass' and 'weight' mean two completely different things in physics (mass is quantity of matter; weight is gravitational force), even though people use them interchangeably in daily conversation.",
        correction:
          "Use technical terms because they provide exact, standardized meaning across scientific disciplines.",
        example: "A scientist distinguishes between 'weather' (daily atmospheric conditions) and 'climate' (long-term historical patterns).",
      },
      {
        kind: "check",
        id: "vc2e5la08-check",
        heading: "Check Your Understanding",
        prompt: "Practise identifying specialized terminology, decoding technical definitions, and applying nominalisation.",
        curriculumCode: "VC2E5LA08",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 9. VC2E5LA09: Punctuation Conventions: Commas in Phrases & Plural Possession
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LA09",
    title: "Advanced Punctuation: Commas in Phrases and Plural Apostrophes",
    strand: "language",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to apply complex punctuation rules including commas in prepositional/introductory phrases, commas in parenthetical insertions, and apostrophes of plural possession.",
    successCriteria: [
      "I can place commas after introductory adverbial and prepositional phrases.",
      "I can use bracketing commas around non-essential parenthetical information (appositives).",
      "I can distinguish between singular possessive ('s), regular plural possessive (s'), and irregular plural possessive (e.g. children's, women's).",
    ],
    prerequisites: ["VC2E3LA09"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5la09-concept",
        heading: "Mastering Commas and Possessive Apostrophes",
        explanation:
          "Punctuation clarifies sentence meaning and directs the reader's cadence:\n\n1. Commas in Prepositional and Introductory Phrases:\n   When a prepositional phrase or dependent clause opens a sentence, separate it from the main clause with a comma:\n   • 'Beneath the heavy canopy of eucalyptus trees, the koala slept peacefully.'\n   • 'In addition to her daily training regimen, Maria studied sports nutrition.'\n\n2. Bracketing Commas (Parenthetical Information / Appositives):\n   Use a pair of commas to enclose extra information that could be removed without breaking the sentence:\n   • 'Dr Patel, our leading marine biologist, presented the new findings.'\n\n3. Plural Possessive Apostrophes:\n   • Singular noun: add 's (e.g. 'the student's locker' = 1 student).\n   • Regular plural noun ending in s: add apostrophe AFTER the s (e.g. 'the students' lockers' = multiple students).\n   • Irregular plural noun not ending in s: add 's (e.g. 'the children's books', 'the women's team').",
        keyTerms: [
          {
            term: "Plural Possession",
            definition: "An apostrophe used to show that something belongs to more than one person, animal, or group.",
          },
          {
            term: "Parenthetical Comma",
            definition: "A comma used in pairs to set off non-essential extra information inserted into a sentence.",
          },
          {
            term: "Prepositional Phrase",
            definition: "A modifying phrase starting with a preposition (e.g. under the table, across the bay).",
          },
        ],
        visualAsset: {
          id: "vc2e5la09-apostrophe-table",
          type: "table",
          altText: "Table showing rules and examples for singular, regular plural, and irregular plural possessive apostrophes.",
          title: "Possessive Apostrophe Rules Summary",
          data: {
            headers: ["Noun Category", "Base Noun", "Possessive Rule", "Correct Example"],
            rows: [
              ["Singular Noun", "dog", "Add 's", "the dog's collar (1 dog)"],
              ["Regular Plural (ends in s)", "dogs", "Add ' after s", "the dogs' bowls (multiple dogs)"],
              ["Singular Noun", "teacher", "Add 's", "the teacher's desk (1 teacher)"],
              ["Regular Plural (ends in s)", "teachers", "Add ' after s", "the teachers' staffroom (all teachers)"],
              ["Irregular Plural (no s)", "children", "Add 's", "the children's playground"],
              ["Irregular Plural (no s)", "people", "Add 's", "the people's choice"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e5la09-example",
        heading: "Worked Example: Punctuating Phrases and Possessive Apostrophes",
        problem:
          "Correct all comma and apostrophe errors in this sentence: 'Without a moment of hesitation the coach inspected the players uniforms and praised the childrens enthusiasm.'",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the introductory prepositional phrase",
            working: "'Without a moment of hesitation' is an introductory phrase. Place a comma immediately after 'hesitation'.",
            why: "Separates the introductory context from the main independent clause.",
          },
          {
            stepNumber: 2,
            label: "Correct the regular plural possessive ('players uniforms')",
            working: "The uniforms belong to multiple players (plural noun 'players' ending in s). Add the apostrophe after the s: 'players' uniforms'.",
            why: "Plural nouns ending in s receive an apostrophe after the s to show shared possession.",
          },
          {
            stepNumber: 3,
            label: "Correct the irregular plural possessive ('childrens enthusiasm')",
            working: "'Children' is already plural without an s. Add 's: 'children's enthusiasm'.",
            why: "Irregular plurals follow the 's pattern (children's, men's, women's).",
          },
        ],
        finalAnswer: "Without a moment of hesitation, the coach inspected the players' uniforms and praised the children's enthusiasm.",
        commonError: {
          mistake: "Putting an apostrophe in plain plurals that do not own anything (e.g. 'I bought three apple's').",
          whyItHappens: "Thinking any word ending in s needs an apostrophe (the 'greengrocer's apostrophe').",
          howToAvoid: "Ask yourself: Does this word OWN something? If it is just more than one item, NO apostrophe is used.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5la09-misconception",
        heading: "Misconception: 'Its' vs 'It's'",
        claim: "The possessive form of 'it' should have an apostrophe ('the cat licked it's paw').",
        whyWrong:
          "'It's' is exclusively a contraction meaning 'it is' or 'it has'. The possessive pronoun 'its' (like his, hers, ours, theirs) NEVER takes an apostrophe.",
        correction:
          "Test by expanding to 'it is': if 'it is' makes sense, write it's; if showing possession, write its.",
        example: "The solar panel reached its maximum capacity because it's (it is) a sunny day.",
      },
      {
        kind: "check",
        id: "vc2e5la09-check",
        heading: "Check Your Understanding",
        prompt: "Practise applying commas to introductory phrases and punctuating singular and plural possessive apostrophes.",
        curriculumCode: "VC2E5LA09",
        practiceCount: 5,
      },
    ],
  },
]);
