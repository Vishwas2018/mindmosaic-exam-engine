import type { Lesson } from "../schema";

export const LEVEL_5_ENGLISH_LITERACY_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2E5LY01: Active Listening, Paraphrasing & Justifying Opinions
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LY01",
    title: "Active Listening, Paraphrasing and Perspective Taking",
    strand: "literacy",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to practice active listening strategies, accurately paraphrase spoken viewpoints, and clarify or justify opinions with sound reasoning.",
    successCriteria: [
      "I can demonstrate active listening behaviours (maintaining eye contact, taking structured notes, withholding interruption).",
      "I can paraphrase another speaker's argument accurately in my own words before responding.",
      "I can pose clarifying questions and support my own perspective with reasoned justification.",
    ],
    prerequisites: ["VC2E3LY01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text and concept structure authored specifically for Victorian Curriculum Level 5 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5ly01-concept",
        heading: "The Art of Active Listening and Productive Dialogue",
        explanation:
          "Active listening is a deliberate communication skill where the listener fully concentrates, understands, responds, and remembers what is being said rather than simply waiting for their turn to speak.\n\nKey Active Listening Protocols:\n1. Non-Verbal Attunement: Open body language, eye contact, and nodding to signal comprehension.\n2. Paraphrasing / Mirroring: Restating the speaker's main points in your own words to verify understanding ('What I am hearing you say is that...').\n3. Clarification Questions: Asking open-ended questions to explore nuanced points ('What led you to that conclusion?', 'Could you elaborate on the second reason?').\n4. Respectful Counter-Reasoning: Building on or challenging ideas respectfully ('I understand your concern regarding costs; however, if we consider the long-term energy savings...').\n\n*Note on Practice:* This listening and interaction standard is practised live through classroom discussions, collaborative inquiries, and literature circles.",
        keyTerms: [
          {
            term: "Active Listening",
            definition: "A structured way of listening and responding that focuses entirely on understanding the speaker's meaning and perspective.",
          },
          {
            term: "Paraphrase",
            definition: "Restating someone else's spoken or written ideas in your own words while retaining the original meaning.",
          },
          {
            term: "Justification",
            definition: "Providing valid reasons, evidence, and logical rationale to explain why a decision or belief is sound.",
          },
        ],
      },
      {
        kind: "misconception",
        id: "vc2e5ly01-misconception",
        heading: "Misconception: Listening Means Staying Silent and Doing Nothing",
        claim: "As long as you are not talking, you are actively listening.",
        whyWrong:
          "Passive silence is not active listening. Active listening requires mental engagement: tracking key ideas, evaluating evidence, noting questions, and formulating a respectful synthesis.",
        correction:
          "Engage actively by note-taking, nodding, and preparing thoughtful paraphrases or questions.",
        example: "A listener who takes notes and asks clarifying questions is actively engaged.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2E5LY02: Structured Oral Presentations & Multimodal Deliveries
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LY02",
    title: "Oral Presentations: Vocal Craft, Structure and Slide Design",
    strand: "literacy",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to plan, structure, and deliver engaging oral presentations using vocal modulation (pitch, pace, pause, volume) and integrated visual slides.",
    successCriteria: [
      "I can structure an oral presentation with a captivating hook, signposted body arguments, and a memorable conclusion.",
      "I can use vocal modulation (varying volume, pitch, pace, and pausing for emphasis) to maintain audience engagement.",
      "I can design slide visuals that complement my spoken words using high-impact images and minimal bullet points.",
    ],
    prerequisites: ["VC2E5LY01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text and concept structure authored specifically for Victorian Curriculum Level 5 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5ly02-concept",
        heading: "Mastering the Presentation Triad: Content, Voice, Visuals",
        explanation:
          "A memorable oral presentation coordinates three essential dimensions:\n\n1. Macro Structure:\n   • The Hook: An opening question, surprising statistic, or brief anecdote to capture attention.\n   • Verbal Signposting: Clear transition markers ('First, let us examine...; Turning now to our second challenge...; In conclusion...').\n   • The Call to Action: A powerful final statement that leaves a lasting impression.\n\n2. Vocal Delivery (The 4 Ps):\n   • Projection (Volume): Speaking from the diaphragm so back rows hear effortlessly.\n   • Pace: Slowing down during critical points; avoiding rushed nervous speech.\n   • Pitch / Inflection: Varying musicality to avoid monotone delivery.\n   • Pause: Strategic silence right before or after a key insight to let it sink in.\n\n3. Visual Presentation Slides:\n   • Slides are visual anchors, not teleprompters. Use powerful images and 3-5 concise bullet points; NEVER read full paragraphs off the screen.\n\n*Note on Practice:* This spoken and multimodal delivery standard is practised live through classroom speeches, presentations, performances, and audience feedback.",
        keyTerms: [
          {
            term: "Signposting",
            definition: "Verbal cues used by a speaker to guide listeners through the structure and transitions of a presentation.",
          },
          {
            term: "Vocal Modulation",
            definition: "Controlling and varying pitch, volume, speed, and pauses to express meaning and maintain audience interest.",
          },
          {
            term: "Eye Contact",
            definition: "Looking directly at various sections of an audience to establish rapport, connection, and trust.",
          },
        ],
      },
      {
        kind: "misconception",
        id: "vc2e5ly02-misconception",
        heading: "Misconception: Speaking Faster Makes You Sound Smarter",
        claim: "If you speak rapidly without stopping, you sound more knowledgeable and confident.",
        whyWrong:
          "Fast, breathless speaking prevents the audience from absorbing complex ideas and signals nervous panic. Confident speakers speak at a measured pace and use deliberate pauses for emphasis.",
        correction:
          "Slow down, breathe, and use strategic pauses to let your key arguments resonate.",
        example: "A 2-second pause after a striking statistic gives the audience time to realize its significance.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2E5LY03: Advanced Phonological & Morphological Variable Pronunciations
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LY03",
    title: "Phonology and Morphology: Variable Letter-Sound Pronunciations",
    strand: "literacy",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to analyze how spelling, morphology, and syllable stress alter the pronunciation of vowels and consonants in complex words.",
    successCriteria: [
      "I can explain how shifting syllable stress alters vowel sounds from clear vowels to the unaccented schwa /ə/ (e.g. 'photograph' vs 'photography').",
      "I can identify variable grapheme pronunciations based on origin and position (e.g. 'ch' as /tʃ/ in 'chair', /k/ in 'chorus', /ʃ/ in 'chef').",
      "I can use morphological knowledge (base words, prefixes, suffixes) to predict both spelling and pronunciation.",
    ],
    prerequisites: ["VC2E3LY03"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5ly03-concept",
        heading: "Why English Words Change Pronunciation",
        explanation:
          "English spelling is 'morphophonemic' — it preserves the meaning and origin of word families (morphology) even when spoken sounds change (phonology).\n\n1. Syllable Stress and the Schwa /ə/:\nWhen suffixes are added to base words, the primary stress (accent) often shifts to a different syllable. Stressed vowels sound full and clear, while unstressed vowels reduce to the neutral schwa sound /ə/:\n• PHO-to-graph (/oʊ/ sound) -> pho-TOG-ra-phy (/ə/ schwa at the start, /ɒ/ in the middle) -> pho-to-GRAPH-ic (/æ/ sound).\n\n2. Graphemes with Variable Phonemes (e.g. 'ch'):\n• Germanic / Old English origin: pronounced /tʃ/ (chest, church, rich).\n• Greek origin: pronounced /k/ (character, echo, orchestra, monarch).\n• French origin: pronounced /ʃ/ (chef, parachute, machine, brochure).",
        keyTerms: [
          {
            term: "Schwa /ə/",
            definition: "The most common vowel sound in English, an unaccented, weak neutral vowel found in unstressed syllables (e.g. 'about', 'banana').",
          },
          {
            term: "Syllable Stress",
            definition: "The emphasis or prominence given to a particular syllable in a word during pronunciation.",
          },
          {
            term: "Morphophonemic",
            definition: "A writing system that represents both word sounds (phonemes) and meaningful units/roots (morphemes).",
          },
        ],
        visualAsset: {
          id: "vc2e5ly03-ch-table",
          type: "table",
          altText: "Table classifying 'ch' pronunciations into /tʃ/, /k/, and /ʃ/ categories with linguistic origins.",
          title: "Variable Pronunciation of 'ch' Based on Word Origin",
          data: {
            headers: ["Pronunciation Phoneme", "Language of Origin", "Example Words"],
            rows: [
              ["/tʃ/ (as in chip)", "Old English / Germanic", "champion, chalkboard, reach, butcher"],
              ["/k/ (as in kite)", "Greek (via Latin)", "mechanic, technology, anchor, scheme, ache"],
              ["/ʃ/ (as in ship)", "French", "chiffon, chandelier, mustache, brochure"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e5ly03-example",
        heading: "Worked Example: Tracking Stress and Vowel Shifts in a Word Family",
        problem:
          "Analyze the syllable stress and pronunciation shift across the base word 'nature' and its derived forms 'natural' and 'naturalist'. Why does the 'a' sound change even though the spelling stays identical?",
        steps: [
          {
            stepNumber: 1,
            label: "Pronounce 'nature' and identify the first vowel sound",
            working: "'NA-ture' has stress on the first syllable. The 'a' makes a long vowel /eɪ/ sound (nay-chur).",
            why: "In 'nature', the open syllable pattern gives 'a' its long vowel sound.",
          },
          {
            stepNumber: 2,
            label: "Add suffix -al to form 'natural' and observe the vowel shift",
            working: "In 'NAT-u-ral', the addition of the suffix shifts the syllable division. The 'a' shortens to /æ/ (nat-chur-ul), while the second syllable reduces to a schwa.",
            why: "Suffixation often closes the root syllable or triggers vowel reduction.",
          },
          {
            stepNumber: 3,
            label: "Explain the morphophonemic principle",
            working: "English preserves the spelling 'nat-' across 'nature' and 'natural' so the reader immediately recognizes they belong to the same meaning family, despite the phonetic sound change.",
            why: "Spelling prioritises root meaning stability over phonetic spelling.",
          },
        ],
        finalAnswer:
          "In 'nature', 'a' is a long /eɪ/ sound, whereas in 'natural', 'a' shifts to a short /æ/ sound due to syllable division changes. English keeps the spelling 'nat-' identical across both words to maintain morphological family connection.",
        commonError: {
          mistake: "Spelling 'natural' phonetically as 'nacherel' or 'nachral'.",
          whyItHappens: "Spelling purely by ear without recognizing the base root 'nature'.",
          howToAvoid: "Always ask: 'What is the base root of this word?' Connect 'natural' to 'nature'.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5ly03-misconception",
        heading: "Misconception: English Spelling Is Totally Random and Broken",
        claim: "English spelling has no rules because letters make different sounds in different words.",
        whyWrong:
          "English spelling is not purely phonetic; it is a system designed to preserve root meanings, prefixes, suffixes, and etymological histories across related words. Once you understand morphology and roots, spelling becomes logical and predictable.",
        correction:
          "Recognize that spelling reflects meaning families (morphology) as well as sound (phonology).",
        example: "The silent 'g' in 'sign' is pronounced in related family words like 'signal' and 'signature'.",
      },
      {
        kind: "check",
        id: "vc2e5ly03-check",
        heading: "Check Your Understanding",
        prompt: "Practise identifying stress shifts, schwa vowels, and variable grapheme pronunciations across word families.",
        curriculumCode: "VC2E5LY03",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. VC2E5LY04: Word Etymology, Greek/Latin Roots & Advanced Spelling
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LY04",
    title: "Etymology: Greek and Latin Morphemes and Spelling Patterns",
    strand: "literacy",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to use Greek and Latin roots, prefixes, and suffixes to unlock the meaning, spelling, and etymology of advanced multisyllabic academic words.",
    successCriteria: [
      "I can identify common Greek combining forms (bio, geo, tele, auto, micro, graph, scope, meter) and Latin roots (port, tract, struct, dict, spect, rupt).",
      "I can break unfamiliar academic words into prefixes, roots, and suffixes to deduce their meaning.",
      "I can apply advanced spelling generalisations for assimilated prefixes (e.g. in- becomes im-, il-, ir- before certain consonants).",
    ],
    prerequisites: ["VC2E3LY04", "VC2E5LY03"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5ly04-concept",
        heading: "Cracking the Code with Greek and Latin Morphemes",
        explanation:
          "Over 60% of English words—and over 90% of specialized academic and scientific vocabulary—originate from Greek and Latin roots. Learning morphemes gives you the key to understand thousands of words instantly.\n\nCommon Greek Morphemes:\n• bio (life): biology, biography, biosphere, biodegradable\n• geo (earth): geology, geography, geometry, geothermal\n• tele (distant): telescope, telephone, television, teleport\n• auto (self): autobiography, automobile, automatic, autonomous\n• graph/gram (written/drawn): autograph, telegram, photograph, graphite\n\nCommon Latin Morphemes:\n• struct (build): construct, instruct, structure, destruction\n• tract (pull/drag): tractor, attract, extract, subtract, contract\n• spect (look/see): inspect, spectator, spectacle, perspective\n• port (carry): portable, transport, export, import, porter\n\nAssimilated (Chameleon) Prefixes:\nThe Latin prefix 'in-' (not) changes its ending consonant to blend smoothly with the root: 'im-' before p/m (impossible), 'il-' before l (illegal), 'ir-' before r (irresponsible).",
        keyTerms: [
          {
            term: "Etymology",
            definition: "The study of the historical origin, derivation, and development of words over time.",
          },
          {
            term: "Root Morpheme",
            definition: "The core base component of a word that holds its fundamental meaning, which prefixes and suffixes modify.",
          },
          {
            term: "Assimilated Prefix",
            definition: "A prefix whose spelling changes to match or blend with the first letter of the base root for easier pronunciation.",
          },
        ],
        visualAsset: {
          id: "vc2e5ly04-morpheme-matrix",
          type: "table",
          altText: "Matrix table showing word construction combining prefixes, roots, and suffixes.",
          title: "Morphological Word Building Matrix (Latin root: STRUCT = build)",
          data: {
            headers: ["Prefix (Meaning)", "Root (Meaning)", "Suffix (Function)", "Assembled Word & Definition"],
            rows: [
              ["con- (together)", "struct (build)", "-ion (noun: process)", "construction (process of building together)"],
              ["de- (down / away)", "struct (build)", "-ive (adjective: quality)", "destructive (tending to tear down)"],
              ["in- (into / upon)", "struct (build)", "-or (noun: person)", "instructor (one who builds knowledge)"],
              ["re- (again)", "struct (build)", "-ure (noun: state)", "restructure (to organize or build again)"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e5ly04-example",
        heading: "Worked Example: Decoding an Unfamiliar Scientific Term",
        problem:
          "Use morphological analysis to break down and define the unfamiliar word 'biodegradable'.",
        steps: [
          {
            stepNumber: 1,
            label: "Isolate the initial Greek morpheme",
            working: "'bio-' is a Greek root meaning 'life' or 'living organisms'.",
            why: "Identifying the root establishes the biological domain.",
          },
          {
            stepNumber: 2,
            label: "Isolate the Latin prefix and core root",
            working: "• Prefix 'de-' means 'down' or 'break down'.\n• Latin root 'grade' (from gradi) means 'step' or 'stage'. Together 'degrade' means to break down into simpler stages.",
            why: "Analyzing the base verb reveals the functional action.",
          },
          {
            stepNumber: 3,
            label: "Isolate the suffix and synthesize the complete definition",
            working: "• Suffix '-able' means 'capable of being'.\n• Synthesis: 'Capable of being broken down naturally by living biological organisms (like bacteria or fungi).'",
            why: "Combining all morphemes derives the precise dictionary meaning without guessing.",
          },
        ],
        finalAnswer:
          "Morphemes: bio (living organisms) + de (down) + grad (step/break) + able (capable of). Definition: Capable of being broken down and decomposed naturally by living organisms.",
        commonError: {
          mistake: "Guessing a word's meaning from how it sounds rather than analyzing its morphemes.",
          whyItHappens: "Relying on context clues alone when precise morphological analysis is available.",
          howToAvoid: "Split the word into prefix, root, and suffix chunks first.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5ly04-misconception",
        heading: "Misconception: Memorising Letter Lists Is the Only Way to Learn Spelling",
        claim: "You have to memorize thousands of individual words letter-by-letter to be a good speller.",
        whyWrong:
          "Rote memorisation is inefficient and easily forgotten. Understanding morphemic building blocks (roots, prefixes, suffixes) allows you to correctly spell and decode dozens of related words from a single root.",
        correction:
          "Study word roots and spelling rules rather than isolated weekly word lists.",
        example: "Learning the Latin root 'port' (carry) instantly unlocks portable, transport, report, export, import, and support.",
      },
      {
        kind: "check",
        id: "vc2e5ly04-check",
        heading: "Check Your Understanding",
        prompt: "Practise breaking down Greek and Latin roots, applying chameleon prefixes, and decoding multisyllabic vocabulary.",
        curriculumCode: "VC2E5LY04",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. VC2E5LY05: Irregular Plurals & Grammatical Shifts from Suffixation
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LY05",
    title: "Morphological Shifts: Suffixation and Irregular Plurals",
    strand: "literacy",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to form and spell irregular plural nouns and analyze how suffixes change a base word's part of speech and spelling (e.g. noun -> adjective -> adverb).",
    successCriteria: [
      "I can form irregular plurals from Old English (foot/feet, mouse/mice, child/children), Latin (cactus/cacti, radius/radii), and Greek (crisis/crises, phenomenon/phenomena).",
      "I can track part-of-speech transitions when adding suffixes (e.g. beauty [noun] -> beautiful [adjective] -> beautifully [adverb]).",
      "I can apply base word spelling modifications when adding vowel suffixes (drop the silent 'e', double the consonant, change 'y' to 'i').",
    ],
    prerequisites: ["VC2E5LY04"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5ly05-concept",
        heading: "Irregular Plurals and the Suffix Engine",
        explanation:
          "Not all plurals in English are formed by simply adding -s or -es.\n\n1. Irregular Plural Categories:\n• Vowel Mutation (Umlaut from Old English): foot -> feet; tooth -> teeth; goose -> geese; man -> men.\n• Archaic Plurals: child -> children; ox -> oxen; mouse -> mice; person -> people.\n• Zero Plural (No change): sheep -> sheep; deer -> deer; species -> species; aircraft -> aircraft.\n• Latin / Greek Plurals: cactus -> cacti; fungus -> fungi; crisis -> crises; phenomenon -> phenomena.\n\n2. Suffixation and Part-of-Speech Shifts:\nAdding suffixes transforms words into different grammatical classes:\n• Noun to Adjective: danger -> dangerous (-ous); courage -> courageous.\n• Adjective to Adverb: quick -> quickly (-ly); enthusiastic -> enthusiastically (-ally).\n• Verb to Noun: create -> creation (-ion); perform -> performance (-ance).\n\nThree Core Spelling Rules for Vowel Suffixes:\n1. Drop the silent 'e': fame + -ous = famous; debate + -able = debatable.\n2. Change 'y' to 'i': happy + -ness = happiness; rely + -able = reliable.\n3. Double final consonant: prefer + -ed = preferred (for accented final syllables).",
        keyTerms: [
          {
            term: "Irregular Plural",
            definition: "A plural noun that is not formed by adding standard -s or -es endings.",
          },
          {
            term: "Derivational Suffix",
            definition: "A suffix added to a base word that changes its grammatical word class (part of speech) or core meaning.",
          },
          {
            term: "Zero Plural",
            definition: "A noun whose singular and plural forms are completely identical (e.g. fish, sheep).",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5ly05-example",
        heading: "Worked Example: Tracking Morphological Word Transformation",
        problem:
          "Take the base noun 'mystery'. (a) Form its plural. (b) Add a suffix to turn it into an adjective. (c) Add another suffix to turn that adjective into an adverb. Apply all required spelling rules at each step.",
        steps: [
          {
            stepNumber: 1,
            label: "Form the plural of 'mystery'",
            working: "'Mystery' ends in a consonant + 'y'. Change 'y' to 'i' and add '-es': 'mysteries'.",
            why: "Standard plural rule for words ending in consonant + y.",
          },
          {
            stepNumber: 2,
            label: "Transform 'mystery' into an adjective using suffix '-ous'",
            working: "Base 'mystery' + '-ous': Change 'y' to 'i': 'mysterious'.",
            why: "The suffix -ous turns a noun into an adjective meaning 'full of' or 'characterized by'.",
          },
          {
            stepNumber: 3,
            label: "Transform adjective 'mysterious' into an adverb using suffix '-ly'",
            working: "Adjective 'mysterious' + '-ly' = 'mysteriously'.",
            why: "The suffix -ly converts descriptive adjectives into adverbs of manner.",
          },
        ],
        finalAnswer:
          "(a) Plural: mysteries; (b) Adjective: mysterious; (c) Adverb: mysteriously.",
        commonError: {
          mistake: "Forming regular plurals on irregular nouns (e.g. writing 'childs' or 'feets' or 'mouses').",
          whyItHappens: "Over-generalising the standard +s rule to historic Germanic irregulars.",
          howToAvoid: "Identify historic vowel mutation words (feet, teeth, geese, mice) and memorize their irregular plural forms.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5ly05-misconception",
        heading: "Misconception: All Words Ending in 'y' Change to 'i' Before Suffixes",
        claim: "Whenever a word ends in 'y', you always change it to 'i' when adding a suffix.",
        whyWrong:
          "If the 'y' is preceded by a VOWEL (e.g. play, enjoy, monkey, key), the 'y' stays intact! play + -ed = played (NOT plaid); monkey + -s = monkeys (NOT monkies). You only change 'y' to 'i' when preceded by a CONSONANT (city -> cities; hurry -> hurried).",
        correction:
          "Check the letter before 'y': Vowel + y = keep 'y'; Consonant + y = change to 'i'.",
        example: "enjoy -> enjoyed; rely -> relied.",
      },
      {
        kind: "check",
        id: "vc2e5ly05-check",
        heading: "Check Your Understanding",
        prompt: "Practise forming irregular plurals, applying vowel-suffix spelling rules, and shifting parts of speech.",
        curriculumCode: "VC2E5LY05",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. VC2E5LY06: Fluent Comprehension of Complex Texts Using Cueing Systems
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LY06",
    title: "Advanced Reading Comprehension: Multi-Layered Cueing Systems",
    strand: "literacy",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to integrate multiple reading cueing systems (semantic context, syntactic grammar, graphophonic word structures, and background knowledge) to comprehend challenging academic texts fluently.",
    successCriteria: [
      "I can monitor my own comprehension and apply self-correction strategies when a passage does not make sense.",
      "I can use syntactic clues (sentence structure and part of speech) and semantic context to determine the meaning of unknown words.",
      "I can cross-check textual cues with background knowledge to verify literal and inferential comprehension.",
    ],
    prerequisites: ["VC2E3LY06"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5ly06-concept",
        heading: "The Four Reading Cueing Systems",
        explanation:
          "Fluent readers do not rely on phonics alone. They orchestrate four simultaneous cueing systems to decode and understand complex text:\n\n1. Graphophonic Cues (Visual/Sound):\n   • 'Does it look right?' Using letter-sound patterns, syllables, prefixes, and roots to decode unfamiliar words.\n2. Syntactic Cues (Grammar/Structure):\n   • 'Does it sound right in English?' Using sentence grammar, clause structure, and parts of speech to predict what kind of word fits (e.g. recognizing that a blank after 'The extremely...' must be an adjective or noun).\n3. Semantic Cues (Meaning/Context):\n   • 'Does it make sense?' Using the topic, surrounding sentences, illustrations, and paragraph theme to deduce meaning.\n4. Pragmatic Cues (Social Purpose/Genre):\n   • 'What is the purpose of this text?' Understanding how text structure, tone, and cultural register shape interpretation.",
        keyTerms: [
          {
            term: "Comprehension Monitoring",
            definition: "The active metacognitive awareness of whether one is understanding a text, triggering re-reading when meaning breaks down.",
          },
          {
            term: "Syntactic Cue",
            definition: "Clues derived from word order, grammatical function, and sentence rules that help predict word identity.",
          },
          {
            term: "Semantic Cue",
            definition: "Clues derived from the overarching meaning, theme, and vocabulary context of a passage.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5ly06-example",
        heading: "Worked Example: Integrating Cues to Decode an Unfamiliar Word",
        problem:
          "Read this sentence: 'After the three-year drought parched the agricultural basin, the sudden torrential downpours proved to be a bountiful boon for local farmers.' How can a reader determine the meaning of 'boon' using syntactic and semantic cues?",
        steps: [
          {
            stepNumber: 1,
            label: "Apply Syntactic Cues (Grammatical position)",
            working: "In 'a bountiful boon for local farmers', 'a' is an article and 'bountiful' is an adjective. Therefore, 'boon' must be a singular noun.",
            why: "Syntax identifies the grammatical category of the target word.",
          },
          {
            stepNumber: 2,
            label: "Apply Semantic Cues (Contextual meaning)",
            working: "Context clues: 'three-year drought parched' (severe problem) contrasts with 'sudden torrential downpours' (relief) described as 'bountiful' (generous/positive) for 'farmers'.",
            why: "The semantic contrast indicates that the downpours provided a tremendous positive benefit or blessing.",
          },
          {
            stepNumber: 3,
            label: "Synthesize and verify definition",
            working: "'Boon' means a timely benefit, blessing, or helpful advantage.",
            why: "Combining syntax (noun) and semantics (positive blessing after drought) confirms the definition.",
          },
        ],
        finalAnswer:
          "Syntactic cues show 'boon' is a singular noun preceded by the positive adjective 'bountiful'. Semantic context contrasts the harsh three-year drought with the life-giving rain, proving 'boon' means a timely benefit, gift, or blessing for the farmers.",
        commonError: {
          mistake: "Skipping over difficult words entirely and continuing to read without understanding.",
          whyItHappens: "Failing to pause and apply repair strategies when comprehension breaks down.",
          howToAvoid: "When a sentence makes no sense, stop immediately: re-read, break words into morphemes, and examine surrounding clues.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5ly06-misconception",
        heading: "Misconception: Reading Fast Is the Primary Sign of Good Reading",
        claim: "A good reader is whoever reads the most words per minute.",
        whyWrong:
          "Reading quickly without comprehension is meaningless. True reading fluency balances speed, accuracy, expression, and deep cognitive understanding. Complex academic texts require slowing down to digest nuanced arguments.",
        correction:
          "Prioritise comprehension and active thinking over pure reading speed.",
        example: "A student who reads a science article thoughtfully and summarizes it accurately is far more skilled than one who races through without understanding.",
      },
      {
        kind: "check",
        id: "vc2e5ly06-check",
        heading: "Check Your Understanding",
        prompt: "Practise integrating syntactic, semantic, and graphophonic cues to decode challenging vocabulary and monitor comprehension.",
        curriculumCode: "VC2E5LY06",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. VC2E5LY07: Historical and Societal Reflections in Text Composition
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LY07",
    title: "Societal and Historical Perspectives in Writing",
    strand: "literacy",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to compose texts that authentically reflect historical eras, diverse cultural perspectives, and evolving societal values.",
    successCriteria: [
      "I can research and select authentic historical and cultural details to establish realistic settings and characters.",
      "I can portray diverse perspectives respectfully and avoid anachronisms (placing modern items or ideas in the wrong historical era).",
      "I can reflect societal themes (e.g. fairness, community resilience, environmental stewardship) in my own compositions.",
    ],
    prerequisites: ["VC2E5LE01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5ly07-concept",
        heading: "Bringing History and Society to Life in Writing",
        explanation:
          "When authors write historical narratives or social commentaries, they carefully construct a world that reflects the authentic realities of that time and place:\n\nKey Authorial Considerations:\n1. Setting and Material Culture: What tools, clothes, transport, and buildings existed? (e.g. In 1890, people travelled by horse-drawn coach, steam train, or on foot, and communicated via handwritten letter or telegraph).\n2. Avoiding Anachronisms: An anachronism is an error where something from one time period is mistakenly placed in another (e.g. a 19th-century gold miner checking his digital wristwatch).\n3. Social Attitudes and Values: Characters must reflect the beliefs, language etiquette, and social structures of their era rather than modern 21st-century habits.\n4. Respectful Cultural Representation: Portraying cultural traditions, First Nations heritage, and migrant experiences with authenticity and nuance.",
        keyTerms: [
          {
            term: "Anachronism",
            definition: "An object, custom, idea, or word that is mistakenly placed in a historical time period where it did not exist.",
          },
          {
            term: "Material Culture",
            definition: "The physical objects, resources, and architecture that people use to define their culture and daily life.",
          },
          {
            term: "Societal Values",
            definition: "The core principles, moral standards, and shared priorities held by a community or society during a specific era.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5ly07-example",
        heading: "Worked Example: Eliminating Anachronisms from a Historical Draft",
        problem:
          "Identify and fix two anachronisms in this draft set during the 1910s Australian wheat belt: 'After harvesting the golden wheat with his team of Clydesdale horses, Arthur sent a quick text to the grain silo on his phone and ate a chocolate bar in plastic wrapping.'",
        steps: [
          {
            stepNumber: 1,
            label: "Identify anachronistic technology and packaging",
            working:
              "• Anachronism 1: 'sent a quick text ... on his phone' (mobile phones and text messaging did not exist in the 1910s).\n• Anachronism 2: 'chocolate bar in plastic wrapping' (modern synthetic plastic food wrapping was not invented or widespread in 1910).",
            why: "Recognizing era-inconsistent artefacts restores historical fidelity.",
          },
          {
            stepNumber: 2,
            label: "Substitute with historically accurate 1910s alternatives",
            working:
              "• Replace phone text with: 'sent a handwritten telegram from the local railway post office' or 'dispatched a message via the horse-drawn mail coach'.\n• Replace plastic packaging with: 'unwrapped a slab of fruitcake wrapped in greaseproof brown paper'.",
            why: "Authentic artefacts ground the reader in the true sensory environment of the era.",
          },
        ],
        finalAnswer:
          "After harvesting the golden wheat with his team of Clydesdale horses, Arthur lodged a telegram at the railway outpost to alert the silo master, then unwrapped a slice of fruitcake packed in greaseproof brown paper.",
        commonError: {
          mistake: "Using modern slang or idioms in historical dialogue (e.g. an 1850s blacksmith saying 'No worries, that's totally cool').",
          whyItHappens: "Defaulting to modern everyday speech habits during creative drafting.",
          howToAvoid: "Read authentic primary sources or letters from that historical era to capture authentic vocabulary and phrasing.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5ly07-misconception",
        heading: "Misconception: Historical People Were Less Intelligent Than Us",
        claim: "People in the past were primitive and did not have complex emotions or clever ideas.",
        whyWrong:
          "Human intelligence and the depth of human emotions have remained constant throughout history. People in the past solved extraordinarily complex engineering, agricultural, and artistic challenges using the materials and tools available to them.",
        correction:
          "Portray historical characters as capable, intelligent humans navigating the specific constraints of their era.",
        example: "Indigenous agricultural and navigational knowledge demonstrated profound scientific understanding of land and astronomy.",
      },
      {
        kind: "check",
        id: "vc2e5ly07-check",
        heading: "Check Your Understanding",
        prompt: "Practise spotting anachronisms, researching historical settings, and incorporating authentic societal values into compositions.",
        curriculumCode: "VC2E5LY07",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. VC2E5LY08: Evaluating Structural Conventions & Rhetorical Devices
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LY08",
    title: "Rhetorical Devices and Structural Analysis Across Media",
    strand: "literacy",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to analyze and evaluate how authors and creators use rhetorical devices (rhetorical questions, rule of three, ethos/pathos/logos, inclusive pronouns) to position audiences across print and digital media.",
    successCriteria: [
      "I can identify and explain the intended effect of rhetorical questions, the rule of three (tricolon), and inclusive language ('we', 'our').",
      "I can evaluate how rhetorical appeals (logic/evidence, emotion, credibility) are balanced in persuasive texts.",
      "I can detect bias, spin, and emotive exaggeration in advertising and news media.",
    ],
    prerequisites: ["VC2E5LA02"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5ly08-concept",
        heading: "The Persuasive Toolkit: Rhetorical Devices",
        explanation:
          "Rhetoric is the art of persuasive speaking and writing. Skilled writers employ specific rhetorical devices to influence how an audience thinks and feels:\n\nKey Rhetorical Devices:\n• Rhetorical Question: A question asked for dramatic effect or to prompt reflection, where the intended answer is obvious ('Can we truly afford to ignore our planet's future?').\n• Rule of Three (Tricolon): Grouping words, phrases, or arguments into threes for rhythm, memorability, and power ('Reduce, reuse, recycle'; 'A government of the people, by the people, for the people').\n• Inclusive Language: Using 'we', 'us', and 'our' to make the audience feel directly involved and part of a unified group ('Together, we can transform our community').\n• High Modality vs Low Modality: Definite words ('must', 'will', 'crucial') vs hesitant words ('might', 'possibly').\n• Emotive Language: Words specifically chosen to evoke strong feelings of empathy, outrage, pride, or fear (e.g. 'abandoned and neglected' vs 'unsupervised').",
        keyTerms: [
          {
            term: "Rhetorical Device",
            definition: "A linguistic technique used by a writer or speaker to persuade or evoke an emotional response in an audience.",
          },
          {
            term: "Rule of Three (Tricolon)",
            definition: "The deliberate grouping of three parallel words, clauses, or examples to create a satisfying and memorable cadence.",
          },
          {
            term: "Inclusive Language",
            definition: "Words like 'we', 'our', and 'together' that build solidarity and shared responsibility with the reader.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5ly08-example",
        heading: "Worked Example: Analyzing Rhetorical Techniques in a Speech",
        problem:
          "Analyze the rhetorical devices in this campaign excerpt: 'Will we stand by while our local parks vanish? We must protect our green spaces, defend our wildlife, and secure our children's future. Together, we have the power to create lasting change.'",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the opening rhetorical question",
            working: "'Will we stand by while our local parks vanish?' is a rhetorical question designed to provoke guilt and urgency, positioning the listener to think 'No, we must not'.",
            why: "Rhetorical questions guide the audience to adopt the speaker's viewpoint automatically.",
          },
          {
            stepNumber: 2,
            label: "Identify the Rule of Three (Tricolon)",
            working: "'protect our green spaces [1], defend our wildlife [2], and secure our children's future [3]' is a classic tricolon using parallel verb phrases.",
            why: "Three balanced clauses build escalating rhythm and persuasive momentum.",
          },
          {
            stepNumber: 3,
            label: "Identify inclusive pronouns and high modality",
            working: "The repeated use of 'we', 'our', 'together' and high modality 'must' fosters collective empowerment and urgent obligation.",
            why: "Inclusive language unites the speaker and audience into a single shared cause.",
          },
        ],
        finalAnswer:
          "The speaker utilizes: (1) an urgent rhetorical question to challenge complacency; (2) a powerful Rule of Three ('protect... defend... secure...') to build rhythmic momentum; and (3) inclusive pronouns ('we', 'our', 'together') combined with high modality ('must') to unite the audience in collective action.",
        commonError: {
          mistake: "Assuming a rhetorical question expects the reader or audience to shout out an actual spoken answer.",
          whyItHappens: "Confusing interactive conversational questions with rhetorical styling.",
          howToAvoid: "A rhetorical question is designed to make the listener think and agree internally, not answer aloud.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5ly08-misconception",
        heading: "Misconception: Rhetorical Devices Are Only Found in Political Speeches",
        claim: "Rhetoric is only used by politicians giving big speeches on television.",
        whyWrong:
          "Rhetorical devices are everywhere in daily life: advertising slogans, charity appeals, news articles, book reviews, school captain speeches, and movie trailers all rely on rhetorical framing.",
        correction:
          "Recognize rhetoric across advertisements, websites, opinion articles, and everyday debates.",
        example: "A commercial saying 'Clean, fresh, and unbeatable' uses the Rule of Three to sell laundry detergent.",
      },
      {
        kind: "check",
        id: "vc2e5ly08-check",
        heading: "Check Your Understanding",
        prompt: "Practise identifying rhetorical questions, tricolons, inclusive language, and emotive framing in persuasive texts.",
        curriculumCode: "VC2E5LY08",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 9. VC2E5LY09: Evaluative Comprehension: Synthesis, Inference & Critical Thinking
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LY09",
    title: "Evaluative Comprehension: Inference, Synthesis and Critical Analysis",
    strand: "literacy",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to synthesize information across multiple texts, draw deep inferences using textual evidence, and critically evaluate an author's bias, credibility, and unstated assumptions.",
    successCriteria: [
      "I can synthesize (combine) facts and perspectives from two or more source texts into a unified summary.",
      "I can make deep inferences by combining 'clues in the text' with 'prior knowledge' to explain unstated motivations.",
      "I can identify an author's bias, underlying assumptions, and potential commercial or political motives.",
    ],
    prerequisites: ["VC2E3LY09", "VC2E5LY06"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5ly09-concept",
        heading: "Levels of Reading Comprehension",
        explanation:
          "Reading comprehension operates on three distinct levels of depth:\n\n1. Literal Comprehension ('On the Line'):\n   • Recalling facts, names, dates, and details explicitly written in black and white on the page.\n2. Inferential Comprehension ('Between the Lines'):\n   • Reading between the lines. Combining textual clues (word choices, character actions, body language) with your background knowledge to deduce what the author implies without stating directly:\n   Formula: Text Evidence + Background Knowledge = Inference.\n3. Evaluative / Critical Comprehension ('Beyond the Lines'):\n   • Synthesizing multiple texts, questioning the author's objectivity, evaluating evidence strength, identifying omitted viewpoints, and forming an independent judgment on the topic.",
        keyTerms: [
          {
            term: "Inference",
            definition: "A logical conclusion drawn from textual clues and prior background knowledge rather than explicit statements.",
          },
          {
            term: "Synthesis",
            definition: "Combining information, ideas, and perspectives from different sources into a coherent whole.",
          },
          {
            term: "Authorial Bias",
            definition: "A predisposition, leaning, or one-sided prejudice in a text that favours a particular viewpoint while downplaying alternatives.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5ly09-example",
        heading: "Worked Example: Synthesizing Two Perspectives on Renewable Energy",
        problem:
          "Source A states: 'Solar and wind farms generate clean electricity without emitting greenhouse gases, significantly reducing air pollution.' Source B states: 'Constructing solar and wind infrastructure requires extensive land clearing and rare-earth mineral mining, which can disrupt local wildlife habitats.' Synthesize these two sources into a balanced evaluative summary.",
        steps: [
          {
            stepNumber: 1,
            label: "Extract the core insight from Source A",
            working: "Source A highlights the primary operational environmental benefit: zero operational greenhouse gas emissions and cleaner air.",
            why: "Identifying the positive premise of Source A.",
          },
          {
            stepNumber: 2,
            label: "Extract the core insight from Source B",
            working: "Source B highlights the manufacturing and spatial costs: land footprint and ecological disruption from mineral extraction.",
            why: "Identifying the critical environmental caveat of Source B.",
          },
          {
            stepNumber: 3,
            label: "Synthesize both perspectives into a unified, balanced conclusion",
            working: "While renewable energy systems provide critical long-term climate benefits by eliminating operational greenhouse gas emissions, planners must carefully manage the land use and mineral mining impacts associated with their construction.",
            why: "True synthesis integrates complementary and conflicting data into a nuanced, comprehensive understanding.",
          },
        ],
        finalAnswer:
          "While renewable energy sources like solar and wind provide vital climate benefits by eliminating operational greenhouse emissions, their production and deployment require careful management to minimize land clearing and habitat disruption from mineral mining.",
        commonError: {
          mistake: "Treating synthesis as simply copying and pasting one sentence from each source with 'and' in between.",
          whyItHappens: "Failing to merge and reconcile the ideas in your own words.",
          howToAvoid: "Identify the shared topic, note where the sources agree or contrast, and write an integrated summary.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5ly09-misconception",
        heading: "Misconception: Inferring Is Just Making a Wild Guess",
        claim: "An inference is whatever you imagine or guess could happen.",
        whyWrong:
          "Inferences are NOT wild guesses. A valid inference must be anchored directly in tangible textual evidence. If you cannot point to specific words or actions in the text that support your deduction, your inference is unsupported.",
        correction:
          "Always cite the exact text clues that led to your inferential conclusion.",
        example: "If a character's 'knuckles were white as she slammed the door', you infer anger from physical evidence, not guessing.",
      },
      {
        kind: "check",
        id: "vc2e5ly09-check",
        heading: "Check Your Understanding",
        prompt: "Practise drawing evidence-based inferences, detecting authorial bias, and synthesizing multiple source texts.",
        curriculumCode: "VC2E5LY09",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 10. VC2E5LY10: Multi-Paragraph Text Creation for Targeted Audiences
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LY10",
    title: "Extended Writing: Multi-Paragraph Composition and Elaboration",
    strand: "literacy",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to plan and write coherent, multi-paragraph extended texts (persuasive essays, reports, narrative recounts) tailored precisely to specific audiences and purposes.",
    successCriteria: [
      "I can plan an extended text using a structured graphic organizer (introduction, body paragraphs with topic sentences, conclusion).",
      "I can elaborate on ideas using evidence, examples, statistical data, and detailed explanations.",
      "I can craft cohesive paragraph transitions that guide the reader smoothly between major sections.",
    ],
    prerequisites: ["VC2E5LA03", "VC2E5LA04"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5ly10-concept",
        heading: "Architecture of an Extended Multi-Paragraph Text",
        explanation:
          "Extended writing requires careful macro-planning to ensure ideas are logically developed rather than hastily dumped onto the page:\n\n1. Engaging Introduction:\n   • Background Context -> Clear Contention / Thesis Statement -> Preview of main points.\n2. Elaborated Body Paragraphs (PEEL / TEEL):\n   • Topic Sentence: Clear statement of the paragraph's central point.\n   • Elaboration / Evidence: Concrete facts, research data, or examples.\n   • Deep Explanation: Exploring the 'why' and 'how' with causal reasoning.\n   • Linking Sentence: Wrapping up and transitioning to the next concept.\n3. Powerful Conclusion:\n   • Restate the thesis in fresh words -> Synthesize main arguments -> Final impactful thought / call to action (NO new arguments introduced).",
        keyTerms: [
          {
            term: "Elaboration",
            definition: "Adding depth, detail, evidence, and explanation to expand and prove a core idea.",
          },
          {
            term: "Thesis Statement",
            definition: "A concise sentence in the introduction that clearly states the central contention or focus of the entire piece.",
          },
          {
            term: "Paragraph Transition",
            definition: "Words or phrases that bridge the end of one paragraph to the start of the next (e.g. 'Building upon these environmental concerns...').",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5ly10-example",
        heading: "Worked Example: Writing a Cohesive Paragraph Transition",
        problem:
          "Write a smooth paragraph transition between Body Paragraph 1 (about the health benefits of daily exercise) and Body Paragraph 2 (about the academic/cognitive benefits of physical activity).",
        steps: [
          {
            stepNumber: 1,
            label: "Review the conclusion of Paragraph 1 (Physical Health)",
            working: "Paragraph 1 established that daily physical activity strengthens cardiovascular endurance and boosts immunity.",
            why: "Transitions must acknowledge where the reader has just been.",
          },
          {
            stepNumber: 2,
            label: "Draft a bridging topic sentence for Paragraph 2 (Cognitive/Academic Focus)",
            working: "'In addition to these undeniable physical health advantages, regular exercise plays an equally vital role in enhancing cognitive function and academic performance.'",
            why: "Using an additive transition ('In addition to... equally vital...') seamlessly connects physical and mental domains.",
          },
        ],
        finalAnswer:
          "\"In addition to these undeniable physical health advantages, regular exercise plays an equally vital role in enhancing cognitive function and academic focus across the school day.\"",
        commonError: {
          mistake: "Starting every body paragraph with mechanical, robotic starters ('Firstly', 'Secondly', 'Thirdly').",
          whyItHappens: "Relying on elementary list formulas instead of conceptual transitions.",
          howToAvoid: "Connect the ideas themselves (e.g. 'Beyond environmental sustainability, the economic arguments are equally compelling...').",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5ly09-misconception",
        heading: "Misconception: Length Matters More Than Quality and Structure",
        claim: "A four-page rambling essay will always receive higher marks than a tightly structured two-page essay.",
        whyWrong:
          "Repetitive, padded writing that lacks structure and evidence loses marks. High-scoring writing is disciplined, clear, well-structured, and rigorously elaborated.",
        correction:
          "Focus on clarity, strong paragraph structure, and rich elaboration over empty word count.",
        example: "Three tightly argued, evidence-backed body paragraphs easily outperform six repetitive, unsubstantiated paragraphs.",
      },
      {
        kind: "check",
        id: "vc2e5ly10-check",
        heading: "Check Your Understanding",
        prompt: "Practise structuring extended essays, elaborating on core arguments, and crafting smooth paragraph transitions.",
        curriculumCode: "VC2E5LY10",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 11. VC2E5LY11: Collaborative and Independent Text Editing Against Criteria
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LY11",
    title: "Editing and Refining: Proofreading Against Success Criteria",
    strand: "literacy",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to review, edit, and refine our own and peers' writing using established rubric criteria to enhance vocabulary, sentence variety, clarity, and grammatical precision.",
    successCriteria: [
      "I can distinguish between 'revising' (improving ideas, structure, and word choices) and 'editing/proofreading' (correcting spelling, grammar, and punctuation).",
      "I can use the ARMS strategy (Add, Remove, Move, Substitute) to revise text for flow and impact.",
      "I can use the CUPS strategy (Capitals, Usage, Punctuation, Spelling) to proofread mechanics systematically.",
    ],
    prerequisites: ["VC2E5LA09", "VC2E5LY10"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5ly11-concept",
        heading: "The Two Phases of Writing Refinement",
        explanation:
          "Professional writers know that great writing happens in the editing phase. Refinement takes place in two distinct stages:\n\n1. Macro-Level Revision (ARMS):\n   • Add: Include sensory details, precise evidence, missing transition words, or descriptive noun qualifiers.\n   • Remove: Cut unnecessary words, repetitive phrases, and off-topic sentences.\n   • Move: Rearrange sentence order or paragraphs to improve logical sequence and flow.\n   • Substitute: Replace weak verbs ('went', 'got', 'said') and bland adjectives ('good', 'nice') with powerful, precise alternatives.\n\n2. Micro-Level Proofreading (CUPS):\n   • Capitals: Check proper nouns and sentence beginnings.\n   • Usage: Verify subject-verb agreement and tense consistency.\n   • Punctuation: Check commas, apostrophes, and quotation marks.\n   • Spelling: Verify tricky vowel combinations and Greek/Latin roots.",
        keyTerms: [
          {
            term: "Revision (ARMS)",
            definition: "The process of reworking text to improve content, structure, voice, and flow (Add, Remove, Move, Substitute).",
          },
          {
            term: "Proofreading (CUPS)",
            definition: "The final check for surface mechanics: Capitalisation, Usage, Punctuation, and Spelling.",
          },
          {
            term: "Peer Feedback",
            definition: "Constructive evaluation from a classmate based on objective success criteria and rubrics.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2e5ly11-example",
        heading: "Worked Example: Applying ARMS and CUPS to a Student Paragraph",
        problem:
          "Apply ARMS and CUPS to refine this rough draft: 'the scientists went into the dark cave they found a bunch of old bones that was very interesting and took lots of photos.'",
        steps: [
          {
            stepNumber: 1,
            label: "Apply ARMS (Substitute weak verbs, add precision)",
            working:
              "• Substitute 'went into' with 'ventured into the subterranean cavern'\n• Substitute 'a bunch of old bones' with 'fossilised skeletal remains'\n• Substitute 'very interesting' with 'unprecedented archaeological significance'\n• Substitute 'took lots of photos' with 'photographically documented the specimens'.",
            why: "Elevating vocabulary and adding descriptive noun groups enhances academic quality.",
          },
          {
            stepNumber: 2,
            label: "Apply CUPS (Fix run-on sentences, capitalization, and grammar)",
            working:
              "• Capitalise 'The scientists'\n• Fix run-on: split into two distinct sentences or join with a semicolon/conjunction\n• Fix subject-verb disagreement ('bones that was' -> 'bones that were').",
            why: "Ensures mechanical correctness and prevents comma splices.",
          },
        ],
        finalAnswer:
          "The paleontologists ventured deep into the limestone cavern. There, they discovered fossilised skeletal remains of unprecedented archaeological significance and systematically documented each specimen.",
        commonError: {
          mistake: "Checking for spelling only and declaring a draft 'finished' without revising weak sentence structures or repetitive words.",
          whyItHappens: "Confusing basic proofreading with comprehensive revision.",
          howToAvoid: "Always perform ARMS revision (content and vocabulary) BEFORE doing CUPS proofreading.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e5ly11-misconception",
        heading: "Misconception: Good Writers Get Everything Perfect on the First Draft",
        claim: "Talented authors write perfect masterpieces on their first try without editing.",
        whyWrong:
          "First drafts are meant to get ideas down quickly. Famous authors routinely write five, ten, or twenty revisions of a chapter, rewriting sentences and reorganizing paragraphs until the piece shines.",
        correction:
          "Treat the first draft as raw material to be sculpted and polished through revision.",
        example: "Editing is where clarity, voice, and brilliance are built.",
      },
      {
        kind: "check",
        id: "vc2e5ly11-check",
        heading: "Check Your Understanding",
        prompt: "Practise applying the ARMS and CUPS strategies to edit and polish student writing samples.",
        curriculumCode: "VC2E5LY11",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 12. VC2E5LY12: Fluent, Legible and Automatic Cursive Handwriting
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E5LY12",
    title: "Fluent Cursive Handwriting: Ergonomics, Joins and Speed",
    strand: "literacy",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to write with fluent, automatic, legible cursive handwriting using correct posture, pencil grip, slope, and standard entry/exit joins.",
    successCriteria: [
      "I can maintain proper ergonomic posture (feet flat, upright spine, paper angled, relaxed tripod grip).",
      "I can execute standard diagonal and horizontal joins (e.g. joining from baseline, joining from crossbars like 't', and joining from top letters like 'o', 'v', 'w', 'b').",
      "I can sustain neat, consistent letter slope, sizing, and ascender/descender proportions during extended timed writing.",
    ],
    prerequisites: ["VC2E3LY13"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text and concept structure authored specifically for Victorian Curriculum Level 5 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e5ly12-concept",
        heading: "Automaticity in Handwriting: Freeing Cognitive Bandwidth",
        explanation:
          "Handwriting automaticity occurs when forming letters requires zero conscious effort, allowing your brain to focus 100% of its cognitive energy on high-level vocabulary, structure, and creative ideas.\n\nKey Principles of Fluent Victorian Modern Cursive:\n1. Ergonomics: Sit with feet flat on the floor, spine upright, non-writing hand stabilizing the paper, and a relaxed dynamic tripod grip.\n2. Consistent Slope and Proportions:\n   • Letters should slope slightly forward with uniform angle.\n   • Body letters (a, c, e, m, n, o, r, s, u, v, w, x, z) fill the middle zone (x-height).\n   • Ascenders (b, d, h, k, l, t) reach up to the top line.\n   • Descenders (g, j, p, q, y) extend straight down into the lower zone.\n3. The Four Standard Joins:\n   • Diagonal joins to letters without ascenders (e.g. in, am, un).\n   • Diagonal joins to ascenders (e.g. th, ch, cl, sh).\n   • Horizontal top joins from letters ending at the x-height (e.g. on, wi, ve, re).\n   • Unjoined letters (break letters: letters ending to the left like 'b', 'p', 's' depending on style).\n\n*Note on Practice:* Handwriting is a physical fine-motor skill practised with pen and lined paper in the classroom.",
        keyTerms: [
          {
            term: "Automaticity",
            definition: "The ability to execute a motor skill (like handwriting) fluently and smoothly without conscious thought.",
          },
          {
            term: "Ascender",
            definition: "The portion of a lowercase letter (like b, d, h, l) that extends upward above the x-height line.",
          },
          {
            term: "Descender",
            definition: "The portion of a lowercase letter (like g, j, p, q, y) that extends downward below the baseline.",
          },
          {
            term: "Horizontal Join",
            definition: "A cursive joining stroke originating from the top line of letters like o, v, w, and b to connect to the next letter.",
          },
        ],
      },
      {
        kind: "misconception",
        id: "vc2e5ly12-misconception",
        heading: "Misconception: In the Digital Age, Handwriting Doesn't Matter",
        claim: "We have keyboards and touchscreens, so learning fluent cursive is a waste of time.",
        whyWrong:
          "Brain imaging research shows that handwriting stimulates neural pathways for reading, language memory, and conceptual retention far more effectively than typing. Furthermore, exams and written notes still require rapid, legible physical handwriting.",
        correction:
          "Fluent handwriting strengthens cognitive memory and provides vital exam speed.",
        example: "Students who write fluent cursive take notes faster and remember key concepts longer.",
      },
    ],
  },
]);
