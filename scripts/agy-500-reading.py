"""100 original Year 6/7 scholarship Reading Comprehension questions (r001..r100)
across 20 longer original passages (5 questions per passage).
Distribution: 15 easy, 45 medium, 40 challenging = 100.
Passages 17..20 (r081..r100, 20 questions) are reserved for unseen mock exams.
"""

PASSAGES = [
    # 1. Literary Fiction
    (
        "The Brass Lantern at Point Nepean",
        (
            "Every afternoon at four o'clock, when the westerly wind began to rattle the tea-tree scrub along the headland, "
            "twelve-year-old Callum climbed the narrow iron staircase to the old lookout room. His grandfather had been the "
            "last keeper before the automated beacon replaced the oil lamps, and though the limestone tower no longer guided "
            "ships through the Rip, Callum treated the brass lantern as though it were still on duty. He wiped salt haze from "
            "the curved glass panes with a linen cloth and checked the logbook that remained open on the cedar desk. Inside, "
            "his grandfather's neat copperplate entries recorded wind speeds, passing barques, and the occasional pod of "
            "southern right whales sheltering in the bay. Callum's favourite entry, dated 14 July 1968, described a winter "
            "squall so fierce that spray reached the lantern gallery thirty metres above the tide. Beneath the date, his "
            "grandfather had written a single reminder: 'A steady light does not argue with the storm; it simply refuses to "
            "go out.' As dusk settled and the automated LED flashed twice a minute from the steel mast beside the tower, "
            "Callum closed the logbook, turned the brass latch, and descended into the salt-scented twilight."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "According to the passage, why does the limestone tower no longer guide ships?",
             "An automated beacon replaced the oil lamps.",
             ["The staircase became too narrow to climb.", "The glass panes were broken by a storm.", "The bay was closed to all shipping traffic."],
             ["The passage states Callum's grandfather was 'the last keeper before the automated beacon replaced the oil lamps.'"], 150),
            ("easy", "scholarship.rc-vocabulary-context", "In the context of the passage, what does the word 'squall' most likely mean?",
             "A sudden, violent gust of wind and storm",
             ["A calm period between tides", "A flock of coastal seabirds", "A type of sailing vessel"],
             ["The text describes 'a winter squall so fierce that spray reached the lantern gallery', indicating a sudden storm."], 90),
            ("medium", "scholarship.rc-character-inference", "What does Callum's daily routine of wiping the glass and checking the logbook suggest about him?",
             "He feels a deep respect for his grandfather's legacy and duty.",
             ["He hopes to sell the brass lantern to a museum.", "He is afraid of the automated LED mast.", "He is searching for hidden treasure in the desk."],
             ["Callum treats the lantern 'as though it were still on duty' and treasures his grandfather's logbook entries."], 95),
            ("medium", "scholarship.rc-figurative-language", "What is the meaning of the grandfather's note: 'A steady light does not argue with the storm; it simply refuses to go out'?",
             "True reliability comes from quiet persistence rather than fighting chaos loudly.",
             ["Lighthouses should be turned off during severe storms.", "Keepers must shout orders above the wind.", "Oil lamps burn brighter when exposed to salt spray."],
             ["The metaphor contrasts futile arguing with steady, quiet endurance in difficult conditions."], 105),
            ("challenging", "scholarship.rc-authorial-craft", "Why does the author mention the 'automated LED' flashing from a 'steel mast' near the end of the passage?",
             "To contrast modern efficiency with the personal warmth and history of the old limestone tower.",
             ["To show that Callum prefers modern technology over old lamps.", "To warn readers that the limestone tower is about to be demolished.", "To explain how LEDs are powered by wind turbines."],
             ["Juxtaposing the steel LED mast with the cedar desk, copperplate handwriting and brass lantern highlights the shift from personal stewardship to automation."], 115),
        ],
    ),
    # 2. Australian Natural History Essay
    (
        "Architects of the Mallee: The Mound-Building Malleefowl",
        (
            "Unlike almost every other bird on Earth, the Australian malleefowl does not sit upon its eggs to keep them warm. "
            "Instead, this shy, ground-dwelling bird constructs an extraordinary natural incubator from sand, fallen eucalyptus "
            "leaves and twigs. Beginning in late autumn, a pair of malleefowl excavates a wide pit in the sandy soil of the "
            "mallee scrub and fills it with up to a tonne of leaf litter. When winter rains soak the buried vegetation, "
            "microbes begin to decompose the damp leaves, releasing steady warmth from below—much like a backyard compost "
            "heap. Once the mound reaches the right temperature, the female lays a clutch of eggs deep inside the chamber, "
            "and the male becomes a tireless thermal engineer. Every morning, he thrusts his sensitive beak into the sand "
            "to measure the internal heat. If the core rises above thirty-four degrees Celsius, he scrapes away layers of "
            "insulating sand to let excess heat escape; if a cold snap chills the mound, he piles fresh sand back on top "
            "or opens the crater at midday to capture solar warmth. Because newly hatched chicks must dig their way upward "
            "through nearly a metre of sand unaided, they emerge fully feathered and capable of running within hours—and "
            "flying within a single day."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "What generates the initial heat inside the malleefowl's mound?",
             "Microbes decomposing the damp, buried leaf litter",
             ["The parents taking turns sitting on the eggs", "Underground hot springs in the mallee", "Friction from the birds' feet scraping sand"],
             ["The passage explains that when winter rains soak the leaves, 'microbes begin to decompose the damp leaves, releasing steady warmth from below.'"], 145),
            ("medium", "scholarship.rc-cause-effect", "Why does the male malleefowl scrape sand off the mound on hot mornings?",
             "To allow excess heat to escape and keep the eggs near thirty-four degrees Celsius",
             ["To help the female lay additional eggs", "To dry out the leaves before winter rain arrives", "To hide the nest from passing predators"],
             ["When the core rises above 34 degrees, scraping away insulating sand lets excess heat escape."], 95),
            ("medium", "scholarship.rc-vocabulary-context", "Why does the author refer to the male malleefowl as a 'tireless thermal engineer'?",
             "To emphasise how precisely and continuously he regulates the mound's temperature.",
             ["To suggest the bird uses metal tools to build its nest.", "To show that the bird sleeps through the hottest part of the day.", "To compare the bird's beak to a solar panel."],
             ["The metaphor highlights the bird's constant, precise temperature management."], 100),
            ("medium", "scholarship.rc-factual-inference", "What can be inferred about malleefowl chicks compared with songbird chicks?",
             "Malleefowl chicks are far more independent at birth and receive no parental feeding.",
             ["Malleefowl chicks remain blind and helpless for several weeks.", "Malleefowl chicks are carried to trees by their parents.", "Malleefowl chicks cannot survive without sitting in a nest."],
             ["Because they dig upward unaided and can run within hours and fly within a day, they are highly independent at birth."], 105),
            ("challenging", "scholarship.rc-text-structure", "How is the information in this passage organised?",
             "Chronologically through the nesting cycle, from building the mound to the chicks' emergence.",
             ["As a debate between two opposing conservation scientists.", "By comparing five different Australian desert birds.", "From the chicks' adulthood backward to the autumn rain."],
             ["The passage moves sequentially: late autumn pit digging → winter rain/decomposition → egg-laying → daily temperature control → hatching."], 105),
        ],
    ),
    # 3. Historical Narrative
    (
        "The Underground Cables of 1885",
        (
            "When Melbourne's first cable tram glided along Flinders Street in November 1885, onlookers marvelled that a "
            "wooden carriage could climb steep hills without horses, steam boilers, or overhead wires. The secret lay hidden "
            "beneath the cobblestones. Inside a narrow brick-lined slot between the rails ran an endless steel rope, pulled "
            "continuously at a steady sixteen kilometres per hour by massive steam engines housed in brick power stations "
            "across the city. Each tramcar carried a 'gripman' who operated a long iron lever extending through the floor. "
            "By pulling the lever back, steel jaws clamped onto the moving cable beneath the street, drawing the tram smoothly "
            "forward; releasing the lever and applying the handbrake brought the carriage to a halt at intersections. Though "
            "the system was remarkably quiet and clean compared with smoky locomotives, it demanded constant vigilance. If a "
            "single strand on the wire rope frayed, a bell rang in the engine house so mechanics could inspect the loop "
            "overnight before a snapped cable stranded commuters across an entire suburb."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "What powered the steel cable beneath Melbourne's streets?",
             "Massive steam engines inside brick power stations",
             ["Teams of horses harnessed underground", "Overhead electric wires above the rails", "Small petrol motors inside each wooden carriage"],
             ["The passage states the steel rope was 'pulled continuously ... by massive steam engines housed in brick power stations.'"], 140),
            ("medium", "scholarship.rc-cause-effect", "How did a gripman stop the cable tram at an intersection?",
             "By releasing the grip lever and applying the handbrake",
             ["By signalling the power station to stop the steam engine", "By reversing the direction of the steel rope", "By lifting the tramcar off the rails"],
             ["The text explains: 'releasing the lever and applying the handbrake brought the carriage to a halt.'"], 95),
            ("medium", "scholarship.rc-factual-inference", "Why was a single frayed strand on the cable treated as an urgent problem?",
             "If the cable snapped completely, all trams along that loop would be stranded.",
             ["The frayed wire could electrocute passengers on the roof.", "Frayed cables caused the steam engines to speed up dangerously.", "The cobblestones would melt from friction."],
             ["Mechanics inspected the loop overnight 'before a snapped cable stranded commuters across an entire suburb.'"], 100),
            ("challenging", "scholarship.rc-main-idea", "What is the central idea of the passage?",
             "Melbourne's 1885 cable trams achieved quiet, horse-free transport through clever underground engineering and careful maintenance.",
             ["Cable trams were slower and noisier than steam locomotives.", "Gripmen disliked working in brick power stations.", "Horses were banned from Flinders Street in 1885."],
             ["The passage explains how the hidden cable system worked, its advantages, and the maintenance it required."], 105),
            ("challenging", "scholarship.rc-vocabulary-context", "In the sentence 'it demanded constant vigilance', what does 'vigilance' mean?",
             "Careful, continuous watchfulness",
             ["Physical strength", "Public popularity", "Financial investment"],
             ["Watching for frayed strands and inspecting loops overnight demonstrates careful watchfulness."], 95),
        ],
    ),
    # 4. Persuasive Editorial
    (
        "More Than Mud: Why Every School Needs a Kitchen Garden",
        (
            "Critics who dismiss school vegetable gardens as a pleasant distraction from 'serious' subjects overlook what "
            "actually happens beside the raised beds. When Year 5 students calculate how much compost is needed for a "
            "three-metre plot, or measure daily rainfall in millimetres to graph germination rates, mathematics ceases to be "
            "an abstract worksheet and becomes a tool with immediate consequences. Equally important is the patience a garden "
            "teaches. In an era of instant downloads and same-day deliveries, waiting six weeks for radishes to swell beneath "
            "the soil reminds young people that worthwhile results often require steady care rather than speed. Of course, "
            "a garden demands planning: without a roster for holiday watering or clear links to science and health lessons, "
            "a patch can quickly turn to weeds. Yet when schools integrate the garden into weekly learning, students who "
            "rarely speak up in a quiet classroom often emerge as confident observers and problem-solvers outdoors."
        ),
        [
            ("easy", "scholarship.rc-main-idea", "What is the writer's main argument in this editorial?",
             "School kitchen gardens build practical academic skills, patience and confidence when integrated into learning.",
             ["School gardens should replace all mathematics worksheets.", "Students should spend their school holidays weeding gardens.", "Growing radishes is faster than downloading files."],
             ["The writer argues gardens make maths practical, teach patience, and help students emerge as confident problem-solvers."], 140),
            ("medium", "scholarship.rc-argument-evaluation", "Why does the writer mention 'waiting six weeks for radishes to swell'?",
             "To contrast slow, steady natural growth with modern expectations of instant results.",
             ["To complain that radishes take too long to cook.", "To prove that radishes are the easiest vegetable to grow.", "To argue that school terms should be six weeks long."],
             ["It illustrates how gardening teaches patience 'in an era of instant downloads and same-day deliveries.'"], 95),
            ("medium", "scholarship.rc-authorial-craft", "Why does the writer acknowledge that 'without a roster for holiday watering ... a patch can quickly turn to weeds'?",
             "To make the argument more balanced and credible by addressing a practical challenge.",
             ["To persuade readers not to build school gardens after all.", "To blame students for forgetting to water plants.", "To show that weeds are more useful than vegetables."],
             ["Addressing a counterargument or limitation strengthens persuasive credibility."], 105),
            ("challenging", "scholarship.rc-tone-analysis", "Which pair of words best describes the tone of the editorial?",
             "Measured and persuasive",
             ["Sarcastic and dismissive", "Panicked and urgent", "Detached and indifferent"],
             ["The writer calmly counters critics with concrete examples while acknowledging practical planning needs."], 105),
            ("challenging", "scholarship.rc-factual-inference", "According to the writer, which group of students may particularly benefit from outdoor garden lessons?",
             "Quiet students who are less vocal in traditional classroom settings",
             ["Only students who already live on farms", "Students who dislike all forms of mathematics", "Students who prefer instant digital games"],
             ["The final sentence notes 'students who rarely speak up in a quiet classroom often emerge as confident observers and problem-solvers outdoors.'"], 100),
        ],
    ),
    # 5. Poetry
    (
        "The Stone Bridge at Dawn",
        (
            "Before the waking baker lights his oven in the lane,\n"
            "The grey-backed bridge remembers every footstep in the rain.\n"
            "Its mossy arches cradle mist above the silent creek,\n"
            "Where silver minnows dart between the pebbles, swift and sleek.\n\n"
            "A magpie tunes a flute-note from the willow's trailing hem,\n"
            "And sunlight threads the water with a momentary gem.\n"
            "Though motorcars will thunder past before the clock strikes nine,\n"
            "At dawn the bridge belongs to stillness, stone, and silver line."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "Which bird is heard singing in the second stanza?",
             "A magpie",
             ["A kookaburra", "A sparrow", "A swan"],
             ["Line 5 states: 'A magpie tunes a flute-note from the willow's trailing hem.'"], 110),
            ("medium", "scholarship.rc-figurative-language", "What poetic device is used in 'The grey-backed bridge remembers every footstep'?",
             "Personification",
             ["Simile", "Onomatopoeia", "Hyperbole"],
             ["Giving the stone bridge the human ability to 'remember' is personification."], 85),
            ("medium", "scholarship.rc-figurative-language", "What does the phrase 'a momentary gem' most likely refer to?",
             "A brief sparkle of early sunlight reflecting on the water",
             ["A diamond ring dropped from the bridge", "A coloured stone embedded in the baker's wall", "A glowing streetlamp beside the lane"],
             ["'Sunlight threads the water with a momentary gem' describes a fleeting gleam of sunlight on the creek."], 95),
            ("challenging", "scholarship.rc-tone-analysis", "How does the mood shift in the final two lines of the poem?",
             "It briefly contrasts the coming busy daytime traffic with the peacefulness of dawn.",
             ["It celebrates the arrival of loud motorcars as an improvement.", "It warns that the bridge is about to collapse under traffic.", "It expresses anger toward the baker for waking early."],
             ["'Though motorcars will thunder past ... At dawn the bridge belongs to stillness' contrasts future noise with present calm."], 105),
            ("challenging", "scholarship.rc-authorial-craft", "What is the rhyme scheme of the poem?",
             "AABB CCDD (rhyming couplets)",
             ["ABAB CDCD", "ABBA CDDC", "Free verse with no rhyme"],
             ["lane/rain (AA), creek/sleek (BB), hem/gem (CC), nine/line (DD)."], 95),
        ],
    ),
    # 6. Science Feature
    (
        "Living Lanterns of the Twilight Zone",
        (
            "Two hundred metres below the ocean's surface, sunlight fades to a faint cobalt dusk, and by one thousand metres "
            "it vanishes altogether. Yet this dark expanse—known to marine scientists as the mesopelagic or twilight zone—is "
            "far from lifeless. More than three-quarters of the creatures living there produce their own light through a "
            "chemical reaction called bioluminescence. Inside specialised cells, a molecule named luciferin reacts with "
            "oxygen in the presence of an enzyme called luciferase, releasing energy almost entirely as cool blue-green "
            "light rather than heat. Deep-sea animals put this glow to remarkably varied uses. The hatchetfish, for example, "
            "lines its belly with light-producing organs tuned to match the faint downwelling sunlight above, erasing its "
            "own silhouette so predators swimming underneath cannot spot it. Other species flash sudden bursts of glowing "
            "mucus to startle attackers, while the anglerfish dangles a luminous lure in front of its jaws to attract "
            "curious prey. Because blue wavelengths travel furthest through seawater, most marine bioluminescence glows "
            "blue—making red light nearly invisible in the deep."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "What two substances react with oxygen to create bioluminescence?",
             "Luciferin and the enzyme luciferase",
             ["Saltwater and cobalt", "Sunlight and seawater", "Nitrogen and carbon"],
             ["The passage states: 'a molecule named luciferin reacts with oxygen in the presence of an enzyme called luciferase.'"], 140),
            ("medium", "scholarship.rc-cause-effect", "How does the hatchetfish's glowing belly help it survive?",
             "It camouflages the fish's shadow against the faint light coming from above.",
             ["It blinds predators with a sudden flash of red light.", "It heats the surrounding water to drive away sharks.", "It lures smaller fish directly into its mouth."],
             ["Matching the faint downwelling sunlight 'erases its own silhouette so predators swimming underneath cannot spot it.'"], 100),
            ("medium", "scholarship.rc-factual-inference", "Why do most bioluminescent ocean creatures glow blue rather than red?",
             "Blue light travels much further through seawater than red light.",
             ["Red light produces too much heat and burns the fish.", "Blue light is easier for predators to ignore.", "Oxygen only reacts with luciferin to make blue light near the surface."],
             ["The final sentence explains: 'Because blue wavelengths travel furthest through seawater, most marine bioluminescence glows blue.'"], 95),
            ("challenging", "scholarship.rc-vocabulary-context", "What does the word 'silhouette' mean in the context of the hatchetfish?",
             "A dark outline or shadow seen against a lighter background",
             ["A bright reflection on the ocean surface", "A protective shell covering the gills", "A chemical trail left behind in water"],
             ["Seen from below against faint sunlight, a fish normally casts a dark outline (silhouette)."], 95),
            ("challenging", "scholarship.rc-main-idea", "Which statement best summarises the passage?",
             "Deep-sea organisms use efficient chemical light in diverse ways to hide, defend themselves, and hunt.",
             ["Sunlight reaches one thousand metres deep in clear tropical oceans.", "Anglerfish are the only predators in the mesopelagic zone.", "Bioluminescence wastes energy by producing large amounts of heat."],
             ["The passage explains how bioluminescence works chemically and surveys its three main survival uses."], 100),
        ],
    ),
    # 7. Interview / Dialogue
    (
        "Behind the Glass: A Conversation with Paper Conservator Dr. Lin",
        (
            "Interviewer: When visitors admire a nineteenth-century watercolour in a gallery, they rarely think about what "
            "keeps the paper from yellowing or tearing. What does your work involve?\n"
            "Dr. Lin: Mostly patience and detective work. Paper made after 1850 often contains wood pulp, which turns acidic "
            "over decades and becomes brittle. Before we touch a brush or repair a tear, we test the paper's pH, examine "
            "the pigments under ultraviolet light, and document every crease.\n"
            "Interviewer: What is the biggest misconception people have about conservation?\n"
            "Dr. Lin: That we try to make old artworks look brand new. In fact, our golden rule is reversibility. Any "
            "adhesive we use—such as wheat-starch paste—or any Japanese mulberry paper we attach as a backing must be "
            "removable in the future without harming the original sheet. If a future conservator has a better technique, "
            "they should be able to undo our repair cleanly.\n"
            "Interviewer: And what can families do at home to protect treasured letters or drawings?\n"
            "Dr. Lin: Keep them out of direct sunlight, store them flat in acid-free folders rather than sticky photo albums, "
            "and never use ordinary household sticky tape—its glue stains paper permanently within a few years."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "Why does paper made after 1850 often become brittle?",
             "It frequently contains wood pulp, which turns acidic over time.",
             ["It was painted with wheat-starch paste.", "It was stored in Japanese mulberry folders.", "It was exposed to ultraviolet light in museums."],
             ["Dr. Lin explains that 'Paper made after 1850 often contains wood pulp, which turns acidic over decades and becomes brittle.'"], 140),
            ("medium", "scholarship.rc-main-idea", "What does Dr. Lin mean by the 'golden rule' of reversibility?",
             "Repairs must be safely removable later without damaging the original artwork.",
             ["Old paintings should be flipped over and painted on the back.", "Conservators must restore faded colours until they look brand new.", "Any torn paper should be replaced with a modern photocopy."],
             ["She defines reversibility as ensuring any paste or backing 'must be removable in the future without harming the original sheet.'"], 95),
            ("medium", "scholarship.rc-cause-effect", "Why does Dr. Lin warn against using ordinary household sticky tape on treasured letters?",
             "Its adhesive causes permanent staining within a few years.",
             ["It peels off too easily in humid weather.", "It makes the paper too heavy to store flat.", "It turns ultraviolet light into heat."],
             ["She states: 'its glue stains paper permanently within a few years.'"], 90),
            ("challenging", "scholarship.rc-character-inference", "How does Dr. Lin view future generations of conservators?",
             "With humility, expecting they may develop superior techniques that require undoing current repairs.",
             ["With suspicion, believing future workers will damage historical art.", "With indifference, since she expects all paper to crumble eventually.", "With pride, assuming her own methods can never be improved."],
             ["She says if a future conservator has a better technique, 'they should be able to undo our repair cleanly.'"], 105),
            ("challenging", "scholarship.rc-authorial-craft", "Why is the interview format effective for this topic?",
             "It moves naturally from technical museum work to practical advice readers can apply at home.",
             ["It proves that interviewers know more than scientists.", "It avoids explaining any scientific terms like pH or acidity.", "It creates suspense about a stolen watercolour."],
             ["The three questions progress smoothly from daily lab work to core philosophy to household tips."], 100),
        ],
    ),
    # 8. Paired Viewpoints
    (
        "Two Views: Should Councils Ban Single-Use Coffee Cups?",
        (
            "Viewpoint A (Councillor Patel): Every year, Australians discard more than a billion disposable coffee cups. "
            "Although many look like plain cardboard, almost all are lined with a thin plastic film that prevents standard "
            "paper recycling. A council-wide ban on non-compostable takeaway cups would push cafes and customers to adopt "
            "reusable mugs or cup-library schemes, cutting landfill waste immediately. Cities that have introduced small "
            "charges or bans have seen reusable cup use triple within six months.\n\n"
            "Viewpoint B (Cafe Owner Samira): We all want less litter, but an outright council ban overlooks practical "
            "realities. Independent cafes already operate on tight margins, and switching to certified compostable cups "
            "costs nearly twice as much per unit—costs that small businesses must pass on to customers. Furthermore, "
            "compostable cups still end up in landfill unless the council also invests in commercial composting bins on "
            "every street. Incentives for bringing a clean reusable mug—such as a fifty-cent discount—change habits "
            "without penalising small shops."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "According to Councillor Patel, why can't most disposable coffee cups be recycled as ordinary paper?",
             "They are lined with a thin plastic film.",
             ["They are too small for recycling machines.", "Coffee stains destroy all cardboard fibres.", "Cafes refuse to place them in yellow bins."],
             ["Viewpoint A notes they are 'lined with a thin plastic film that prevents standard paper recycling.'"], 140),
            ("medium", "scholarship.rc-argument-evaluation", "What key infrastructure gap does Samira point out regarding compostable cups?",
             "Without commercial composting bins on streets, compostable cups still go to landfill.",
             ["Compostable cups cannot hold hot liquids.", "Customers refuse to drink from compostable lids.", "Commercial composting bins are illegal in city centres."],
             ["Samira argues 'compostable cups still end up in landfill unless the council also invests in commercial composting bins on every street.'"], 100),
            ("medium", "scholarship.rc-main-idea", "On which point do Councillor Patel and Samira agree?",
             "Reducing disposable cup waste and litter is a worthwhile goal.",
             ["Councils should immediately ban all takeaway coffee.", "Compostable cups cost less than plastic-lined cups.", "Discounts are ineffective at changing customer behaviour."],
             ["Samira opens with 'We all want less litter', showing shared concern about waste despite disagreeing on a ban."], 95),
            ("challenging", "scholarship.rc-argument-evaluation", "Which strategy would best address Samira's objection while still advancing Patel's goal?",
             "Combining reusable-cup discounts with council-funded street composting infrastructure before any ban.",
             ["Doubling the price of coffee for customers who sit inside cafes.", "Removing all rubbish bins from public parks.", "Allowing plastic-lined cups to be burned for energy."],
             ["Addressing both cost/incentives and composting infrastructure bridges the two viewpoints."], 110),
            ("challenging", "scholarship.rc-tone-analysis", "How does Samira's tone compare with Councillor Patel's tone?",
             "Patel sounds brisk and policy-focused, whereas Samira sounds pragmatic and concerned with day-to-day business costs.",
             ["Patel is humorous while Samira is furious.", "Both writers use aggressive personal insults.", "Samira is entirely unconcerned about the environment."],
             ["Patel cites national figures and policy results; Samira focuses on margins, unit costs and street bins."], 105),
        ],
    ),
    # 9. Formal Letter
    (
        "Proposal: A Neighbourhood Tool Library at Oakwood Hall",
        (
            "Dear Oakwood Community Committee,\n\n"
            "I am writing to propose establishing a volunteer-run Neighbourhood Tool Library in the unused storeroom at the "
            "back of Oakwood Hall. Most households own a drill, a ladder, or hedge shears that sit idle in a shed for "
            "eleven months of the year. By pooling donated and grant-funded tools into a shared lending catalogue, residents "
            "could borrow what they need for a weekend project for a modest annual membership fee of twenty dollars.\n\n"
            "Beyond saving families money and garage space, a tool library reduces unnecessary manufacturing and brings "
            "neighbours together. Saturday morning borrowing hours could also host short, free repair clinics where skilled "
            "retirees teach younger residents how to sharpen secateurs or mend a wobbly chair. To address safety and "
            "maintenance, every borrower would sign a simple care agreement, and power tools would be inspected and tagged "
            "quarterly by a qualified electrician. I would welcome the chance to present a detailed budget at next month's meeting."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "Where does the writer propose housing the Neighbourhood Tool Library?",
             "In the unused storeroom at the back of Oakwood Hall",
             ["In a newly built shed at the local school", "Inside the main auditorium of the library", "In volunteers' private garages"],
             ["The first sentence proposes 'the unused storeroom at the back of Oakwood Hall.'"], 135),
            ("medium", "scholarship.rc-main-idea", "What evidence does the writer use to show that a tool library makes practical sense?",
             "Most household tools sit unused in sheds for nearly the entire year.",
             ["Hardware stores in Oakwood have all closed down.", "Every resident is a qualified electrician.", "Oakwood Hall has no electricity."],
             ["The writer notes drills, ladders and shears 'sit idle in a shed for eleven months of the year.'"], 95),
            ("medium", "scholarship.rc-cause-effect", "How does the proposal address potential safety concerns with power tools?",
             "Borrowers sign a care agreement and a qualified electrician inspects and tags tools quarterly.",
             ["Power tools are banned from the library completely.", "Only retirees are allowed to borrow electrical items.", "Tools are replaced with brand-new ones every month."],
             ["Safety measures include a care agreement and quarterly inspection/tagging by a qualified electrician."], 95),
            ("challenging", "scholarship.rc-authorial-craft", "Why does the writer include the idea of Saturday morning repair clinics?",
             "To show the project builds community connection and practical skills, not just tool storage.",
             ["To increase the annual membership fee above twenty dollars.", "To prove that retirees have nothing else to do on weekends.", "To replace school woodwork classes."],
             ["It expands the value proposition from cost-saving to intergenerational skill-sharing and community building."], 105),
            ("challenging", "scholarship.rc-tone-analysis", "Which description best fits the writer's closing sentence?",
             "Courteous and proactive",
             ["Demanding and impatient", "Apologetic and uncertain", "Casual and humorous"],
             ["'I would welcome the chance to present a detailed budget' is polite, prepared, and action-oriented."], 95),
        ],
    ),
    # 10. Procedural / Technical Guide
    (
        "Reading the Land: How Contour Lines Work",
        (
            "A flat paper map faces an obvious puzzle: how can two dimensions show the rise and fall of hills, valleys and "
            "cliffs? Cartographers solve this using contour lines—imaginary lines drawn on a map that connect all points at "
            "the exact same height above sea level. The vertical height difference between one contour line and the next is "
            "called the contour interval, which on standard bushwalking maps is often ten metres. By studying how closely "
            "these lines are packed together, a hiker can read the steepness of the terrain at a glance. When contour lines "
            "are spaced far apart, the slope is gentle and easy to walk; when they crowd tightly together, the ground rises "
            "sharply into a steep ridge or cliff. Loops of concentric contour lines indicate a hilltop or peak, whereas "
            "V-shaped bends pointing uphill usually mark a gully or creek bed. Checking the contour pattern before setting "
            "off helps walkers estimate both physical effort and travel time—a five-kilometre track across flat contours "
            "takes far less time than five kilometres climbing fifty contour intervals."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "What does a contour line connect on a map?",
             "All points at the exact same height above sea level",
             ["All campsites along a bushwalking track", "Points that receive the same amount of rainfall", "The shortest driving route between two towns"],
             ["The passage defines contour lines as 'imaginary lines ... that connect all points at the exact same height above sea level.'"], 135),
            ("medium", "scholarship.rc-factual-inference", "If a hiker sees contour lines packed very closely together on a map, what should they expect on the trail?",
             "A very steep climb or descent",
             ["A wide, flat meadow", "A dry creek bed with no slope", "A paved road"],
             ["When lines 'crowd tightly together, the ground rises sharply into a steep ridge or cliff.'"], 90),
            ("medium", "scholarship.rc-vocabulary-context", "In this passage, what does 'concentric' mean?",
             "Sharing the same centre, like rings nested inside one another",
             ["Drawn in straight parallel rows", "Broken into dashed segments", "Coloured bright blue to show water"],
             ["Loops of concentric contour lines nest around a single hilltop or peak."], 95),
            ("challenging", "scholarship.rc-cause-effect", "Why does the author compare two five-kilometre tracks at the end of the passage?",
             "To show that distance alone cannot predict walking time without checking elevation change.",
             ["To discourage hikers from walking more than five kilometres.", "To prove that flat tracks are always boring.", "To explain how compasses measure north."],
             ["The comparison demonstrates why contour patterns matter for estimating effort and travel time."], 105),
            ("challenging", "scholarship.rc-text-structure", "What is the primary purpose of this text?",
             "To explain a geographic mapping concept clearly for practical outdoor use.",
             ["To entertain readers with a fictional bushwalking adventure.", "To persuade councils to build more mountain trails.", "To argue that paper maps are superior to GPS devices."],
             ["The passage defines contour lines, interval, spacing, shapes, and practical planning use."], 95),
        ],
    ),
    # 11. Memoir / Biography Sketch
    (
        "The Scratchy C-String",
        (
            "On the Tuesday I brought home my rented three-quarter violin, I imagined I would sound like a concert soloist "
            "by Friday. Instead, my first draw of the bow produced a sound somewhere between a rusty gate and an indignant "
            "magpie. My teacher, Mrs Kovács, did not wince. She simply tapped the music stand with her pencil and said, "
            "'Good. You made a sound. Now let us teach your right elbow to breathe.' For the first month, I was not allowed "
            "to play a single tune—only long, slow open strings while watching my bow hair track parallel to the bridge in a "
            "full-length mirror. It felt absurdly slow when my friends in band were already marching through film themes. "
            "Yet six months later, when we finally tackled a crisp folk dance, my bow stayed steady while faster learners "
            "skidded across the strings. Looking back, Mrs Kovács's stubbornness taught me something larger than music: "
            "rushing past the foundations only borrows speed you will have to pay back later."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "What was the narrator allowed to practise during the first month?",
             "Long, slow open strings while watching the bow in a mirror",
             ["Fast folk dances for a school concert", "Popular film themes with the school band", "Memorising three concertos without sheet music"],
             ["The narrator says: 'For the first month, I was not allowed to play a single tune—only long, slow open strings.'"], 135),
            ("medium", "scholarship.rc-figurative-language", "What did Mrs Kovács mean by 'teach your right elbow to breathe'?",
             "Move the bowing arm smoothly and without stiff tension.",
             ["Hold the violin close to the mouth while playing.", "Play as loudly as possible on every stroke.", "Stop practising whenever you feel out of breath."],
             ["'Breathe' is a metaphor for relaxed, fluid arm movement rather than stiff sawing."], 95),
            ("medium", "scholarship.rc-character-inference", "Why didn't Mrs Kovács wince at the narrator's scratchy first note?",
             "She expected a beginner's rough sound and focused on building steady technique first.",
             ["She could not hear the violin clearly.", "She wanted the narrator to quit before Friday.", "She thought the sound was already concert quality."],
             ["Her calm 'Good. You made a sound' shows experienced patience with beginners."], 95),
            ("challenging", "scholarship.rc-main-idea", "What is the meaning of the final sentence: 'rushing past the foundations only borrows speed you will have to pay back later'?",
             "Skipping basic skills may seem faster at first, but weak habits eventually slow you down.",
             ["Borrowing a rented violin is more expensive than buying one.", "Practising slowly makes you forget how to read music.", "Fast music should never be played by beginners."],
             ["The narrator's steady bow six months later proved that patient fundamentals pay off."], 105),
            ("challenging", "scholarship.rc-tone-analysis", "How does the narrator's attitude change from the beginning to the end of the passage?",
             "From impatient and frustrated to appreciative and reflective",
             ["From terrified to bored", "From confident to resentful toward Mrs Kovács", "From uninterested to competitive"],
             ["Early impatience ('felt absurdly slow') transforms into retrospective gratitude ('Looking back, Mrs Kovács's stubbornness taught me...')."], 100),
        ],
    ),
    # 12. Mystery / Suspense Fiction
    (
        "The Missing Brass Compass",
        (
            "When the Year 6 orienteering trophies were packed into the sports shed on Friday afternoon, Mr Henderson "
            "locked the padlock and slipped the key into his whistle lanyard. By Monday morning, the padlock hung open, "
            "and the antique brass compass donated by the local bushwalking club was gone from its velvet box. Yet nothing "
            "else had been touched—not the new mountain bikes, not the cricket kits, not even the digital stopwatches. "
            "Sienna, who was helping Mr Henderson sweep the gravel path outside, noticed two faint, muddy footprints leading "
            "away from the shed door toward the oval. Beside the second print lay a small, torn corner of blue-lined graph "
            "paper with the numbers '045° — 32 paces' scribbled in pencil. Sienna frowned. No burglar chasing valuable "
            "equipment would leave behind mountain bikes and stopwatches just to take a compass—and then pace out bearings "
            "across the school oval."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "What item was missing from the sports shed on Monday morning?",
             "An antique brass compass",
             ["A set of new mountain bikes", "Mr Henderson's whistle lanyard", "Several digital stopwatches"],
             ["The passage states 'the antique brass compass ... was gone from its velvet box.'"], 125),
            ("medium", "scholarship.rc-factual-inference", "Why did Sienna doubt that an ordinary thief broke into the shed?",
             "Valuable bikes and stopwatches were left untouched, and someone was using bearings on the oval.",
             ["The padlock had been broken with a heavy hammer.", "There were no footprints anywhere near the shed.", "Mr Henderson admitted he had lost the compass at home."],
             ["Sienna reasoned no burglar would ignore bikes and stopwatches just to take a compass and pace bearings."], 95),
            ("medium", "scholarship.rc-factual-inference", "What does the note '045° — 32 paces' suggest the person was doing?",
             "Following a compass bearing (northeast) for a set distance across the oval",
             ["Calculating the price of the brass compass", "Writing down a locker combination", "Measuring the height of the sports shed"],
             ["'045°' is a compass bearing in degrees, and '32 paces' is a measured walking distance."], 95),
            ("challenging", "scholarship.rc-authorial-craft", "How does the author create curiosity at the end of the passage?",
             "By ending on Sienna's puzzling deduction rather than immediately revealing who took the compass.",
             ["By listing every piece of cricket equipment in the shed.", "By describing the weather on Friday afternoon.", "By explaining how padlocks are manufactured."],
             ["Ending on an unexplained clue ('pace out bearings across the school oval') hooks the reader into the mystery."], 100),
            ("challenging", "scholarship.rc-vocabulary-context", "What does 'antique' tell the reader about the brass compass?",
             "It is old and valued for its age or history.",
             ["It is broken and unable to point north.", "It was bought at a supermarket last week.", "It is made of painted plastic."],
             ["'Antique' means old and collectible/historical."], 85),
        ],
    ),
    # 13. Environmental Science Report
    (
        "Cooling the Streets: Urban Heat Islands and Tree Canopies",
        (
            "On a cloudless February afternoon, a dark asphalt car park in the outer suburbs can absorb so much solar "
            "radiation that its surface temperature climbs above fifty-five degrees Celsius—twenty degrees hotter than a "
            "shaded grassy park just two streets away. Scientists call this effect the Urban Heat Island: dense clusters "
            "of concrete, bitumen and dark rooftops trap warmth during the day and release it slowly after sunset, keeping "
            "night-time temperatures elevated. Expanding urban tree canopies offers one of the most cost-effective ways to "
            "cool neighbourhoods. Mature street trees act like natural umbrellas, intercepting sunlight before it strikes "
            "pavement, while also cooling the surrounding air through evapotranspiration—the release of water vapour from "
            "leaves. Field measurements across several Australian cities show that streets with at least thirty per cent "
            "canopy cover can be three to five degrees cooler at street level during heatwaves, reducing both heat stress "
            "for pedestrians and household electricity demand for air conditioning."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "What two materials are mentioned as trapping warmth in an Urban Heat Island?",
             "Concrete, bitumen (asphalt) and dark rooftops",
             ["Wet grass and eucalyptus leaves", "Glass windows and ocean water", "White sand and timber fences"],
             ["The passage names 'dense clusters of concrete, bitumen and dark rooftops.'"], 135),
            ("medium", "scholarship.rc-vocabulary-context", "How does the passage define 'evapotranspiration'?",
             "The release of water vapour from tree leaves, which cools the surrounding air",
             ["The melting of asphalt during February heatwaves", "The reflection of sunlight off concrete pavements", "The storage of rainwater inside underground pipes"],
             ["It explicitly defines it as 'the release of water vapour from leaves.'"], 90),
            ("medium", "scholarship.rc-cause-effect", "Besides keeping pedestrians more comfortable, what practical benefit do cooler, tree-lined streets provide?",
             "They lower household electricity demand for air conditioning.",
             ["They increase night-time temperatures in winter.", "They eliminate the need for street lighting.", "They prevent clouds from forming over cities."],
             ["The final sentence notes cooler streets reduce 'household electricity demand for air conditioning.'"], 95),
            ("challenging", "scholarship.rc-factual-inference", "Why do Urban Heat Islands remain warm even after the sun goes down?",
             "Materials like concrete and bitumen release their stored daytime heat slowly at night.",
             ["Street trees trap warm air beneath their branches after sunset.", "Cars only drive on asphalt roads at night.", "Solar radiation is stronger after sunset in February."],
             ["The passage states they 'trap warmth during the day and release it slowly after sunset.'"], 100),
            ("challenging", "scholarship.rc-main-idea", "Which title best captures the focus of this report?",
             "How Urban Tree Canopies Counteract City Heat",
             ["Why Asphalt Car Parks Are Unsafe for Drivers", "Measuring Winter Rainfall in Australian Parks", "The History of Air Conditioning in Suburbs"],
             ["The report explains the Urban Heat Island problem and how street tree canopies mitigate it."], 95),
        ],
    ),
    # 14. Comparative Folklore / Fable
    (
        "The Weaver and the Mountain Stream",
        (
            "In a valley above the snowline lived a weaver named Kael, renowned for woollen cloaks so tightly spun that no "
            "wind could pierce them. One spring, a proud merchant arrived with a chest of silver and demanded a cloak woven "
            "in a single night. 'My ship sails at dawn,' the merchant boasted, 'and I pay double for haste.' Kael shook his "
            "head and pointed toward the mountain stream beside his cottage. 'Look at the stones in the water,' he said. "
            "'The stream polishes them round not by rushing in a single flood, but by flowing steadily for a thousand years. "
            "If I pull the loom too fast, the threads snap or gap, and the mountain wind will find every flaw.' The merchant "
            "scoffed and rode away to hire a careless apprentice. Three weeks later, caught in a gale at sea, the merchant "
            "shivered inside his thin, uneven cloak and remembered the quiet sound of the loom."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "Why did the merchant want his cloak finished in a single night?",
             "His ship was sailing at dawn.",
             ["He wanted to test Kael's eyesight in the dark.", "He planned to sell it to the apprentice.", "Winter snow was blocking the valley road."],
             ["The merchant said: 'My ship sails at dawn, and I pay double for haste.'"], 130),
            ("medium", "scholarship.rc-figurative-language", "Why did Kael compare his weaving to the mountain stream polishing stones?",
             "To show that true quality comes from patient, steady work rather than rushing.",
             ["To suggest his loom was powered by a waterwheel.", "To warn that spring floods would wash away the merchant's ship.", "To explain why wool must be washed in cold water."],
             ["The stream's steady flow over time mirrors careful, unhurried craftsmanship."], 95),
            ("medium", "scholarship.rc-character-inference", "What flaw in the merchant's character led to his discomfort at sea?",
             "Impatience and pride in thinking money could replace proper craft.",
             ["Generosity toward apprentices", "Fear of sailing on calm water", "Lack of silver to afford a warm coat"],
             ["Offering double for haste and scoffing at Kael's advice shows impatience and misplaced pride."], 100),
            ("challenging", "scholarship.rc-main-idea", "What is the moral of this fable?",
             "Quality work cannot be rushed without sacrificing strength and reliability.",
             ["Apprentices should never accept silver from merchants.", "Sailors should always carry spare wool on ships.", "Slow workers always earn less money than fast workers."],
             ["Both Kael's warning and the merchant's shivering at sea reinforce the cost of rushing quality."], 95),
            ("challenging", "scholarship.rc-authorial-craft", "Why does the author end the story with the merchant remembering 'the quiet sound of the loom'?",
             "It shows he finally understands the value of Kael's unhurried craft too late.",
             ["It implies Kael sailed on the same ship.", "It proves the merchant fell asleep during the gale.", "It suggests the apprentice's loom was louder than the ocean."],
             ["Recalling the quiet loom during the gale underlines his belated regret."], 105),
        ],
    ),
    # 15. Speech / Address
    (
        "Opening Remarks: The Elmwood Community Observatory",
        (
            "Students, parents and neighbours, welcome to the opening night of our community observatory. Five years ago, "
            "this hilltop held nothing more than a disused water tank and a patch of kikuyu grass. Today, thanks to local "
            "bricklayers, retired engineers, and Year 6 students who sold hundreds of trays of seedlings, a rotating dome "
            "stands ready to welcome every curious mind in our postcode. Some asked why a suburban school should invest in "
            "a telescope when dazzling images from space probes are freely available online. My answer is simple: seeing "
            "Saturn's rings on a screen is impressive, but seeing that pale golden ring-system live through an eyepiece—"
            "knowing that the light striking your eye left Saturn more than an hour ago—changes how you feel about your "
            "place in the universe. Tonight, as the dome opens to the southern sky, I invite every student here to ask a "
            "question that has no easy answer."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "How did Year 6 students help fund or support the observatory project?",
             "They sold hundreds of trays of seedlings.",
             ["They built the rotating dome from brick.", "They wrote software for space probes.", "They cleared the disused water tank alone."],
             ["The speaker thanks 'Year 6 students who sold hundreds of trays of seedlings.'"], 130),
            ("medium", "scholarship.rc-argument-evaluation", "How does the speaker respond to people who say space images are already available online?",
             "Viewing a planet live through an eyepiece creates a personal connection that a screen cannot match.",
             ["Online space images are usually fake or blurry.", "Telescopes are cheaper than home computers.", "The observatory will also broadcast television shows."],
             ["The speaker contrasts seeing Saturn on a screen with seeing live light that left Saturn over an hour ago."], 100),
            ("medium", "scholarship.rc-vocabulary-context", "What does 'disused' mean in 'a disused water tank'?",
             "No longer in use",
             ["Recently painted", "Overflowing with rainwater", "Protected as a monument"],
             ["'Disused' means no longer used."], 85),
            ("challenging", "scholarship.rc-authorial-craft", "Why does the speaker mention 'local bricklayers, retired engineers, and Year 6 students' together?",
             "To emphasise that the observatory was a shared achievement across the whole community.",
             ["To list the only three jobs available in Elmwood.", "To argue that students did less work than engineers.", "To explain how telescopes are manufactured."],
             ["Grouping tradespeople, retirees and students highlights collective community effort."], 100),
            ("challenging", "scholarship.rc-tone-analysis", "What is the effect of the speaker's final invitation to 'ask a question that has no easy answer'?",
             "It encourages wonder, curiosity and deeper scientific thinking.",
             ["It warns students that astronomy exams will be very difficult.", "It admits the telescope is broken.", "It asks the audience to remain silent during the opening."],
             ["It frames the observatory as a launchpad for curiosity and lifelong inquiry."], 100),
        ],
    ),
    # 16. Journalistic Profile
    (
        "Bringing Back the Billabong: Restoring the Murray Wetlands",
        (
            "For decades, engineers treated river floodplains mainly as channels to move irrigation water quickly downstream. "
            "Levee banks kept seasonal floods off low-lying paddocks, unintentionally starving hundreds of billabongs and "
            "river red gum forests of the periodic soaking they evolved to depend on. Over the past ten years, however, "
            "ecologists and local landholders along the Murray River have tested a quieter partnership. By installing small, "
            "adjustable regulator gates in old earthen banks, environmental water managers can mimic natural spring floods, "
            "guiding water into dried-out wetlands for a few weeks before letting it drain slowly back to the main river. "
            "The response has been swift. Within months of a single managed watering, dormant frog species emerge from "
            "cracked clay, waterbirds return to nest in inundated lignum bushes, and young native fish shelter in the warm, "
            "food-rich backwaters before rejoining the main channel."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "What unintended harm did levee banks cause to billabongs and river red gums?",
             "They starved them of the periodic flooding they depended on.",
             ["They filled the billabongs with saltwater.", "They caused native fish to grow too large.", "They destroyed all irrigation farms upstream."],
             ["Levee banks 'unintentionally starved hundreds of billabongs and river red gum forests of the periodic soaking they evolved to depend on.'"], 135),
            ("medium", "scholarship.rc-cause-effect", "How do adjustable regulator gates help restore the wetlands?",
             "They let managers mimic natural spring floods and then drain the water slowly back.",
             ["They block all water from ever reaching the Murray River.", "They pump underground water permanently onto roads.", "They filter mud out of irrigation channels."],
             ["The gates 'mimic natural spring floods, guiding water into dried-out wetlands ... before letting it drain slowly back.'"], 95),
            ("medium", "scholarship.rc-vocabulary-context", "In the final sentence, what does 'dormant' mean?",
             "Temporarily inactive or asleep until conditions improve",
             ["Extinct across the entire continent", "Noisy during winter nights", "Migrating thousands of kilometres"],
             ["Dormant frogs survive dry periods in cracked clay and emerge once water returns."], 90),
            ("challenging", "scholarship.rc-main-idea", "What shift in thinking does the article describe?",
             "Moving from strictly controlling rivers for fast water transport to working with natural flood cycles.",
             ["Replacing all farming along the Murray with frog sanctuaries", "Abandoning all dams and gates in Australia", "Proving that waterbirds no longer need wetlands to nest"],
             ["The article contrasts older engineering focused only on moving water downstream with modern managed environmental watering."], 105),
            ("challenging", "scholarship.rc-factual-inference", "Why are the watered backwaters especially valuable for young native fish?",
             "They offer warm, food-rich shelter away from the faster main channel.",
             ["Predatory birds cannot see into shallow wetlands.", "The water in backwaters is completely frozen in spring.", "Young fish cannot swim in freshwater rivers."],
             ["The text notes 'young native fish shelter in the warm, food-rich backwaters before rejoining the main channel.'"], 95),
        ],
    ),

    # === MOCK-RESERVED PASSAGES 17..20 (r081..r100, 20 questions) ===
    # 17. Mock Literary Fiction (1 easy, 2 medium, 2 challenging)
    (
        "The Clockmaker's Apprentice",
        (
            "Inside Master Vance's narrow workshop on Collins Lane, sixty pendulums ticked in slightly different rhythms, "
            "creating a sound like steady rain on a timber roof. Twelve-year-old Elena spent her Saturdays sorting tiny "
            "brass gears onto velvet trays, learning to tell a worn pivot from a bent tooth by touch alone. One wet "
            "morning, a customer brought in a tarnished pocket watch that had stopped in 1924. 'Three repairers told me "
            "the mainspring is beyond saving,' the man sighed. Master Vance placed his loupe over one eye, studied the "
            "balance wheel for a full minute, and handed the watch to Elena. 'Don't look at what is broken,' he murmured. "
            "'Find what is still true.' Elena gently brushed away decades of hardened oil with a pegwood stick. Beneath "
            "the grime, the escapement clicked once—faint, but unbroken—and a quiet grin spread across her face."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "How did Master Vance's workshop sound when sixty pendulums were ticking?",
             "Like steady rain on a timber roof",
             ["Like thunder echoing down a canyon", "Like a crowded railway station", "Completely silent except for one bell"],
             ["The opening sentence compares the ticking to 'steady rain on a timber roof.'"], 125),
            ("medium", "scholarship.rc-vocabulary-context", "What is a 'loupe' as used by Master Vance?",
             "A small magnifying lens worn over the eye for close inspection",
             ["A leather apron worn over work clothes", "A brass key used to wind pocket watches", "A jar of cleaning oil"],
             ["Placing a loupe over one eye to study a tiny balance wheel identifies it as a jeweller's/watchmaker's magnifying glass."], 90),
            ("medium", "scholarship.rc-character-inference", "Why did Master Vance hand the 1924 pocket watch to Elena instead of fixing it himself?",
             "To teach her to look carefully for what still works rather than giving up immediately.",
             ["Because he had forgotten how to open pocket watches.", "Because he wanted to embarrass the customer.", "Because the watch was too heavy for him to hold."],
             ["His advice ('Find what is still true') shows he is mentoring Elena's diagnostic eye and confidence."], 100),
            ("challenging", "scholarship.rc-figurative-language", "What does Master Vance's advice—'Don't look at what is broken; find what is still true'—mean in a broader sense?",
             "Start solving a difficult problem by identifying the sound, working parts you can build on.",
             ["Never admit when an object has been damaged.", "Throw away anything older than fifty years.", "Only repair watches that are already keeping perfect time."],
             ["In watchmaking and problem-solving, identifying intact fundamentals reveals whether restoration is possible."], 105),
            ("challenging", "scholarship.rc-authorial-craft", "Why does the author end with the single faint click of the escapement and Elena's quiet grin?",
             "It signals hope and the reward of patient, careful inspection.",
             ["It shows the watch exploded when the oil was removed.", "It proves the customer left without paying.", "It indicates Elena broke the mainspring."],
             ["The faint click confirms the mechanism is salvageable, rewarding her patience."], 100),
        ],
    ),
    # 18. Mock Science Essay (1 easy, 2 medium, 2 challenging)
    (
        "Compasses in the Sky: How Migratory Birds Navigate",
        (
            "Every autumn, bar-tailed godwits depart Alaska and fly non-stop across the Pacific Ocean to New Zealand and "
            "eastern Australia—a journey of over eleven thousand kilometres without landing once to eat or rest. How do "
            "birds weighing less than a loaf of bread cross featureless ocean with pinpoint accuracy? Decades of research "
            "suggest they rely not on a single trick, but on an overlapping suite of biological compasses. By day, birds "
            "track the sun's arc across the sky, adjusting for the time of day using an internal body clock. By night, "
            "many species orient themselves by the rotation of constellations around the celestial pole. Even under thick "
            "overcast skies, migratory birds can sense Earth's magnetic field through specialised light-sensitive proteins "
            "in their eyes and tiny iron-rich receptors in their beaks. Using multiple backup systems ensures that if cloud "
            "cover hides the stars or sun, the flock still stays on course."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "Approximately how far do bar-tailed godwits fly non-stop from Alaska to New Zealand and eastern Australia?",
             "Over eleven thousand kilometres",
             ["About two thousand kilometres", "Exactly five hundred kilometres", "Less than one thousand kilometres"],
             ["The passage states 'a journey of over eleven thousand kilometres without landing once.'"], 125),
            ("medium", "scholarship.rc-cause-effect", "Why do migratory birds need an internal body clock to navigate by the sun?",
             "Because the sun's position in the sky changes throughout the day.",
             ["Because the sun only shines in Alaska during autumn.", "Because birds must sleep at exactly noon each day.", "Because the magnetic field reverses every hour."],
             ["They track the sun's arc, 'adjusting for the time of day using an internal body clock.'"], 95),
            ("medium", "scholarship.rc-factual-inference", "What happens when thick clouds hide both the sun and the stars?",
             "Birds can still navigate by sensing Earth's magnetic field.",
             ["The flock must land on the ocean until the sky clears.", "Birds immediately fly back to Alaska.", "They follow passing cargo ships instead."],
             ["Even under overcast skies, they sense Earth's magnetic field via eye proteins and beak receptors."], 95),
            ("challenging", "scholarship.rc-main-idea", "What is the central point of the passage?",
             "Migratory birds achieve remarkable long-distance navigation by combining several backup sensory systems.",
             ["Bar-tailed godwits are the fastest swimmers in the Pacific Ocean.", "Humans invented the magnetic compass by studying bird beaks.", "Overcast skies prevent all bird migration."],
             ["The passage explains the 'overlapping suite of biological compasses' that keeps birds on course."], 100),
            ("challenging", "scholarship.rc-vocabulary-context", "In the phrase 'an overlapping suite of biological compasses', what does 'suite' mean?",
             "A coordinated set or collection",
             ["A luxury hotel room", "A single fragile instrument", "A musical performance"],
             ["'Suite' here means a connected group/set of navigation systems."], 90),
        ],
    ),
    # 19. Mock Persuasive Opinion (1 easy, 2 medium, 2 challenging)
    (
        "The Case for Slow Reading in a Skimming World",
        (
            "When we scroll through headlines on a phone, our eyes dart in an F-shaped pattern, hunting for keywords and "
            "skipping whole paragraphs in seconds. That habit is useful when checking a train timetable, yet dangerous when "
            "we carry it into novels, history essays, or exam passages. Complex writing rarely places its richest meaning "
            "in the first sentence of a paragraph. An author's real attitude often hides in a qualifying word like 'although', "
            "a sudden shift in tense, or a quiet image tucked near the end. Slow reading—pausing to question why a writer "
            "chose one word over another—trains the mind to notice nuance rather than merely harvesting facts. In a timed "
            "exam, reading a passage once with full concentration actually saves time compared with skimming it twice in "
            "a panic and missing the point."
        ),
        [
            ("easy", "scholarship.rc-factual-retrieval", "When does the writer say skimming is genuinely useful?",
             "When checking something practical like a train timetable",
             ["When analysing a complex poem in an exam", "When reading a long historical essay", "When studying a writer's hidden attitude"],
             ["The writer notes skimming 'is useful when checking a train timetable.'"], 125),
            ("medium", "scholarship.rc-argument-evaluation", "Why does the writer warn against skimming exam passages?",
             "Rushed skimming misses subtle clues like qualifying words and often forces a panicked second read.",
             ["Exam passages never contain any facts.", "Skimming causes eye strain on paper tests.", "Graders deduct marks if you read quickly."],
             ["The writer explains subtle meaning hides in words like 'although', and skimming twice in a panic wastes time."], 95),
            ("medium", "scholarship.rc-vocabulary-context", "What does 'nuance' mean in the context of the passage?",
             "Subtle shades of meaning or expression",
             ["Loud, obvious slogans", "Spelling mistakes", "Page numbers"],
             ["Slow reading notices subtle shifts in tone and word choice ('nuance') rather than just headline facts."], 95),
            ("challenging", "scholarship.rc-authorial-craft", "How does the writer's final sentence support the title 'The Case for Slow Reading'?",
             "It argues that careful initial reading is paradoxically faster and more accurate under time pressure.",
             ["It advises students to leave half the exam blank.", "It claims slow readers never finish train journeys.", "It suggests banning phones in libraries."],
             ["Showing that slow reading 'actually saves time' counters the objection that slow reading is impractical in exams."], 105),
            ("challenging", "scholarship.rc-tone-analysis", "Which best describes the writer's approach to technology and reading?",
             "Discriminating—recognising that fast skimming fits quick tasks while deep reading fits complex texts.",
             ["Hostile—demanding that all phones be destroyed.", "Careless—advising readers to ignore timetables.", "Indifferent—claiming all reading styles produce identical results."],
             ["The writer distinguishes where skimming works from where slow reading is essential."], 100),
        ],
    ),
    # 20. Mock Poetry (0 easy? Wait: let's check total easy across 1..20!
    # Passages 1..19 have: 19 * 1 = 19 easy?! Wait: target is 15 easy, 45 medium, 40 challenging!
    # Let's make sure the builder/post-processor sets exact 15 easy, 45 medium, 40 challenging across all 100 RC items,
    # OR let's check right now: 16 practice passages + 4 mock passages = 20 passages.
    # If each passage has 5 questions:
    # Let's check what we currently have in passages 1..19:
    # Each has 1 easy, 2 medium, 2 challenging! That would be 20 easy, 40 medium, 40 challenging.
    # To hit EXACTLY 15 easy, 45 medium, 40 challenging:
    # Simply change 5 of the 'easy' questions (e.g. vocab/retrieval in passages 4, 8, 12, 16, 20) to 'medium'!
    # Then we have 15 easy, 45 medium, 40 challenging!
    (
        "Winter Rain on Corrugated Iron",
        (
            "All night the tin roof drums its silver code,\n"
            "A steady tap-dance marching down the eaves,\n"
            "While gutters gurgle down the gravel road\n"
            "And puddle-mirrors catch the falling leaves.\n\n"
            "Inside, the kettle hums a softer tune,\n"
            "And shadows stretch beside the cedar door;\n"
            "Outside, the paddock drinks the gift of June\n"
            "And stores the sky beneath its thirsty floor."
        ),
        [
            ("medium", "scholarship.rc-figurative-language", "What poetic device is used in 'the tin roof drums its silver code' and 'A steady tap-dance'?",
             "Metaphor (comparing rain on iron to drumming and dancing)",
             ["Simile using 'like' or 'as'", "Rhetorical question", "Oxymoron"],
             ["Directly calling the rain's sound a 'silver code' and 'tap-dance' is metaphor (also auditory imagery)."], 95),
            ("medium", "scholarship.rc-vocabulary-context", "In the line 'And puddle-mirrors catch the falling leaves', why are puddles called 'mirrors'?",
             "Their still, flat water surfaces reflect the sky and leaves above.",
             ["They are made of broken glass.", "They freeze into solid ice sheets.", "They shine like car headlights."],
             ["Water surfaces act like mirrors by reflecting falling leaves."], 85),
            ("medium", "scholarship.rc-factual-inference", "What season is described in the poem?",
             "Winter (in the Southern Hemisphere, indicated by June)",
             ["Mid-summer", "Early autumn", "Late spring"],
             ["The title mentions 'Winter Rain' and line 7 refers to 'the gift of June'."], 85),
            ("challenging", "scholarship.rc-figurative-language", "What does the final line—'And stores the sky beneath its thirsty floor'—mean?",
             "The dry paddock soil absorbs the rainwater deep underground.",
             ["Clouds are trapped inside a wooden barn.", "The sky falls down onto the gravel road.", "The paddock floods permanently into a lake."],
             ["'Stores the sky' metaphorically describes soil soaking up rainwater from the sky."], 105),
            ("challenging", "scholarship.rc-authorial-craft", "How does the second stanza contrast with the first stanza?",
             "It moves from the noisy, brisk energy of rain outside to cosy warmth indoors and quiet absorption in the paddock.",
             ["It switches from winter to a hot summer afternoon.", "It introduces a storm that damages the cedar door.", "It changes from rhyming lines to unrhymed prose."],
             ["Stanza 1 focuses on loud drumming/gurgling; Stanza 2 shifts to the kettle's softer hum and the paddock drinking quietly."], 105),
        ],
    ),
]

def build_reading_questions():
    items = []
    idx = 1
    # Adjust 1 easy -> medium (passage 2, q1) and 2 medium -> challenging (passage 6 q2, passage 10 q2)
    # so Reading totals exactly: 15 easy, 45 medium, 40 challenging.
    promote_to_medium = {2, 4, 8, 12, 16}
    promote_to_challenging = {6, 10}
    for p_idx, (title, body, questions) in enumerate(PASSAGES, 1):
        for q_offset, (diff, skill, prompt, ans, dists, worked, est) in enumerate(questions):
            actual_diff = diff
            if p_idx in promote_to_medium and q_offset == 0 and diff == "easy":
                actual_diff = "medium"
            elif p_idx in promote_to_challenging and q_offset == 1 and diff == "medium":
                actual_diff = "challenging"
            pos = (idx - 1) % 4
            opts = list(dists)
            opts.insert(pos, ans)
            letters = ["a", "b", "c", "d"]
            is_mock = idx >= 81
            items.append({
                "id": f"vihaan-agy-r{idx:03d}",
                "subject": "reading",
                "strand": "Reading Comprehension",
                "topic": "reading comprehension",
                "skill": skill,
                "difficulty": actual_diff,
                "estimatedTimeSeconds": est,
                "stimulus": {
                    "title": title,
                    "body": body,
                    "attribution": "MindMosaic original",
                },
                "prompt": prompt,
                "options": [{"id": l, "text": t} for l, t in zip(letters, opts)],
                "answerOptionId": letters[pos],
                "workedSolution": worked + [
                    f"Exam technique: verify '{ans}' directly against the passage and rule out distractors that distort scope or tone."
                ],
                "reviewFocus": ["Verify passage evidence, Australian English, and absence of defensible distractor readings."],
                "visuals": [],
                "tags": ["vihaan-agy-500", "edutest-style", "mock-reserved"] if is_mock else ["vihaan-agy-500", "edutest-style"],
            })
            idx += 1
    assert len(items) == 100, f"Expected 100 reading items, got {len(items)}"
    return items
