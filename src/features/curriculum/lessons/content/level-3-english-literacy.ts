import type { Lesson } from "../schema";

export const LEVEL_3_ENGLISH_LITERACY_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2E3LY01: Oral Interaction in Group Discussions (Classroom / Non-Digital)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY01",
    title: "Spoken Interaction: Clarifying Questions and Contributing in Groups",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to contribute constructive ideas and ask clarifying questions in collaborative group discussions to deepen shared understanding.",
    successCriteria: [
      "I can formulate clarifying questions (e.g. 'Can you give an example of what that means?') when an idea is unclear.",
      "I can stay focused on the group's central inquiry goal.",
      "I can encourage quiet group members to share their thoughts respectfully.",
    ],
    prerequisites: [],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text and concept structure authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly01-concept-1",
        heading: "Mastering Oral Group Interactions",
        explanation:
          "Speaking and listening in teams is a vital life skill. In Level 3, effective group contributors practice three essential communication habits:\n\n1. **Asking Clarifying Questions:** When someone shares an idea you don't fully understand, ask open-ended questions to unpack their thinking:\n• 'What led you to that conclusion?'\n• 'How does that link back to our main topic?'\n• 'Could you show me where that happens in the text?'\n\n2. **Keeping the Group on Track:** If talk drifts away from the question, gently redirect the team: 'Let's check back on our main question: what was the character's motivation?'\n\n3. **Encouraging Balanced Contributions:** Ensure every voice is heard by inviting peers who haven't spoken yet: 'Sam, what do you think about this step?'\n\n*Note on Practice:* This oral communication standard is practised live through classroom group projects, literature discussions, and inquiry circles.",
        keyTerms: [
          {
            term: "Clarifying Question",
            definition: "A question asked to clear up confusion or request more specific details about someone's idea.",
          },
          {
            term: "Open-Ended Question",
            definition: "A question that requires an explanation or elaboration rather than a simple one-word 'yes' or 'no'.",
          },
          {
            term: "Facilitation",
            definition: "Helping a group conversation flow smoothly and ensuring all members participate.",
          },
        ],
        visualAsset: {
          id: "vc2e3ly01-clarifying-stems-table",
          type: "table",
          altText:
            "Table displaying effective clarifying question stems for classroom inquiry groups.",
          title: "Clarifying Question Stems for Group Inquiry",
          data: {
            headers: ["Inquiry Need", "Clarifying Question Stem", "Why It Helps the Group"],
            rows: [
              ["Need more detail", "'Could you tell us more about why you think...?'", "Prompts the speaker to elaborate on their initial thought."],
              ["Checking understanding", "'Are you saying that [...] or did you mean something else?'", "Verifies interpretation before the group moves on."],
              ["Finding evidence", "'Which part of our research or data supports that point?'", "Keeps arguments anchored in verifiable facts."],
              ["Inviting others", "'We haven't heard from Noah yet — what are your thoughts, Noah?'", "Creates an inclusive, balanced discussion culture."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly01-misconception",
        heading: "Common Trap: Thinking Asking Questions Means You Are Not Smart",
        claim: "Asking a teammate to explain their idea means you weren't paying attention or don't understand.",
        whyWrong:
          "Asking sharp, thoughtful clarifying questions is the hallmark of advanced critical thinkers. It shows you are actively analyzing the idea and want to explore it deeper.",
        correction:
          "Great questions help the whole group think deeper and prevent costly misunderstandings.",
        example: "Asking 'Why did that happen?' pushes the team to uncover hidden causes.",
      },
      {
        kind: "check",
        id: "vc2e3ly01-check",
        heading: "Check Your Understanding",
        prompt:
          "This oral interaction standard is practised in classroom group projects, literature circles, and collaborative investigations.",
        curriculumCode: "VC2E3LY01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2E3LY02: Spoken Text Delivery (Classroom / Non-Digital)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY02",
    title: "Spoken Delivery: Clear Volume, Pace, Tone and Audience Engagement",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to deliver spoken presentations with audible volume, appropriate pacing, clear vocal projection, and engaging body language.",
    successCriteria: [
      "I can project my voice clearly so that everyone in the room can hear without shouting.",
      "I can control my speaking pace, pausing at key points for dramatic effect and audience comprehension.",
      "I can use natural eye contact, confident posture, and expressive tone to engage listeners.",
    ],
    prerequisites: ["VC2E3LY01"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text and concept structure authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly02-concept-1",
        heading: "The Elements of Confident Spoken Delivery",
        explanation:
          "Delivering a speech, story, or project presentation requires combining voice, body, and audience connection:\n\n1. **Voice Projection & Volume:** Project from your diaphragm so listeners at the back of the classroom can hear every word clearly. Projecting is not shouting — it is clear, resonant, and controlled.\n2. **Pacing & Strategic Pauses:** Nervous speakers tend to rush. Slow down! Taking a 2-second pause after a key point allows the audience to digest your message and creates dramatic emphasis.\n3. **Intonation & Expression:** Avoid a robotic monotone. Vary your pitch to express excitement, curiosity, urgency, or seriousness.\n4. **Body Language & Eye Contact:** Stand tall with relaxed shoulders. Look across the audience (left, centre, right) rather than staring down at cue cards.\n\n*Note on Practice:* This public speaking standard is practised through classroom show-and-tell, oral book reviews, poetry recitations, and debate presentations.",
        keyTerms: [
          {
            term: "Vocal Projection",
            definition: "Directing the voice with clarity and sufficient breath power so it carries cleanly across a room.",
          },
          {
            term: "Pacing",
            definition: "The speed at which you speak, balanced to be neither too rushed nor too sluggish.",
          },
          {
            term: "Intonation",
            definition: "The rise and fall of the voice pitch that gives emotional expression to spoken words.",
          },
        ],
        visualAsset: {
          id: "vc2e3ly02-presentation-checklist-table",
          type: "table",
          altText:
            "Table outlining the four pillars of effective spoken presentations: Volume, Pace, Expression, and Posture.",
          title: "Public Speaking & Spoken Delivery Checklist",
          data: {
            headers: ["Pillar", "Great Presentation Practice", "Common Delivery Trap to Avoid"],
            rows: [
              ["Volume", "Clear, projected voice reaching the back row easily.", "Mumbling quietly into cue cards."],
              ["Pacing", "Measured, calm rhythm with 2-second pauses after big points.", "Rushing through sentences without taking a breath."],
              ["Expression", "Lively pitch changes matching the mood of the topic.", "Flat, robotic monotone reading."],
              ["Eye Contact", "Scanning the whole audience and smiling warmly.", "Staring exclusively at the floor or paper notes."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly02-misconception",
        heading: "Common Trap: Reading Every Word from a Script",
        claim: "A great speaker writes out their whole speech and reads every single word word-for-word.",
        whyWrong:
          "Reading full sentences keeps your eyes glued to the paper, eliminates eye contact, and makes your voice sound flat and unnatural.",
        correction:
          "Use brief dot-point cue cards with keywords to trigger your memory, allowing you to speak naturally while looking at your audience.",
        example: "Having a card that says '• Diet: eucalyptus, 500g daily' allows you to look up and explain the facts conversationally.",
      },
      {
        kind: "check",
        id: "vc2e3ly02-check",
        heading: "Check Your Understanding",
        prompt:
          "This spoken delivery standard is practised in classroom speeches, poetry recitals, drama performances, and project presentations.",
        curriculumCode: "VC2E3LY02",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2E3LY03: Phonic Decoding and Syllable Segmentation
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY03",
    title: "Phonics and Decoding: Syllable Splitting and Multisyllabic Words",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to decode complex multisyllabic words using syllable division rules (rabbit, tiger, camel, and consonant-le patterns) and phonemic blending.",
    successCriteria: [
      "I can count and clap the vowel beats (syllables) in long words.",
      "I can apply the VC/CV (rabbit rule) to split between twin or distinct middle consonants (e.g. rab-bit, nap-kin).",
      "I can decode open syllables (long vowel: ti-ger) and closed syllables (short vowel: cam-el).",
    ],
    prerequisites: [],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly03-concept",
        heading: "Mastering Multisyllabic Word Decoding",
        explanation:
          "When you meet a long, unfamiliar word in a book, don't guess! Break the word down into smaller, decodable **syllables** (every syllable must contain exactly one vowel sound):\n\n1. **Closed Syllables (Short Vowel):** End in a consonant that 'closes in' the vowel, making it short (e.g. *cat, pic-nic, rab-bit*).\n2. **Open Syllables (Long Vowel):** End in an open vowel with no closing consonant, making the vowel say its name (e.g. *ti-ger, mu-sic, ro-bot*).\n\n**The 4 Golden Syllable Division Rules:**\n• **VC/CV (Rabbit Rule):** If two consonants sit between two vowels, split between the consonants: *rab-bit, sud-den, nap-kin, doc-tor*.\n• **V/CV (Tiger Rule):** Split before a single middle consonant to leave an open first syllable with a long vowel: *ti-ger, pi-lot, ba-by*.\n• **VC/V (Camel Rule):** If the first vowel is short, split after the middle consonant: *cam-el, rob-in, cab-in*.\n• **-CLE (Consonant-le Rule):** Count back 3 letters from the end for words ending in -le: *can-dle, tur-tle, ta-ble*.",
        keyTerms: [
          {
            term: "Syllable",
            definition: "A single unit of spoken sound formed with one vowel beat (e.g. 'com-pu-ter' has 3 syllables).",
          },
          {
            term: "Closed Syllable",
            definition: "A syllable ending in a consonant that produces a short vowel sound (e.g. 'nap').",
          },
          {
            term: "Open Syllable",
            definition: "A syllable ending in a vowel that produces a long vowel sound (e.g. 'ti' in tiger).",
          },
        ],
        visualAsset: {
          id: "vc2e3ly03-syllable-rules-table",
          type: "table",
          altText:
            "Table demonstrating the four core syllable division patterns: Rabbit, Tiger, Camel, and Consonant-le.",
          title: "The 4 Core Syllable Division Patterns",
          data: {
            headers: ["Pattern Name", "Rule Structure", "Division Point", "Decodable Word Examples"],
            rows: [
              ["Rabbit Rule (VC/CV)", "Two consonants between vowels", "Split between the consonants", "nap-kin, den-tist, bas-ket, sud-den"],
              ["Tiger Rule (V/CV)", "One consonant, long first vowel", "Split before the consonant", "ti-ger, pa-per, ro-bot, mu-sic"],
              ["Camel Rule (VC/V)", "One consonant, short first vowel", "Split after the consonant", "cam-el, rob-in, lem-on, plan-et"],
              ["Consonant-le (-CLE)", "Word ends in consonant + le", "Count back 3 letters from end", "can-dle, tur-tle, ap-ple, mar-ble"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3ly03-example",
        heading: "Worked Example: Decoding a 3-Syllable Unfamiliar Word",
        problem:
          "Demonstrate how to break down and decode the multisyllabic word: **fantastic** step by step using syllable rules.",
        steps: [
          {
            stepNumber: 1,
            label: "Spot and count the vowel sounds",
            working:
              "Identify the vowels: 'a' in fan, 'a' in tas, 'i' in tic. There are 3 vowel sounds, meaning the word has exactly 3 syllables.",
            why: "Every syllable contains exactly one distinct vowel sound.",
          },
          {
            stepNumber: 2,
            label: "Apply the VC/CV rule to the first division",
            working:
              "Between the first two vowels (a and a), we see two consonants 'nt'. Apply the Rabbit rule: split between 'n' and 't' → **fan / tas**.",
            why: "Splitting between double middle consonants creates closed, easy-to-read syllables.",
          },
          {
            stepNumber: 3,
            label: "Apply the VC/CV rule to the second division",
            working:
              "Between the second and third vowels (a and i), we see two consonants 'st'. Apply the Rabbit rule: split between 's' and 't' → **tas / tic**.",
            why: "Separating 's' and 't' completes the chunking.",
          },
          {
            stepNumber: 4,
            label: "Blend the 3 syllables together fluently",
            working:
              "Read each chunk: fan (short a) + tas (short a) + tic (short i) = **fan-tas-tic** → 'fantastic'.",
            why: "Reading three simple closed syllables in sequence reveals the complete word effortlessly.",
          },
        ],
        finalAnswer:
          "The word 'fantastic' splits into 3 closed syllables: **fan-tas-tic**. By decoding chunk by chunk, the reader blends the syllables into 'fantastic'.",
        commonError: {
          mistake: "Trying to guess long words from just the first letter and picture.",
          whyItHappens:
            "Reverting to guessing habits when faced with 3-syllable words.",
          howToAvoid:
            "Always pick up your finger and divide the word at consonant boundaries (VC/CV).",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly03-misconception",
        heading: "Common Trap: Counting Letters Instead of Vowel Sounds",
        claim: "Every word with 6 letters must have 3 syllables.",
        whyWrong:
          "Syllable count depends strictly on vowel *sounds*, not letter counts. The word 'flight' has 6 letters but only 1 syllable (1 vowel sound /igh/).",
        correction:
          "Count the vowel beats you hear when saying the word aloud, not the number of letters written.",
        example: "'Straight' has 8 letters but only 1 syllable; 'area' has 4 letters and 3 syllables (a-re-a).",
      },
      {
        kind: "check",
        id: "vc2e3ly03-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise splitting multisyllabic words using the rabbit, tiger, and consonant-le rules.",
        curriculumCode: "VC2E3LY03",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. VC2E3LY04: Morphological Awareness (Prefixes, Suffixes, Base Words)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY04",
    title: "Word Structure: Prefixes, Suffixes, Base Words and Spelling Changes",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify base words, prefixes, and suffixes, and apply spelling rules when adding suffixes (drop the e, double the consonant, change y to i).",
    successCriteria: [
      "I can identify common prefixes (un-, re-, dis-, pre-, mis-) and explain how they change a base word's meaning.",
      "I can identify common suffixes (-ful, -less, -ly, -ness, -tion) and explain how they change a word's grammatical class.",
      "I can apply the 3 core suffix spelling rules: Drop the silent 'e' (hope → hoping), Double the consonant (hop → hopping), and Change 'y' to 'i' (happy → happily).",
    ],
    prerequisites: ["VC2E3LY03"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly04-concept",
        heading: "Morphology: The Building Blocks of English Words",
        explanation:
          "**Morphology** is the study of meaningful word parts (morphemes):\n\n1. **Base Word (Root):** The core word that holds the central meaning (e.g. *play, build, friend, help*).\n2. **Prefix (Added to the front):** Alters the meaning of the base:\n• *un-* (not / opposite): *unhappy, unlock*\n• *re-* (again / back): *rebuild, rewrite*\n• *dis-* (not / opposite): *disagree, disappear*\n• *mis-* (wrongly): *misunderstand, misplace*\n3. **Suffix (Added to the end):** Changes word class or tense:\n• *-ful* (full of): *hopeful, playful*\n• *-less* (without): *fearless, endless*\n• *-ly* (in a manner): *bravely, smoothly*\n\n**The 3 Golden Suffix Spelling Rules:**\n• **Drop the 'e' Rule:** Drop the silent final 'e' before adding a vowel suffix: *make + ing → making; care + ed → cared*.\n• **Double the 1-1-1 Consonant Rule:** For 1-syllable words with 1 short vowel and 1 ending consonant, double the consonant before a vowel suffix: *hop + ing → hopping; run + er → runner*.\n• **Change 'y' to 'i' Rule:** If a consonant comes before 'y', change 'y' to 'i' before adding a suffix (except -ing): *happy + ly → happily; heavy + est → heaviest*.",
        keyTerms: [
          {
            term: "Base Word",
            definition: "A standalone word to which prefixes and suffixes can be added to create new words.",
          },
          {
            term: "Prefix",
            definition: "A meaningful letter group added to the beginning of a base word to alter its meaning.",
          },
          {
            term: "Suffix",
            definition: "A letter group added to the end of a base word that changes its grammatical function or meaning.",
          },
        ],
        visualAsset: {
          id: "vc2e3ly04-suffix-rules-table",
          type: "table",
          altText:
            "Table displaying the three major suffix spelling rules with base words, suffix additions, and correct spelling.",
          title: "The 3 Golden Suffix Spelling Rules",
          data: {
            headers: ["Rule Name", "Condition", "Base Word + Suffix", "Correct Transformation"],
            rows: [
              ["Drop the 'e'", "Base ends in silent e + vowel suffix", "shine + ing", "shin**ing** (drop e)"],
              ["Drop the 'e'", "Base ends in silent e + vowel suffix", "create + or", "creat**or** (drop e)"],
              ["Double Consonant (1-1-1)", "1 syllable, 1 short vowel, 1 consonant", "swim + ing", "swim**ming** (double m)"],
              ["Double Consonant (1-1-1)", "1 syllable, 1 short vowel, 1 consonant", "stop + ed", "stop**ped** (double p)"],
              ["Change 'y' to 'i'", "Consonant before 'y' + suffix", "beauty + ful", "beaut**iful** (y → i)"],
              ["Change 'y' to 'i'", "Consonant before 'y' + suffix", "easy + ly", "eas**ily** (y → i)"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3ly04-example",
        heading: "Worked Example: Deconstructing and Transforming Words with Affixes",
        problem:
          "Transform each base word by adding the requested suffix, applying the correct spelling rule: (a) **bake** + **ing**; (b) **slip** + **ed**; (c) **lonely** + **ness**.",
        steps: [
          {
            stepNumber: 1,
            label: "Transform (a): bake + ing",
            working:
              "'Bake' ends in a silent 'e', and '-ing' starts with a vowel. Apply the 'Drop the e' rule: drop 'e' and add 'ing' → **baking**.",
            why: "When adding a vowel suffix to a word ending in silent e, the e is dropped.",
          },
          {
            stepNumber: 2,
            label: "Transform (b): slip + ed",
            working:
              "'Slip' is a 1-syllable word with 1 short vowel (i) and 1 ending consonant (p) [1-1-1 word]. '-ed' is a vowel suffix. Apply the 'Double the consonant' rule: double 'p' and add 'ed' → **slipped**.",
            why: "Doubling the consonant protects the short vowel sound so it doesn't sound like 'sliped'.",
          },
          {
            stepNumber: 3,
            label: "Transform (c): lonely + ness",
            working:
              "'Lonely' ends in 'y' preceded by a consonant 'l'. Apply the 'Change y to i' rule: change 'y' to 'i' and add 'ness' → **loneliness**.",
            why: "A consonant before y changes to i before adding suffixes like -ness, -ly, -ful, -est.",
          },
        ],
        finalAnswer:
          "(a) bake + ing = **baking** (Drop the e). (b) slip + ed = **slipped** (Double the consonant). (c) lonely + ness = **loneliness** (Change y to i).",
        commonError: {
          mistake: "Writing 'hopeing' or 'sliped' (forgetting the spelling modifications).",
          whyItHappens:
            "Gluing the suffix onto the base word without checking the ending letters.",
          howToAvoid:
            "Always test the 3 checkpoints: 1. Does it end in silent e? 2. Is it a 1-1-1 short vowel word? 3. Does it end in consonant-y?",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly04-misconception",
        heading: "Common Trap: Changing 'y' to 'i' when adding -ing",
        claim: "'Crying' should be spelled 'criing' because of the change y to i rule.",
        whyWrong:
          "English avoids having double 'i' (ii). Therefore, the 'y to i' rule does NOT apply when adding the suffix **-ing**.",
        correction:
          "Keep the 'y' when adding -ing: cry + ing = crying; play + ing = playing; study + ing = studying.",
        example: "carry → carried (y → i for -ed), but carry → carrying (keep y for -ing).",
      },
      {
        kind: "check",
        id: "vc2e3ly04-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying prefixes, suffixes, base words, and applying the 3 suffix spelling rules.",
        curriculumCode: "VC2E3LY04",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. VC2E3LY05: Complex Phonic Grapheme Patterns
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY05",
    title: "Complex Spelling: Less Common Letter Combinations and Silent Letters",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to recognize and spell complex and less common grapheme patterns, including silent letter digraphs (kn, wr, gn, mb) and alternative vowel representations.",
    successCriteria: [
      "I can read and spell silent letter combinations: kn (knight, knee), wr (write, wrap), gn (gnome, gnaw), and mb (climb, thumb).",
      "I can identify less common vowel graphemes (e.g. 'ea' sounding like /e/ in head; 'ou' sounding like /u/ in touch).",
      "I can use visual memory and etymology (word origin) to remember tricky letter combinations.",
    ],
    prerequisites: ["VC2E3LY04"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly05-concept",
        heading: "Mastering Silent Letters and Tricky Graphemes",
        explanation:
          "English is a fascinating language that has borrowed words from Old English, French, Greek, and Latin over hundreds of years. Because of this history, some letters are written but no longer pronounced:\n\n1. **Silent Consonant Digraphs:**\n• **kn- (sounds like /n/):** *knight, knife, knee, knock, knot, know* (hundreds of years ago, the 'k' was actually pronounced!).\n• **wr- (sounds like /r/):** *wrist, write, wrap, wreck, wrong, wrestle*.\n• **gn- (sounds like /n/):** *gnome, gnaw, gnat, sign, design*.\n• **-mb (sounds like /m/):** *thumb, climb, lamb, crumb, comb, numb*.\n• **-gh- / -igh (sounds like /i/ or /f/):** *night, bright, thought, tough, laugh*.\n\n2. **Alternative Vowel Sounds:**\n• 'ea' sounding like short /e/: *head, bread, heavy, leather, feather*.\n• 'ch' sounding like /k/ (from Greek): *school, echo, anchor, stomach, ache*.",
        keyTerms: [
          {
            term: "Silent Letter",
            definition: "A letter in a word that is written but not pronounced when spoken aloud (e.g. the 'k' in 'knee').",
          },
          {
            term: "Grapheme",
            definition: "A letter or group of letters that represents a specific sound (phoneme) in spelling.",
          },
          {
            term: "Etymology",
            definition: "The historical origin and development of a word's meaning and spelling.",
          },
        ],
        visualAsset: {
          id: "vc2e3ly05-silent-letters-table",
          type: "table",
          altText:
            "Table showcasing silent letter patterns (kn, wr, gn, mb, ch as k) with examples and mnemonic memory aids.",
          title: "Complex Spelling & Silent Letter Reference Guide",
          data: {
            headers: ["Grapheme Pattern", "Pronounced Sound", "Silent Letter", "Word Bank Examples"],
            rows: [
              ["kn-", "/n/", "Silent k", "knight, knock, knee, knife, knot, know"],
              ["wr-", "/r/", "Silent w", "write, wrist, wrap, wrong, wreck, wreath"],
              ["gn-", "/n/", "Silent g", "gnome, gnat, gnaw, sign, design"],
              ["-mb", "/m/", "Silent b", "climb, thumb, lamb, comb, crumb, numb"],
              ["ch (Greek)", "/k/", "None (ch says /k/)", "school, echo, stomach, anchor, chemist"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3ly05-example",
        heading: "Worked Example: Selecting Correct Grapheme Patterns in Sentences",
        problem:
          "Choose the correct spelling pattern to complete each word: (a) The brave [ nite / knight ] rode his horse. (b) Please [ wrap / rap ] the birthday present neatly. (c) He hurt his [ thum / thumb ] while hammering.",
        steps: [
          {
            stepNumber: 1,
            label: "Analyze word (a): medieval warrior",
            working:
              "The word represents an armoured medieval warrior. The homophone with 'kn-' means warrior: **knight**. ('Night' means after sunset).",
            why: "Distinguishing silent 'kn' from 'n' prevents homophone confusion.",
          },
          {
            stepNumber: 2,
            label: "Analyze word (b): covering a parcel",
            working:
              "The word means covering or folding paper around an object. The spelling with silent 'wr-' means to package: **wrap**. ('Rap' means a quick knock or music genre).",
            why: "Silent 'wr' signifies twisting, wrapping, or writing actions.",
          },
          {
            stepNumber: 3,
            label: "Analyze word (c): finger anatomy",
            working:
              "The short first digit on the hand has a silent final 'b': **thumb**.",
            why: "Words like thumb, crumb, and limb retain their historical silent 'b'.",
          },
        ],
        finalAnswer:
          "(a) **knight**; (b) **wrap**; (c) **thumb**.",
        commonError: {
          mistake: "Spelling purely by ear without silent letters (e.g. writing 'rite' for write, 'lam' for lamb, 'neel' for kneel).",
          whyItHappens:
            "Relying on simple phonetic translation rather than orthographic memory of silent digraphs.",
          howToAvoid:
            "Group silent letter words into semantic families (e.g. body parts with silent letters: wrist, knee, thumb).",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly05-misconception",
        heading: "Common Trap: Assuming Silent Letters are Random Mistakes",
        claim: "Silent letters in English are useless mistakes that should be removed.",
        whyWrong:
          "Silent letters preserve word history (etymology) and help readers instantly tell homophones apart in reading (e.g. 'knight' vs 'night', 'knot' vs 'not', 'write' vs 'right').",
        correction:
          "Silent letters are vital visual markers that prevent confusion when reading written texts.",
        example: "'The knight rode in the night' uses 'k' so readers instantly know who is riding!",
      },
      {
        kind: "check",
        id: "vc2e3ly05-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise spelling words with silent letters (kn, wr, gn, mb) and less common vowel digraphs.",
        curriculumCode: "VC2E3LY05",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. VC2E3LY06: Homophones and High-Frequency Words
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY06",
    title: "Homophones and Tricky Words: Distinguishing Sound-Alikes",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to distinguish, correctly spell, and use common homophones (words that sound identical but have different spellings and meanings) in our writing.",
    successCriteria: [
      "I can explain that homophones sound the same when spoken, but have different spellings and meanings.",
      "I can correctly use the there / their / they're and to / too / two triplets.",
      "I can use contextual memory tricks to select the correct homophone (e.g. piece of pie = piece; peace = no war).",
    ],
    prerequisites: ["VC2E3LY04"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly06-concept",
        heading: "Mastering Tricky Homophones",
        explanation:
          "**Homophones** (from Greek *homo* = same, *phone* = sound) are words that sound exactly the same when spoken, but have different spellings and distinct meanings:\n\n**The Big Triplets:**\n1. **There / Their / They're:**\n• **There (Place):** Contains the word *here* (places: over there, here and there).\n• **Their (Ownership):** Contains the word *heir* (belongs to them: their dog, their books).\n• **They're (Contraction):** Short for *they are* (e.g. They're going to the zoo).\n\n2. **To / Too / Two:**\n• **Two (Number 2):** Spelled with a 'w' like twin or twice.\n• **Too (Excess / Also):** Has an extra 'o' because it means 'too much' or 'as well'.\n• **To (Direction / Action):** Walking *to* the park; ready *to* run.\n\n**Common Homophone Pairs:**\n• *piece* (a slice of something) vs *peace* (calm, no fighting)\n• *weather* (sun, rain) vs *whether* (choice between two options)\n• *flour* (baking powder) vs *flower* (blossom in a garden)",
        keyTerms: [
          {
            term: "Homophone",
            definition: "A word that sounds the same as another word, but has a different spelling and meaning.",
          },
          {
            term: "Contextual Clue",
            definition: "Using the meaning of the surrounding sentence to decide which homophone spelling is required.",
          },
        ],
        visualAsset: {
          id: "vc2e3ly06-homophones-table",
          type: "table",
          altText:
            "Table detailing common Level 3 homophones, their definitions, and memory tricks.",
          title: "Level 3 Homophone Master Guide & Memory Tricks",
          data: {
            headers: ["Homophone Group", "Word & Definition", "Memory Trick", "Example in Context"],
            rows: [
              ["There / Their / They're", "**There** = A physical location", "Look for the word *here* inside t-**here**", "Put the box over **there**."],
              ["There / Their / They're", "**Their** = Belongs to them", "Shows possession by people (th-**eir**)", "The students packed **their** bags."],
              ["There / Their / They're", "**They're** = Short for 'they are'", "Has an apostrophe replacing 'a'", "**They're** playing basketball."],
              ["To / Too / Two", "**Two** = The number 2", "Connected to *tw*in, *tw*elve, *tw*ice", "I have **two** pet rabbits."],
              ["To / Too / Two", "**Too** = As well / Excessive", "Has an extra 'o' (too many o's!)", "The tea is **too** hot to drink."],
              ["To / Too / Two", "**To** = Movement / Direction", "Single 'o' for travelling direction", "We walked **to** the station."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3ly06-example",
        heading: "Worked Example: Selecting Correct Homophones in a Paragraph",
        problem:
          "Choose the correct homophones in parentheses to complete the text: 'The children took [ their / there / they're ] bicycles [ to / too / two ] the park. [ Their / There / They're ] excited because [ its / it's ] sunny outside.'",
        steps: [
          {
            stepNumber: 1,
            label: "Select homophone 1: '[ their / there / they're ] bicycles'",
            working:
              "The bicycles belong to the children (possession). The correct possessive spelling is **their**.",
            why: "'Their' indicates ownership by a group.",
          },
          {
            stepNumber: 2,
            label: "Select homophone 2: '[ to / too / two ] the park'",
            working:
              "Travelling towards a destination represents direction. The correct spelling is **to**.",
            why: "'To' shows movement toward a location.",
          },
          {
            stepNumber: 3,
            label: "Select homophone 3: '[ Their / There / They're ] excited'",
            working:
              "Test with 'They are': 'They are excited' makes complete sense. Therefore, use the contraction **They're**.",
            why: "If 'they are' fits grammatically, the contraction 'they're' is mandatory.",
          },
          {
            stepNumber: 4,
            label: "Select homophone 4: 'because [ its / it's ] sunny'",
            working:
              "Test with 'it is': 'because it is sunny' makes complete sense. Therefore, use the contraction **it's**.",
            why: "'It's' replaces the missing 'i' in 'it is'.",
          },
        ],
        finalAnswer:
          "'The children took **their** bicycles **to** the park. **They're** excited because **it's** sunny outside.'",
        commonError: {
          mistake: "Using 'there' for people (e.g. 'there coats').",
          whyItHappens:
            "Writing the most common visual spelling without checking ownership.",
          howToAvoid:
            "Ask: 'Does it belong to them?' If yes, it MUST be 'their'.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly06-misconception",
        heading: "Common Trap: Relying Solely on Spell-Check for Homophones",
        claim: "If my computer spell-checker doesn't underline a word in red, it must be the right word.",
        whyWrong:
          "A spell-checker only checks if a word exists in the dictionary. If you write 'The weather was grate', 'grate' is a real word (like a cheese grater), so the computer will not flag it as an error!",
        correction:
          "Human proofreading is essential to ensure the word makes sense in the context of the sentence.",
        example: "'I ate a pear' vs 'I ate a pair' — both words are spelled correctly, but only 'pear' is edible!",
      },
      {
        kind: "check",
        id: "vc2e3ly06-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise selecting correct homophones (there/their/they're, to/too/two, piece/peace) in sentence contexts.",
        curriculumCode: "VC2E3LY06",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. VC2E3LY07: Fluent Reading Strategies and Self-Correction
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY07",
    title: "Reading Fluency: Phrasing, Self-Monitoring and Self-Correction",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to read aloud with fluency (appropriate speed, phrasing, and expression) and monitor our comprehension by self-correcting errors as we read.",
    successCriteria: [
      "I can read aloud in meaningful phrases (chunking words together) rather than word-by-word robotic reading.",
      "I can use punctuation marks (periods, commas, question marks, dialogue quotes) to guide pauses and vocal inflection.",
      "I can self-monitor by asking: 'Does that make sense? Did that look right? Did that sound right?' and re-read to correct mistakes.",
    ],
    prerequisites: ["VC2E3LY03"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly07-concept",
        heading: "The 3 Pillars of Fluent Reading",
        explanation:
          "Reading fluency is the bridge between decoding words and understanding deep meaning. Fluent reading consists of three core components:\n\n1. **Accuracy:** Reading words correctly without stumbling or misreading.\n2. **Rate / Pace:** Reading at a natural conversational speed — not rushing like a speeding train, and not crawling word-by-word.\n3. **Prosody (Expression & Phrasing):** Reading in natural phrases and adjusting vocal tone to reflect character dialogue, questions (voice rising at the end?), exclamations (excitement!), and commas (brief breath pauses).\n\n**The 3 Self-Correction Checks (M.S.V.):**\nWhen you read a word that doesn't feel right, pause and ask:\n• **Meaning (Semantic):** *Does it make sense in the story?*\n• **Structure (Syntactic):** *Does it sound like proper English grammar?*\n• **Visual (Graphophonic):** *Does it match the letters on the page?*\nIf the answer to any of these is 'No', back up to the start of the sentence and re-read!",
        keyTerms: [
          {
            term: "Reading Fluency",
            definition: "The ability to read text accurately, quickly, and with expressive phrasing and vocal inflection.",
          },
          {
            term: "Prosody",
            definition: "The rhythmic and intonational aspects of spoken language that bring written text to life.",
          },
          {
            term: "Self-Monitoring",
            definition: "Actively checking your own understanding while reading and noticing when a word or sentence does not make sense.",
          },
        ],
        visualAsset: {
          id: "vc2e3ly07-fluency-rubric-table",
          type: "table",
          altText:
            "Table displaying the fluency self-monitoring guide: Meaning, Structure, and Visual checks.",
          title: "The MSV Self-Monitoring Reading Strategy",
          data: {
            headers: ["Check Category", "Reader's Internal Question", "Reading Example Scenario", "Self-Correction Action"],
            rows: [
              ["Meaning (M)", "'Does that make sense?'", "Reader reads 'The horse galloped across the butter.'", "Butter makes no sense! Back up and decode 'pasture'."],
              ["Structure (S)", "'Does it sound like natural English?'", "Reader reads 'She went to the store and buyed fruit.'", "'Buyed' sounds grammatically wrong. Re-read: 'bought'."],
              ["Visual (V)", "'Does it look right?'", "Reader reads 'house' when the text says 'horse'.", "Check all letters: h-o-r-s-e. Re-read: 'horse'."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3ly07-example",
        heading: "Worked Example: Applying Self-Correction During Aloud Reading",
        problem:
          "A student reading aloud reads: 'The captain shouted through the storm, \"Hold on tight!\"' but accidentally reads 'shouted' as 'started'. Walk through how the reader should self-monitor and self-correct.",
        steps: [
          {
            stepNumber: 1,
            label: "Notice the comprehension breakdown (Self-Monitor)",
            working:
              "Reader reads: 'The captain *started* through the storm, \"Hold on tight!\"' The sentence feels awkward because 'started' does not explain how the dialogue was spoken.",
            why: "A proficient reader immediately detects when sentence structure or meaning feels disjointed.",
          },
          {
            stepNumber: 2,
            label: "Apply the Visual and Meaning checks",
            working:
              "Visual check: The word starts with 'sh-' (not 'st-') and contains 'ou'. Meaning check: The captain is communicating loud speech in a hurricane.",
            why: "Combining graphophonic cues with semantic context zeroes in on the correct word.",
          },
          {
            stepNumber: 3,
            label: "Back up to the start of the clause and re-read",
            working:
              "The reader pauses, returns to 'The captain...', and reads fluently: 'The captain **shouted** through the storm, \"Hold on tight!\"' with dramatic vocal urgency.",
            why: "Re-reading from the beginning of the clause restores comprehension and expressive flow.",
          },
        ],
        finalAnswer:
          "The reader notices that 'started' does not make sense with dialogue, checks the 'sh-' grapheme, and re-reads the sentence correctly: 'The captain **shouted** through the storm, \"Hold on tight!\"'.",
        commonError: {
          mistake: "Ploughing straight through misread words without stopping to self-correct.",
          whyItHappens:
            "Focusing solely on speed rather than comprehension.",
          howToAvoid:
            "Always prioritize meaning: if a sentence doesn't make total sense, STOP, back up, and re-read.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly07-misconception",
        heading: "Common Trap: Thinking Fluency Means Reading as Fast as Possible",
        claim: "The fastest reader in the class is always the best reader.",
        whyWrong:
          "Racing through text like a machine destroys comprehension and ignores punctuation pauses. If you read too fast to visualize the scene, you aren't really reading.",
        correction:
          "Fluency means reading at a natural, expressive conversational pace that honors punctuation and supports deep understanding.",
        example: "Pausing before a dramatic line creates suspense; rushing through ruins the moment.",
      },
      {
        kind: "check",
        id: "vc2e3ly07-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise fluent phrasing, pausing at punctuation marks, and applying MSV self-correction strategies.",
        curriculumCode: "VC2E3LY07",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. VC2E3LY08: Audience Awareness and Purpose Across Texts
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY08",
    title: "Audience and Purpose: Comparing How Different Texts Approach Topics",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to compare how different texts approach the same topic depending on their purpose (inform, persuade, entertain) and target audience (children, experts, community).",
    successCriteria: [
      "I can identify the target audience of a text (e.g. young children, general public, scientists).",
      "I can explain how an author alters vocabulary, tone, and sentence length to suit different readers.",
      "I can compare two texts on the same topic (e.g. sharks) written for different purposes.",
    ],
    prerequisites: [],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly08-concept",
        heading: "Matching Language to Audience and Purpose",
        explanation:
          "When authors write, they constantly ask two questions: **'Why am I writing?'** (Purpose) and **'Who is going to read this?'** (Audience):\n\n1. **Purpose Determines the Text Structure:**\n• *To Inform:* Uses facts, statistics, objective descriptions, and diagrams.\n• *To Persuade:* Uses high modality, emotive arguments, and rhetorical devices.\n• *To Entertain:* Uses characters, suspense, humor, and dialogue.\n\n2. **Audience Determines the Register and Tone:**\n• *Young Children (Ages 4-7):* Short simple sentences, playful rhyming vocabulary, large bright pictures.\n• *Year 3 Students (Ages 8-9):* Engaging compound/complex sentences, interesting facts, diagrams with clear labels.\n• *Adult Experts / Scientists:* Formal technical vocabulary, dense data tables, serious objective tone.\n\nComparing texts on the same subject (e.g. a fictional shark picture book vs a marine biology textbook) reveals how audience and purpose shape every word choice.",
        keyTerms: [
          {
            term: "Target Audience",
            definition: "The specific group of readers (e.g. children, parents, scientists) for whom a text is intended.",
          },
          {
            term: "Register",
            definition: "The level of formality in language, ranging from informal and conversational to formal and academic.",
          },
          {
            term: "Author's Purpose",
            definition: "The underlying goal an author wishes to achieve (to inform, persuade, entertain, or instruct).",
          },
        ],
        visualAsset: {
          id: "vc2e3ly08-audience-comparison-table",
          type: "table",
          altText:
            "Table comparing three different texts written about Great White Sharks for three distinct audiences.",
          title: "Comparing Three Texts About Sharks Across Different Audiences",
          data: {
            headers: ["Text Sample", "Purpose", "Target Audience", "Key Language & Layout Features"],
            rows: [
              ["'Sammy the Shark Loves to Swim!'", "To entertain / bedtime story", "Preschoolers (Ages 3-5)", "Short rhyming sentences, friendly cartoon drawings, playful adjectives"],
              ["'Ocean Predators: Inside the World of Sharks'", "To inform and educate", "Primary Students (Ages 8-10)", "Subheadings, labelled anatomy diagram, fascinating facts, clear definitions"],
              ["'Apex Marine Predation Patterns & Migration'", "To report scientific research", "Marine Biologists / Academics", "Formal academic terminology, data graphs, Latin names (*Carcharodon carcharias*)"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3ly08-example",
        heading: "Worked Example: Comparing Two Texts on Solar Energy",
        problem:
          "Read these two text snippets on Solar Energy: \nText A: 'Did you know the sun is a giant power station? By putting shiny solar panels on your roof, you can catch sunshine and make your own clean electricity!' \nText B: 'Photovoltaic cells convert incoming solar irradiance directly into direct-current electrical energy via the photoelectric effect.' \n(a) Identify the intended audience for each text. (b) Explain two differences in language choices between them.",
        steps: [
          {
            stepNumber: 1,
            label: "Analyze the tone and vocabulary of Text A",
            working:
              "Text A uses an engaging question ('Did you know...?'), a simple metaphor ('giant power station'), and conversational words ('shiny', 'catch sunshine'). Intended audience: **Primary school students or young readers**.",
            why: "Friendly, accessible language and relatable analogies target younger audiences.",
          },
          {
            stepNumber: 2,
            label: "Analyze the tone and vocabulary of Text B",
            working:
              "Text B uses complex technical terms ('photovoltaic cells', 'solar irradiance', 'photoelectric effect') and formal academic syntax. Intended audience: **Scientists, engineers, or adult physics students**.",
            why: "Specialized scientific jargon is tailored for expert readers.",
          },
          {
            stepNumber: 3,
            label: "Compare the two distinct language choices",
            working:
              "Difference 1: Vocabulary complexity ('shiny panels' vs 'photovoltaic cells'). Difference 2: Sentence structure (conversational exclamation vs dense academic definition).",
            why: "Explicit comparison of vocabulary and syntax proves understanding of audience adaptation.",
          },
        ],
        finalAnswer:
          "(a) Text A is written for children/students; Text B is written for scientists/adults. (b) Text A uses accessible metaphors ('giant power station') and conversational words ('catch sunshine'), while Text B uses specialist scientific terminology ('photovoltaic cells', 'solar irradiance') to explain the exact physics.",
        commonError: {
          mistake: "Saying Text B is 'better' because it uses bigger words.",
          whyItHappens:
            "Confusing complex vocabulary with overall text quality.",
          howToAvoid:
            "A text is successful if it fits its intended audience: Text A is perfect for children, and Text B is perfect for engineers.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly08-misconception",
        heading: "Common Trap: Assuming Informative Texts Cannot Be Entertaining",
        claim: "Non-fiction information reports must always be boring and dry to be educational.",
        whyWrong:
          "Modern educational non-fiction for children uses vivid adjectives, fascinating 'Did You Know?' callout boxes, and engaging humor to keep readers captivated while teaching facts.",
        correction:
          "Informative texts can be highly engaging and dynamic while remaining 100% factually accurate.",
        example: "National Geographic Kids articles use witty headings and colorful layout to make science thrilling.",
      },
      {
        kind: "check",
        id: "vc2e3ly08-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying target audiences, comparing text registers, and analyzing authorial purpose.",
        curriculumCode: "VC2E3LY08",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 9. VC2E3LY09: Identifying Authorial Purpose through Text Features
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY09",
    title: "Identifying Purpose: Persuading, Informing and Entertaining Features",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify an author's primary purpose (to persuade, inform, or entertain) by analyzing specific structural and linguistic text features (P.I.E.).",
    successCriteria: [
      "I can recall the P.I.E. purpose framework: Persuade, Inform, Entertain.",
      "I can identify language features typical of persuasive texts (rhetorical questions, modal verbs, emotive words).",
      "I can identify language features typical of informative texts (factual statements, subheadings, diagrams) and entertaining texts (characters, dialogue, suspense).",
    ],
    prerequisites: ["VC2E3LY08"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly09-concept",
        heading: "The P.I.E. Framework for Authorial Purpose",
        explanation:
          "To determine why an author wrote a text, remember the delicious acronym **P.I.E.**:\n\n1. **P = Persuade (To convince):**\n• The author wants the reader to agree with an opinion or take an action.\n• *Key Features:* Opinion words (*best, essential*), high-modality verbs (*must, should*), rhetorical questions (*Don't you agree?*), and calls to action.\n• *Examples:* Petitions, advertisements, letters to the editor, debates.\n\n2. **I = Inform (To teach facts):**\n• The author wants to explain real facts, processes, or historical events without sharing personal opinions.\n• *Key Features:* Present tense, technical definitions, statistics, headings, diagrams, and captions.\n• *Examples:* Textbooks, news reports, encyclopedias, recipes.\n\n3. **E = Entertain (To amuse / tell a story):**\n• The author wants to engage the reader's imagination and emotions.\n• *Key Features:* Story plot, fictional characters, vivid descriptive settings, dialogue, and humor/drama.\n• *Examples:* Novels, fairy tales, comic books, adventure stories, poems.",
        keyTerms: [
          {
            term: "P.I.E. Framework",
            definition: "A memory acronym for the three primary authorial purposes: Persuade, Inform, Entertain.",
          },
          {
            term: "Rhetorical Question",
            definition: "A question asked to make a point or provoke thought rather than expecting an answer (e.g. 'Who wouldn't want a cleaner playground?').",
          },
          {
            term: "Authorial Bias",
            definition: "When an author presents only one side of an issue to influence the reader's opinion.",
          },
        ],
        visualAsset: {
          id: "vc2e3ly09-pie-purpose-table",
          type: "table",
          altText:
            "Table breaking down the P.I.E. framework: Persuade, Inform, and Entertain with features and text types.",
          title: "The P.I.E. Authorial Purpose Breakdown",
          data: {
            headers: ["Author Purpose", "Goal for the Reader", "Dead-Giveaway Language Clues", "Common Text Types"],
            rows: [
              ["**P** - Persuade", "To convince you to agree or act", "Emotive words, high modality ('must'), rhetorical questions", "Advertisements, campaign posters, persuasive essays"],
              ["**I** - Inform", "To give you true facts & knowledge", "Objective facts, numbers/statistics, subheadings, diagrams", "Information reports, news articles, science guides"],
              ["**E** - Entertain", "To spark imagination & emotions", "Characters, dialogue tags, descriptive setting, plot twists", "Narratives, poems, comic books, plays"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3ly09-example",
        heading: "Worked Example: Diagnosing Author Purpose from Text Clues",
        problem:
          "Read this short text: 'Did you know that discarded plastic bottles take over 400 years to decompose in landfill? It is absolutely outrageous that our school still sells bottled water when filtered taps are available. We must ban single-use plastic bottles today!' Determine the author's primary purpose and cite two linguistic clues.",
        steps: [
          {
            stepNumber: 1,
            label: "Check for storytelling elements (Entertain)",
            working:
              "Are there characters, fictional dialogue, or a story plot? No. The text is addressing the reader directly about a real environmental issue.",
            why: "Ruling out entertainment focuses analysis on Inform vs Persuade.",
          },
          {
            stepNumber: 2,
            label: "Check for opinion and emotive language (Persuade vs Inform)",
            working:
              "While sentence 1 contains a fact (400 years), sentence 2 uses strong emotive judgment ('absolutely outrageous') and sentence 3 gives a commanding call to action using high modality ('We must ban...').",
            why: "Informative texts stay neutral; persuasive texts express strong moral judgment and urge action.",
          },
          {
            stepNumber: 3,
            label: "Conclude primary authorial purpose",
            working:
              "The author's primary purpose is to **PERSUADE** the school community to ban single-use plastic bottles.",
            why: "The overall goal is driving political/school action, using the fact as supporting evidence.",
          },
        ],
        finalAnswer:
          "Primary Purpose: To PERSUADE. Linguistic Clues: 1. Evaluative/emotive phrase ('absolutely outrageous'); 2. High-modality call to action ('We must ban single-use plastic bottles today!').",
        commonError: {
          mistake: "Calling it an informative text just because it mentions a fact ('takes 400 years').",
          whyItHappens:
            "Ignoring the persuasive arguments that surround the fact.",
          howToAvoid:
            "Look at the ending: if the text asks you to DO something or agree with a belief, its primary purpose is Persuade.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly09-misconception",
        heading: "Common Trap: Thinking a Text Can Only Ever Have One Purpose",
        claim: "A text is either 100% informative or 100% persuasive with zero crossover.",
        whyWrong:
          "Persuasive texts use factual evidence to prove their points, and informative documentaries use storytelling to keep viewers interested. However, one purpose is always the primary driver.",
        correction:
          "Look at the author's ultimate goal: are the facts being used to neutrally inform, or to push you toward an opinion?",
        example: "An advertisement gives facts about a bicycle, but its ultimate purpose is to persuade you to buy it.",
      },
      {
        kind: "check",
        id: "vc2e3ly09-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise diagnosing whether passages are written to Persuade, Inform, or Entertain using text clues.",
        curriculumCode: "VC2E3LY09",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 10. VC2E3LY10: Reading Comprehension Strategies
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY10",
    title: "Comprehension Strategies: Literal Recall, Inference, and Visualising",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to apply core reading comprehension strategies: literal recall (right there), making inferences (reading between the lines), visualising, and summarising main ideas.",
    successCriteria: [
      "I can answer literal questions where the answer is stated directly in the text ('Right There').",
      "I can answer inferential questions by combining text clues with my background knowledge ('Text Clues + Schema = Inference').",
      "I can summarise the main idea of a paragraph in 1 to 2 concise sentences.",
    ],
    prerequisites: ["VC2E3LY09"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly10-concept",
        heading: "The Core Comprehension Strategies",
        explanation:
          "Comprehension is the ultimate goal of reading. Effective readers use four foundational strategies:\n\n1. **Literal Comprehension (Right There on the Page):**\nFacts directly stated in the text. You can point your finger right at the answer.\n• *Question example:* 'What colour was the bicycle?' → Text says: 'He rode a blue bicycle.'\n\n2. **Inferential Comprehension (Reading Between the Lines):**\nThe author gives clues, but doesn't state the answer explicitly. You must combine text clues with your background knowledge (schema):\n• *Formula:* **Text Clues + Background Knowledge (Schema) = Inference**\n• *Example:* 'Tears streamed down Emma's cheeks as she held the broken toy.' → Inference: Emma is feeling heartbroken and upset.\n\n3. **Visualising (Mind Movies):**\nCreating sensory mental pictures of settings, characters, and events as you read.\n\n4. **Summarising (The Big Picture):**\nFiltering out minor details and capturing the central message in 1 or 2 clear sentences.",
        keyTerms: [
          {
            term: "Literal Comprehension",
            definition: "Understanding information that is directly and explicitly stated in the text.",
          },
          {
            term: "Inference",
            definition: "A logical conclusion reached by combining text clues with your own background knowledge.",
          },
          {
            term: "Schema",
            definition: "Your accumulated background knowledge and past life experiences used to make sense of new information.",
          },
        ],
        visualAsset: {
          id: "vc2e3ly10-comprehension-types-table",
          type: "table",
          altText:
            "Table comparing Literal, Inferential, and Evaluative comprehension questions with examples.",
          title: "Question-Answer Relationship (QAR) Framework",
          data: {
            headers: ["Question Type", "Where is the Answer?", "Thinking Action Required", "Sample Question"],
            rows: [
              ["Literal ('Right There')", "Directly in the text", "Scan and locate exact matching words", "'How many kilometres did the bus travel?'"],
              ["Inferential ('Think & Search')", "Between the lines (Clues)", "Combine text clues with your schema", "'Why was the driver feeling exhausted?'"],
              ["Author & You", "In your head + text theme", "Connect story lesson to real life", "'What would you have done in the protagonist's position?'"],
              ["Summarising", "Across the whole text", "Synthesize main idea into 1 sentence", "'What is the central message of this article?'"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3ly10-example",
        heading: "Worked Example: Making an Evidence-Backed Inference",
        problem:
          "Read this short passage: 'Sophie shivered as icy wind howled outside the wooden cabin. She blew on her numb fingertips, tossed two dry pine logs into the glowing hearth, and wrapped a thick woollen blanket around her shoulders.' (a) What season is it, and what is the weather like? (b) Show the exact formula (Text Clues + Schema) that proves your inference.",
        steps: [
          {
            stepNumber: 1,
            label: "Extract the explicit text clues",
            working:
              "Text clues: 'shivered', 'icy wind howled', 'numb fingertips', 'glowing hearth' (fireplace), 'thick woollen blanket'.",
            why: "Highlighting specific sensory words provides the concrete foundation for inference.",
          },
          {
            stepNumber: 2,
            label: "Connect text clues to background knowledge (schema)",
            working:
              "Schema: People only shiver, have numb fingers, build fires in hearths, and wrap in thick woollen blankets when temperatures are freezing cold, typically during winter.",
            why: "Your real-world experience gives meaning to the physical behaviors described.",
          },
          {
            stepNumber: 3,
            label: "Apply the inference formula",
            working:
              "Text Clues (icy howling wind, numb fingers, wood fire, blanket) + Schema (these actions happen in freezing winter cold) = **Season: Winter; Weather: Freezing, stormy, and blustery**.",
            why: "Synthesizing text and schema creates a robust, unshakeable deduction.",
          },
        ],
        finalAnswer:
          "(a) Season: Winter; Weather: Extremely cold, windy, and stormy. (b) Formula: Clues ('icy wind', 'shivered', 'numb fingertips', 'hearth fire') + Schema (these occur in severe cold) = Winter storm.",
        commonError: {
          mistake: "Saying 'The text doesn't say what season it is, so we can't know.'",
          whyItHappens:
            "Expecting every answer to be literally written out word-for-word.",
          howToAvoid:
            "Look for behavioral and sensory clues: authors expect readers to deduce obvious conditions from character actions.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly10-misconception",
        heading: "Common Trap: Confusing Inference with Wild Guessing",
        claim: "An inference is just a random guess where any answer is acceptable.",
        whyWrong:
          "An inference is a logical deduction strictly bounded by the evidence in the text. If you claim Sophie is on a tropical beach, your inference is completely invalid.",
        correction:
          "Every legitimate inference must be provable using direct clues cited from the passage.",
        example: "Inferring that Sophie is cold is valid; inferring that she loves chocolate has zero textual support.",
      },
      {
        kind: "check",
        id: "vc2e3ly10-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise answering literal recall and inferential questions and identifying main idea summaries.",
        curriculumCode: "VC2E3LY10",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 11. VC2E3LY11: Structured Paragraph Writing Across Genres
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY11",
    title: "Structured Writing: Composing Narrative, Report and Persuasive Texts",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to write coherent, sequenced paragraphs across narrative, informative, and persuasive genres using topic sentences and clear structural frameworks.",
    successCriteria: [
      "I can draft an informative paragraph with a topic sentence and supporting factual evidence.",
      "I can draft a persuasive paragraph using the P.E.E.L. structure (Point, Explanation, Evidence, Link).",
      "I can draft a narrative paragraph using sensory details and character actions.",
    ],
    prerequisites: ["VC2E3LY10"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly11-concept",
        heading: "Composing Structured Paragraphs for Different Genres",
        explanation:
          "Writing well means adapting your paragraph structure to match the genre of your writing:\n\n1. **Informative Paragraphs (Classification & Explanation):**\n• *Topic Sentence:* Names the sub-topic (e.g. 'Koalas have specialized physical adaptations for life in trees.').\n• *Supporting Details:* 2-3 sentences explaining anatomical features (e.g. sharp claws, opposable thumbs, thick leathery paws).\n• *Concluding Summary:* Connects adaptations back to tree-dwelling survival.\n\n2. **Persuasive Paragraphs (P.E.E.L.):**\n• **P (Point):** State your argument clearly (e.g. 'Firstly, daily exercise dramatically improves classroom concentration.').\n• **E (Explain):** Explain why this is true (e.g. 'Physical activity increases oxygen and blood flow to the brain...').\n• **E (Evidence / Example):** Provide a real example or fact (e.g. 'Studies show students who run for 15 minutes before maths focus significantly better.').\n• **L (Link):** Link back to the main thesis ('Therefore, school schedules must include daily morning fitness.').\n\n3. **Narrative Paragraphs (Action & Imagery):**\n• Group actions by setting or moment, showing character reactions through sensory details.",
        keyTerms: [
          {
            term: "P.E.E.L. Structure",
            definition: "A paragraph writing framework: Point, Explanation, Evidence/Example, Link.",
          },
          {
            term: "Elaboration",
            definition: "Adding specific descriptive details, reasons, or evidence to expand a basic statement.",
          },
        ],
        visualAsset: {
          id: "vc2e3ly11-peel-structure-table",
          type: "table",
          altText:
            "Table illustrating the 4 components of the P.E.E.L. persuasive paragraph framework with a complete example.",
          title: "The P.E.E.L. Paragraph Writing Framework",
          data: {
            headers: ["P.E.E.L. Stage", "Purpose in Paragraph", "Example Sentence in Action"],
            rows: [
              ["**P** - Point", "State the core argument clearly", "Firstly, planting native trees in school grounds creates vital wildlife habitats."],
              ["**E** - Explain", "Explain the reasoning in depth", "Native eucalyptus and wattle trees provide natural food and shelter for birds and insects."],
              ["**E** - Example", "Provide concrete evidence or data", "For instance, our school garden attracted over ten species of native honeyeaters after planting bottle-brush shrubs."],
              ["**L** - Link", "Link back to the main contention", "Consequently, expanding our school tree canopy is an essential conservation action."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3ly11-example",
        heading: "Worked Example: Ordering Scrambled Sentences into a Cohesive Paragraph",
        problem:
          "Put these four scrambled sentences into a logical, cohesive P.E.E.L. paragraph: \n(A) 'For example, our local library loans over 5,000 digital audiobooks and graphic novels every month for free.' \n(B) 'Therefore, local councils must continue funding and protecting public libraries.' \n(C) 'Public libraries are essential community hubs that provide free learning resources for all citizens.' \n(D) 'They allow every family to access expensive books, internet computers, and study spaces regardless of income.'",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the Topic Sentence / Point (P)",
            working:
              "Sentence (C) ('Public libraries are essential community hubs that provide free learning resources...') introduces the overarching main idea. Position 1: (C).",
            why: "A paragraph must begin with its broad topic claim.",
          },
          {
            stepNumber: 2,
            label: "Identify the Explanation (E)",
            working:
              "Sentence (D) ('They allow every family to access expensive books, internet computers...') explains WHY libraries are essential community hubs. Position 2: (D).",
            why: "The explanation follows directly from the opening claim.",
          },
          {
            stepNumber: 3,
            label: "Identify the Example / Evidence (E)",
            working:
              "Sentence (A) begins with 'For example...' and cites specific data (5,000 digital loans monthly). Position 3: (A).",
            why: "Concrete evidence and statistics substantiate the explanation.",
          },
          {
            stepNumber: 4,
            label: "Identify the Concluding Link (L)",
            working:
              "Sentence (B) begins with the transition 'Therefore...' and summarizes the final civic call to action. Position 4: (B).",
            why: "The link sentence wraps up the argument conclusively.",
          },
        ],
        finalAnswer:
          "Correct logical sequence: **C → D → A → B** (Point → Explanation → Example → Link).",
        commonError: {
          mistake: "Placing the example sentence (A) first before defining the main idea (C).",
          whyItHappens:
            "Writing specific facts before establishing the context.",
          howToAvoid:
            "Always lead with your main claim (Point), then explain it, then give the example.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly11-misconception",
        heading: "Common Trap: The 'Listing' Paragraph",
        claim: "A good paragraph is just a random list of facts with no connectives (e.g. 'Dogs are cute. Dogs bark. Dogs run fast. Dogs eat meat.').",
        whyWrong:
          "Choppy, disconnected sentences sound robotic and fail to show how ideas relate to each other.",
        correction:
          "Use compound and complex sentences with transition words (e.g. 'Furthermore', 'Because of this') to weave facts into a smooth narrative.",
        example: "'Dogs are highly active companions that require daily exercise; furthermore, their keen senses make them loyal working partners.'",
      },
      {
        kind: "check",
        id: "vc2e3ly11-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise structuring paragraphs using P.E.E.L. and ordering sentences into logical informative sequences.",
        curriculumCode: "VC2E3LY11",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 12. VC2E3LY12: Editing and Proofreading for Grammar and Punctuation
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY12",
    title: "Editing and Proofreading: Polishing Capital Letters, Punctuation and Flow",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to proofread and edit written texts for correct capitalisation, sentence punctuation, spelling, and subject-verb agreement.",
    successCriteria: [
      "I can check that every sentence begins with a capital letter and ends with an appropriate stop mark (. ? !).",
      "I can use capital letters for proper nouns (names, days, months, geographic places: e.g. Melbourne, Monday, October).",
      "I can correct subject-verb agreement errors (e.g. 'The dogs *were* barking' vs 'The dog *was* barking').",
    ],
    prerequisites: ["VC2E3LY11"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly12-concept",
        heading: "The C.U.P.S. Editing and Proofreading Strategy",
        explanation:
          "All professional authors edit their work before publishing. Editing is the deliberate process of checking for and fixing mechanical errors using the **C.U.P.S.** checklist:\n\n1. **C = Capitalisation:**\n• First word of every sentence.\n• Proper nouns: Names of people (*Liam*), places (*Australia, Sydney*), days (*Tuesday*), months (*August*), and the pronoun **I**.\n\n2. **U = Usage & Grammar (Subject-Verb Agreement):**\n• Singular subjects take singular verbs: *The child **is** playing* (NOT 'The child are playing').\n• Plural subjects take plural verbs: *The children **are** playing*.\n\n3. **P = Punctuation:**\n• Sentence end marks: Period (.), Question mark (?), Exclamation mark (!).\n• Commas in lists: *We packed apples, bananas, and grapes*.\n• Speech marks around exact spoken words: *\"Look out!\" shouted Ben*.\n\n4. **S = Spelling:**\n• Check high-frequency words, homophones (there/their), and suffix rules.",
        keyTerms: [
          {
            term: "Proofreading",
            definition: "Carefully reading a written text to detect and fix spelling, punctuation, and grammatical mistakes.",
          },
          {
            term: "Proper Noun",
            definition: "A specific name for a particular person, place, or calendar unit, always capitalized (e.g. Victoria, Friday).",
          },
          {
            term: "Subject-Verb Agreement",
            definition: "The grammatical rule that singular subjects must pair with singular verbs, and plural subjects with plural verbs.",
          },
        ],
        visualAsset: {
          id: "vc2e3ly12-cups-checklist-table",
          type: "table",
          altText:
            "Table displaying the C.U.P.S. editing checklist with error examples and corrections.",
          title: "The C.U.P.S. Editing & Proofreading Checklist",
          data: {
            headers: ["C.U.P.S. Letter", "Editing Focus", "Sentence with Error", "Corrected Version"],
            rows: [
              ["**C** - Capitals", "Start of sentences & proper nouns", "last **monday**, **lucas** visited sydney.", "**L**ast **M**onday, **L**ucas visited **S**ydney."],
              ["**U** - Usage", "Subject-verb agreement", "The three girls **was** running fast.", "The three girls **were** running fast."],
              ["**P** - Punctuation", "End marks & speech marks", "Where is the library.", "Where is the library**?**"],
              ["**S** - Spelling", "Homophones & tricky patterns", "The dog wagged **it's** tail.", "The dog wagged **its** tail."],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2e3ly12-example",
        heading: "Worked Example: Proofreading a Paragraph with Multiple Errors",
        problem:
          "Read this unedited student draft: 'on saturday, my brother and me went to ballarat. we was excited because we seen a historic steam train.' Identify and correct the 5 grammatical, capitalization, and spelling errors.",
        steps: [
          {
            stepNumber: 1,
            label: "Check Capitals (C)",
            working:
              "Error 1: 'on' needs a capital 'O' (start of sentence). Error 2: 'saturday' needs a capital 'S' (day of the week). Error 3: 'ballarat' needs a capital 'B' (proper noun city). Error 4: 'we' after the period needs a capital 'W'.",
            why: "Sentence openings and proper nouns are strictly capitalized.",
          },
          {
            stepNumber: 2,
            label: "Check Usage and Pronouns (U)",
            working:
              "Error 5: 'my brother and me went' → 'my brother and **I** went' (subject pronoun). Error 6: 'we was' → 'we **were**' (plural subject 'we' takes plural verb 'were').",
            why: "'I' is used for the subject performing the action; plural 'we' requires 'were'.",
          },
          {
            stepNumber: 3,
            label: "Check Verb Tense and Spelling (S)",
            working:
              "Error 7: 'we seen' → 'we **saw**' (the past tense of see is saw, not 'seen' without a helping verb).",
            why: "'Seen' requires a helping verb ('we had seen'); simple past is 'saw'.",
          },
          {
            stepNumber: 4,
            label: "Assemble the final polished paragraph",
            working:
              "'**On** **Saturday**, my brother and **I** went to **Ballarat**. **We** **were** excited because we **saw** a historic steam train.'",
            why: "Re-reading the edited text confirms all errors are resolved and syntax flows cleanly.",
          },
        ],
        finalAnswer:
          "Corrected text: '**On** **Saturday**, my brother and **I** went to **Ballarat**. **We** **were** excited because we **saw** a historic steam train.'",
        commonError: {
          mistake: "Reading through your own draft silently in your head without reading aloud.",
          whyItHappens:
            "Your brain automatically auto-corrects mistakes in your head and skips over missing words.",
          howToAvoid:
            "Read your writing ALOUD with a pencil, pointing to every single word one by one.",
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly12-misconception",
        heading: "Common Trap: Thinking First Drafts Should Be Perfect",
        claim: "Great writers write everything perfectly on their first try and never need to edit.",
        whyWrong:
          "Even award-winning authors write messy first drafts! First drafts are for getting ideas down; editing and revising is where writing becomes clear, polished, and brilliant.",
        correction:
          "Drafting and editing are separate steps: write freely first, then put on your editor's hat with C.U.P.S.",
        example: "J.K. Rowling and Roald Dahl rewrote their story drafts dozens of times before publishing.",
      },
      {
        kind: "check",
        id: "vc2e3ly12-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise editing passages for capital letters, subject-verb agreement, and punctuation accuracy.",
        curriculumCode: "VC2E3LY12",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 13. VC2E3LY13: Cursive Handwriting (Classroom / Non-Digital)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2E3LY13",
    title: "Cursive Handwriting: Consistent Slope, Clear Joins and Legibility",
    strand: "literacy",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to write using clear, legible cursive script with consistent letter sizing, correct joins, even spacing, and a steady slope.",
    successCriteria: [
      "I can form all lowercase and uppercase letters with correct starting points and directional strokes.",
      "I can use horizontal joins (e.g. from o, v, w) and diagonal joins (e.g. from a, c, d) smoothly.",
      "I can maintain consistent ascender height (t, l, b, h) and descender depth (g, y, p, q) on lined guidelines.",
    ],
    prerequisites: [],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text and concept structure authored specifically for Victorian Curriculum Level 3 English (Literacy).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2e3ly13-concept-1",
        heading: "Principles of Legible Victorian Modern Cursive Script",
        explanation:
          "Fluent handwriting allows your thoughts to flow onto paper smoothly without hand fatigue. In Victorian schools, students learn **Victorian Modern Cursive**, which follows four core penmanship principles:\n\n1. **Correct Grip and Posture:** Hold the pen or pencil with a relaxed 'tripod grip' (thumb and index finger pinching, resting on the middle finger). Sit upright with your non-writing hand stabilizing the paper.\n2. **Letter Sizing & Line Placement:**\n• *Body Letters (Head to Baseline):* a, c, e, m, n, o, r, s, u, v, w, x, z fill the middle third of standard guideline lines.\n• *Ascenders (Reach up to the top line):* b, d, f, h, k, l, t.\n• *Descenders (Drop below the baseline):* g, j, p, q, y.\n3. **Joins (Ligatures):**\n• *Diagonal Joins:* Travel upward from the baseline to the next letter (e.g. *an, in, ch*).\n• *Horizontal / Top Joins:* Travel across from letters that finish at the top (e.g. *on, vi, wi, re*).\n\n*Note on Practice:* Handwriting is a physical fine-motor skill developed through daily pencil-and-paper writing practice in the classroom.",
        keyTerms: [
          {
            term: "Ascender",
            definition: "The portion of a lowercase letter that extends upward above the middle guideline (e.g. b, d, h, l, t).",
          },
          {
            term: "Descender",
            definition: "The portion of a lowercase letter that extends downward below the baseline (e.g. g, j, p, q, y).",
          },
          {
            term: "Ligature / Join",
            definition: "The connecting stroke that links one letter smoothly to the next in cursive script.",
          },
        ],
        visualAsset: {
          id: "vc2e3ly13-handwriting-joins-table",
          type: "table",
          altText:
            "Table displaying the classification of cursive letter families and join styles in Victorian Modern Cursive.",
          title: "Victorian Modern Cursive Letter Families & Joins",
          data: {
            headers: ["Letter Group", "Letters in Family", "Starting Stroke / Characteristic", "Joining Behavior"],
            rows: [
              ["Clockwise Letters", "a, c, d, g, o, q", "Start at 2 o'clock, curve counter-clockwise", "Join with diagonal line from baseline"],
              ["Tall Ascenders", "b, h, k, l, t", "Start at the top headline, drop straight down", "Exit at baseline with diagonal join"],
              ["Tail Descenders", "g, j, p, q, y", "Drop below baseline with clean tail stroke", "Loop or exit stroke to next letter"],
              ["Top Finishers", "o, v, w, r", "Finish at the middle guideline line", "Join with horizontal top wave line"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "misconception",
        id: "vc2e3ly13-misconception",
        heading: "Common Trap: Gripping the Pencil Too Tightly",
        claim: "Pressing down hard with a tight fist gives you neater handwriting.",
        whyWrong:
          "A death-grip on the pencil causes hand cramps, tears paper, slows down writing speed, and makes letter strokes stiff and jagged.",
        correction:
          "Hold the pencil lightly with a relaxed tripod grip so your fingers and wrist can glide across the page effortlessly.",
        example: "If your fingers hurt after writing one paragraph, you are pressing too hard!",
      },
      {
        kind: "check",
        id: "vc2e3ly13-check",
        heading: "Check Your Understanding",
        prompt:
          "This handwriting and penmanship standard is practised daily on lined paper in the classroom.",
        curriculumCode: "VC2E3LY13",
        practiceCount: 5,
      },
    ],
  },
]);
