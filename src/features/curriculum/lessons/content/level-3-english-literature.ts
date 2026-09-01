import type { Lesson } from "../schema";

export const LEVEL_3_ENGLISH_LITERATURE_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2E3LE01: Characters, Settings and Cultural Contexts
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LE01",
    title: "Literary Contexts: Exploring Characters, Settings and Cultural Backgrounds",
    strand: "literature",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to analyze how characters, settings, and cultural contexts in stories reflect different times, places, and community traditions.",
    successCriteria: [
      "I can describe how the setting (time and place) influences the challenges characters face in a story.",
      "I can identify cultural details (food, celebrations, language, storytelling traditions) represented in diverse literary texts.",
      "I can compare characters from stories set in different eras or cultural environments.",
    ],
    prerequisites: [],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literature).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3le01-concept",
        heading: "How Setting and Cultural Context Shape Literature",
        explanation:
          "Stories do not happen in a vacuum. Authors anchor their stories in specific **settings** (when and where the story takes place) and **cultural contexts** (the beliefs, customs, traditions, and lifestyles of the community):\n\n1. **The Role of Setting:**\n• *Physical Environment:* A story set in the Australian outback presents different challenges (heat, distance, drought) compared to a story set in a snowy alpine village.\n• *Time Period:* A story set 150 years ago during the Gold Rush means characters have no phones, cars, or electricity, changing how they communicate and travel.\n\n2. **Cultural Context and Traditions:**\n• Stories often reflect cultural practices, including First Nations oral storytelling connected to Country and Sky, traditional celebrations (like Lunar New Year or Diwali), unique foods, and family structures.\n• Paying attention to these details helps readers appreciate diverse worldviews and understand character motivations.",
        keyTerms: [
          {
            term: "Setting",
            definition: "The time period (past, present, future) and physical location (forest, city, ocean) where a story occurs.",
          },
          {
            term: "Cultural Context",
            definition: "The values, customs, daily traditions, and shared history of the community portrayed in a text.",
          },
          {
            term: "First Nations Storytelling",
            definition: "Traditional stories passed down by Aboriginal and Torres Strait Islander peoples sharing knowledge of Country, animals, and ethics.",
          },
        ],
        visualAsset: {
          id: "vc2e3le01-setting-influence-table",
          type: "table",
          altText:
            "Table showing how different settings create unique story challenges and cultural elements for characters.",
          title: "Impact of Setting & Cultural Context on Story Plot",
          data: {
            headers: ["Story Setting", "Time Period", "Environmental Challenge", "Cultural & Lifestyle Details"],
            rows: [
              ["Outback Cattle Station", "Present Day", "Isolation, extreme summer heat, dust storms", "Mustering, distance education (School of the Air), water conservation"],
              ["Victorian Goldfields", "1850s (History)", "Cramped tents, digging with pickaxes, no electricity", "Cobb & Co coaches, prospecting pans, miner's licences"],
              ["Coastal Rainforest", "Timeless", "Dense canopy, swollen monsoon creeks, tropical wildlife", "Deep connection to Country, seasonal fishing, ancestral wisdom"],
              ["Modern City Apartment", "Present Day", "Crowded traffic, busy schedules, limited green space", "Public transport, diverse multicultural cuisine, community gardens"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3le01-example",
        heading: "Worked Example: Analyzing How Setting Influences Character Actions",
        problem:
          "Read this story excerpt: 'Koby adjusted his wide-brimmed Akubra hat as the shimmering heat rose off the red dirt track. With the bore pump broken and the temperature soaring past 40 degrees, he knew he had to hike three kilometres to the creek before midday.' Explain how the setting forces Koby to act.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the setting clues (time, place, weather)",
            working:
              "Setting clues: 'red dirt track', 'Akubra hat', 'bore pump', '40 degrees heat', 'three kilometres to the creek'. Location: An arid Australian rural station during a scorching summer day.",
            why: "Extracting environmental details establishes the physical parameters of the scene.",
          },
          {
            stepNumber: 2,
            label: "Identify the immediate complication caused by the setting",
            working:
              "The extreme heat (40°C) combined with the broken bore pump means water is critically urgently needed for survival.",
            why: "The setting creates the problem and heightens the stakes.",
          },
          {
            stepNumber: 3,
            label: "Analyze the character's reaction and urgency",
            working:
              "Koby must wear protective sun gear (wide-brimmed hat) and complete the 3 km trek 'before midday' to avoid heatstroke during peak sun.",
            why: "The harsh climate directly dictates the character's equipment and deadline.",
          },
          {
            stepNumber: 4,
            label: "Synthesize the setting-character relationship",
            working:
              "The harsh outback setting turns a simple walk into a life-and-death mission, showcasing Koby's resilience and practical country knowledge.",
            why: "Explaining how setting drives plot reveals deeper literary understanding.",
          },
        ],
        finalAnswer:
          "The extreme outback climate (40°C heat, broken water bore) directly creates the story's urgent problem, forcing Koby to wear protective sun gear and race against the midday sun to reach the creek for water.",
        commonError: {
          mistake: "Just listing the place name without explaining how the environment impacts the character.",
          whyItHappens:
            "Stopping at literal recall rather than analyzing cause and effect.",
          howToAvoid:
            "Always ask: 'If this story took place in a snowy city instead, what would change about the character's choices?'",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3le01-misconception",
        heading: "Common Trap: Thinking Setting is Just Background Scenery",
        claim: "The setting is just pretty background wallpaper that has no effect on what characters do.",
        whyWrong:
          "In high-quality literature, setting acts almost like an additional character — creating obstacles, determining available tools, and driving emotional mood.",
        correction:
          "Setting creates the rules of the world and directly triggers the plot complications.",
        example: "A storm at sea forces sailors to work together, whereas a cozy library setting allows quiet detective reflection.",
      },
      {
        kind: "check",
        id: "vc2e3le01-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise analyzing settings, character backgrounds, and cultural contexts in literary passages.",
        curriculumCode: "VC2E3LE01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2E3LE02: Personal Responses to Literature (Classroom / Non-Digital)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LE02",
    title: "Connecting to Stories: Sharing Personal Responses and Text-to-Self Links",
    strand: "literature",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to make personal connections (text-to-self, text-to-text, and text-to-world) and express our thoughts and feelings about characters, themes, and dilemmas in literature.",
    successCriteria: [
      "I can make a text-to-self connection by relating a character's experiences or feelings to my own life.",
      "I can make a text-to-text connection by comparing themes, plots, or character types across different books.",
      "I can explain which character choices I agree or disagree with and provide reasons for my opinion.",
    ],
    prerequisites: ["VC2E3LE01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text and concept structure authored specifically for Victorian Curriculum Level 3 English (Literature).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3le02-concept-1",
        heading: "Making Deep Connections to Stories",
        explanation:
          "When we read literature, the words on the page connect with our own memories, feelings, and knowledge of the world. Proficient readers make three powerful types of connections:\n\n1. **Text-to-Self Connections:**\nConnecting a story event or emotion to something you have experienced personally.\n• *Sentence Frame:* 'This part reminds me of when I was nervous on my first day of swimming club, just like Oliver felt before his big race.'\n\n2. **Text-to-Text Connections:**\nConnecting the book to another story, poem, or movie with similar characters or themes.\n• *Sentence Frame:* 'The clever fox in this fable reminds me of the cunning crow in the story we read last week because both outsmarted a greedy antagonist.'\n\n3. **Text-to-World Connections:**\nConnecting a book's big themes to real-world events, nature, or community issues.\n• *Sentence Frame:* 'The oil spill in the story reminds me of the ocean conservation documentary we watched in Science.'\n\n*Note on Practice:* This descriptor is developed through personal reading response journals, literature circle discussions, and peer sharing in the classroom.",
        keyTerms: [
          {
            term: "Text-to-Self",
            definition: "A personal connection made between a text and a reader's own life experiences.",
          },
          {
            term: "Text-to-Text",
            definition: "A connection made between the text being read and another story, article, or poem.",
          },
          {
            term: "Reader Response",
            definition: "A thoughtful personal opinion or emotional reflection on how a text impacted the reader.",
          },
        ],
        visualAsset: {
          id: "vc2e3le02-connections-framework-table",
          type: "table",
          altText:
            "Table outlining the Three Connections Framework (Text-to-Self, Text-to-Text, Text-to-World) with prompts and examples.",
          title: "The Three Types of Reading Connections",
          data: {
            headers: ["Connection Type", "What It Connects", "Thinking Prompt", "Deep Response Example"],
            rows: [
              ["Text-to-Self", "Story ↔ Your Life", "'Have I ever felt this way or faced this challenge?'", "'When Zara lost her pet, it reminded me of how heartbroken I was when my cat went missing.'"],
              ["Text-to-Text", "Story ↔ Another Story", "'Does this character or plot remind me of another book?'", "'The tricky villain reminds me of the wolf in Red Riding Hood because both disguised their true intentions.'"],
              ["Text-to-World", "Story ↔ Real World Issues", "'How does this story relate to real life or nature?'", "'The habitat destruction in the story reflects the real clearing of koala trees reported on the news.'"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "misconception",
        id: "vc2e3le02-misconception",
        heading: "Common Trap: Superficial Connections vs Meaningful Connections",
        claim: "Saying 'The character has shoes and I have shoes' is a great text-to-self connection.",
        whyWrong:
          "Superficial surface connections (like wearing shoes or having brown hair) don't help you understand the story's emotions or deeper themes.",
        correction:
          "Meaningful connections focus on shared feelings, moral choices, challenges, and relationships that help you empathize with the characters.",
        example: "Connecting with a character's courage when standing up to a bully helps you understand their actions deeply.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2E3LE03: Authorial Craft (Plot, Characters, Mood)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LE03",
    title: "Author's Craft: Character Motives, Narrative Arc and Atmosphere",
    strand: "literature",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to analyze how authors build narrative plots, develop multidimensional characters through action and dialogue, and establish atmospheric mood.",
    successCriteria: [
      "I can infer character traits and motives from what characters say, do, think, and how others react to them ('Show, Don't Tell').",
      "I can trace a narrative arc: build-up, turning point / complication, climax, and resolution.",
      "I can explain how sensory imagery and figurative language create an atmospheric mood (e.g. suspenseful, mysterious, heartwarming).",
    ],
    prerequisites: ["VC2E3LE01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literature).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3le03-concept",
        heading: "The Tools of Authorial Craft",
        explanation:
          "Skilled authors use deliberate literary techniques to make stories unforgettable:\n\n1. **Character Development ('Show, Don't Tell'):**\nInstead of simply telling the reader 'Ben was impatient', an author shows Ben's actions: 'Ben drummed his fingers furiously against the table, glaring at the ticking clock every five seconds.'\n• We analyze characters through their **S.T.E.A.L.** actions: **S**peech, **T**houghts, **E**ffect on others, **A**ctions, and **L**ooks.\n\n2. **Narrative Arc and Pacing:**\n• *Rising Action:* Obstacles get harder, raising tension.\n• *Climax:* The peak moment of truth or greatest confrontation.\n• *Resolution:* Unraveling the problem and showing how characters have changed.\n\n3. **Atmospheric Mood:**\nThe emotional feeling of a scene created through sensory details (sounds, shadows, scents) and strong verbs.",
        keyTerms: [
          {
            term: "Character Motivation",
            definition: "The underlying reasons, goals, or desires that drive a character's actions and decisions in a story.",
          },
          {
            term: "Show, Don't Tell",
            definition: "A writing technique where authors reveal character traits and emotions through behavior, dialogue, and sensory clues rather than direct statements.",
          },
          {
            term: "Mood / Atmosphere",
            definition: "The emotional climate or feeling evoked in the reader by the author's choice of descriptive language.",
          },
        ],
        visualAsset: {
          id: "vc2e3le03-character-steal-table",
          type: "table",
          altText:
            "Table displaying the S.T.E.A.L. character analysis framework with examples of clues and inferred traits.",
          title: "The S.T.E.A.L. Method for Analyzing Character Traits",
          data: {
            headers: ["STEAL Category", "Text Clue in Story", "Inferred Character Trait"],
            rows: [
              ["Speech", "'Don't worry, Maya. You can share my umbrella so you don't get wet.'", "Caring, generous, thoughtful"],
              ["Thoughts", "'If I tell the truth about the broken vase, everyone will be disappointed in me.'", "Anxious, guilty, conflicted"],
              ["Effect on others", "Whenever Mr. Thorne entered the room, the rowdy students fell instantly silent.", "Authoritative, strict, respected"],
              ["Actions", "She quietly placed her last gold coin into the collection box.", "Selfless, humble, charitable"],
              ["Looks", "His shoulders slumped, head bowed, clutching a torn drawing.", "Defeated, heartbroken, crestfallen"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3le03-example",
        heading: "Worked Example: Inferring Character Traits from Behavior Clues",
        problem:
          "Read this narrative excerpt: 'When the teacher announced the spelling bee, Lucas smiled broadly and immediately stood up, offering his seat to a younger classmate who looked nervous. He then whispered encouragement: \"Take your time, you'll do great!\"' (a) What character traits does Lucas possess? (b) List two specific text clues that prove your answer.",
        steps: [
          {
            stepNumber: 1,
            label: "Inspect Lucas's actions",
            working:
              "Action 1: Lucas smiled broadly (confident, positive attitude). Action 2: He stood up and offered his seat to a younger nervous classmate (kindness, empathy, manners).",
            why: "Physical gestures reveal emotional states and character values.",
          },
          {
            stepNumber: 2,
            label: "Inspect Lucas's dialogue (speech)",
            working:
              "Speech: He whispered encouragement ('Take your time, you'll do great!') to comfort the younger student.",
            why: "Spoken dialogue directly proves empathy and leadership.",
          },
          {
            stepNumber: 3,
            label: "Synthesize character traits",
            working:
              "Lucas is **confident**, **empathetic**, **supportive**, and **generous**.",
            why: "Combining speech and action clues provides a well-rounded character description.",
          },
          {
            stepNumber: 4,
            label: "Format evidence-backed answer",
            working:
              "State traits and quote evidence: 'offered his seat' and whispered 'you'll do great!'.",
            why: "High-level reading comprehension requires linking inferences directly to text citations.",
          },
        ],
        finalAnswer:
          "(a) Lucas is confident, compassionate, and supportive. (b) Proof clues: 1. He gave up his seat to help a younger classmate feel comfortable; 2. He whispered kind words of encouragement ('Take your time, you'll do great!').",
        commonError: {
          mistake: "Guessing feelings that have zero evidence in the passage (e.g. saying 'Lucas was secretly terrified' when the text says he smiled broadly).",
          whyItHappens:
            "Inventing plot points rather than grounding inferences in authorial clues.",
          howToAvoid:
            "Every inference MUST be backed by a specific word, phrase, or action in the text.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3le03-misconception",
        heading: "Common Trap: Thinking Characters Must Be Purely Good or Purely Evil",
        claim: "In a good story, heroes never make mistakes and villains have no human feelings.",
        whyWrong:
          "Realistic, engaging characters have flaws, doubts, and mixed feelings. A hero can feel afraid or make a selfish error, and a villain might have a understandable grievance.",
        correction:
          "Multi-dimensional characters are complex; look for subtle moments where heroes doubt themselves or learn from mistakes.",
        example: "A brave protagonist who hesitates because they are terrified of heights is more relatable and realistic.",
      },
      {
        kind: "check",
        id: "vc2e3le03-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise inferring character motives, tracing story arcs, and identifying atmospheric mood in literary excerpts.",
        curriculumCode: "VC2E3LE03",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. VC2E3LE04: Poetic Devices (Rhythm, Alliteration, Onomatopoeia, Imagery)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LE04",
    title: "Poetic Devices: Rhythm, Alliteration, Onomatopoeia and Imagery",
    strand: "literature",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify and analyze poetic sound devices (rhyme, rhythm, alliteration, onomatopoeia) and figurative language (similes and imagery) in poetry and prose.",
    successCriteria: [
      "I can identify alliteration (repetition of starting consonant sounds: e.g. 'slippery silver snakes').",
      "I can identify onomatopoeia (words that mimic real-life sounds: e.g. buzz, sizzle, splash).",
      "I can identify similes (comparing two things using 'like' or 'as': e.g. 'as swift as the wind') and describe the sensory picture they create.",
    ],
    prerequisites: ["VC2E3LE03"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literature).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3le04-concept",
        heading: "The Music and Imagery of Poetic Language",
        explanation:
          "Poets and authors use special language devices to make words sound musical and paint vivid pictures in the reader's imagination:\n\n1. **Sound Devices:**\n• **Alliteration:** The repetition of the same starting consonant sound in close succession (e.g. *The **b**risk **b**reeze **b**lew the **b**anner*). It creates rhythm and mood.\n• **Onomatopoeia:** Words that imitate the actual sound they describe (e.g. *snap, pop, clatter, hiss, whoosh, babble*).\n• **Rhythm & Rhyme:** The beat of syllables and matching end sounds (e.g. *cat / hat*) that create musical bounce.\n\n2. **Imagery & Figurative Comparisons:**\n• **Simile:** Compares two different things using the linking words **'like'** or **'as'** to create a fresh visual image (e.g. 'His eyes sparkled **like** diamonds in the sun'; 'Her hands were **as** cold **as** ice').\n• **Sensory Imagery:** Descriptions appealing to the 5 senses (sight, sound, smell, taste, touch) that make a scene feel physically real.",
        keyTerms: [
          {
            term: "Alliteration",
            definition: "The repetition of the same beginning consonant sound in a group of words.",
          },
          {
            term: "Onomatopoeia",
            definition: "A word that sounds like the noise it represents (e.g. 'crunch', 'screech').",
          },
          {
            term: "Simile",
            definition: "A figurative comparison of two unlike things using 'like' or 'as' to highlight a shared quality.",
          },
          {
            term: "Sensory Imagery",
            definition: "Descriptive language that appeals to the senses of sight, sound, smell, touch, or taste.",
          },
        ],
        visualAsset: {
          id: "vc2e3le04-poetic-devices-table",
          type: "table",
          altText:
            "Table matching poetic devices with definitions, examples, and sensory effects.",
          title: "Key Poetic and Literary Devices",
          data: {
            headers: ["Device Name", "How to Spot It", "Example Line", "Effect on the Reader"],
            rows: [
              ["Alliteration", "Repeated starting sound", "The **w**ild **w**aves **w**ashed the shore.", "Creates a fluid, rolling sound mimicking ocean waves."],
              ["Onomatopoeia", "Sound-mimicking word", "The bacon **sizzled** and **popped** in the pan.", "Lets the reader hear the cooking sounds instantly."],
              ["Simile", "Comparison with 'like' / 'as'", "The runner was as fast as a cheetah.", "Visualizes extraordinary speed by linking to a wild animal."],
              ["Sensory Imagery", "Appeals to 5 senses", "The sweet scent of damp pine needles and crisp morning air.", "Engages smell and touch, immersing the reader in the forest."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3le04-example",
        heading: "Worked Example: Identifying Poetic Devices in a Poem Stanza",
        problem:
          "Read this stanza from an original poem: 'Thunder **rumbled** in the distance, / Dark clouds **drifted** through the sky. / Lightning flashed **like jagged silver arrows**, / As the stormy wind began to **sigh**.' (a) Identify the simile. (b) Identify the onomatopoeic word. (c) Explain what image the simile paints.",
        steps: [
          {
            stepNumber: 1,
            label: "Search for a simile comparison using 'like' or 'as'",
            working:
              "Line 3 contains: 'Lightning flashed **like jagged silver arrows**'. It compares lightning bolts to sharp, flying silver arrows using the word 'like'.",
            why: "A simile always links two disparate objects with 'like' or 'as'.",
          },
          {
            stepNumber: 2,
            label: "Search for sound-mimicking words (onomatopoeia)",
            working:
              "Line 1 contains '**rumbled**'. The word 'rumbled' reproduces the low, vibrating, echoing noise of distant thunder.",
            why: "Onomatopoeic words imitate acoustic sounds.",
          },
          {
            stepNumber: 3,
            label: "Explain the visual effect of the simile",
            working:
              "The simile 'like jagged silver arrows' paints a picture of lightning bolts being bright, razor-sharp, dangerous, and shooting rapidly downward from the sky.",
            why: "Explaining the sensory effect shows deep appreciation of authorial imagery.",
          },
        ],
        finalAnswer:
          "(a) Simile: 'Lightning flashed like jagged silver arrows'. (b) Onomatopoeia: 'rumbled'. (c) The simile creates a vivid visual picture of sharp, bright, lethal bursts of light piercing the dark sky like arrows.",
        commonError: {
          mistake: "Calling 'like jagged silver arrows' a metaphor instead of a simile.",
          whyItHappens:
            "Confusing metaphors and similes.",
          howToAvoid:
            "If it uses 'like' or 'as', it is ALWAYS a simile. A metaphor says something IS something else (e.g. 'The sky was a dark blanket').",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3le04-misconception",
        heading: "Common Trap: Thinking All Poems Must Rhyme",
        claim: "If a poem doesn't have rhyming words at the end of every line, it is not a real poem.",
        whyWrong:
          "Many of the world's most powerful poems use **free verse**, where rhythm, imagery, line breaks, and alliteration create beauty without any rhyme.",
        correction:
          "Poetry is about rhythm, emotion, and vivid imagery — rhyming is just one optional tool among many.",
        example: "Japanese Haiku and modern free-verse poems do not rhyme, but create breathtaking sensory images.",
      },
      {
        kind: "check",
        id: "vc2e3le04-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying alliteration, onomatopoeia, similes, and sensory imagery in poems and descriptive passages.",
        curriculumCode: "VC2E3LE04",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. VC2E3LE05: Imaginative Text Creation (Classroom / Non-Digital)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LE05",
    title: "Imaginative Writing: Adapting Characters, Settings and Literary Styles",
    strand: "literature",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to create original imaginative texts by borrowing and adapting character traits, settings, dialogue styles, and narrative patterns from mentor authors.",
    successCriteria: [
      "I can adapt a familiar story pattern (e.g. a quest, mystery, or warning tale) with new characters and settings.",
      "I can create an original protagonist with clear strengths, weaknesses, and a compelling motivation.",
      "I can write descriptive narrative scenes using sensory details and expressive dialogue.",
    ],
    prerequisites: ["VC2E3LE03"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text and concept structure authored specifically for Victorian Curriculum Level 3 English (Literature).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3le05-concept-1",
        heading: "Creating Imaginative Stories from Mentor Texts",
        explanation:
          "Every great author starts by reading and learning from mentor texts. In Level 3, imaginative writing involves taking techniques you admire in published books and adapting them to create your own original stories:\n\n1. **Borrowing a Story Pattern (Narrative Spine):**\n• *The Warning Tale:* Character is warned not to go somewhere → Character ignores warning → Faces a scary complication → Escapes and learns a lesson.\n• *The Quest / Search Tale:* Character loses something important → Journeys through obstacles → Finds unexpected help → Recovers the treasure.\n\n2. **Innovating on Characters:**\nTake a character archetype (like a clumsy wizard or an adventurous detective) and give them unique quirks, fears, and personal goals.\n\n3. **Developing Sensory Settings:**\nTransport your reader into your world by describing what the character sees, hears, smells, and feels.\n\n*Note on Practice:* This sustained creative writing standard is developed through drafting, writer's workshops, peer conferencing, and publishing illustrated stories in the classroom.",
        keyTerms: [
          {
            term: "Mentor Text",
            definition: "A published story or book used as a model of excellent writing craft for students to learn from and emulate.",
          },
          {
            term: "Story Innovation",
            definition: "Taking a familiar story structure and changing characters, setting, or complications to make a brand-new original narrative.",
          },
          {
            term: "Protagonist",
            definition: "The main character who drives the story and works to solve the central problem.",
          },
        ],
        visualAsset: {
          id: "vc2e3le05-story-planning-table",
          type: "table",
          altText:
            "Table showing a narrative planning framework for developing an original adapted story.",
          title: "The 4-Step Narrative Innovation Planner",
          data: {
            headers: ["Story Stage", "Mentor Text Idea", "Original Innovation Example", "Author Craft Focus"],
            rows: [
              ["Orientation", "Boy enters a magical forest", "Girl discovers a hidden subway tunnel beneath Melbourne", "Vivid sensory setting details and atmospheric lighting"],
              ["Complication", "Lost in the dark woods", "The last subway train leaves and the power goes out", "Pacing, suspense, and showing character fear through actions"],
              ["Climax", "Confronts a woodland creature", "Solves an old mechanical puzzle box to open a rescue door", "High-stakes dialogue and dramatic short sentences"],
              ["Resolution", "Returns home safely with a magic acorn", "Climbs up to daylight holding an antique station map", "Reflective ending showing character growth and relief"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "misconception",
        id: "vc2e3le05-misconception",
        heading: "Common Trap: Ending Stories with 'It Was All a Dream'",
        claim: "'...and then I woke up and it was all just a dream!' is the best way to resolve an imaginative story.",
        whyWrong:
          "Ending with 'it was all a dream' instantly erases the entire story and disappoints the reader because none of the character's courage or problem-solving actually mattered.",
        correction:
          "Always have your character solve the complication using their own wits, bravery, or teamwork in the real story world.",
        example: "Having the character unlock the secret door themselves creates a satisfying, earned conclusion.",
      },
    ],
  },
]);
