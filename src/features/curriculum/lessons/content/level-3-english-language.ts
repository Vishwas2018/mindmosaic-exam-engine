import type { Lesson } from "../schema";

export const LEVEL_3_ENGLISH_LANGUAGE_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2E3LA01: Collaborative Discussions (Classroom / Non-Digital)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LA01",
    title: "Collaborative Discussions: Turn-Taking, Active Listening and Building Ideas",
    strand: "language",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning the social language conventions of collaborative conversations, including respectful turn-taking, active listening, and building on others' contributions.",
    successCriteria: [
      "I can use respectful conversational cues to take turns without interrupting.",
      "I can demonstrate active listening by maintaining eye contact, nodding, and paraphrasing what a partner shared.",
      "I can use linking sentence starters (e.g. 'I agree with Maya because...', 'Building on what Leo said...') to expand group discussions.",
    ],
    prerequisites: [],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text and concept structure authored specifically for Victorian Curriculum Level 3 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3la01-concept-1",
        heading: "The Rules of Productive Collaborative Talk",
        explanation:
          "Collaborative discussion is how learners share thinking, solve complex problems, and deepen their understanding together. In Level 3, effective talk relies on three core language conventions:\n\n1. **Respectful Turn-Taking:** Conversations are like passing a ball back and forth. Good group members wait for natural pauses before speaking rather than talking over someone.\n2. **Active Listening:** Showing the speaker you are engaged by facing them, nodding, and summarizing their point before offering your own view.\n3. **Building and Linking Ideas:** Rather than just saying 'I disagree' or changing the subject, effective collaborators connect to prior statements:\n• *Agreeing & Extending:* 'I agree with Sam, and we could also add that...'\n• *Clarifying:* 'Could you explain what you meant when you said...?'\n• *Respectful Disagreement:* 'I see your point, but another way to look at it is...'\n\n*Note on Practice:* This descriptor develops oral and social interaction. It is practised through partner talk, literature circles, and group problem-solving in the classroom.",
        keyTerms: [
          {
            term: "Active Listening",
            definition: "Focusing completely on a speaker, understanding their message, and responding thoughtfully.",
          },
          {
            term: "Sentence Starter",
            definition: "A phrase that helps a speaker begin their response and link it to prior discussion (e.g. 'In addition to...').",
          },
          {
            term: "Paraphrasing",
            definition: "Restating someone else's idea in your own words to confirm understanding.",
          },
        ],
        visualAsset: {
          id: "vc2e3la01-talk-moves-table",
          type: "table",
          altText:
            "Table displaying effective sentence stems for classroom collaborative discussions.",
          title: "Classroom Discussion Sentence Starters & Talk Moves",
          data: {
            headers: ["Discussion Goal", "Helpful Sentence Starter", "Why It Helps the Group"],
            rows: [
              ["Adding an idea", "'Building on what [Name] said, I noticed that...'", "Keeps the conversation connected to the shared topic."],
              ["Asking for evidence", "'What in the story made you think that...?'", "Encourages teammates to back up opinions with facts."],
              ["Respectful difference", "'I agree that [...], but on the other hand...'", "Aacknowledges partner's view before sharing a different angle."],
              ["Checking understanding", "'So are you saying that [...]? Did I get that right?'", "Prevents misunderstandings before moving forward."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "misconception",
        id: "vc2e3la01-misconception",
        heading: "Common Trap: Thinking a Discussion is a Debate to Win",
        claim: "A good group discussion means convincing everyone that your idea is the only right one.",
        whyWrong:
          "Collaborative discussion is not a competition. The goal is to explore multiple perspectives and combine ideas to build a stronger shared understanding.",
        correction:
          "A successful discussion is one where every participant shares, listens, and learns something new from the group.",
        example: "Saying 'Let's combine Leo's idea about setting with Maya's idea about character motive!' produces a richer outcome than arguing.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2E3LA02: Evaluative Language and Tone
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LA02",
    title: "Evaluative Language: Expressing Feelings, Opinions and Nuanced Judgments",
    strand: "language",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify and use evaluative language (adjectives, adverbs, and emotive verbs) to express opinions, feelings, and degrees of judgment in texts.",
    successCriteria: [
      "I can distinguish between factual descriptions (e.g. 'the wooden chair') and evaluative judgments (e.g. 'the rickety, uncomfortable chair').",
      "I can identify positive, neutral, and negative evaluative words.",
      "I can select nuanced evaluative vocabulary to adjust the tone of a review or persuasive text.",
    ],
    prerequisites: [],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3la02-concept",
        heading: "What is Evaluative Language?",
        explanation:
          "Authors do not just report facts — they use language to shape how readers feel about characters, events, and topics. **Evaluative language** consists of words and phrases that express a judgment, emotional reaction, or opinion:\n\n• **Factual Description:** 'The dog barked at the visitor.' (Neutral reporting of an event).\n• **Positive Evaluative Language:** 'The loyal pup gave a joyful, welcoming bark.' (Shapes the dog as friendly and delightful).\n• **Negative Evaluative Language:** 'The aggressive beast let out a menacing growl.' (Shapes the dog as frightening and dangerous).\n\nEvaluative words can be:\n• *Adjectives:* magnificent, disastrous, clumsy, heroic\n• *Adverbs:* skillfully, carelessly, bravely, rudely\n• *Verbs:* shrieked, sneered, rescued, cherished",
        keyTerms: [
          {
            term: "Evaluative Language",
            definition: "Words that convey an opinion, emotional judgment, or point of view about something.",
          },
          {
            term: "Tone",
            definition: "The overall mood, attitude, or feeling conveyed by an author's choice of words.",
          },
          {
            term: "Objective vs Subjective",
            definition: "Objective statements are factual and measurable; subjective statements reflect personal feelings or value judgments.",
          },
        ],
        visualAsset: {
          id: "vc2e3la02-evaluative-spectrum-table",
          type: "table",
          altText:
            "Table comparing negative, neutral, and positive evaluative words describing the same subjects.",
          title: "Evaluative Word Spectrum: Shifting Tone",
          data: {
            headers: ["Subject", "Negative Evaluative Tone", "Neutral / Factual", "Positive Evaluative Tone"],
            rows: [
              ["Book plot", "Boring, predictable, sluggish", "A 150-page mystery story", "Thrilling, gripping, unputdownable"],
              ["Weather", "Gloomy, freezing, miserable", "12°C with light rain", "Crisp, refreshing, invigorating"],
              ["Food", "Soggy, bland, unappetizing", "Boiled vegetables and rice", "Delicious, flavorful, mouth-watering"],
              ["Effort", "Careless, hasty, sloppy", "Completed in 20 minutes", "Meticulous, thorough, dedicated"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3la02-example",
        heading: "Worked Example: Identifying Evaluative Words in a Text",
        problem:
          "Read this short book review excerpt: 'The brave heroine embarked on a perilous journey across the barren wasteland, outsmarting a deceitful villain.' Identify the evaluative words and explain whether each conveys a positive or negative judgment.",
        steps: [
          {
            stepNumber: 1,
            label: "Scan for descriptive adjectives and character judgments",
            working:
              "Identify the descriptive words modifying the nouns: 'brave', 'perilous', 'barren', 'deceitful', and the action verb 'outsmarting'.",
            why: "Evaluative language is typically found in descriptive adjectives and strong process verbs.",
          },
          {
            stepNumber: 2,
            label: "Analyze the words describing the heroine",
            working:
              "'Brave' and 'outsmarting' praise the heroine's courage and intelligence. Tone: Strongly positive.",
            why: "These words judge character behavior as admirable and heroic.",
          },
          {
            stepNumber: 3,
            label: "Analyze the words describing the setting and villain",
            working:
              "'Perilous' (dangerous), 'barren' (bleak/empty), and 'deceitful' (dishonest). Tone: Negative / Warning.",
            why: "These words create tension, danger, and moral disapproval of the villain.",
          },
          {
            stepNumber: 4,
            label: "Synthesize how the evaluative words guide the reader",
            working:
              "The author deliberately steers the reader to admire the protagonist and fear/distrust the villain, making the story exciting.",
            why: "Evaluative language directly constructs reader sympathy and suspense.",
          },
        ],
        finalAnswer:
          "Evaluative words: Positive = 'brave', 'outsmarting' (heroic character traits); Negative = 'perilous', 'barren', 'deceitful' (hazardous setting and dishonest villain).",
        commonError: {
          mistake: "Thinking only 'good' or 'bad' are evaluative words.",
          whyItHappens:
            "Overlooking nuanced adjectives like 'perilous' or 'meticulous'.",
          howToAvoid:
            "Ask: 'Is this word pure measurement (factual), or does it express a feeling or judgment?'",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3la02-misconception",
        heading: "Common Trap: Believing All Descriptions are Neutral",
        claim: "Saying 'The room was cluttered' is just a factual statement.",
        whyWrong:
          "'Cluttered' carries a negative evaluation (implying messy and disorganized). A neutral statement would be 'The room contained many books and toys.' A positive evaluation would be 'The room was cozy and lived-in.'",
        correction:
          "Word choices are rarely 100% neutral; adjectives carry connotations that shape reader perception.",
        example: "'Stubborn' (negative) vs 'Determined' (positive) describe the exact same behavior with opposite emotional evaluations.",
      },
      {
        kind: "check",
        id: "vc2e3la02-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying evaluative words, comparing positive vs negative tones, and selecting emotive vocabulary.",
        curriculumCode: "VC2E3LA02",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2E3LA03: Structural Features Across Diverse Text Types
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LA03",
    title: "Text Structures: Narrative, Informative and Persuasive Organisation",
    strand: "language",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify the characteristic structural features and stages of narratives, information reports, procedures, and persuasive texts.",
    successCriteria: [
      "I can identify the stages of a narrative: Orientation (setting, characters), Complication (problem), and Resolution (solution).",
      "I can identify the stages of an information report: General Classification, Description in sub-topics, and Concluding Statement.",
      "I can explain why different text types use distinct structures to achieve their purpose.",
    ],
    prerequisites: [],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3la03-concept",
        heading: "How Different Texts are Structured for Their Purpose",
        explanation:
          "Every text has a purpose, and authors choose an established structure (a sequence of stages) to make that purpose clear to readers:\n\n1. **Narrative (Purpose: To entertain and tell a story):**\n• *Orientation:* Introduces characters, setting (when and where), and mood.\n• *Complication / Rising Action:* A problem or challenge arises that the character must face.\n• *Climax & Resolution:* The most exciting moment where the problem is resolved.\n\n2. **Information Report (Purpose: To classify and explain facts about a topic):**\n• *General Classification:* Defines what the subject is (e.g. 'The Platypus is a semi-aquatic mammal...').\n• *Factual Descriptions:* Paragraphs organized under subheadings (Appearance, Habitat, Diet, Life Cycle).\n• *Concluding Summary:* A concluding fact or conservation status.\n\n3. **Persuasive Text (Purpose: To convince the reader of an opinion):**\n• *Statement of Position:* Clearly states the argument.\n• *Reason Paragraphs:* 2 to 3 arguments backed by facts and examples.\n• *Call to Action / Restatement:* Re-emphasizes the main opinion.",
        keyTerms: [
          {
            term: "Text Structure",
            definition: "The framework or organizational pattern used to build a text (such as problem-solution or classification-description).",
          },
          {
            term: "Orientation",
            definition: "The opening section of a narrative that introduces the characters, setting, and background context.",
          },
          {
            term: "Classification",
            definition: "The opening statement of an information report that identifies the broad group or category the subject belongs to.",
          },
        ],
        visualAsset: {
          id: "vc2e3la03-text-structures-table",
          type: "table",
          altText:
            "Table comparing narrative, informative report, procedure, and persuasive text structures and their defining features.",
          title: "Major Text Types & Their Structural Stages",
          data: {
            headers: ["Text Type", "Primary Purpose", "Structural Stages in Order", "Typical Language Features"],
            rows: [
              ["Narrative", "To entertain / tell story", "Orientation → Complication → Climax → Resolution", "Past tense, descriptive adjectives, dialogue, time connectives"],
              ["Information Report", "To inform / classify facts", "General Classification → Sub-topic Descriptions → Conclusion", "Present tense, technical vocabulary, subheadings, diagrams"],
              ["Procedure", "To instruct how to do something", "Goal / Title → Materials / Ingredients → Numbered Steps", "Imperative (command) verbs, time sequence words, bullet points"],
              ["Persuasive Text", "To convince of an opinion", "Position Statement → Series of Arguments → Call to Action", "Modal verbs (must, should), rhetorical questions, evaluative words"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3la03-example",
        heading: "Worked Example: Identifying the Structural Stage of a Paragraph",
        problem:
          "Read this paragraph: 'Koalas are native Australian arboreal marsupials found in coastal eucalyptus forests across eastern and southeastern Australia.' Which text type and structural stage is this paragraph, and what clues prove it?",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the purpose of the paragraph",
            working:
              "The paragraph provides factual, scientific information defining what a koala is and where it lives. It is NOT telling a fictional story or giving an opinion.",
            why: "Determining whether the text is fictional, instructional, persuasive, or factual identifies the text type.",
          },
          {
            stepNumber: 2,
            label: "Identify the text type",
            working:
              "The text type is an **Information Report**.",
            why: "Information reports explain facts about animals, places, or phenomena.",
          },
          {
            stepNumber: 3,
            label: "Analyze the specific structural stage",
            working:
              "It defines the animal by scientific category ('arboreal marsupials') and broad location. This is the **General Classification** stage (the opening paragraph).",
            why: "The first stage of an information report always classifies the subject before detailing appearance or diet.",
          },
          {
            stepNumber: 4,
            label: "List key evidence clues",
            working:
              "Clues: Timeless present tense ('are native', 'are found'), domain-specific vocabulary ('arboreal', 'marsupials'), and objective definition.",
            why: "These language features are diagnostic markers of an information report classification.",
          },
        ],
        finalAnswer:
          "Text Type: Information Report. Structural Stage: General Classification. Evidence: It formally defines the animal into its scientific category (arboreal marsupial) and geographic range in present tense.",
        commonError: {
          mistake: "Calling it a 'narrative orientation' because it is at the beginning.",
          whyItHappens:
            "Confusing the opening of a story (orientation) with the opening of a factual report (classification).",
          howToAvoid:
            "Check for fictional characters and plot: if there are no characters or story events, it is an information report classification, not a story orientation.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3la03-misconception",
        heading: "Common Trap: Mixing Recipes and Stories",
        claim: "You can write a recipe or science experiment as a story with a complication.",
        whyWrong:
          "Procedural texts must be clear, concise, and sequenced so the reader can follow the steps without distraction.",
        correction:
          "A recipe uses a strict list of ingredients and numbered command steps (e.g. '1. Mix the flour...'), not a narrative plot.",
        example: "A recipe that begins 'Once upon a time there was a bowl of sugar' makes cooking confusing and inefficient!",
      },
      {
        kind: "check",
        id: "vc2e3la03-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying text structures, matching paragraphs to their structural stages, and analyzing text purposes.",
        curriculumCode: "VC2E3LA03",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. VC2E3LA04: Paragraphing and Textual Cohesion
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LA04",
    title: "Paragraph Construction: Topic Sentences, Supporting Details and Connectives",
    strand: "language",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to structure paragraphs around a single main idea using a clear topic sentence, supporting elaboration, and cohesive transition words.",
    successCriteria: [
      "I can explain that a paragraph is a group of sentences focusing on one central idea.",
      "I can write a strong topic sentence that introduces the main point of the paragraph.",
      "I can use cohesive connectives (e.g. 'furthermore', 'for example', 'as a result') to link sentences smoothly.",
    ],
    prerequisites: ["VC2E3LA03"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3la04-concept",
        heading: "The Anatomy of a Well-Built Paragraph",
        explanation:
          "A paragraph is a building block of written text. It groups related sentences around **one key idea** so the reader can follow the author's train of thought easily.\n\n**The P.E.E.L. / T.E.E. Structure:**\n1. **Topic Sentence (Point):** The first sentence that clearly states the paragraph's main idea (e.g. 'Honeybees play an essential role in pollinating our food crops.').\n2. **Supporting Explanation & Evidence (Elaborate / Example):** 2 to 3 sentences providing specific details, facts, or descriptions that prove the topic sentence (e.g. 'As bees travel between blossoms collecting nectar, pollen grains stick to their furry bodies. When they visit the next flower, they fertilize it, allowing fruits and vegetables to grow.').\n3. **Linking / Concluding Sentence (Link):** Wraps up the point or transitions to the next paragraph (e.g. 'Without bee pollination, many of our favorite foods would disappear.').\n\n**When to Start a New Paragraph (TiP ToP Rule):**\nStart a new paragraph whenever there is a change in **Ti**me, **P**lace, **To**pic, or **P**erson (speaker in dialogue).",
        keyTerms: [
          {
            term: "Topic Sentence",
            definition: "The introductory sentence that announces the main idea of a paragraph.",
          },
          {
            term: "Cohesion",
            definition: "The smooth grammatical and semantic flow that connects sentences together logically.",
          },
          {
            term: "Transition Word / Connective",
            definition: "A linking word that signals relationships between ideas (e.g. 'consequently', 'similarly', 'in addition').",
          },
        ],
        visualAsset: {
          id: "vc2e3la04-transition-connectives-table",
          type: "table",
          altText:
            "Table categorizing cohesive connectives by their linking function: adding ideas, showing cause, contrasting, and sequencing.",
          title: "Cohesive Connectives & Transition Words Guide",
          data: {
            headers: ["Function", "Linking Words / Connectives", "Example in a Sentence"],
            rows: [
              ["Adding information", "Furthermore, in addition, also, moreover", "Solar panels reduce power bills. *In addition*, they produce clean green energy."],
              ["Showing cause & effect", "As a result, consequently, therefore, because", "Heavy rain flooded the pitch. *Consequently*, the match was postponed."],
              ["Contrasting / Opposing", "However, on the other hand, although, yet", "Desert days are scorching hot. *However*, nights can drop below freezing."],
              ["Sequencing time", "Initially, subsequently, meanwhile, finally", "The caterpillars feed on leaves. *Subsequently*, they spin protective cocoons."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3la04-example",
        heading: "Worked Example: Identifying Where to Break a Text into Paragraphs",
        problem:
          "Read this continuous text block: 'Emperor penguins have thick layers of blubber and dense feathers to survive Antarctica's freezing blizzards. They also huddle together in massive groups to share body warmth. When hunting for food, penguins dive deep beneath the pack ice. Their sleek, streamlined bodies allow them to chase squid and krill at incredible speeds.' Identify where a new paragraph should begin and explain why.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the main topic of sentences 1 and 2",
            working:
              "Sentence 1 ('thick layers of blubber and feathers') and Sentence 2 ('huddle together to share warmth') are both about **cold-weather survival adaptations on land**.",
            why: "Sentences sharing the same core theme belong in the same initial paragraph.",
          },
          {
            stepNumber: 2,
            label: "Analyze the topic of sentences 3 and 4",
            working:
              "Sentence 3 introduces 'When hunting for food, penguins dive...' and Sentence 4 discusses 'streamlined bodies chasing squid and krill'. This shifts to a new topic: **hunting and diet in the water**.",
            why: "A change in topic (from keeping warm on land to hunting underwater) signals the boundary for a new paragraph.",
          },
          {
            stepNumber: 3,
            label: "Determine the paragraph split point",
            working:
              "The new paragraph should begin at Sentence 3: 'When hunting for food...'.",
            why: "Applying the TiP ToP rule (Topic change) dictates creating a clean paragraph division.",
          },
          {
            stepNumber: 4,
            label: "Formulate the two cohesive paragraphs",
            working:
              "Paragraph 1 (Staying Warm): Sentences 1-2. Paragraph 2 (Hunting & Swimming): Sentences 3-4.",
            why: "Separating these two distinct themes improves clarity and readability.",
          },
        ],
        finalAnswer:
          "Start a new paragraph at 'When hunting for food...'. Reason: The topic shifts from staying warm on land to underwater hunting and swimming techniques.",
        commonError: {
          mistake: "Starting a new paragraph after every single sentence.",
          whyItHappens:
            "Confusing a single sentence with a complete paragraph.",
          howToAvoid:
            "A standard paragraph typically has 2 to 5 sentences that work together to develop one main idea.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3la04-misconception",
        heading: "Common Trap: Thinking Paragraph Length is Just a Fixed Number of Lines",
        claim: "A paragraph must always be exactly 5 lines long on a page.",
        whyWrong:
          "Paragraphs are organized by ideas, not line counts. A paragraph ends when the idea is fully explained or when the topic, time, or speaker changes.",
        correction:
          "In dialogue, a paragraph can be a single spoken line. In non-fiction, a paragraph lasts as long as it takes to explain that specific sub-topic.",
        example: "'\"Watch out!\" cried Ben.' is a complete, one-line paragraph in narrative dialogue.",
      },
      {
        kind: "check",
        id: "vc2e3la04-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying topic sentences, organizing ideas into paragraphs, and using cohesive transition words.",
        curriculumCode: "VC2E3LA04",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. VC2E3LA05: Visual Layout and Navigational Features
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LA05",
    title: "Visual Features: Headings, Sidebars, Captions and Diagrams",
    strand: "language",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify and explain the purpose of visual layout and navigational features (headings, captions, sidebars, bullet points, and diagrams) in print and digital media.",
    successCriteria: [
      "I can explain how headings and subheadings organize information hierarchically for the reader.",
      "I can use captions and labels to interpret visual diagrams, photographs, and maps.",
      "I can navigate non-fiction texts efficiently using tables of contents, glossaries, sidebars, and digital hyperlinks.",
    ],
    prerequisites: ["VC2E3LA03"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3la05-concept",
        heading: "Navigational and Visual Layout Features in Media",
        explanation:
          "Non-fiction books, websites, and articles use visual design elements to help readers find and understand information quickly without having to read every single word from start to finish:\n\n• **Main Heading / Title:** Large bold text at the top that announces the overall subject of the article.\n• **Subheadings:** Smaller bold headings dividing the article into organized sections (e.g. 'Habitat', 'Diet').\n• **Captions:** Brief explanatory sentences printed directly beneath photos or illustrations explaining what is shown.\n• **Sidebars / Callout Boxes:** Highlighted boxes with interesting 'Did You Know?' facts or supplementary data.\n• **Bullet Points & Numbered Lists:** Break down dense text into readable, bite-sized key points.\n• **Glossary & Hyperlinks:** Glossaries define bold technical terms; online hyperlinks allow instant navigation to related topics.",
        keyTerms: [
          {
            term: "Subheading",
            definition: "A mini-title that introduces a specific sub-topic or section within a larger article.",
          },
          {
            term: "Caption",
            definition: "A brief text description accompanying an image, photo, diagram, or chart.",
          },
          {
            term: "Sidebar / Callout Box",
            definition: "A separate box of text placed alongside an article providing extra facts, tips, or summaries.",
          },
        ],
        visualAsset: {
          id: "vc2e3la05-visual-features-table",
          type: "table",
          altText:
            "Table matching visual layout features with their primary purpose for readers.",
          title: "Visual & Navigational Features in Non-Fiction Texts",
          data: {
            headers: ["Feature Name", "Visual Appearance", "Reader's Navigation Purpose"],
            rows: [
              ["Subheading", "Bold, medium-sized font above a paragraph", "Helps readers skim and jump directly to the specific information they need."],
              ["Photo Caption", "Small italicized font beneath an image", "Explains exactly what the photo shows and highlights important visual details."],
              ["Diagram Labels", "Lines or arrows pointing to parts of an object", "Names specific anatomical or mechanical components."],
              ["Sidebar Box", "Shaded or bordered container on the page margin", "Presents fascinating extra facts or case studies without interrupting main text."],
              ["Glossary", "Alphabetical list at the back of a book", "Provides quick definitions for bolded, technical subject terms."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3la05-example",
        heading: "Worked Example: Selecting Navigational Features to Answer Research Questions",
        problem:
          "Liam is reading a 6-page magazine article about Australian rainforests to answer the research question: 'What do tree kangaroos eat?' Describe the most efficient navigation strategy Liam should use rather than reading the entire 6 pages.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the target keyword and topic",
            working:
              "The research question asks about food and eating habits ('What do tree kangaroos eat?'). Keywords: Diet, Food, Feeding.",
            why: "Clarifying the target keyword helps determine which navigational signpost to hunt for.",
          },
          {
            stepNumber: 2,
            label: "Scan the subheadings across the pages",
            working:
              "Liam should skim the bold subheadings on each page, looking for titles such as 'Diet', 'Feeding Habits', or 'What They Eat'.",
            why: "Subheadings organize content by sub-topic, allowing readers to bypass unrelated sections (like 'Habitat' or 'Classification').",
          },
          {
            stepNumber: 3,
            label: "Inspect accompanying visual features and captions",
            working:
              "Look for photos of tree kangaroos foraging or a diagram labeled 'Rainforest Food Web' with captions describing leaves and fruit.",
            why: "Images and diagrams often provide fast visual answers accompanied by captions.",
          },
          {
            stepNumber: 4,
            label: "Read the targeted paragraph closely",
            working:
              "Once the 'Diet' subheading is located, read that specific 3-sentence paragraph to extract the exact food items (leaves, fruit, bark, flowers).",
            why: "Focused reading on the relevant section saves time and prevents cognitive overload.",
          },
        ],
        finalAnswer:
          "Liam should skim the bold subheadings to find the 'Diet' or 'Feeding Habits' section, and check photo captions, allowing him to locate the answer in seconds without reading all 6 pages.",
        commonError: {
          mistake: "Reading every page from word one to find a single specific fact.",
          whyItHappens:
            "Treating non-fiction reference texts like narrative storybooks.",
          howToAvoid:
            "Use headings, contents pages, index, and bold subheadings to navigate non-fiction efficiently.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3la05-misconception",
        heading: "Common Trap: Skipping Captions and Diagrams",
        claim: "Pictures and captions are just decorative and don't contain real testable information.",
        whyWrong:
          "In non-fiction, diagrams, maps, and captions often contain critical facts, statistics, and measurements that are not repeated in the body text.",
        correction:
          "Always read photo captions and study diagrams carefully — they are essential components of the text.",
        example: "A diagram of a volcano with labeled layers often explains internal magma chambers much clearer than words alone.",
      },
      {
        kind: "check",
        id: "vc2e3la05-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise using subheadings, captions, sidebars, and diagram labels to locate and interpret information in diverse text layouts.",
        curriculumCode: "VC2E3LA05",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. VC2E3LA06: Clause Structures (Simple, Compound, Complex)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LA06",
    title: "Sentence Structure: Simple, Compound and Complex Clauses",
    strand: "language",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify and construct simple, compound, and complex sentences by joining independent and dependent clauses with coordinating and subordinating conjunctions.",
    successCriteria: [
      "I can identify a clause (a group of words containing a subject and a verb).",
      "I can create compound sentences using coordinating conjunctions (FANBOYS: for, and, nor, but, or, yet, so).",
      "I can create complex sentences by joining an independent main clause with a dependent clause using subordinating conjunctions (e.g. because, although, when, while, since).",
    ],
    prerequisites: [],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3la06-concept",
        heading: "Building Simple, Compound, and Complex Sentences",
        explanation:
          "A **clause** is a building block of sentences containing a **subject** (who or what) and a **verb** (the action or state of being):\n\n1. **Simple Sentence (One Independent Clause):**\nContains one complete thought that can stand alone as a sentence.\n• Example: 'The hungry kookaburra caught a lizard.'\n\n2. **Compound Sentence (Two Independent Clauses):**\nJoins two equal, standalone sentences together using a comma and a **coordinating conjunction** (remember **FANBOYS**: For, And, Nor, But, Or, Yet, So).\n• Example: 'The wind blew fiercely, **but** the sturdy tent stayed upright.'\n\n3. **Complex Sentence (One Independent Clause + One Dependent Clause):**\nContains a main clause that makes sense alone, joined to a dependent clause that starts with a **subordinating conjunction** (e.g. *because, although, whenever, while, since, unless*). The dependent clause cannot stand alone.\n• Example: 'We packed up our picnic **because** the rain started pouring.' (Or: '**Because** the rain started pouring, we packed up our picnic.')",
        keyTerms: [
          {
            term: "Clause",
            definition: "A grammatical unit consisting of a subject and a verb.",
          },
          {
            term: "Independent Clause",
            definition: "A clause that expresses a complete thought and can stand alone as a simple sentence.",
          },
          {
            term: "Dependent (Subordinate) Clause",
            definition: "A clause that begins with a subordinating conjunction and cannot stand alone as a complete sentence.",
          },
          {
            term: "FANBOYS",
            definition: "An acronym for the seven coordinating conjunctions: For, And, Nor, But, Or, Yet, So.",
          },
        ],
        visualAsset: {
          id: "vc2e3la06-sentence-types-table",
          type: "table",
          altText:
            "Table comparing Simple, Compound, and Complex sentence structures with examples and connecting conjunctions.",
          title: "Sentence Types: Formula & Clause Analysis",
          data: {
            headers: ["Sentence Type", "Clause Formula", "Connecting Conjunctions", "Example Sentence"],
            rows: [
              ["Simple", "1 Independent Clause", "None needed", "The echidna dug rapidly into the dry soil."],
              ["Compound", "Independent + Independent", "Coordinating (and, but, so, or)", "The sun was setting, **so** the campers lit a fire."],
              ["Complex", "Independent + Dependent", "Subordinating (because, although, when)", "She wore a thick coat **because** the winter wind was freezing."],
              ["Complex (Inverted)", "Dependent + Independent", "Subordinating at the start (comma needed)", "**Although** it was raining, the children played outside."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3la06-example",
        heading: "Worked Example: Classifying and Transforming Sentence Clauses",
        problem:
          "Analyze the sentence: 'Although the trail was steep and muddy, the hikers reached the summit before sunset.' (a) Identify whether this sentence is simple, compound, or complex. (b) Name the dependent clause and the independent clause. (c) Explain what punctuation is required.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the conjunction and clauses",
            working:
              "Look for conjunctions: 'Although' sits at the very beginning. Clause 1: 'Although the trail was steep and muddy'. Clause 2: 'the hikers reached the summit before sunset'.",
            why: "Conjunctions reveal the structural relationship between clauses.",
          },
          {
            stepNumber: 2,
            label: "Test which clause can stand alone",
            working:
              "Clause 2 ('the hikers reached the summit before sunset') makes complete sense on its own (Independent Clause). Clause 1 ('Although the trail was steep and muddy') leaves you hanging (Dependent Clause).",
            why: "An independent clause expresses a complete thought; a dependent clause requires the main clause to complete its meaning.",
          },
          {
            stepNumber: 3,
            label: "Classify the sentence type",
            working:
              "Because it combines one dependent clause ('Although...') with one independent clause, it is a **Complex Sentence**.",
            why: "Independent + Dependent = Complex.",
          },
          {
            stepNumber: 4,
            label: "Check comma punctuation rule for starting dependent clauses",
            working:
              "When a complex sentence starts with a dependent clause, a comma MUST separate the dependent clause from the main clause: 'Although the trail was steep and muddy**,** the hikers...'.",
            why: "The comma marks the pause between the introductory dependent clause and the main clause.",
          },
        ],
        finalAnswer:
          "(a) Complex sentence. (b) Dependent clause: 'Although the trail was steep and muddy'; Independent clause: 'the hikers reached the summit before sunset'. (c) A comma is required after 'muddy' to separate the introductory dependent clause.",
        commonError: {
          mistake: "Calling it a compound sentence because it has a comma.",
          whyItHappens:
            "Assuming every sentence with a comma is a compound sentence.",
          howToAvoid:
            "Check the conjunction: FANBOYS (and, but, so) = Compound; subordinating words (although, because, while) = Complex.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3la06-misconception",
        heading: "Common Trap: Sentence Fragments as Complete Sentences",
        claim: "'Because I was tired.' is a complete, grammatically correct sentence.",
        whyWrong:
          "'Because I was tired' is a dependent clause (fragment). It explains a reason, but leaves the reader asking: 'What happened because you were tired?'",
        correction:
          "A dependent clause must always attach to an independent clause to form a complete sentence: 'I went to bed early because I was tired.'",
        example: "Never let a dependent clause beginning with 'Because' or 'Although' stand alone without a main clause attached.",
      },
      {
        kind: "check",
        id: "vc2e3la06-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying simple, compound, and complex sentences, finding clauses, and choosing coordinating vs subordinating conjunctions.",
        curriculumCode: "VC2E3LA06",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. VC2E3LA07: Verb Processes (Action, Saying, Thinking, Feeling, Being)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LA07",
    title: "Types of Verbs: Action, Saying, Thinking, Feeling and Relational Processes",
    strand: "language",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify and use different types of verbs (action, saying, thinking, feeling, and relational/being) to bring precision and variety to our writing.",
    successCriteria: [
      "I can identify action verbs (physical doing: ran, constructed, threw).",
      "I can identify saying verbs (dialogue: whispered, demanded, announced) and thinking/feeling verbs (mental/emotional: believed, remembered, feared).",
      "I can identify relational/being verbs (states of existence and possession: is, was, were, has, belonged).",
    ],
    prerequisites: ["VC2E3LA06"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3la07-concept",
        heading: "The Five Families of Verb Processes",
        explanation:
          "Verbs are the engine of every sentence. While many people think verbs are only 'doing words', functional grammar groups verbs into five distinct process types:\n\n1. **Action Verbs (Doing):** Physical actions you can see happen (e.g. *sprinted, paddled, built, erupted*).\n2. **Saying Verbs (Speaking):** How characters communicate spoken words (e.g. *muttered, exclaimed, whispered, declared, warned*).\n3. **Thinking Verbs (Cognition):** Mental thoughts happening inside the brain (e.g. *wondered, decided, remembered, solved, doubted*).\n4. **Feeling / Sensing Verbs (Emotion & Perception):** Emotions, reactions, and sensory experiences (e.g. *treasured, feared, admired, heard, tasted*).\n5. **Relational / Being & Having Verbs (States of Existence):** Connect a subject to its description or ownership without physical action (e.g. *is, was, were, became, seems, has, belongs*).",
        keyTerms: [
          {
            term: "Verb Process",
            definition: "The functional role of a verb in expressing what is happening, being said, thought, felt, or existing.",
          },
          {
            term: "Relational Verb",
            definition: "A verb that establishes a relationship of being or possession (such as 'is', 'was', 'became', 'has').",
          },
          {
            term: "Saying Verb",
            definition: "A verb used in dialogue tags to reveal tone and delivery of speech (e.g. 'growled', 'pleaded').",
          },
        ],
        visualAsset: {
          id: "vc2e3la07-verb-families-table",
          type: "table",
          altText:
            "Table displaying the five verb process types with examples and sample sentences.",
          title: "The 5 Families of Verb Processes",
          data: {
            headers: ["Verb Family", "What It Expresses", "Strong Example Words", "Sentence in Context"],
            rows: [
              ["Action (Doing)", "Physical movement & events", "leaped, constructed, scrambled", "The frog *leaped* into the pond."],
              ["Saying (Speech)", "Spoken communication & tone", "insisted, gasped, whispered", "'We made it!' *gasped* Oliver."],
              ["Thinking (Mind)", "Internal thoughts & logic", "reflected, recognized, hypothesized", "Ella *recognized* the mysterious footprint."],
              ["Feeling (Emotion)", "Feelings & sensory reactions", "cherished, dreaded, appreciated", "The team *dreaded* the thunderstorm."],
              ["Relational (Being)", "States of being & ownership", "is, was, were, became, possesses", "The ancient castle *was* magnificent."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3la07-example",
        heading: "Worked Example: Classifying Verbs in a Narrative Passage",
        problem:
          "Identify and classify every verb in this passage: 'Marcus **believed** the map **was** genuine. He **sprinted** across the bridge and **shouted** for his sister.'",
        steps: [
          {
            stepNumber: 1,
            label: "Isolate the first verb ('believed')",
            working:
              "'Believed' describes an internal thought process happening inside Marcus's mind. Classification: **Thinking Verb**.",
            why: "Believing is a cognitive mental state, not a visible physical movement.",
          },
          {
            stepNumber: 2,
            label: "Isolate the second verb ('was')",
            working:
              "'Was' connects the map to its state of being ('genuine'). It shows no physical action. Classification: **Relational / Being Verb**.",
            why: "'Was' is the past-tense form of the verb 'to be', linking subject to description.",
          },
          {
            stepNumber: 3,
            label: "Isolate the third verb ('sprinted')",
            working:
              "'Sprinted' describes vigorous physical running that you can see. Classification: **Action Verb**.",
            why: "Sprinting is a visible physical movement.",
          },
          {
            stepNumber: 4,
            label: "Isolate the fourth verb ('shouted')",
            working:
              "'Shouted' describes vocal communication and speech delivery. Classification: **Saying Verb**.",
            why: "Shouting is the oral delivery of words or sound.",
          },
        ],
        finalAnswer:
          "1. 'believed' = Thinking Verb; 2. 'was' = Relational/Being Verb; 3. 'sprinted' = Action Verb; 4. 'shouted' = Saying Verb.",
        commonError: {
          mistake: "Failing to recognize 'was' or 'is' as verbs because they aren't 'doing' anything.",
          whyItHappens:
            "Relying solely on the old rule that 'verbs are action words'.",
          howToAvoid:
            "Remember that verbs of being (is, am, are, was, were, been) are vital relational verbs that anchor sentences.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3la07-misconception",
        heading: "Common Trap: Overusing 'Said' Instead of Precise Saying Verbs",
        claim: "'Said' is always the best verb to use for character dialogue.",
        whyWrong:
          "Repeating 'said' gives no clue about character emotion or vocal volume. Saying verbs like 'whispered', 'stammered', or 'roared' reveal mood and urgency immediately.",
        correction:
          "Choose powerful saying verbs that match the character's emotional state in the scene.",
        example: "'\"Give it back!\" demanded Chloe.' is far more vivid and urgent than '\"Give it back!\" said Chloe.'",
      },
      {
        kind: "check",
        id: "vc2e3la07-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying action, saying, thinking, feeling, and being verbs across sentences and dialogue.",
        curriculumCode: "VC2E3LA07",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. VC2E3LA08: Verb Tense Consistency and Temporal Anchoring
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LA08",
    title: "Verb Tenses: Consistent Past, Present and Future Time Anchoring",
    strand: "language",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to maintain consistent verb tense (past, present, or future) throughout our writing and correctly form regular and irregular past-tense verbs.",
    successCriteria: [
      "I can identify whether a sentence or paragraph is set in past, present, or future time.",
      "I can form regular past-tense verbs by adding -ed (e.g. walk → walked, play → played) and recognize common irregular verbs (e.g. run → ran, catch → caught, see → saw).",
      "I can spot and correct accidental tense-shifting (tense drift) within a paragraph.",
    ],
    prerequisites: ["VC2E3LA07"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3la08-concept",
        heading: "Controlling Verb Tense Across Time",
        explanation:
          "Verb tense anchors your writing in time, telling the reader when events take place:\n\n• **Past Tense (Already happened):** Used for recounts, narratives, and historical reports (e.g. *Yesterday we explored the museum*).\n• **Present Tense (Happening now / General truth):** Used for information reports, procedures, and explanations (e.g. *Kangaroo mothers carry their joeys in a pouch*).\n• **Future Tense (Will happen):** Used for plans and predictions (e.g. *Tomorrow we will travel to the coast*).\n\n**Regular vs Irregular Past Tense Verbs:**\n• *Regular Verbs:* Add `-ed` (or `-d` if ending in e): climb → climbed, jump → jumped, smile → smiled.\n• *Irregular Verbs:* Change vowel or spelling completely (they do NOT take -ed!): fly → flew, swim → swam, teach → taught, write → wrote, bring → brought.\n\n**Tense Drift Trap:** When writing a recount in past tense, avoid accidentally slipping into present tense halfway through!",
        keyTerms: [
          {
            term: "Tense Consistency",
            definition: "Keeping verbs anchored in the same time frame (e.g. past or present) throughout a piece of writing.",
          },
          {
            term: "Irregular Past Tense",
            definition: "A verb that forms its past tense through a spelling or vowel change rather than adding -ed (e.g. 'ran' instead of 'runned').",
          },
          {
            term: "Tense Drift",
            definition: "The accidental mixing of past and present tense verbs within the same paragraph.",
          },
        ],
        visualAsset: {
          id: "vc2e3la08-irregular-verbs-table",
          type: "table",
          altText:
            "Table comparing present tense and irregular past tense verbs with common error alerts.",
          title: "Common Irregular Past-Tense Verbs in Australian English",
          data: {
            headers: ["Present Base Form", "Correct Past Tense", "Incorrect Regularised Form (Trap!)", "Example Sentence"],
            rows: [
              ["catch", "caught", "catched ✗", "The goalkeeper *caught* the ball cleanly."],
              ["run", "ran", "runned ✗", "The dog *ran* across the green park."],
              ["bring", "brought", "bringed ✗", "Mia *brought* her science model to class."],
              ["swim", "swam", "swimmed ✗", "They *swam* in the cool ocean pool."],
              ["teach", "taught", "teached ✗", "Mr. Davis *taught* us fractions today."],
              ["see", "saw", "seed ✗", "We *saw* a shooting star last night."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3la08-example",
        heading: "Worked Example: Correcting Tense Drift in a Recount",
        problem:
          "Read this student recount paragraph: 'Yesterday, our class **visited** the botanic gardens. We **walked** through the rainforest canopy and **see** colorful parrots. Suddenly, a lizard **scampers** across the boardwalk.' Find the two tense errors and rewrite the paragraph with consistent past tense.",
        steps: [
          {
            stepNumber: 1,
            label: "Determine the primary time anchor of the text",
            working:
              "The recount begins with 'Yesterday' and uses past-tense verbs 'visited' and 'walked'. The text is anchored in the **Past Tense**.",
            why: "The opening time marker establishes the governing tense for the entire paragraph.",
          },
          {
            stepNumber: 2,
            label: "Inspect the third verb ('see')",
            working:
              "'See' is in the present tense, which clashes with 'walked'. The past-tense irregular form of see is **saw**.",
            why: "Switching from 'walked' to 'see' creates ungrammatical tense drift.",
          },
          {
            stepNumber: 3,
            label: "Inspect the fourth verb ('scampers')",
            working:
              "'Scampers' is in the present tense (with -s). The regular past-tense form is **scampered** (adding -ed).",
            why: "Consistent past recounting requires 'scampered'.",
          },
          {
            stepNumber: 4,
            label: "Rewrite the polished paragraph",
            working:
              "'Yesterday, our class visited the botanic gardens. We walked through the rainforest canopy and **saw** colorful parrots. Suddenly, a lizard **scampered** across the boardwalk.'",
            why: "All four verbs are now cleanly anchored in the past tense.",
          },
        ],
        finalAnswer:
          "Errors: 'see' (should be 'saw') and 'scampers' (should be 'scampered'). Corrected text: 'Yesterday, our class visited the botanic gardens. We walked through the rainforest canopy and saw colorful parrots. Suddenly, a lizard scampered across the boardwalk.'",
        commonError: {
          mistake: "Adding -ed to irregular verbs (e.g. writing 'catched', 'felled', or 'eated').",
          whyItHappens:
            "Over-applying the standard -ed rule to irregular English root words.",
          howToAvoid:
            "Memorize common irregular past forms: caught, fell, ate, threw, flew.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3la08-misconception",
        heading: "Common Trap: Thinking Present Tense Means Today Only",
        claim: "Present tense can only be used for actions happening at this very second.",
        whyWrong:
          "Present tense (Simple Present) is also used for universal scientific facts and timeless explanations that are always true.",
        correction:
          "Information reports use present tense because scientific facts don't expire: 'Koalas eat eucalyptus leaves.'",
        example: "'The Earth revolves around the Sun' uses present tense because it is an enduring scientific fact.",
      },
      {
        kind: "check",
        id: "vc2e3la08-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise forming regular and irregular past-tense verbs and fixing tense drift in paragraphs.",
        curriculumCode: "VC2E3LA08",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 9. VC2E3LA09: Modal Verbs (Obligation and Probability)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LA09",
    title: "Modality: Expressing Degree of Certainty and Obligation with Modal Verbs",
    strand: "language",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify and use modal auxiliary verbs (e.g. must, should, could, might, will) to express varying degrees of obligation, certainty, and possibility.",
    successCriteria: [
      "I can identify modal verbs helping main action verbs in a sentence (e.g. 'We *might* go', 'You *must* stop').",
      "I can arrange modal verbs along a scale of certainty/probability from Low (might, could) to High (will, must, definitely).",
      "I can select high-modality verbs to strengthen persuasive arguments (e.g. 'We *must* protect the wetlands').",
    ],
    prerequisites: ["VC2E3LA07"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3la09-concept",
        heading: "How Modal Verbs Control Strength and Certainty",
        explanation:
          "**Modal verbs** (or modal auxiliary verbs) are helper verbs that pair with a main verb to show how sure, necessary, or possible something is:\n\n1. **Low Modality (Possibility / Doubt):** Indicates low certainty or gentle suggestion.\n• Words: *might, could, may, possibly*\n• Example: 'It *might* rain later today.' (Unsure, just a possibility).\n\n2. **Medium Modality (Probability / Advice):** Indicates reasonable likelihood or recommendation.\n• Words: *should, ought to, would, likely*\n• Example: 'You *should* wear a hat outdoors.' (Sensible advice, recommended).\n\n3. **High Modality (Certainty / Strict Obligation):** Indicates complete certainty, command, or absolute necessity.\n• Words: *must, will, shall, definitely, always*\n• Example: 'All swimmers *must* wear life jackets.' (Mandatory rule; zero doubt).\n\n**Why Modality Matters in Writing:**\nIn persuasive writing, using high-modality verbs (*must, will, vital*) convinces readers far more effectively than weak, uncertain low-modality words (*maybe, might*).",
        keyTerms: [
          {
            term: "Modal Verb",
            definition: "A helping verb that expresses degrees of possibility, permission, ability, or obligation (e.g. can, could, might, must, should, will).",
          },
          {
            term: "Degree of Modality",
            definition: "The strength of certainty or forcefulness conveyed by language, ranging from low (might) to high (must).",
          },
          {
            term: "Obligation",
            definition: "A requirement or duty that someone is expected or commanded to do.",
          },
        ],
        visualAsset: {
          id: "vc2e3la09-modality-scale-table",
          type: "table",
          altText:
            "Table ranking modal verbs along a 3-tier scale of certainty and obligation.",
          title: "The Modality Ladder: From Possibility to Certainty",
          data: {
            headers: ["Modality Level", "Modal Verbs", "Meaning Conveyed", "Persuasive Example"],
            rows: [
              ["Low Modality", "might, could, may, possibly", "Tentative possibility / gentle suggestion", "We *could* consider picking up rubbish."],
              ["Medium Modality", "should, would, probably, can", "Reasonable expectation / sound advice", "Students *should* reduce plastic waste."],
              ["High Modality", "must, will, shall, definitely, always", "Strong certainty / urgent mandatory obligation", "We *must* ban single-use plastics immediately!"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3la09-example",
        heading: "Worked Example: Strengthening a Weak Persuasive Sentence",
        problem:
          "A student wrote this sentence in a persuasive petition for a new school bike rack: 'The principal **might** buy a bike rack because students **could** ride to school.' (a) Identify the modality level of the bold words. (b) Rewrite the sentence using high-modality verbs to make it more convincing.",
        steps: [
          {
            stepNumber: 1,
            label: "Evaluate the current modal verbs",
            working:
              "'Might' and 'could' are low-modality verbs. They express uncertainty and doubt ('it might happen, but maybe not').",
            why: "Low-modality words make persuasive writing sound uncommitted and weak.",
          },
          {
            stepNumber: 2,
            label: "Select high-modality replacements for obligation and certainty",
            working:
              "Replace 'might' with 'must' or 'needs to' (creates urgency/duty). Replace 'could' with 'will' (creates certainty and confidence).",
            why: "High-modality words convey conviction and strong justification.",
          },
          {
            stepNumber: 3,
            label: "Formulate the strengthened sentence",
            working:
              "'The principal **must** install a bike rack because students **will** ride to school every day.'",
            why: "The revised sentence commands action and promises a definite positive outcome.",
          },
          {
            stepNumber: 4,
            label: "Compare the persuasive impact",
            working:
              "Original sounds like a vague wish; the revised version sounds like an urgent, decisive community need.",
            why: "Modal choice directly dictates how persuasive a statement is to the reader.",
          },
        ],
        finalAnswer:
          "(a) 'Might' and 'could' are low-modality verbs expressing weak possibility. (b) High-modality revision: 'The principal **must** install a bike rack because students **will** ride to school every day.'",
        commonError: {
          mistake: "Using high modality in scientific hypotheses where evidence is still uncertain.",
          whyItHappens:
            "Over-asserting facts before an experiment is completed.",
          howToAvoid:
            "Use low/medium modality for scientific predictions ('The plant *might* grow faster') and high modality for proven rules ('Water *will* freeze at 0°C').",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3la09-misconception",
        heading: "Common Trap: Thinking 'Can' and 'May' are Identical",
        claim: "'Can I go to the library?' and 'May I go to the library?' mean the exact same thing.",
        whyWrong:
          "'Can' refers to physical ability ('Are my legs capable of walking to the library?'). 'May' asks for formal permission.",
        correction:
          "Use 'may' when requesting permission, and 'can' when describing ability.",
        example: "'You *can* jump very high (ability), and you *may* go outside to play (permission).'",
      },
      {
        kind: "check",
        id: "vc2e3la09-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying modal verbs, ordering words by degree of certainty, and adjusting modality in persuasive writing.",
        curriculumCode: "VC2E3LA09",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 10. VC2E3LA10: Multimodal Elements (Visual & Auditory Meaning)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LA10",
    title: "Multimodal Elements: How Visuals and Sound Support Meaning",
    strand: "language",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning how multimodal texts combine written words with visual images, sound effects, framing, and typography to create richer meaning.",
    successCriteria: [
      "I can explain how illustrations, color palettes, and framing choices enhance the mood of a written story.",
      "I can analyze how sound effects, background music, or narration alter the tone of a digital presentation.",
      "I can explain how typography (bold, italics, font sizing) guides reader emphasis.",
    ],
    prerequisites: ["VC2E3LA05"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3la10-concept",
        heading: "Understanding Multimodal Meaning Making",
        explanation:
          "A **multimodal text** combines two or more communication modes (written text, spoken audio, visual images, body gesture, and spatial layout) to tell a complete story:\n\n1. **Visual Elements (Pictures, Colour & Framing):**\n• *Colour Palette:* Dark blues and greys create mystery or sadness; bright yellows and greens create joy and energy.\n• *Framing & Angle:* Looking up at a character (low angle) makes them look powerful and dominant; looking down on a character (high angle) makes them look vulnerable or small.\n• *Facial Expressions & Body Posture:* Show unspoken feelings that words might not state explicitly.\n\n2. **Typography & Text Effects:**\n• *BOLD FONTS:* Emphasize loudness or critical importance.\n• *ALL-CAPS OR JAGGED LETTERS:* Convey shouting, panic, or surprise.\n• *Tiny font:* Suggests a quiet whisper or secrecy.\n\n3. **Auditory Elements (Digital Media):**\n• Background music, sound effects (like a creaking door or thunder rumble), and spoken tone amplify tension and suspense.",
        keyTerms: [
          {
            term: "Multimodal Text",
            definition: "A text combining two or more modes (e.g. written words + illustrations + sound effects) to convey meaning.",
          },
          {
            term: "Visual Framing",
            definition: "The way an illustrator positions and crops characters and settings within the borders of an image.",
          },
          {
            term: "Typography",
            definition: "The visual style, arrangement, and appearance of printed letters and words.",
          },
        ],
        visualAsset: {
          id: "vc2e3la10-multimodal-modes-table",
          type: "table",
          altText:
            "Table detailing how visual, auditory, and typographic modes add meaning to written words.",
          title: "Multimodal Elements & Their Impact on Reader Experience",
          data: {
            headers: ["Mode", "Technique", "Visual / Auditory Example", "Meaning Added to Words"],
            rows: [
              ["Visual", "Colour Palette", "Dark stormy charcoal skies with shadows", "Injects a sense of danger and looming trouble."],
              ["Visual", "Camera Angle", "Low angle looking up at a towering giant", "Emphasizes the giant's overwhelming power and scale."],
              ["Typography", "Font Variation", "Words shrinking from LARGE to *tiny*", "Mimics sound fading away into silence."],
              ["Auditory", "Sound Effects", "Rhythmic ticking clock in a digital story", "Builds suspense that time is rapidly running out."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3la10-example",
        heading: "Worked Example: Analyzing Image and Typography Synergy",
        problem:
          "In a picture book, the text reads: 'Suddenly, the floor gave way.' In the illustration, the character is shown from a high angle falling through darkness, while the word 'CRACK!' is printed in huge, jagged, bright-orange lettering across the page. Explain how these visual elements amplify the written sentence.",
        steps: [
          {
            stepNumber: 1,
            label: "Analyze the typography of 'CRACK!'",
            working:
              "The huge, jagged, orange letters for 'CRACK!' visually represent the sudden, deafening noise of wood splintering.",
            why: "Letter size and jagged shape mimic the loudness and suddenness of the sound.",
          },
          {
            stepNumber: 2,
            label: "Analyze the camera angle (high angle looking down)",
            working:
              "Looking down on the falling character makes the character appear small, helpless, and in serious danger.",
            why: "High-angle visual framing diminishes a character's visual power and highlights vulnerability.",
          },
          {
            stepNumber: 3,
            label: "Analyze the colour scheme (dark background vs orange flash)",
            working:
              "The dark background conveys sudden shock and unknown danger, while the bright orange text draws immediate focus to the disaster point.",
            why: "High colour contrast directs the reader's eye and creates dynamic visual shock.",
          },
          {
            stepNumber: 4,
            label: "Synthesize how the elements work together",
            working:
              "The written words state what happened, while the illustration and typography make the reader feel the sudden shock, volume, and peril.",
            why: "Multimodal elements enhance emotional resonance beyond simple text decoding.",
          },
        ],
        finalAnswer:
          "The jagged, oversized 'CRACK!' typography makes the sound feel deafening, while the high-angle illustration of the character falling into darkness reinforces their helplessness and fear, amplifying the simple text into a dramatic moment.",
        commonError: {
          mistake: "Only reading the words and ignoring the visual clues on the page.",
          whyItHappens:
            "Treating picture books as if the illustrations are just background decoration.",
          howToAvoid:
            "Always do a 'picture walk' to analyze facial expressions, color mood, and framing alongside the text.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3la10-misconception",
        heading: "Common Trap: Thinking Illustrations Must Simply Repeat the Words",
        claim: "An illustration in a book only ever draws what the written words say.",
        whyWrong:
          "Illustrations often show subtext, irony, or secret information that the narrator never mentions in words (e.g. showing a mischievous monster hiding behind the narrator).",
        correction:
          "Illustrations can expand, contradict, or provide humorous counterpoint to the written words.",
        example: "In many picture books, the words say 'Everything was completely calm', while the picture shows total hilarious chaos behind the character's back!",
      },
      {
        kind: "check",
        id: "vc2e3la10-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise analyzing illustrations, typography effects, and multimodal elements that enhance meaning.",
        curriculumCode: "VC2E3LA10",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 11. VC2E3LA11: Topic-Specific Vocabulary and Word Relationships
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LA11",
    title: "Vocabulary Mastery: Synonyms, Antonyms, Collocations and Technical Terms",
    strand: "language",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to expand our vocabulary using synonyms, antonyms, word families, domain-specific technical words, and context clues to deduce unknown word meanings.",
    successCriteria: [
      "I can identify and use synonyms (words with similar meanings) and antonyms (words with opposite meanings).",
      "I can use Tier 2 academic vocabulary (e.g. explain, evaluate, conclude) and Tier 3 domain-specific technical vocabulary (e.g. habitat, nocturnal, evaporation).",
      "I can use surrounding sentence context clues to infer the meaning of an unfamiliar word.",
    ],
    prerequisites: [],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3la11-concept",
        heading: "Expanding Word Knowledge and Relationships",
        explanation:
          "Words are interconnected in rich networks of meaning:\n\n1. **Synonyms (Similar Meaning):** Words that mean almost the same thing, but carry subtle differences in intensity or tone:\n• *Small:* tiny, miniature, microscopic, compact.\n• *Happy:* joyful, ecstatic, cheerful, delighted.\n\n2. **Antonyms (Opposite Meaning):** Words with contrasting meanings:\n• *Ancient* ↔ *Modern*\n• *Abundant* ↔ *Scarce*\n• *Courageous* ↔ *Cowardly*\n\n3. **Tier 3 Domain-Specific / Technical Vocabulary:** Specialist terms used in specific subject areas like Science, Geography, and Maths (e.g. *photosynthesis, predator, perimeter, precipitation*).\n\n4. **Context Clues Strategy (Deducing Unknown Words):**\nWhen you encounter an unfamiliar word, look at the clues in surrounding sentences:\n• *Definition clues:* 'The animal is nocturnal, which means it is active at night.'\n• *Synonym clues:* 'The desert was arid and dry.'\n• *Contrast clues:* 'Unlike his boisterous sister, Liam was quiet and reserved.'",
        keyTerms: [
          {
            term: "Synonym",
            definition: "A word having the same or nearly the same meaning as another word in the same language.",
          },
          {
            term: "Antonym",
            definition: "A word that means the direct opposite of another word.",
          },
          {
            term: "Context Clues",
            definition: "Hints and information in surrounding text that help a reader deduce the meaning of an unfamiliar word.",
          },
        ],
        visualAsset: {
          id: "vc2e3la11-vocabulary-shades-table",
          type: "table",
          altText:
            "Table displaying word intensity gradients (shades of meaning) from mild to extreme.",
          title: "Shades of Meaning: Vocabulary Intensity Gradient",
          data: {
            headers: ["Base Concept", "Mild Intensity", "Medium Intensity", "Extreme / Powerful Intensity"],
            rows: [
              ["Hot", "Warm", "Heated / Steaming", "Scorching / Sizzling / Blistering"],
              ["Cold", "Cool / Chilly", "Freezing / Frigid", "Sub-zero / Glacial / Polar"],
              ["Angry", "Annoyed / Cross", "Frustrated / Irritated", "Furious / Enraged / Livid"],
              ["Scared", "Nervous / Uneasy", "Frightened / Afraid", "Terrified / Petrified / Horrified"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3la11-example",
        heading: "Worked Example: Deducing Word Meaning from Context Clues",
        problem:
          "Read this sentence: 'Because the desert was so **arid**, the plants developed deep taproots and thick waxy leaves to store scarce water.' Use context clues to deduce the meaning of the unfamiliar word **arid**.",
        steps: [
          {
            stepNumber: 1,
            label: "Isolate the target word and surrounding topic",
            working:
              "Target word: 'arid'. Setting context: 'the desert'.",
            why: "Identifying the subject domain provides a baseline expectation.",
          },
          {
            stepNumber: 2,
            label: "Hunt for descriptive clue words in the sentence",
            working:
              "Clues: 'plants developed deep roots to store scarce water' and 'thick waxy leaves'.",
            why: "Plant adaptations for storing scarce water reveal environmental conditions.",
          },
          {
            stepNumber: 3,
            label: "Synthesize the meaning",
            working:
              "If plants must store scarce water, the environment must receive almost zero rainfall. Therefore, 'arid' means extremely dry with little to no rain.",
            why: "Connecting the biological adaptations directly defines the climatic adjective.",
          },
          {
            stepNumber: 4,
            label: "Verify by substitution",
            working:
              "Test: 'Because the desert was so [extremely dry], the plants developed deep taproots...' The sentence makes perfect sense.",
            why: "Substituting the deduced definition confirms semantic consistency.",
          },
        ],
        finalAnswer:
          "'Arid' means extremely dry with very little or no rainfall. Context clues: desert location, scarce water, and plant adaptations designed to store moisture.",
        commonError: {
          mistake: "Guessing a random definition without checking the rest of the sentence.",
          whyItHappens:
            "Skipping the surrounding clues when encountering a difficult word.",
          howToAvoid:
            "Read the sentence before and the sentence after the mystery word to gather supporting evidence.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3la11-misconception",
        heading: "Common Trap: Synonyms Being 100% Interchangeable",
        claim: "Any synonym can replace another without changing the meaning of a sentence.",
        whyWrong:
          "Synonyms carry different shades of meaning. Replacing 'He gave a brief answer' with 'He gave a tiny answer' sounds ungrammatical.",
        correction:
          "Always check the collocations (words that naturally belong together) and intensity of a synonym before replacing it.",
        example: "A 'slender tree' makes sense, but a 'skinny tree' sounds informal, and a 'lean tree' means something different.",
      },
      {
        kind: "check",
        id: "vc2e3la11-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying synonyms, antonyms, domain-specific vocabulary, and context clue strategies.",
        curriculumCode: "VC2E3LA11",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 12. VC2E3LA12: Apostrophes of Contraction and Singular Possession
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LA12",
    title: "Apostrophes: Contractions and Singular Possession Rules",
    strand: "language",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to use apostrophes correctly for contractions (shortened words) and for singular possession (showing ownership).",
    successCriteria: [
      "I can place an apostrophe in contractions exactly where letters have been omitted (e.g. do not → don't, it is → it's).",
      "I can use an apostrophe followed by 's ('s) to show singular noun ownership (e.g. the dog's bone, Sarah's pencil).",
      "I can explain that regular plural nouns (e.g. 'three dogs') NEVER take an apostrophe.",
    ],
    prerequisites: [],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Language).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3la12-concept",
        heading: "The Two Jobs of the Apostrophe",
        explanation:
          "In English, the apostrophe (') has exactly two distinct jobs:\n\n1. **Apostrophes of Contraction (Missing Letters):**\nWhen two words are squashed together to make a shorter word, letters fall out. The apostrophe sits in the exact spot where the missing letters used to be:\n• *do not* → **don't** (apostrophe replaces the 'o')\n• *I am* → **I'm** (apostrophe replaces 'a')\n• *they are* → **they're** (apostrophe replaces 'a')\n• *cannot* → **can't** (apostrophe replaces 'no')\n• *it is* → **it's** (apostrophe replaces 'i')\n\n2. **Apostrophes of Singular Possession (Ownership):**\nWhen one person, animal, or thing owns something, add an apostrophe followed by 's' (**'s**):\n• The bone belonging to one dog → **the dog's bone**\n• The coat belonging to the girl → **the girl's coat**\n• The bag belonging to Liam → **Liam's bag**\n\n**CRITICAL RULE: Plurals Do NOT Take Apostrophes!**\nIf you simply have more than one item, add 's' with NO apostrophe: 'There are five **apples** in the basket' (NOT apple's!).",
        keyTerms: [
          {
            term: "Apostrophe of Contraction",
            definition: "A punctuation mark indicating that letters have been omitted when combining two words.",
          },
          {
            term: "Possessive Apostrophe",
            definition: "An apostrophe used with 's' to show that a person, animal, or entity owns something.",
          },
          {
            term: "Plural Noun",
            definition: "A word naming more than one person, place, or thing, formed without an apostrophe.",
          },
        ],
        visualAsset: {
          id: "vc2e3la12-apostrophe-rules-table",
          type: "table",
          altText:
            "Table comparing contractions, singular possession, and simple plurals with correct and incorrect examples.",
          title: "The Three Apostrophe Rules: Contractions, Possession, and Plurals",
          data: {
            headers: ["Category", "Grammar Rule", "Correct Example", "Common Error Trap"],
            rows: [
              ["Contraction", "Replaces missing letters", "is not → **isn't** (replaces 'o')", "is'nt ✗ (wrong placement)"],
              ["Singular Possession", "One owner: add 's", "The **cat's** whiskers (1 cat)", "The cats whiskers ✗ (missing apostrophe)"],
              ["Simple Plural", "More than one: NO apostrophe", "Two black **cats** (multiple cats)", "Two black cat's ✗ (greengrocer's apostrophe)"],
              ["Tricky Pair", "it's = it is / its = belonging to it", "**It's** raining; the bird flapped **its** wings.", "The bird flapped it's wings ✗"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3la12-example",
        heading: "Worked Example: Distinguishing Contractions, Possession, and Plurals",
        problem:
          "Read this sentence with three underlined words: 'The **bakers** (**1**) **cant** (**2**) find the **chefs** (**3**) hat.' Correct the punctuation for each numbered word and explain the rule for each.",
        steps: [
          {
            stepNumber: 1,
            label: "Analyze word (1): 'bakers'",
            working:
              "The sentence refers to multiple bakers. Since it is a simple plural meaning more than one baker (and nothing belongs to them here), NO apostrophe is needed: 'bakers'.",
            why: "Plural nouns indicating quantity never take an apostrophe.",
          },
          {
            stepNumber: 2,
            label: "Analyze word (2): 'cant'",
            working:
              "'Cant' is a contraction of 'cannot'. The apostrophe must replace the missing letters 'no': **can't**.",
            why: "Contractions require an apostrophe in the spot of omitted letters.",
          },
          {
            stepNumber: 3,
            label: "Analyze word (3): 'chefs'",
            working:
              "The hat belongs to one chef (singular owner). Add apostrophe + s: **chef's hat**.",
            why: "Showing ownership by a singular noun requires 's.",
          },
          {
            stepNumber: 4,
            label: "Assemble the corrected sentence",
            working:
              "'The **bakers** **can't** find the **chef's** hat.'",
            why: "Checking all three words verifies that plural, contraction, and possession rules are correctly satisfied.",
          },
        ],
        finalAnswer:
          "Corrected sentence: 'The **bakers** **can't** find the **chef's** hat.' (1. 'bakers' = plural, no apostrophe; 2. 'can't' = contraction with apostrophe replacing 'no'; 3. 'chef's' = singular possessive showing ownership of the hat).",
        commonError: {
          mistake: "Adding an apostrophe to every word ending in 's' (e.g. writing 'banana's for sale' or 'three dog's').",
          whyItHappens:
            "Treating the apostrophe as a decorative mark whenever an 's' is written.",
          howToAvoid:
            "Ask: 'Does the noun own something? Did letters fall out?' If neither, DO NOT use an apostrophe!",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3la12-misconception",
        heading: "Common Trap: The It's vs Its Confusion",
        claim: "'Its' should have an apostrophe when showing possession, like 'The dog wagged it's tail.'",
        whyWrong:
          "'It's' ONLY means 'it is' or 'it has'. Possessive pronouns (his, hers, ours, yours, its) NEVER take an apostrophe.",
        correction:
          "Test with 'it is': if you can say 'The dog wagged *it is* tail', use it's. If you cannot, use possessive **its** (no apostrophe).",
        example: "'**It's** a sunny day, and the tree dropped **its** golden leaves.'",
      },
      {
        kind: "check",
        id: "vc2e3la12-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise forming contractions, inserting possessive apostrophes for singular owners, and avoiding apostrophes in plurals.",
        curriculumCode: "VC2E3LA12",
        practiceCount: 5,
      },
    ],
  },
]);
