import type { Lesson } from "../schema";

export const LEVEL_5_ENGLISH_LITERATURE_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2E5LE01: Historical & Cultural Contexts in Literature
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LE01",
    title: "Literary Context: Historical and Cultural Perspectives",
    strand: "literature",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to analyze how historical eras, social customs, and cultural contexts shape the themes, values, and language of Australian and world literature.",
    successCriteria: [
      "I can explain what 'historical and cultural context' means when reading literary texts.",
      "I can identify how an author's time period and cultural background influence their characters' perspectives and challenges.",
      "I can compare how different cultures and historical periods represent universal human themes (e.g. courage, friendship, belonging).",
    ],
    prerequisites: ["VC2E3LE01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literature).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5le01-concept",
        heading: "Literature as a Window into Time and Culture",
        explanation:
          "Stories do not exist in a vacuum. Every story is shaped by its context — the specific time, place, society, and culture in which it was created or set.\n\nKey Contextual Dimensions:\n• Historical Context: The real-world events, technology, laws, and daily living conditions of an era (e.g. colonial Australia, the gold rush, the 1960s space race). Characters face problems determined by what was possible and customary in their historical era.\n• Cultural Context: The beliefs, traditions, customs, folklore, and values shared by a group of people (such as First Nations Australian storytelling traditions, migrant settlement experiences, or regional folklore).\n• Universal Themes: Deep human experiences (like loyalty, justice, overcoming hardship, connection to land) that appear across cultures while being expressed through unique cultural motifs.",
        keyTerms: [
          {
            term: "Historical Context",
            definition: "The political, economic, and social environment that existed during the time a story is set or written.",
          },
          {
            term: "Cultural Context",
            definition: "The shared traditions, beliefs, customs, and values of a specific community represented in a text.",
          },
          {
            term: "Theme",
            definition: "The underlying big idea, moral message, or universal human insight explored across a literary work.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5le01-example",
        heading: "Worked Example: Analyzing Historical Context in a Colonial Story",
        problem:
          "Read this excerpt set in 1854 Ballarat: 'Edward clutched the precious tin mining licence tightly in his pocket. The thundering hooves of the mounted commissioners echoed across the gravel gully, their whistles piercing the dusty air. On the diggings, failing to produce a licence meant immediate imprisonment in the government logs.' How does the historical context create tension in this scene?",
        steps: [
          {
            stepNumber: 1,
            label: "Identify specific historical details",
            working: "Specific historical elements: 'mining licence', 'mounted commissioners', '1854 Ballarat', 'the diggings', 'imprisonment in the government logs'.",
            why: "Locating historical artefacts and terminology establishes the setting.",
          },
          {
            stepNumber: 2,
            label: "Connect historical laws/practices to character emotions",
            working: "In the 1850s Victorian goldfields, miners were legally required to carry expensive monthly licences and were aggressively hunted by armed authorities (licence hunts).",
            why: "Understanding the real historical conflict explains why Edward feels intense fear.",
          },
          {
            stepNumber: 3,
            label: "Explain how context drives dramatic tension",
            working: "The tension stems directly from the harsh historical reality: the imminent threat of arbitrary arrest and harsh punishment by authoritarian commissioners.",
            why: "Context creates the stakes and authentic motivation for the narrative action.",
          },
        ],
        finalAnswer:
          "The historical context of the 1850s Victorian goldfields—specifically the authoritarian enforcement of monthly mining licences by mounted commissioners—drives the tension. Edward's fear is rooted in the real historical consequence of immediate imprisonment in the government logs.",
        commonError: {
          mistake: "Judging historical characters solely by modern 21st-century standards without considering their era's constraints.",
          whyItHappens: "Assuming past societies operated with modern technology, laws, and cultural expectations.",
          howToAvoid: "Consider what tools, knowledge, and social customs were available to people living in that historical time.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5le01-misconception",
        heading: "Misconception: Historical Stories Are Purely Factual Recounts",
        claim: "Historical fiction is just a history textbook disguised as a story.",
        whyWrong:
          "Historical fiction weaves imaginative characters, emotional conflicts, and storytelling techniques into genuine historical settings. The aim is to bring human experiences, dilemmas, and empathy to life, not merely list dates.",
        correction:
          "Historical literature uses factual historical context to explore universal human emotions and relationships.",
        example: "A story about two friends on the Goldfields explores loyalty and hope within a factual 1850s setting.",
      },
      {
        kind: "check",
        id: "vc2e5le01-check",
        heading: "Check Your Understanding",
        prompt: "Practise identifying historical contexts, cultural values, and universal literary themes across diverse stories.",
        curriculumCode: "VC2E5LE01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2E5LE02: Critical Literary Discussion & Metalanguage
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LE02",
    title: "Literary Metalanguage: Analyzing Craft and Authorial Choices",
    strand: "literature",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to use literary metalanguage (such as imagery, foreshadowing, symbolism, character arc, and pacing) to critically discuss how authors craft meaning.",
    successCriteria: [
      "I can define and correctly use literary terms (protagonist, antagonist, symbolism, foreshadowing, motif, imagery).",
      "I can explain HOW an author's craft choice creates a specific emotional impact or meaning for the reader.",
      "I can participate in structured literary discussions using textual quotes to support my interpretations.",
    ],
    prerequisites: ["VC2E5LE01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literature).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5le02-concept",
        heading: "The Toolbox of Literary Metalanguage",
        explanation:
          "Metalanguage is 'language used to talk about language and literature'. Using precise literary terms allows us to analyze how an author builds their narrative world:\n\nKey Literary Devices and Terms:\n• Protagonist / Antagonist: The main character driving the story versus the force or character opposing them.\n• Character Arc: The internal transformation, growth, or change a character experiences from beginning to end.\n• Foreshadowing: Subtle hints, clues, or warnings an author drops early in a text about future plot events.\n• Symbolism: When an object, animal, colour, or weather element represents a deeper abstract concept (e.g. a caged bird symbolizing a lack of freedom; an approaching storm symbolizing rising conflict).\n• Motif: A recurring element, symbol, phrase, or image that reinforces a major theme throughout a story.\n• Pacing: The speed at which a story unfolds (short, sharp sentences create suspense; long, descriptive passages create calm).",
        keyTerms: [
          {
            term: "Metalanguage",
            definition: "The specialized vocabulary used to analyze, describe, and discuss literary techniques and grammatical craft.",
          },
          {
            term: "Foreshadowing",
            definition: "A narrative technique where an author plants subtle clues indicating what will happen later in the plot.",
          },
          {
            term: "Symbolism",
            definition: "The use of concrete symbols to represent abstract ideas, qualities, or emotional states.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5le02-example",
        heading: "Worked Example: Identifying Symbolism and Foreshadowing",
        problem:
          "Analyze this passage using literary metalanguage: 'As Leo stepped onto the stage for his first debate, a tiny fracture in his eyeglasses blurred his vision of the audience. Outside, the first distant rumble of thunder rolled across the valley.' What literary devices are present, and what might they symbolize or foreshadow?",
        steps: [
          {
            stepNumber: 1,
            label: "Identify symbolic elements in the character's description",
            working: "The 'tiny fracture in his eyeglasses' that 'blurred his vision' is symbolic of Leo's self-doubt, vulnerability, and distorted, anxious perception of how the audience will judge him.",
            why: "A physical flaw in a character's tool or vision often symbolizes an internal emotional struggle.",
          },
          {
            stepNumber: 2,
            label: "Identify atmospheric foreshadowing",
            working: "The 'distant rumble of thunder' is pathetic fallacy and foreshadowing: the gathering storm hints at rising dramatic tension, conflict, or high stakes in the debate to come.",
            why: "Weather events introduced at critical plot junctures foreshadow future narrative turbulence.",
          },
        ],
        finalAnswer:
          "The author uses symbolism (the cracked glasses representing internal anxiety and distorted confidence) and foreshadowing (the distant thunder signalling impending dramatic conflict and high emotional tension).",
        commonError: {
          mistake: "Merely spotting a technique ('There is a symbol here') without explaining what it means or how it affects the reader.",
          whyItHappens: "Treating literary analysis as a scavenger hunt rather than an investigation of authorial intent.",
          howToAvoid: "Always follow the formula: Device + Example + Effect on reader/meaning.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5le02-misconception",
        heading: "Misconception: There Is Only One 'Correct' Meaning in a Literary Text",
        claim: "Every symbol or poem has one hidden correct answer that only the teacher knows.",
        whyWrong:
          "Literature is open to interpretation. As long as a reader provides logical reasoning supported by direct textual evidence from the passage, multiple different interpretations can be valid and insightful.",
        correction:
          "Defend your interpretation with textual quotes and clear reasoning.",
        example: "A winter setting can represent loneliness to one reader and peaceful stillness to another, depending on textual evidence.",
      },
      {
        kind: "check",
        id: "vc2e5le02-check",
        heading: "Check Your Understanding",
        prompt: "Practise using literary metalanguage to analyze authorial craft, symbolism, and narrative foreshadowing.",
        curriculumCode: "VC2E5LE02",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2E5LE03: Narrative Point of View & Interpretation
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LE03",
    title: "Narrative Point of View: First, Third and Unreliable Narrators",
    strand: "literature",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to analyze how narrative point of view (first person, third-person limited, third-person omniscient) shapes reader empathy, access to information, and interpretation.",
    successCriteria: [
      "I can identify first person ('I', 'we'), third-person limited ('he', 'she', 'they' through one character's eyes), and third-person omniscient (all-knowing narrator).",
      "I can explain how first-person narration creates closeness and empathy while limiting what the reader knows about other characters.",
      "I can recognize when a narrator's perspective might be biased, subjective, or unreliable.",
    ],
    prerequisites: ["VC2E3LE03"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literature).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5le03-concept",
        heading: "The Lens Through Which We See the Story",
        explanation:
          "Point of view (POV) is the perspective from which a story is told. Changing the narrator completely changes what the reader learns and feels:\n\n1. First Person ('I', 'me', 'my', 'we'):\n   • The narrator is an active character inside the story.\n   • Strengths: Deep emotional intimacy, direct access to thoughts and vulnerabilities.\n   • Limitations: The reader only sees what that one person experiences; other characters' private thoughts remain a mystery.\n\n2. Third-Person Limited ('he', 'she', 'they'):\n   • The story is told from an outside perspective, but closely tracks the thoughts and feelings of ONE specific protagonist.\n\n3. Third-Person Omniscient ('all-knowing'):\n   • The outside narrator knows the thoughts, motivations, histories, and secrets of ALL characters simultaneously.\n\n• Unreliable Narrator: A first-person narrator whose version of events is coloured by prejudice, misunderstanding, or intentional secrecy.",
        keyTerms: [
          {
            term: "Point of View (POV)",
            definition: "The narrative perspective chosen by an author to relate events and describe characters.",
          },
          {
            term: "First-Person Narrative",
            definition: "Storytelling delivered directly from the voice of a character using 'I' and 'we'.",
          },
          {
            term: "Third-Person Omniscient",
            definition: "An all-knowing narrator who has complete knowledge of every character's thoughts, emotions, and background.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5le03-example",
        heading: "Worked Example: Comparing First Person and Third-Person Omniscient",
        problem:
          "Compare these two versions of the same event: Version A: 'I watched Maya walk into the room with her arms crossed and a smirk on her face. She was clearly delighted that she had won the science prize.' Version B: 'Maya walked into the room with her arms crossed, forcing a smirk to conceal her trembling hands. Unbeknownst to the other finalists, she felt completely overwhelmed.' How does the change in POV alter the reader's understanding of Maya?",
        steps: [
          {
            stepNumber: 1,
            label: "Analyze Version A (First-Person Observer)",
            working: "In Version A, the narrator can only see Maya's external posture and interprets her smirk as arrogant delight. The reader receives a subjective, biased impression.",
            why: "First person restricts knowledge to external observations and personal assumptions.",
          },
          {
            stepNumber: 2,
            label: "Analyze Version B (Third-Person Omniscient)",
            working: "In Version B, the omniscient narrator reveals Maya's private emotional truth: her trembling hands, internal anxiety, and feeling overwhelmed. The reader feels deep empathy rather than resentment.",
            why: "Omniscient narration reveals internal contradictions between appearance and reality.",
          },
        ],
        finalAnswer:
          "Version A portrays Maya as smug and arrogant because the first-person narrator only sees external appearances and assumes bad intentions. Version B reveals Maya's internal vulnerability and anxiety through omniscient narration, completely shifting reader perception from irritation to empathy.",
        commonError: {
          mistake: "Assuming a character in dialogue saying 'I think...' makes the whole story a first-person narrative.",
          whyItHappens: "Confusing spoken character dialogue with the overarching narration voice.",
          howToAvoid: "Check the narration outside the speech marks: if it uses 'he said' or 'she thought', it is third-person.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5le03-misconception",
        heading: "Misconception: A First-Person Narrator Always Tells the Complete Truth",
        claim: "Everything a first-person narrator tells you is guaranteed to be 100% accurate and factual.",
        whyWrong:
          "First-person narrators have human flaws: they make mistakes, jump to wrong conclusions about others, and sometimes exaggerate to make themselves look better. Great readers think critically about narrator reliability.",
        correction:
          "Evaluate whether a first-person narrator might have biases or limited knowledge of what really occurred.",
        example: "A narrator might insist 'nobody liked me' when surrounding actions show their classmates were trying to help.",
      },
      {
        kind: "check",
        id: "vc2e5le03-check",
        heading: "Check Your Understanding",
        prompt: "Practise identifying narrative points of view, analyzing perspective limits, and evaluating narrator reliability.",
        curriculumCode: "VC2E5LE03",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. VC2E5LE04: Figurative Imagery: Similes, Metaphors, Personification
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LE04",
    title: "Figurative Language: Similes, Metaphors and Sensory Imagery",
    strand: "literature",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify, analyze, and create figurative language (similes, extended metaphors, personification, onomatopoeia, alliteration, hyperbole) and explain their sensory and emotional impact on the reader.",
    successCriteria: [
      "I can distinguish between literal language and figurative language.",
      "I can identify and explain the comparative mechanism of similes ('like/as') and metaphors (direct equivalence).",
      "I can analyze personification (attributing human qualities to non-human things) and sensory imagery in poetry and prose.",
    ],
    prerequisites: ["VC2E3LE04"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literature).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5le04-concept",
        heading: "Painting with Words: Figurative Devices",
        explanation:
          "Figurative language goes beyond literal dictionary definitions to paint vivid pictures in the reader's imagination:\n\n• Simile: Explicitly comparing two different things using 'like' or 'as' (e.g. 'Her hands were as cold as ice'; 'The car leapt forward like a startled cat').\n• Metaphor: Directly stating that one thing IS another to transfer its qualities (e.g. 'The classroom was a bustling beehive of creativity'; 'Time is a thief').\n• Extended Metaphor: A single metaphor that continues and develops across multiple sentences or an entire poem.\n• Personification: Giving human feelings, intentions, or actions to inanimate objects or natural phenomena (e.g. 'The wind shrieked through the trees and rattled the stubborn window latch').\n• Hyperbole: Deliberate, dramatic exaggeration for emphasis or humor (e.g. 'This backpack weighs a million tonnes').\n• Onomatopoeia & Sound Devices: Words that mimic sounds (hiss, clatter, thud) and alliteration (repeating initial consonant sounds) to create auditory rhythm.",
        keyTerms: [
          {
            term: "Figurative Language",
            definition: "Expressive language that creates imagery and symbolic comparisons beyond literal meaning.",
          },
          {
            term: "Metaphor",
            definition: "A direct figure of speech that equates one thing with another to highlight a shared characteristic.",
          },
          {
            term: "Personification",
            definition: "A literary device that attributes human emotions, actions, or consciousness to animals or objects.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5le04-example",
        heading: "Worked Example: Analyzing Figurative Imagery in a Poem",
        problem:
          "Read this line from a poem about bushfires: 'The ravenous flames swallowed the dry scrub, their red tongues licking the canopy while smoke suffocated the valley.' Identify the figurative devices used and explain their effect.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify personification and metaphor",
            working:
              "• Personification: 'ravenous flames', 'swallowed', 'red tongues licking', 'smoke suffocated'.\n• Metaphor: Depicting the fire as a hungry, predatory beast with 'tongues' that 'swallows' everything in its path.",
            why: "Pinpointing the device words reveals the central imagery theme.",
          },
          {
            stepNumber: 2,
            label: "Analyze the sensory and emotional effect on the reader",
            working: "By characterizing the wildfire as an insatiable, destructive monster, the author conveys its terrifying speed, uncontrollability, and lethal threat, evoking dread and urgency in the reader.",
            why: "Explaining the effect shows why the figurative choice is powerful.",
          },
        ],
        finalAnswer:
          "The author uses personification and predatory metaphor (depicting fire as a ravenous monster with 'red tongues' that 'swallows' the forest). This intensifies the reader's sense of danger and highlights the unstoppable, destructive power of the wildfire.",
        commonError: {
          mistake: "Calling a metaphor a simile when the word 'like' or 'as' is absent (e.g. calling 'He is a lion in battle' a simile).",
          whyItHappens: "Thinking all comparisons are called similes.",
          howToAvoid: "Check for the connector words: if it uses 'like' or 'as', it is a simile; if it states direct equivalence, it is a metaphor.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5le04-misconception",
        heading: "Misconception: Similes Are Always Better Than Direct Descriptions",
        claim: "Every sentence in creative writing should contain a simile.",
        whyWrong:
          "Cliché similes ('hot as the sun', 'cold as ice', 'fast as lightning') weaken writing. Creative writing thrives on original, unexpected comparisons and powerful verbs, not overused stock phrases.",
        correction:
          "Invent original, specific comparisons or use strong verbs instead of cliché similes.",
        example: "'The river churned like boiling chocolate' is more vivid than 'The river was fast like lightning'.",
      },
      {
        kind: "check",
        id: "vc2e5le04-check",
        heading: "Check Your Understanding",
        prompt: "Practise identifying similes, metaphors, personification, and sensory sound devices in poetry and prose.",
        curriculumCode: "VC2E5LE04",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. VC2E5LE05: Creative Text Composition & Experimenting with Voice
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LE05",
    title: "Creative Writing: Authorial Voice, Dialogue and Pacing",
    strand: "literature",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to compose imaginative texts that experiment with distinctive character voice, dynamic dialogue, sensory imagery, and narrative pacing.",
    successCriteria: [
      "I can establish a unique character voice through word choice, dialogue quirks, and internal thoughts.",
      "I can punctuate direct speech accurately with speech marks, commas, and varied dialogue tags.",
      "I can manipulate sentence length and structure to control narrative tension and pacing during climactic moments.",
    ],
    prerequisites: ["VC2E5LE03", "VC2E5LE04"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literature).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5le05-concept",
        heading: "Crafting Compelling Stories with Voice and Pacing",
        explanation:
          "Imaginative writing moves beyond simple plot events to create an immersive world through craft:\n\n• Character Voice: The personality, attitude, and tone that shines through how a character speaks and thinks. A nervous scientist sounds completely different from a reckless adventurer.\n• Dynamic Dialogue: Spoken exchanges should reveal character conflict and move the plot forward, rather than stating mundane greetings ('Hi', 'Hello').\n  - Punctuation Rule: 'Speech words inside quotes,' followed by comma inside quotes, speaker tag, and full stop: \"We need to leave immediately,\" whispered Maya.\n• Controlling Pacing:\n  - Suspense / Action: Short, punchy sentences and fragments speed up time (e.g. 'Footsteps. Louder now. She held her breath.').\n  - Reflection / Setting: Longer, compound-complex sentences with rich descriptive clauses slow down time.",
        keyTerms: [
          {
            term: "Authorial Voice",
            definition: "The distinct personality, tone, and stylistic fingerprint of a writer or character.",
          },
          {
            term: "Dialogue",
            definition: "The spoken conversation between characters, framed by quotation marks and dialogue tags.",
          },
          {
            term: "Narrative Pacing",
            definition: "The rhythm and speed at which a writer moves through plot events, controlled by sentence length and detail.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5le05-example",
        heading: "Worked Example: Elevating Dialogue and Dramatic Pacing",
        problem:
          "Rewrite this bland scene to increase tension and distinctive voice: 'Tom said we are lost. Sarah said she knows the way. They walked in the dark forest and heard a noise.'",
        steps: [
          {
            stepNumber: 1,
            label: "Create authentic character voices in dialogue",
            working:
              "Give Tom an anxious, hesitant voice and Sarah a stubborn, defensive voice:\n• \"Tom, keep your flashlight still!\" hissed Sarah, swatting away a cobweb.\n• \"Sarah, we've passed that same twisted gum tree three times,\" Tom stammered, his voice cracking. \"We're completely lost.\"",
            why: "Conflict in dialogue immediately reveals personality traits and escalates stakes.",
          },
          {
            stepNumber: 2,
            label: "Use short sentences to accelerate pacing for the suspense moment",
            working:
              "Then, silence. A snap. Somewhere in the black undergrowth behind them, heavy branches splintered.",
            why: "Short sentences and sensory sound words mimic an elevated heart rate.",
          },
        ],
        finalAnswer:
          "\"Keep your flashlight still!\" hissed Sarah, swatting away a thick cobweb. \"I told you, the campsite is just over this ridge.\"\n\"Sarah, we've passed that same twisted gum tree three times,\" Tom stammered, his voice cracking in the cold air. \"Admit it. We're lost.\"\nThen, absolute silence. A sharp snap. Somewhere in the black undergrowth behind them, heavy branches splintered.",
        commonError: {
          mistake: "Over-using bizarre speaker tags instead of 'said' or 'asked' (e.g. 'he ejaculated', 'she pontificated').",
          whyItHappens: "Trying to avoid 'said' at all costs.",
          howToAvoid: "'Said' is an invisible word that keeps focus on the dialogue. Use action beats rather than theatrical tags.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5le05-misconception",
        heading: "Misconception: More Plot Events Equal a Better Story",
        claim: "A great short story must have an alien invasion, a car chase, a robbery, and a volcano explosion all in two pages.",
        whyWrong:
          "Cramming ten huge events into a short piece leaves no room for character development, emotional tension, or sensory description. The best stories focus on ONE central problem or pivotal moment and explore it with depth and craft.",
        correction:
          "Focus on one meaningful conflict and develop character reactions, dialogue, and atmosphere thoroughly.",
        example: "A story about a character trying to confess a mistake to a friend can be far more powerful than a rushed global battle.",
      },
      {
        kind: "check",
        id: "vc2e5le05-check",
        heading: "Check Your Understanding",
        prompt: "Practise writing dialogue with correct punctuation, establishing character voice, and varying sentence pacing.",
        curriculumCode: "VC2E5LE05",
        practiceCount: 5,
      },
    ],
  },
]);
