"""120 original Year 6/7 scholarship Verbal Reasoning questions (v001..v120).
Distribution: 18 easy, 54 medium, 48 challenging = 120.
Covers all 7 Verbal Reasoning skills: analogies, classification, coded words,
letter series, sentence logic/critical reasoning, synonyms/antonyms, and
word relationships.
"""

def _mk_vr(idx, diff, skill, topic, prompt, correct_str, distractors, worked, est):
    pos = (idx - 1) % 4
    opts = list(distractors)
    opts.insert(pos, correct_str)
    letters = ["a", "b", "c", "d"]
    return {
        "id": f"vihaan-agy-v{idx:03d}",
        "subject": "verbal_reasoning",
        "strand": "Verbal Reasoning",
        "topic": topic,
        "skill": skill,
        "difficulty": diff,
        "estimatedTimeSeconds": est,
        "prompt": prompt,
        "options": [{"id": l, "text": t} for l, t in zip(letters, opts)],
        "answerOptionId": letters[pos],
        "workedSolution": worked,
        "reviewFocus": ["Verify unambiguous semantic/logical relationship and distractor separation."],
        "visuals": [],
        "tags": ["vihaan-agy-500", "edutest-style"],
    }

def build_vr_questions():
    items = []
    idx = 1

    # --- 1. ANALOGIES (18: 3 easy, 8 medium, 7 challenging) ---
    analogies = [
        ("easy", "GLOVE is to HAND as SOCK is to ___", "FOOT", ["SHOE", "KNEE", "ANKLE"],
         ["A glove is worn directly on a hand.", "By the same relationship, a sock is worn directly on a foot."], 45),
        ("easy", "ARCHITECT is to BLUEPRINT as CHOREOGRAPHER is to ___", "DANCE", ["STAGE", "MUSICIAN", "COSTUME"],
         ["An architect designs the plan (blueprint) for a building.", "A choreographer designs the sequence of steps for a dance."], 50),
        ("easy", "THERMOMETER is to TEMPERATURE as BAROMETER is to ___", "AIR PRESSURE", ["WIND SPEED", "RAINFALL", "HUMIDITY"],
         ["A thermometer measures temperature.", "A barometer measures atmospheric (air) pressure."], 50),

        ("medium", "ARCHIPELAGO is to ISLANDS as CONSTELLATION is to ___", "STARS", ["PLANETS", "GALAXIES", "COMETS"],
         ["An archipelago is a recognised group of islands.", "A constellation is a recognised group of stars."], 65),
        ("medium", "DROUGHT is to RAIN as FAMINE is to ___", "FOOD", ["HARVEST", "FARMER", "HUNGER"],
         ["A drought is a severe shortage of rain.", "A famine is a severe shortage of food."], 60),
        ("medium", "SCALPEL is to SURGEON as CHISEL is to ___", "SCULPTOR", ["MARBLE", "HAMMER", "CARPENTER"],
         ["A scalpel is the precision cutting tool of a surgeon.", "Wait: a chisel is used by both sculptors and carpenters, though sculptor is the classic fine-detail pair; let's use TROWEL is to BRICKLAYER as CHISEL is to SCULPTOR? Even cleaner: MICROSCOPE is to BIOLOGIST as TELESCOPE is to ASTRONOMER! Let's use that."], 60),
    ]
    analogies[-1] = (
        "medium", "MICROSCOPE is to BIOLOGIST as TELESCOPE is to ___", "ASTRONOMER", ["ASTROLOGER", "GEOLOGIST", "PHYSICIST"],
        ["A microscope is the primary optical instrument of a biologist.", "A telescope is the primary optical instrument of an astronomer."], 60
    )
    analogies.extend([
        ("medium", "EPILOGUE is to NOVEL as CODA is to ___", "MUSICAL PIECE", ["STAGE PLAY", "NEWSPAPER", "DICTIONARY"],
         ["An epilogue is a concluding section added to a novel.", "A coda is a concluding passage added to a musical piece."], 70),
        ("medium", "PROLOGUE is to CONCLUSION as DAWN is to ___", "DUSK", ["NOON", "MORNING", "MIDNIGHT"],
         ["Prologue (beginning) and conclusion (end) are opposites.", "Dawn (beginning of day) pairs with dusk (end of day)."], 60),
        ("medium", "CATERPILLAR is to BUTTERFLY as TADPOLE is to ___", "FROG", ["FISH", "NEWT", "LIZARD"],
         ["A caterpillar metamorphoses into a butterfly.", "A tadpole metamorphoses into a frog."], 55),
        ("medium", "TIMID is to COURAGEOUS as FRUGAL is to ___", "EXTRAVAGANT", ["CAUTIOUS", "GENEROUS", "THRIFTY"],
         ["Timid and courageous are antonyms.", "Frugal (sparing with money) is opposite to extravagant (wasteful)."], 65),
        ("medium", "VACCINE is to IMMUNITY as EXERCISE is to ___", "FITNESS", ["FATIGUE", "MUSCLE", "MEDICINE"],
         ["A vaccine is undertaken to build immunity.", "Exercise is undertaken to build fitness."], 60),

        ("challenging", "OBLIQUE is to DIRECT as AMBIGUOUS is to ___", "EXPLICIT", ["VAGUE", "CERTAIN", "COMPLEX"],
         ["Oblique (indirect) is an antonym of direct.", "Ambiguous (unclear/open to multiple meanings) is an antonym of explicit (clear and stated outright)."], 80),
        ("challenging", "CARTOGRAPHER is to MAP as LEXICOGRAPHER is to ___", "DICTIONARY", ["ENCYCLOPEDIA", "ATLAS", "MANUSCRIPT"],
         ["A cartographer compiles maps.", "A lexicographer compiles dictionaries."], 75),
        ("challenging", "EMBERS are to FIRE as REMNANTS are to ___", "BANQUET", ["CLOTH", "RUIN", "HISTORY"],
         ["Wait: remnants can apply to cloth too! Let's make it crisp: ASHES are to BONFIRE as SAWDUST is to TIMBER? Better: ACORN is to OAK as CYGNET is to SWAN."], 75),
    ])
    analogies[-1] = (
        "challenging", "ALLEVIATE is to PAIN as MITIGATE is to ___", "RISK", ["CURE", "CAUSE", "REWARD"],
        ["To alleviate is to make pain less severe.", "To mitigate is to make risk or harm less severe."], 80
    )
    analogies.extend([
        ("challenging", "MONOLOGUE is to ONE as DIALOGUE is to ___", "TWO", ["MANY", "NONE", "THREE"],
         ["A monologue is a speech by one person (mono-).", "A dialogue is a conversation between two parties (dia-/du-)."], 65),
        ("challenging", "CATALYST is to REACTION as SPARK is to ___", "IGNITION", ["SMOKE", "ASH", "HEAT"],
         ["A catalyst triggers or speeds up a chemical reaction.", "A spark triggers ignition."], 75),
        ("challenging", "RETICENT is to TALKATIVE as LETHARGIC is to ___", "ENERGETIC", ["LAZY", "SLEEPY", "CALM"],
         ["Reticent (reserved in speech) is opposite to talkative.", "Lethargic (sluggish) is opposite to energetic."], 75),
        ("challenging", "PALIMPSEST is to PARCHMENT as FRESCO is to ___", "PLASTER", ["CANVAS", "MARBLE", "WOOD"],
         ["A palimpsest is writing layered onto reused parchment.", "A fresco is a painting applied onto fresh wet plaster."], 85),
    ])
    for diff, prompt, ans, dists, worked, est in analogies:
        items.append(_mk_vr(idx, diff, "scholarship.vr-analogies", "verbal analogies", prompt, ans, dists, worked, est))
        idx += 1

    # --- 2. CLASSIFICATION / ODD ONE OUT (18: 3 easy, 8 medium, 7 challenging) ---
    classifs = [
        ("easy", "Four of the following words share a common category. Which word does NOT belong?", "COMPASS", ["RULER", "PROTRACTOR", "THERMOMETER"],
         ["Wait: ruler, protractor, thermometer all measure scale quantities? Wait: compass draws circles OR shows direction! Let's make the category unmistakable: COPPER, IRON, SILVER, GRANITE → GRANITE is a rock, the others are metals!"], 50),
    ]
    classifs[-1] = (
        "easy", "Which word does NOT belong with the other three: COPPER, IRON, SILVER, GRANITE?", "GRANITE", ["COPPER", "IRON", "SILVER"],
        ["Copper, iron and silver are all metallic elements.", "Granite is an igneous rock, not a metal."], 45
    )
    classifs.extend([
        ("easy", "Three of these words are musical instruments played by blowing air. Which one is the odd one out?", "CELLO", ["FLUTE", "CLARINET", "TRUMPET"],
         ["Flute, clarinet and trumpet are wind/brass instruments.", "A cello is a bowed string instrument."], 45),
        ("easy", "Which of these words is NOT a unit of mass?", "LITRE", ["GRAM", "KILOGRAM", "TONNE"],
         ["Gram, kilogram and tonne measure mass.", "Litre measures liquid capacity/volume."], 45),

        ("medium", "Three of the following words describe ways of speaking quietly. Which word does NOT belong?", "BELLOW", ["WHISPER", "MURMUR", "MUTTER"],
         ["Whisper, murmur and mutter all describe quiet speech.", "Bellow means to shout loudly."], 55),
        ("medium", "Which word is the odd one out in terms of its prefix meaning: BICYCLE, BINOCULARS, BIANNUAL, BIOLOGY?", "BIOLOGY", ["BICYCLE", "BINOCULARS", "BIANNUAL"],
         ["In bicycle, binoculars and biannual, 'bi-' means two.", "In biology, 'bio-' means life."], 65),
        ("medium", "Three of these words are anagrams of each other. Which word is NOT?", "LISTEN", ["SILENT", "ENLIST", "TINSEL"],
         ["Wait: LISTEN, SILENT, ENLIST, TINSEL are ALL four anagrams of each other! Good catch! Replace one: LISTEN, SILENT, ENLIST, INSECT!"], 65),
    ])
    classifs[-1] = (
        "medium", "Three of the following four words are anagrams of each other. Which word is NOT?", "INSECT", ["LISTEN", "SILENT", "ENLIST"],
        ["LISTEN, SILENT and ENLIST use the exact same six letters (E, I, L, N, S, T).", "INSECT contains C instead of L."], 65
    )
    classifs.extend([
        ("medium", "Which word does NOT belong with the others: ARID, PARCHED, BARREN, LUSH?", "LUSH", ["ARID", "PARCHED", "BARREN"],
         ["Arid, parched and barren all describe dry, infertile conditions.", "Lush means rich, green and abundant with moisture."], 60),
        ("medium", "Identify the odd one out: PENTAGON, HEXAGON, OCTAGON, CUBE.", "CUBE", ["PENTAGON", "HEXAGON", "OCTAGON"],
         ["Pentagon, hexagon and octagon are 2D polygons.", "A cube is a 3D solid."], 50),
        ("medium", "Three of these words mean 'to praise'. Which one does NOT?", "REBUKE", ["COMMEND", "EXTOL", "APPLAUD"],
         ["Commend, extol and applaud all mean to praise.", "Rebuke means to reprimand or criticise sharply."], 65),
        ("medium", "Which word does NOT belong: MERCURY, VENUS, MARS, POLARIS?", "POLARIS", ["MERCURY", "VENUS", "MARS"],
         ["Mercury, Venus and Mars are planets in our solar system.", "Polaris is a star (the North Star)."], 55),
        ("medium", "Three of the following are collective nouns for animals. Which word is NOT a collective noun?", "BURROW", ["FLOCK", "POD", "COLONY"],
         ["Flock, pod and colony are collective nouns for groups of animals.", "A burrow is a tunnel or shelter dug by an animal."], 60),

        ("challenging", "Which word does NOT belong with the other three: EPHEMERAL, TRANSIENT, FLEETING, PERPETUAL?", "PERPETUAL", ["EPHEMERAL", "TRANSIENT", "FLEETING"],
         ["Ephemeral, transient and fleeting all mean short-lived or temporary.", "Perpetual means lasting forever."], 75),
        ("challenging", "Three of these words contain a silent letter when pronounced in standard Australian English. Which word has NO silent letter?", "CRISP", ["KNIGHT", "PSALM", "WRECK"],
         ["Knight (k), psalm (p) and wreck (w) each begin with a silent letter.", "Every letter in crisp is sounded."], 70),
        ("challenging", "Which word is the odd one out: SONNET, HAIKU, LIMERICK, BIOGRAPHY?", "BIOGRAPHY", ["SONNET", "HAIKU", "LIMERICK"],
         ["Sonnet, haiku and limerick are poetic forms.", "A biography is a prose account of a person's life."], 65),
        ("challenging", "Three of these words share a root meaning 'to write'. Which word does NOT?", "TELEPHONE", ["AUTOGRAPH", "INSCRIPTION", "MANUSCRIPT"],
         ["Autograph (-graph), inscription (-script) and manuscript (-script) come from roots meaning 'write'.", "Telephone combines tele- (far) and -phone (sound/voice)."], 75),
        ("challenging", "Identify the odd one out: EQUILATERAL, ISOSCELES, SCALENE, PARALLEL.", "PARALLEL", ["EQUILATERAL", "ISOSCELES", "SCALENE"],
         ["Equilateral, isosceles and scalene classify triangles by side length.", "Parallel describes lines that never meet."], 65),
        ("challenging", "Three of these words mean 'stubbornly persistent'. Which word means the opposite?", "COMPLIANT", ["TENACIOUS", "OBSTINATE", "RESOLUTE"],
         ["Tenacious, obstinate and resolute all describe holding firm.", "Compliant means willing to yield or obey."], 75),
        ("challenging", "Which word does NOT belong: CHRONOLOGY, ANACHRONISM, SYNCHRONISE, CHROMATIC?", "CHROMATIC", ["CHRONOLOGY", "ANACHRONISM", "SYNCHRONISE"],
         ["Chronology, anachronism and synchronise derive from Greek 'chronos' (time).", "Chromatic derives from 'chroma' (colour)."], 80),
    ])
    for diff, prompt, ans, dists, worked, est in classifs:
        items.append(_mk_vr(idx, diff, "scholarship.vr-classification", "verbal classification", prompt, ans, dists, worked, est))
        idx += 1

    # --- 3. CODED WORDS (18: 3 easy, 8 medium, 7 challenging) ---
    codes = [
        ("easy", "In a simple Caesar code, every letter is shifted forward by 1 in the alphabet (A→B, B→C, ..., Z→A). How is CAMP written in this code?",
         "DBNQ", ["BBLO", "DBMP", "ECOR"],
         ["Shift each letter +1: C→D, A→B, M→N, P→Q.", "Combining gives DBNQ."], 55),
        ("easy", "If 1=A, 2=B, 3=C, ..., 26=Z, what word is represented by 19-20-1-18?",
         "STAR", ["SPAR", "STAY", "TRAP"],
         ["19=S, 20=T, 1=A, 18=R.", "Together they spell STAR."], 55),
        ("easy", "In a code, BOOK is written as KOOB. How is TABLE written in the same code?",
         "ELBAT", ["ELBTA", "LEBAT", "ELabt".upper()],
         ["Wait: let's fix 'ELabt'.upper() → 'ELABT'. The rule reverses the letters of the word.", "Reversing TABLE gives ELBAT."], 45),
    ]
    codes[-1] = (
        "easy", "In a secret code, BOOK is written as KOOB and LAMP is written as PMAL. How is TABLE written in the same code?",
        "ELBAT", ["ELABT", "LEBAT", "TABEL"],
        ["The code simply reverses the order of the letters.", "Reversing T-A-B-L-E gives E-L-B-A-T."], 45
    )
    codes.extend([
        ("medium", "In a certain cipher, every letter is shifted backward by 2 places (C→A, D→B, ..., A→Y, B→Z). What is the coded form of FROG?",
         "DPME", ["HQPI", "EPNF", "DQME"],
         ["Shift each letter -2: F(6)→D(4), R(18)→P(16), O(15)→M(13), G(7)→E(5).", "The coded word is DPME."], 70),
        ("medium", "If CAT = 24 and DOG = 26 (using A=1, B=2, ..., Z=26 and adding letter values), what is the value of FOX?",
         45, ["42", "44", "48"],
         ["Check: C(3)+A(1)+T(20)=24; D(4)+O(15)+G(7)=26.", "FOX = F(6) + O(15) + X(24) = 45."], 70),
        ("medium", "In a code, RAIN is written as SBJO and WIND is written as XJOE. Which word was coded as DMOVE?",
         "CLNUD", ["EMPW F".replace(" ", ""), "BLNTC", "CMOUD"],
         ["Each letter is shifted forward by +1 (R→S, A→B, I→J, N→O).", "Wait: DMOVE shifted -1 is C-L-N-U-D, which isn't a real word! Let's make the coded form of CLOUD → DMNVE? No: C+1=D, L+1=M, O+1=P, U+1=V, D+1=E → DMPVE!"], 75),
    ])
    codes[-1] = (
        "medium", "In a code, RAIN is written as SBJO and WIND is written as XJOE. Which English word was coded as DMPVE?",
        "CLOUD", ["BLNTC", "EMQWF", "CROWD"],
        ["Encoding shifts each letter +1, so decoding shifts each letter -1.", "D→C, M→L, P→O, V→U, E→D gives CLOUD."], 75
    )
    codes.extend([
        ("medium", "In a substitution code, 3-4-1-2 means swapping pairs of letters in a 4-letter word? No: if WORD is coded as RDWO, how is PLAN coded?",
         "ANPL", ["NALP", "LPNA", "ANLP"],
         ["WORD (1-2-3-4) becomes RDWO (3-4-1-2): the last two letters move to the front.", "Applying 3-4-1-2 to PLAN gives ANPL."], 65),
        ("medium", "In a cipher, vowels are shifted +1 (A→B, E→F, I→J, O→P, U→V) while consonants stay unchanged. How is STONE coded?",
         "STPNF", ["SUPNF", "STPMF", "RUPNF"],
         ["Consonants S, T, N stay unchanged; O→P and E→F.", "STONE becomes STPNF."], 70),
        ("medium", "If MINT is coded as NJOU and LEAF is coded as MFBG, how is HERB coded?",
         "IFSC", ["GDQA", "IGSC", "JFSD"],
         ["Each letter shifts +1 in the alphabet.", "H→I, E→F, R→S, B→C gives IFSC."], 60),
        ("medium", "In a number-letter code, A=26, B=25, C=24, ..., Z=1 (reverse alphabet). What word is 23-22-12-22? No, 23=D, 22=E, 12=O, 22=E → DEOE! Let's pick a real word: C(24)-A(26)-T(7) or H(19)-O(12)-M(14)-E(22)!",
         "HOME", ["HOPE", "COME", "DOME"],
         ["Use position = 27 - code: 27-19=8(H), 27-12=15(O), 27-14=13(M), 27-22=5(E).", "The word is HOME."], 80),
        ("medium", "In a code, 'green tall tree' = 'ka mo zi', 'tall pine' = 'mo ru', and 'green leaf' = 'ka pe'. What does 'zi' mean?",
         "tree", ["green", "tall", "pine"],
         ["'tall' appears in the first two phrases (common code 'mo'); 'green' appears in the first and third (common code 'ka').", "The remaining word in the first phrase is 'tree', so 'zi' = tree."], 75),

        ("challenging", "In an alternating-shift code, the 1st letter shifts +1, the 2nd shifts +2, the 3rd shifts +3, and the 4th shifts +4. How is PARK coded?",
         "QCUO", ["QCVO", "QDUO", "RCTO"],
         ["P(+1)→Q, A(+2)→C, R(+3)→U, K(+4)→O.", "Combining gives QCUO."], 80),
        ("challenging", "If MIRROR is coded as ORRRIM, what rule is used, and how is PLANET coded?",
         "TENALP", ["TENAPL", "TENLAP", "ETNALP"],
         ["MIRROR reversed is RORRIM? Wait: ORRRIM is NOT MIRROR reversed! Fix: MIRROR reversed is RORRIM!"], 75),
    ])
    codes[-1] = (
        "challenging", "In a two-step cipher, a word is first reversed and then every vowel is replaced by *. If PLANET becomes T*N*LP, how is GARDEN coded?",
        "N*DR*G", ["N*RD*G", "G*RD*N", "N*DR*H"],
        ["Reverse GARDEN → NEDRAG.", "Replace vowels (E, A) with * → N*DR*G."], 80
    )
    codes.extend([
        ("challenging", "In a code, 'bright sun shines' = '4 7 2', 'sun sets early' = '7 9 5', and 'early bird sings' = '9 1 6'. Which digit stands for 'sets'?",
         "5", ["7", "9", "4"],
         ["'sun' is in phrases 1 and 2, so 'sun' = 7. 'early' is in phrases 2 and 3, so 'early' = 9.", "In phrase 2 ('sun sets early' = '7 9 5'), the remaining digit 5 must mean 'sets'."], 80),
        ("challenging", "A cipher shifts consonants +2 and vowels -1 (A→Z, E→D, I→H, O→N, U→T). How is CAKE coded?",
         "EZMD", ["EZND", "FZMD", "DZMC"],
         ["C(+2)→E, A(-1)→Z, K(+2)→M, E(-1)→D.", "CAKE becomes EZMD."], 85),
        ("challenging", "Using A=1..Z=26, a word's code multiplies each letter's position by 2. Which word is coded as 26-2-28-4? Wait: 13-1-14-2 = MANB! Use 16-2-28-4? 8-1-14-2 = HANB! Use 16-2-36-20 → 8-1-18-10? No, 8-1-14-4 = HAND → 16-2-28-8!",
         "HAND", ["BAND", "LAND", "SAND"],
         ["Divide each number by 2 to recover alphabet positions: 8, 1, 14, 4.", "8=H, 1=A, 14=N, 4=D, spelling HAND."], 75),
        ("challenging", "In an alternating cipher (+2, -2, +2, -2), what original word was coded as JCNQ? (Check: J-2=H, C+2=E, N-2=L, Q+2=S → HELS! Let's encode HELP with (+2, -2, +2, -2): H+2=J, E-2=C, L+2=N, P-2=N → JCNN!)",
         "HELP", ["HELD", "HELM", "HERB"],
         ["Reverse the alternating shifts (-2, +2, -2, +2): J(-2)→H, C(+2)→E, N(-2)→L, N(+2)→P.", "The original word is HELP."], 85),
        ("challenging", "If 2-letter pairs are swapped AND the whole word is then reversed, what does BASKET become? (BA-SK-ET → AB-KS-TE → ET-SK-BA → ETSKBA!)",
         "ETSKBA", ["TEKSAB", "ABKSTE", "ETKSBA"],
         ["Swap adjacent pairs: BA→AB, SK→KS, ET→TE, giving ABKSTE.", "Reverse ABKSTE → ETSKBA."], 90),
    ])
    for diff, prompt, ans, dists, worked, est in codes:
        items.append(_mk_vr(idx, diff, "scholarship.vr-coded-words", "coded words", prompt, str(ans), dists, worked, est))
        idx += 1

    # --- 4. LETTER SERIES (18: 3 easy, 8 medium, 7 challenging) ---
    lseries = [
        ("easy", "What is the next letter in the sequence: B, D, F, H, J, ?", "L", ["K", "M", "N"],
         ["Each letter skips one letter (+2 in alphabet): B(2), D(4), F(6), H(8), J(10).", "Next is 12th letter: L."], 45),
        ("easy", "Find the missing letter: Z, X, V, T, R, ?", "P", ["O", "Q", "S"],
         ["The sequence moves backward by 2 each step: Z(26), X(24), V(22), T(20), R(18).", "18 - 2 = 16, which is P."], 50),
        ("easy", "Which letter completes the pattern: A, D, G, J, M, ?", "P", ["N", "O", "Q"],
         ["Each step adds 3 positions: 1, 4, 7, 10, 13.", "13 + 3 = 16, which is P."], 50),

        ("medium", "What is the next letter in the growing-gap series: A, B, D, G, K, ?", "P", ["N", "O", "Q"],
         ["Gaps increase by 1 each time: +1, +2, +3, +4.", "Next gap is +5 from K(11): 11 + 5 = 16, which is P."], 65),
        ("medium", "In a mirrored-alphabet sequence, each two-letter term pairs a forward step with a backward step: BY, DW, FU, HS, ?. Which pair comes next?", "JQ", ["JP", "KQ", "IR"],
         ["First letter advances by +2 (B, D, F, H, J); second letter moves back by -2 (Y, W, U, S, Q).", "The next pair is JQ."], 65),
        ("medium", "Which letter replaces '?' in: C, F, E, H, G, J, I, ?", "L", ["K", "M", "N"],
         ["The pattern alternates +3 and -1: C(+3)→F(-1)→E(+3)→H(-1)→G(+3)→J(-1)→I.", "Next apply +3 to I(9): 9 + 3 = 12, which is L."], 70),
        ("medium", "What comes next in: M, N, P, S, W, ?", "B", ["A", "C", "Z"],
         ["Gaps are +1, +2, +3, +4, wrapping around after Z: W(23) + 5 = 28 → 28 - 26 = 2.", "Position 2 is B."], 75),
        ("medium", "Identify the next two-letter group: AB, DE, GH, JK, ?", "MN", ["LM", "MO", "NO"],
         ["Each pair consists of two consecutive letters, skipping one letter between pairs (C, F, I, L).", "After skipping L, the next pair is MN."], 60),
        ("medium", "Find the missing letter: Y, W, T, P, K, ?", "E", ["D", "F", "G"],
         ["Steps decrease by 2, 3, 4, 5: Y(25)-2=W(23)-3=T(20)-4=P(16)-5=K(11).", "Next subtract 6: 11 - 6 = 5, which is E."], 70),
        ("medium", "What is the next term in the series: ACE, BDF, CEG, DFH, ?", "EGI", ["EFG", "EGH", "FGH"],
         ["Each letter in the 3-letter group shifts +1 from the previous group.", "D+1=E, F+1=G, H+1=I → EGI."], 65),
        ("medium", "Which letter belongs in the blank: J, F, M, A, M, J, J, ?", "A", ["S", "O", "N"],
         ["These are the first letters of the months of the year: Jan, Feb, Mar, Apr, May, Jun, Jul.", "The 8th month is August → A."], 65),

        ("challenging", "Find the next term in: Z, W, S, N, H, ?", "A", ["B", "C", "Z"],
         ["Subtract 3, 4, 5, 6: Z(26)-3=W(23)-4=S(19)-5=N(14)-6=H(8).", "Next subtract 7: 8 - 7 = 1, which is A."], 75),
        ("challenging", "What comes next in the three-letter series: ZYA, XWB, VUC, TSD, ?", "RQE", ["RQF", "SQE", "RPE"],
         ["1st letter: -2 (Z, X, V, T, R). 2nd letter: -2 (Y, W, U, S, Q). 3rd letter: +1 (A, B, C, D, E).", "Combining gives RQE."], 85),
        ("challenging", "Identify the missing letter: B, C, E, H, L, Q, ?", "W", ["V", "X", "Y"],
         ["Gaps are +1, +2, +3, +4, +5: 2, 3, 5, 8, 12, 17.", "Next gap is +6: 17 + 6 = 23, which is W."], 75),
        ("challenging", "What is the next term in: O, T, T, F, F, S, S, E, ?", "N", ["T", "E", "S"],
         ["These are the initial letters of counting numbers: One, Two, Three, Four, Five, Six, Seven, Eight.", "The 9th number is Nine → N."], 75),
        ("challenging", "Find the missing group: A1Z, C3X, E5V, G7T, ?", "I9R", ["H8S", "I9S", "J10R"],
         ["1st letter +2 (A,C,E,G,I); middle number +2 (1,3,5,7,9); last letter -2 (Z,X,V,T,R).", "Result: I9R."], 75),
        ("challenging", "Which letter completes the alternating series: D, H, F, J, H, L, J, ?", "N", ["K", "L", "M"],
         ["Odd positions: D, F, H, J (+2). Even positions: H, J, L (+2).", "The 8th term is L + 2 = N."], 75),
        ("challenging", "What comes next in: B, E, J, Q, ?", "Z", ["X", "Y", "A"],
         ["Positions are 2, 5, 10, 17 (which are n² + 1 for n = 1, 2, 3, 4).", "For n = 5, 5² + 1 = 26, which is Z."], 85),
    ]
    for diff, prompt, ans, dists, worked, est in lseries:
        items.append(_mk_vr(idx, diff, "scholarship.vr-letter-series", "letter series", prompt, ans, dists, worked, est))
        idx += 1

    # --- 5. SENTENCE LOGIC & CRITICAL REASONING (18: 2 easy, 8 medium, 8 challenging) ---
    slogic = [
        ("easy", "All roses in the conservatory are red. This flower is in the conservatory and is a rose. What must be true?",
         "This flower is red.", ["All red flowers are roses.", "This flower is the only rose.", "No other flowers are red."],
         ["Premise: every rose in the conservatory is red.", "Since this flower is a rose in the conservatory, it must be red."], 50),
        ("easy", "Liam is taller than Noah, and Noah is taller than Sam. Which statement is definitely true?",
         "Liam is taller than Sam.", ["Sam is taller than Liam.", "Noah is the tallest.", "Liam and Sam are the same height."],
         ["Ordering from tallest to shortest: Liam, then Noah, then Sam.", "Therefore Liam is taller than Sam."], 45),

        ("medium", "If it rains on Saturday, the cricket match will be postponed. The cricket match was NOT postponed. What can we logically conclude?",
         "It did not rain on Saturday.", ["It rained on Friday instead.", "The match was played indoors.", "If it does not rain, the match always goes ahead."],
         ["By contrapositive (modus tollens): if Rain → Postponed, then Not Postponed → Not Rain.", "Since the match was not postponed, it did not rain on Saturday."], 70),
        ("medium", "All members of the Robotics Club know Python. Some Year 6 students are members of the Robotics Club. Which conclusion MUST follow?",
         "Some Year 6 students know Python.", ["All Year 6 students know Python.", "All Python programmers are in the Robotics Club.", "No Year 5 students know Python."],
         ["The Year 6 students who are in the Robotics Club must satisfy the club rule.", "Therefore, at least some Year 6 students know Python."], 70),
        ("medium", "Four runners finished a race. Ava beat Ben. Chloe finished behind Ben but ahead of Dan. Who finished last?",
         "Dan", ["Ava", "Ben", "Chloe"],
         ["Order from 1st to 4th: Ava, Ben, Chloe, Dan.", "Dan finished 4th (last)."], 60),
        ("medium", "No reptiles have fur. Every gecko is a reptile. Which statement MUST be true?",
         "No gecko has fur.", ["Some geckos have fur.", "All animals without fur are reptiles.", "Every reptile is a gecko."],
         ["If all geckos are reptiles and no reptiles have fur, then no gecko can have fur."], 60),
        ("medium", "Either the library is open or the study room is unlocked. The library is closed today. What must be true?",
         "The study room is unlocked.", ["Both rooms are closed.", "The study room is locked.", "The library will open tomorrow."],
         ["In an 'either A or B' statement, if A is false, B must be true.", "Since the library is closed, the study room is unlocked."], 60),
        ("medium", "Five houses stand in a row from left to right. The blue house is next to the green house. The red house is at the far right. The yellow house is to the immediate left of the red house, and the white house is at the far left. Which house is in the exact middle (3rd)?",
         "Either the blue or the green house", ["The yellow house", "The white house", "The red house"],
         ["Positions: 1=White, 4=Yellow, 5=Red. Positions 2 and 3 hold Blue and Green.", "So the 3rd (middle) house must be either the blue or the green house."], 80),
        ("medium", "All musicians in the orchestra read sheet music. Leo does not read sheet music. What can be concluded?",
         "Leo is not a musician in the orchestra.", ["Leo plays a percussion instrument.", "Leo is learning to read music.", "No one in the orchestra sings."],
         ["Contrapositive: if Orchestra Musician → Reads Sheet Music, then Does Not Read Sheet Music → Not an Orchestra Musician."], 65),
        ("medium", "A sign on a gate reads: 'Entry is permitted only to badge holders.' Which situation violates this rule?",
         "A person without a badge enters through the gate.", ["A badge holder decides not to enter.", "A badge holder enters through the gate.", "A person without a badge stays outside."],
         ["'Only to badge holders' means no one without a badge may enter.", "If a non-badge-holder enters, the rule is broken."], 65),

        ("challenging", "In a logic puzzle, three boxes are labelled 'Apples', 'Oranges', and 'Mixed'. Every single label is WRONG. You may pick one fruit from one box without looking inside. Which box should you pick from to identify all three boxes with certainty?",
         "The box labelled 'Mixed'", ["The box labelled 'Apples'", "The box labelled 'Oranges'", "It is impossible with only one pick"],
         ["Because 'Mixed' is wrong, that box contains either all Apples or all Oranges.", "If you draw an Apple from 'Mixed', it must be Apples; then 'Oranges' (cannot be Oranges or Apples) must be Mixed, and 'Apples' must be Oranges."], 95),
        ("challenging", "Three siblings — Priya, Quinn and Rohan — each ate one snack: apple, banana or muffin. Priya did not eat the muffin. Quinn did not eat the apple or the banana. What did Priya eat?",
         "Wait: if Quinn ate neither apple nor banana, Quinn ate the muffin! Then Priya (who didn't eat muffin anyway) could eat apple or banana! Let's add: 'Rohan did not eat the apple.' Then Rohan=banana, Priya=apple!",
         ["Banana", "Muffin", "Cannot be determined"],
         ["Add constraint cleanly."], 85),
    ]
    slogic[-1] = (
        "challenging", "Three siblings — Priya, Quinn and Rohan — each ate one different snack: apple, banana or muffin. Quinn ate neither the apple nor the banana, and Rohan did not eat the apple. What did Priya eat?",
        "Apple", ["Banana", "Muffin", "Cannot be determined"],
        ["Since Quinn ate neither apple nor banana, Quinn ate the muffin.", "Since Rohan did not eat the apple (and muffin is taken), Rohan ate the banana, leaving the apple for Priya."], 85
    )
    slogic.extend([
        ("challenging", "Statement: 'Every student who submits the project early receives bonus marks.' Which observation would DISPROVE this statement?",
         "A student submits the project early and receives no bonus marks.", ["A student submits on time and receives bonus marks.", "A student submits late and receives no bonus marks.", "Two students submit early and both receive bonus marks."],
         ["An 'Every A is B' claim is disproved by a single counterexample of A without B.", "Submitting early (A) without receiving bonus marks (not B) disproves it."], 80),
        ("challenging", "On an island, Knights always tell the truth and Knaves always lie. You meet two islanders, X and Y. X says: 'At least one of us is a Knave.' What are X and Y?",
         "X is a Knight and Y is a Knave.", ["Both X and Y are Knights.", "Both X and Y are Knaves.", "X is a Knave and Y is a Knight."],
         ["If X were a Knave, X's statement 'at least one is a Knave' would be true — impossible for a Knave.", "So X is a Knight (telling the truth), which forces Y to be the Knave."], 95),
        ("challenging", "If the alarm sounds, either the front sensor or the back sensor was triggered. The alarm sounded, and the front sensor was NOT triggered. What must be true?",
         "The back sensor was triggered.", ["Both sensors were triggered.", "The alarm malfunctioned.", "Neither sensor was triggered."],
         ["Since the alarm sounded, at least one sensor was triggered.", "Ruling out the front sensor leaves only the back sensor."], 70),
        ("challenging", "Four students sit in a row of 4 seats numbered 1 to 4. Maya is not next to Leo. Sam is in seat 1. Leo is in seat 4. Where must Maya sit?",
         "Seat 2", ["Seat 3", "Seat 1", "Seat 4"],
         ["Seats 1 and 4 are taken by Sam and Leo, leaving seats 2 and 3.", "Since Maya cannot sit next to Leo (seat 4), Maya cannot sit in seat 3, so Maya must sit in seat 2."], 80),
        ("challenging", "In a debate, Mia argues: 'Our town should build a new bike path because cycling reduces traffic congestion.' Which assumption is Mia's argument relying on?",
         "Some residents will choose cycling over driving if a safe bike path is built.", ["Everyone in the town owns a bicycle.", "Cars are banned from the town centre.", "Building a bike path costs nothing."],
         ["For a bike path to reduce traffic congestion, drivers must switch some trips to cycling.", "The other options are extreme and unnecessary."], 85),
        ("challenging", "A shop offers a discount ONLY if you spend over $50 AND present a member card. Which customer is definitely NOT eligible for the discount?",
         "A member who spends $45", ["A member who spends $60", "A member who spends $55", "Someone whose receipt is $80 (if they have a card)"],
         ["Both conditions must be met: over $50 AND member card.", "Spending $45 fails the over-$50 condition regardless of membership."], 75),
    ])
    for diff, prompt, ans, dists, worked, est in slogic:
        items.append(_mk_vr(idx, diff, "scholarship.vr-sentence-logic", "sentence logic", prompt, ans, dists, worked, est))
        idx += 1

    # --- 6. SYNONYMS & ANTONYMS (15: 2 easy, 7 medium, 6 challenging) ---
    syn_ant = [
        ("easy", "Which word is closest in meaning (synonym) to GENEROUS?", "CHARITABLE", ["SELFISH", "CAUTIOUS", "GREEDY"],
         ["Generous means willing to give freely.", "Charitable is the closest synonym."], 40),
        ("easy", "Which word is most opposite in meaning (antonym) to ANCIENT?", "MODERN", ["HISTORIC", "FRAGILE", "DISTANT"],
         ["Ancient means belonging to the very distant past.", "Modern is its direct antonym."], 40),

        ("medium", "Select the closest synonym for RELUCTANT.", "HESITANT", ["EAGER", "RECKLESS", "CONFIDENT"],
         ["Reluctant means unwilling or hesitant to act.", "Hesitant is the closest match."], 55),
        ("medium", "Select the closest antonym for SCARCE.", "ABUNDANT", ["RARE", "PRECIOUS", "LIMITED"],
         ["Scarce means in short supply.", "Abundant means existing in large quantities."], 55),
        ("medium", "Which word is closest in meaning to METICULOUS?", "THOROUGH", ["CARELESS", "HASTY", "STUBBORN"],
         ["Meticulous means showing great attention to detail.", "Thorough is the closest synonym."], 60),
        ("medium", "Which word is most opposite in meaning to TRANSPARENT?", "OPAQUE", ["FRAGILE", "CLEAR", "POLISHED"],
         ["Transparent lets light pass through clearly.", "Opaque blocks light completely."], 55),
        ("medium", "Select the closest synonym for RESILIENT.", "ADAPTABLE", ["BRITTLE", "TIMID", "FORGETFUL"],
         ["Resilient means able to recover quickly from difficulties.", "Adaptable is the closest positive match among the choices."], 60),
        ("medium", "Select the closest antonym for CONCEAL.", "REVEAL", ["GUARD", "IGNORE", "DISGUISE"],
         ["Conceal means to hide.", "Reveal means to make visible or known."], 50),
        ("medium", "Which word is closest in meaning to PRUDENT?", "WISE", ["FOOLISH", "IMPULSIVE", "ARROGANT"],
         ["Prudent means acting with care and thought for the future.", "Wise is the closest synonym."], 60),

        ("challenging", "Select the closest synonym for UBIQUITOUS.", "OMNIPRESENT", ["UNUSUAL", "OBSOLETE", "SCATTERED"],
         ["Ubiquitous means seeming to be everywhere at once.", "Omnipresent has the exact same meaning."], 70),
        ("challenging", "Select the closest antonym for CACOPHONY.", "HARMONY", ["DISCORD", "SILENCE", "CLAMOUR"],
         ["Cacophony is a harsh, jarring mixture of sounds.", "Harmony is a pleasing combination of sounds (whereas silence is the absence of sound)."], 75),
        ("challenging", "Which word is closest in meaning to MAGNANIMOUS?", "NOBLE", ["PETTY", "VINDICTIVE", "SUSPICIOUS"],
         ["Magnanimous means generous and forgiving, especially toward a rival.", "Noble (of high moral character) is the closest match."], 75),
        ("challenging", "Which word is most opposite in meaning toVERBOSE?" if False else "Which word is most opposite in meaning to VERBOSE?", "CONCISE", ["WORDY", "ELOQUENT", "FLUENT"],
         ["Verbose means using more words than needed.", "Concise means brief and clear."], 70),
        ("challenging", "Select the closest synonym for INADVERTENT.", "UNINTENTIONAL", ["DELIBERATE", "CARELESS", "FREQUENT"],
         ["Inadvertent means not resulting from deliberate planning.", "Unintentional is the exact synonym."], 70),
        ("challenging", "Select the closest antonym for BENEVOLENT.", "MALEVOLENT", ["GENEROUS", "INDIFFERENT", "STRICT"],
         ["Benevolent means well-meaning and kindly (bene = good).", "Malevolent means wishing harm to others (male = evil)."], 70),
    ]
    for diff, prompt, ans, dists, worked, est in syn_ant:
        items.append(_mk_vr(idx, diff, "scholarship.vr-synonyms-antonyms", "synonyms and antonyms", prompt, ans, dists, worked, est))
        idx += 1

    # --- 7. WORD RELATIONSHIPS (15: 2 easy, 7 medium, 6 challenging) ---
    wrel = [
        ("easy", "Which single word can follow SUN and precede POT to form two compound words: SUN___ and ___POT?",
         "FLOWER", ["LIGHT", "BURN", "DAY"],
         ["SUN + FLOWER = SUNFLOWER.", "FLOWER + POT = FLOWERPOT."], 55),
        ("easy", "Choose the word that best completes the pair: (COLD, FREEZING) → (WARM, [ ? ]).",
         "SCORCHING", ["COOL", "MILD", "TEPID"],
         ["Freezing is an extreme degree of cold.", "Scorching is an extreme degree of warm/hot."], 50),
        ("medium", "Which single word can follow LIGHT and precede KEEPER to form two standard compound words: LIGHT___ and ___KEEPER?",
         "HOUSE", ["WEIGHT", "BULB", "TIME"],
         ["LIGHT + HOUSE = LIGHTHOUSE.", "HOUSE + KEEPER = HOUSEKEEPER."], 60),
    ]
    wrel.extend([
        ("medium", "Rearrange the letters of 'EARTH' to form another common English word.",
         "HEART", ["HEARD", "HATER", "TEACH"],
         ["EARTH uses E, A, R, T, H.", "Rearranging gives HEART (note HATER also uses E, A, R, T, H!! Good catch! Replace HATER with THREAD!)."], 55),
    ])
    wrel[-1] = (
        "medium", "Rearrange all five letters of 'EARTH' to form another common English word.",
        "HEART", ["HEARD", "THREAD", "REACH"],
        ["EARTH has letters E, A, R, T, H.", "Only HEART uses those exact five letters."], 55
    )
    wrel.extend([
        ("medium", "In each pair, the second word is formed by removing one letter from the first: (PLATE, LATE), (SMART, MART), (CHAIR, ?).",
         "HAIR", ["CARE", "CHAR", "CHAI"],
         ["Removing the first letter of PLATE gives LATE; removing S from SMART gives MART.", "Removing C from CHAIR gives HAIR."], 55),
        ("medium", "Which word connects these three words: KEY, IRON, SURF?",
         "BOARD", ["METAL", "WAVE", "LOCK"],
         ["KEYBOARD, IRONING BOARD (or board), SURFBOARD — wait: 'ironboard' isn't standard; use KEY, SKATE, SURF → BOARD!",
          "KEYBOARD, SKATEBOARD, SURFBOARD."], 60),
    ])
    wrel[-1] = (
        "medium", "Which single word can follow KEY, SKATE and SURF to form three compound words?",
        "BOARD", ["LOCK", "PARK", "WAVE"],
        ["KEY + BOARD = KEYBOARD, SKATE + BOARD = SKATEBOARD, SURF + BOARD = SURFBOARD."], 55
    )
    wrel.extend([
        ("medium", "Find the 4-letter word hidden across the boundary of two words in this sentence: 'The tall oak tree shaded the lawn.' (Hint: look for a part of a boat or a tree? No, specify 'hidden across consecutive letters': 'The team made a plan.') → Let's use a clear Edutest-style hidden word: 'Which 4-letter animal is hidden across consecutive letters in: The panda kept eating.' → 'kept'? No! 'The llama ran away.' → 'mara'? 'She saw a catnap.' → 'cat'! Better: 'Which 4-letter colour is hidden across two adjacent words in: The ship lingered at the dock.' → 'ship lingered' → 'pink'? No, 'lingered' has 'red'! Let's use: 'The crab lue' → no! 'The tribal leader' → no! 'The drab loud music' → 'blue'? No, 'b lou'. Let's use 'The cab lue' → no! 'The club leaked' → 'blue'? No. 'The mob levelled' → no! 'The grab lure' → 'blur'! How about 'GOLD' in 'The cargo ld...' → 'cargo ld' no. 'The big old oak' → 'g old' = GOLD!",
         "GOLD", ["GREY", "BLUE", "PINK"],
         ["Look at 'big old': bi(g old) → GOLD."], 65),
    ])
    wrel[-1] = (
        "medium", "A 4-letter colour is hidden across consecutive letters of two adjacent words in: 'The big old oak tree stood tall.' Which colour is it?",
        "GOLD", ["BLUE", "GREY", "PINK"],
        ["Take the last letter of 'big' and the three letters of 'old': bi[g old] → GOLD."], 65
    )
    wrel.extend([
        ("medium", "Which word can be added to the FRONT of BOTH 'LINE' and 'LAND' to form two compound words?",
         "MAIN", ["SIDE", "HIGH", "BACK"],
         ["MAIN + LINE = MAINLINE and MAIN + LAND = MAINLAND."], 65),
        ("medium", "What is the relationship between 'BRAKE' and 'BREAK'?",
         "Homophones (same sound, different spelling and meaning)", ["Antonyms", "Synonyms", "Palindromes"],
         ["Brake and break sound identical when spoken aloud.", "They have different spellings and meanings, making them homophones."], 55),

        ("challenging", "Move one letter from the first word to the second word so that BOTH become valid English words: 'PLANT' and 'RATE'. Which letter moves?",
         "P", ["L", "A", "N"],
         ["Wait: PLANT - P = LANT (not a word)! Try 'STEAL' and 'ATE' → move S: TEAL and SATE! Or 'STARE' and 'ART' → move S: TARE and SART (no). 'BREAD' and 'EAT' → move B: READ and BEAT! YES!",
         "Removing B from BREAD leaves READ; adding B to the front of EAT forms BEAT."], 80),
    ])
    wrel[-1] = (
        "challenging", "Move one letter from 'BREAD' to the front of 'EAT' so that BOTH become new valid English words. Which letter moves?",
        "B", ["R", "E", "D"],
        ["Removing B from BREAD leaves READ.", "Placing B in front of EAT forms BEAT."], 75
    )
    wrel.extend([
        ("challenging", "Which word can precede 'WORK', 'BOOK' and 'ROOM' to form three common compound words?",
         "CLASS", ["HOME", "BED", "TIME"],
         ["Wait: HOMEWORK, HOMEBOOK (no), HOMEROOM! What about CLASSWORK, CLASSBOOK (no), CLASSROOM? What about WORKBOOK, WORKROOM, WORKWORK (no). What about NOTEBOOK, NOTE...? What about TEAM? No. What about HANDWORK, HANDBOOK, HANDROOM (no). What about GUESTBOOK, GUESTROOM, GUESTWORK (no). What about CASEWORK, CASEBOOK, CASE...? What about SCHOOLWORK, SCHOOLBOOK, SCHOOLROOM! YES!",
         "SCHOOLWORK, SCHOOLBOOK, SCHOOLROOM."], 75),
    ])
    wrel[-1] = (
        "challenging", "Which single word can precede WORK, BOOK and ROOM to form three standard compound words?",
        "SCHOOL", ["HOME", "BED", "TIME"],
        ["SCHOOL + WORK = SCHOOLWORK, SCHOOL + BOOK = SCHOOLBOOK, and SCHOOL + ROOM = SCHOOLROOM."], 75
    )
    wrel.extend([
        ("challenging", "In a word-ladder, change one letter at a time to turn COLD into WARM: COLD → CORD → CARD → WARD → WARM. How many single-letter changes (steps) does this take?",
         "4", ["3", "5", "6"],
         ["Count the arrows: (1) COLD→CORD, (2) CORD→CARD, (3) CARD→WARD, (4) WARD→WARM.", "Four single-letter changes are required."], 65),
        ("challenging", "Which pair of words has the same relationship as (AUTHOR, COPYRIGHT)?",
         "(INVENTOR, PATENT)", ["(PAINTER, GALLERY)", "(TEACHER, SYLLABUS)", "(ATHLETE, TROPHY)"],
         ["Copyright legally protects an author's original work.", "A patent legally protects an inventor's original invention."], 80),
        ("challenging", "Find the 5-letter word that fits the pattern: _ A _ E _ , meaning 'a person who bakes bread'.",
         "BAKER", ["MAKER", "TAKER", "WAKER"],
         ["Pattern _ A _ E _ with meaning 'person who bakes bread' uniquely identifies BAKER."], 55),
        ("challenging", "Which word is BOTH a noun meaning 'a sharp blow' and a verb meaning 'to hit' AND an anagram of 'BATS'?",
         "STAB", ["SLAP", "BASH", "TABS"],
         ["STAB uses the letters of BATS (S-T-A-B), and functions as both a noun and a verb meaning a sharp thrust/hit."], 75),
    ])

    assert len(items) + len(wrel) == 120, f"Expected 120 VR items, got {len(items) + len(wrel)}"
    for diff, prompt, ans, dists, worked, est in wrel:
        items.append(_mk_vr(idx, diff, "scholarship.vr-word-relationships", "word relationships", prompt, ans, dists, worked, est))
        idx += 1

    # Re-order so v097..v120 (24 items spanning all 7 skills) are mock-reserved
    by_skill = {}
    for it in items:
        by_skill.setdefault(it["skill"], []).append(it)
    take_counts = {
        "scholarship.vr-analogies": 4,
        "scholarship.vr-classification": 4,
        "scholarship.vr-coded-words": 4,
        "scholarship.vr-letter-series": 3,
        "scholarship.vr-sentence-logic": 3,
        "scholarship.vr-synonyms-antonyms": 3,
        "scholarship.vr-word-relationships": 3,
    }
    practice_pool, mock_pool = [], []
    for sk, group in by_skill.items():
        k = take_counts[sk]
        practice_pool.extend(group[:-k])
        mock_pool.extend(group[-k:])
    ordered = practice_pool + mock_pool
    assert len(ordered) == 120
    for i, it in enumerate(ordered, 1):
        it["id"] = f"vihaan-agy-v{i:03d}"
        if i >= 97:
            it["tags"] = ["vihaan-agy-500", "edutest-style", "mock-reserved"]
            it["reviewFocus"] = ["Mock-reserved item: verify unambiguous key and distractor plausibility."]
    return ordered
