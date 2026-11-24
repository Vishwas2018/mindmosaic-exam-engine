"""40 original Year 6/7 scholarship Written Expression tasks (w001..w040).
Distribution: 6 easy, 18 medium, 16 challenging = 40.
w033..w040 (8 tasks) are reserved exclusively for unseen mock examinations.
"""

RUBRIC_SUMMARY = (
    "Assessed by a human marker against the 6-criterion Scholarship Written Expression Rubric: "
    "Ideas & Content, Structure & Cohesion, Vocabulary & Expression, Sentence Craft, "
    "Mechanics & Australian Spelling, and Task Responsiveness."
)

WRITING_PROMPTS = [
    # Easy (6)
    ("easy", "narrative", "The Forgotten Key",
     "Write a narrative about a student who discovers an unlabelled brass key tucked inside an old library book. Plan a clear beginning, rising complication, turning point and resolution.",
     900, ["Spend 3 minutes planning character, setting and the key's mystery before writing.", "Show suspense through sensory details rather than rushing the ending."]),
    ("easy", "persuasive", "Longer Lunch Breaks",
     "Should primary schools extend lunch breaks by fifteen minutes? Write a persuasive essay presenting a clear stance with two well-developed reasons and an acknowledgement of the opposing view.",
     900, ["Spend 4 minutes outlining your thesis, two body arguments and one counterargument.", "Reserve 3 minutes at the end to check punctuation and paragraph links."]),
    ("easy", "descriptive", "Early Morning at the Market",
     "Describe a bustling weekend farmers' market just as it opens at sunrise. Focus on sights, sounds, scents and textures to bring the scene alive.",
     900, ["Organise your description spatially from the entrance gate to the busiest stall.", "Use varied sentence openings and precise Australian vocabulary."]),
    ("easy", "informative", "How to Prepare for a Timed Exam",
     "Write an informative guide for Year 6 students explaining practical strategies for managing time, staying calm, and checking answers during a timed scholarship test.",
     900, ["Group your advice under clear stages: before, during and final five minutes.", "Use concrete examples such as flagging hard questions and estimating."]),
    ("easy", "creative", "The Day the Clocks Ran Backwards",
     "Imagine waking up one Saturday to discover every clock in your town is ticking backwards. Write an imaginative story exploring what happens over the next few hours.",
     900, ["Establish a clear rule for how backwards time affects your character.", "Maintain consistent tense and a satisfying final twist."]),
    ("easy", "expository", "Why Libraries Still Matter",
     "Even when information is available on smartphones, public libraries remain busy community hubs. Explain three reasons why libraries continue to be valuable today.",
     900, ["Plan three distinct points: quiet study access, community programs and reliable curation.", "Use topic sentences to open each body paragraph."]),

    # Medium (18)
    ("medium", "persuasive", "Homework-Free Weekends",
     "Write a persuasive argument on whether Year 6 students should have homework-free weekends. Support your position with logical reasoning, concrete examples and a rebuttal.",
     900, ["Dedicate 4 minutes to planning thesis, 3 supporting points and rebuttal.", "Avoid vague generalisations; use specific school-life examples."]),
    ("medium", "narrative", "The Storm Signal",
     "Write a story set at a coastal surf club where two young cadets notice a sudden change in the weather before anyone else. Build tension toward a decisive choice.",
     900, ["Plan the inciting incident, escalation and rescue or warning decision.", "Keep dialogue concise and purposeful."]),
    ("medium", "expository", "Teamwork Versus Solo Effort",
     "Some challenges are best solved alone, while others demand a team. Explain when individual focus is stronger and when collaboration produces better results.",
     900, ["Balance both sides with clear criteria and real-world examples.", "Link paragraphs with transitional phrases such as 'Conversely' and 'In practice'."]),
    ("medium", "descriptive", "After the Bushfire Rain",
     "Describe a eucalyptus gully a month after rain returns following a long dry summer. Capture the contrast between charred bark and bright new shoots.",
     900, ["Use colour, sound and texture contrasts to convey renewal.", "Vary sentence length for rhythmic control."]),
    ("medium", "persuasive", "Should Smartphones Wait Until High School?",
     "Argue for or against the view that children should wait until Year 8 before owning a personal smartphone. Address both safety benefits and social pressures.",
     900, ["Structure: Hook + Thesis → Argument 1 → Argument 2 → Counterargument & Rebuttal → Conclusion.", "Maintain a respectful, reasoned tone throughout."]),
    ("medium", "creative", "The Map Without Names",
     "A hiker finds a hand-drawn map in a hollow log showing landmarks—'Split Boulder', 'Echo Creek', 'Three Pines'—but no town names. Write the story of following it.",
     900, ["Plan each landmark as a stepping stone in the plot.", "Use vivid verbs and tight pacing."]),
    ("medium", "informative", "Designing a Fair School Timetable",
     "Explain how a school principal should balance core academic subjects, sport, arts and rest breaks when designing a weekly Year 6 timetable.",
     900, ["Consider energy levels across the day, variety and teacher availability.", "Present ideas in a logical, structured sequence."]),
    ("medium", "persuasive", "Compulsory Musical Instruments",
     "Should every primary student be required to learn a musical instrument for at least two years? Write a persuasive piece defending your viewpoint.",
     900, ["Address cognitive/team benefits as well as cost and student choice.", "Use persuasive devices sparingly and effectively."]),
    ("medium", "narrative", "The Wrong Platform",
     "Running late for an interschool debating final, Priya steps onto the wrong suburban train. Write a narrative showing how she adapts under pressure.",
     900, ["Focus on problem-solving and emotional composure under time pressure.", "Resolve the conflict believably without relying on coincidence."]),
    ("medium", "expository", "What Makes a Great Mentor?",
     "Think of a teacher, coach or older student who helps others learn. Explain the qualities that separate an effective mentor from someone who merely gives orders.",
     900, ["Define three key qualities with brief illustrative scenarios.", "Conclude by reflecting on how mentorship builds independence."]),
    ("medium", "descriptive", "Midnight at the Train Depot",
     "Describe an empty country railway station late at night as an express train approaches, rushes past, and disappears into the dark.",
     900, ["Build sensory intensity as the train approaches, then drop back into quietness.", "Check spelling and punctuation carefully."]),
    ("medium", "creative", "The Museum After Closing",
     "Write a story about a student who accidentally stays inside a natural history museum for ten minutes after the doors lock—and notices one display is not quite still.",
     900, ["Keep the tone atmospheric and controlled.", "End with a clever, grounded resolution."]),
    ("medium", "persuasive", "Public Transport Should Be Free for Students",
     "Write a persuasive letter to your local council arguing that buses and trains should be free for all school students.",
     900, ["Use formal letter conventions and persuasive evidence (traffic, equity, independence).", "Address funding or crowding objections directly."]),
    ("medium", "informative", "The Life Cycle of a Plastic Bottle",
     "Write an informative article tracing what happens to a single-use plastic bottle when it is recycled properly versus when it is littered.",
     900, ["Compare the two pathways clearly step by step.", "Use accurate, formal explanatory language."]),
    ("medium", "narrative", "The Last Over",
     "With six runs needed off the final two balls of the match, the least experienced batter walks to the crease. Write the story from that batter's perspective.",
     900, ["Capture internal thoughts, crowd noise and tactical focus.", "Focus on sportsmanship and composure regardless of the scoreboard."]),
    ("medium", "expository", "Why Mistakes Improve Learning",
     "Many students fear getting answers wrong in class. Explain why analysing mistakes carefully is actually one of the fastest ways to improve.",
     900, ["Distinguish between careless slips and conceptual gaps.", "Include practical advice on keeping an error log."]),
    ("medium", "creative", "Letter from a Voyager",
     "Write a diary entry or letter from an explorer camping on the edge of an uncharted southern glacier in 1912.",
     900, ["Maintain historical voice and sensory precision (wind, ice, rationed tea).", "Avoid modern slang."]),
    ("medium", "persuasive", "Zoos: Conservation or Captivity?",
     "Modern zoos argue they protect endangered species, while critics say wild animals belong in natural habitats. Write a persuasive essay taking a clear, nuanced position.",
     900, ["Weigh breeding programs and education against habitat space.", "Synthesise your strongest reasons in a memorable conclusion."]),

    # Challenging (16)
    ("challenging", "persuasive", "Should Artificial Intelligence Grade Student Essays?",
     "Schools are debating whether automated software should score student writing. Write a persuasive argument examining accuracy, fairness, voice and the role of human teachers.",
     900, ["Plan a sophisticated thesis distinguishing mechanical checks from human judgement of meaning.", "Counter the strongest opposing argument (speed/scale)."]),
    ("challenging", "expository", "The Paradox of Choice",
     "Having more options is usually seen as a good thing, yet too many choices can leave people anxious or indecisive. Explain this idea using examples from daily life and study.",
     900, ["Define the paradox clearly in your introduction.", "Develop two contrasting examples and offer a practical takeaway."]),
    ("challenging", "narrative", "The Unsent Telegram",
     "Write a story centred on an unopened telegram discovered inside a second-hand piano bench, and the decision of whether to deliver it fifty years later.",
     900, ["Balance present-day curiosity with respect for the past.", "Use subtle detail rather than melodrama."]),
    ("challenging", "persuasive", "Compulsory Volunteering in Year 7",
     "Should secondary schools require every student to complete twenty hours of community volunteering each year? Argue your case with precision and depth.",
     900, ["Explore whether compulsory service builds civic habit or undermines genuine altruism.", "Conclude with a constructive policy recommendation."]),
    ("challenging", "creative", "The City Built on Bridges",
     "Imagine a city suspended across a misty gorge where every street is a bridge and no building touches the ground. Write a narrative set during a festival night there.",
     900, ["Weave world-building details naturally into character action.", "Ensure the plot has a clear conflict and resolution."]),
    ("challenging", "expository", "Speed Versus Accuracy",
     "In scholarship examinations, sport and engineering, speed without accuracy fails—yet perfectionism without pace leaves work unfinished. Analyse how to strike the right balance.",
     900, ["Use structured comparison across two domains (e.g. timed exams and another field).", "Offer a concrete framework for pacing."]),
    ("challenging", "descriptive", "Anatomy of a Thunderstorm",
     "Describe the full arc of a late-afternoon summer storm: the heavy stillness beforehand, the sudden squall, the downpour, and the cool clarity after it passes.",
     900, ["Use four distinct paragraphs matching the four stages of the storm.", "Control pace through sentence rhythm and precise verbs."]),
    ("challenging", "persuasive", "Should Cities Prioritise Bike Lanes Over Street Parking?",
     "Many suburban shopping strips face a choice between keeping kerbside car parking or building protected bike lanes. Write a persuasive essay defending one priority.",
     900, ["Consider local traders, safety, congestion and accessibility for elderly shoppers.", "Rebut the strongest counter-claim fairly."]),
    ("challenging", "narrative", "The Second-Place Trophy",
     "Write a story about an athlete or musician who has always come first, and how placing second at a regional final changes their understanding of effort.",
     900, ["Show internal shift convincingly without sounding preachy.", "Anchor the turning point in a specific moment."]),
    ("challenging", "informative", "How Bridges Carry Weight",
     "Write a clear, engaging explanation for upper-primary readers comparing how beam, arch and suspension bridges distribute heavy loads.",
     900, ["Explain tension and compression in accessible Australian English.", "Use everyday analogies to clarify engineering ideas."]),
    ("challenging", "persuasive", "Is Competition Helpful or Harmful in Primary School?",
     "Debate whether academic and sporting rankings motivate primary students or create unnecessary pressure. Take a clear stance and defend it rigorously.",
     900, ["Distinguish healthy personal challenge from destructive comparison.", "Support claims with reasoned analysis."]),
    ("challenging", "creative", "The Keeper of Lost Sounds",
     "In a quiet alley stands a workshop that bottles vanishing sounds—the clack of old train tickets, the hum of a streetcar bell. Write a story about a visitor who brings a sound to be saved.",
     900, ["Focus on emotional resonance behind the chosen sound.", "Keep prose crisp and evocative."]),
    ("challenging", "expository", "Why Privacy Matters in a Digital Age",
     "When apps and websites offer free services in exchange for personal data, why should young citizens care about digital privacy? Write a structured expository essay.",
     900, ["Explain data trails, targeted influence and long-term reputation clearly.", "Maintain an objective, analytical tone."]),

    # Reserve w033..w040 (8 tasks: 1 easy, 4 medium, 3 challenging) — wait: let's check total counts!
    # Above we have: 6 easy, 18 medium, 13 challenging = 37!
    # Adding 3 more challenging tasks gives: 6 easy, 18 medium, 16 challenging = 40!
    # And we can mark w033..w040 (which are 8 tasks: let's make sure w033..w040 include a mix of persuasive, narrative, expository, descriptive!)
    ("challenging", "persuasive", "Should Daylight Saving Be Abolished or Extended?",
     "Write a persuasive essay arguing whether Australian states should keep, extend or abolish daylight saving time, weighing energy, health, agriculture and lifestyle.",
     900, ["Address regional differences (e.g. rural vs urban) in your rebuttal.", "Keep paragraphs focused on one central claim each."]),
    ("challenging", "narrative", "The Tide Table Mistake",
     "Two friends exploring sea caves misread the afternoon tide chart by one hour. Write a tense, realistic story about how they notice the danger and reach safety.",
     900, ["Use accurate coastal detail and calm decision-making.", "Avoid exaggerated melodrama; keep action credible."]),
    ("challenging", "expository", "The Value of Learning a Second Language",
     "Beyond ordering food on holiday, how does learning another language reshape the way we think, listen and understand other cultures? Write a well-structured essay.",
     900, ["Organise around cognitive, cultural and practical dimensions.", "Reserve 3 minutes to proofread spelling and sentence boundaries."]),
]

def build_writing_questions():
    assert len(WRITING_PROMPTS) == 40, f"Expected 40 writing prompts, got {len(WRITING_PROMPTS)}"
    # Reorder so w033..w040 (8 tasks) include 1 easy, 4 medium, 3 challenging across diverse forms
    easy_list = [p for p in WRITING_PROMPTS if p[0] == "easy"]
    med_list = [p for p in WRITING_PROMPTS if p[0] == "medium"]
    chal_list = [p for p in WRITING_PROMPTS if p[0] == "challenging"]
    practice_list = easy_list[:-1] + med_list[:-4] + chal_list[:-3]
    mock_list = easy_list[-1:] + med_list[-4:] + chal_list[-3:]
    ordered = practice_list + mock_list
    assert len(ordered) == 40

    items = []
    for idx, (diff, form, title, prompt_text, est, pacing_tips) in enumerate(ordered, 1):
        is_mock = idx >= 33
        items.append({
            "id": f"vihaan-agy-w{idx:03d}",
            "subject": "writing",
            "strand": "Written Expression",
            "topic": f"writing {form}",
            "difficulty": diff,
            "estimatedTimeSeconds": est,
            "prompt": f"{title}: {prompt_text}",
            "rubric": RUBRIC_SUMMARY,
            "workedSolution": [
                f"Task form: {form}. Target total time: {est // 60} minutes (plan 3-4 min, draft 8-9 min, proofread 2-3 min).",
                *pacing_tips,
            ],
            "reviewFocus": [
                "Human marker assessment required using scholarship-written-expression rubric v1.",
                "Verify prompt clarity, age suitability, and Australian English.",
            ],
            "writingGuidance": {
                "rubricId": "scholarship-written-expression",
                "rubricVersion": 1,
                "successCriteria": [
                    f"Sustained {form} purpose with clear opening, developed middle, and deliberate conclusion.",
                    "Controlled paragraphing, varied sentence structures, and precise Australian English vocabulary.",
                    "Evidence of planning and final proofreading for punctuation, spelling, and tense consistency.",
                ],
                "assessmentMode": "human_only",
            },
            "visuals": [],
            "tags": ["vihaan-agy-500", "edutest-style", form, "mock-reserved"] if is_mock else ["vihaan-agy-500", "edutest-style", form],
        })
    return items
