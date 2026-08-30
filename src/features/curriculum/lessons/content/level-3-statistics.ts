import type { Lesson } from "../schema";

export const LEVEL_3_STATISTICS_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2M3ST01: Categorical Data Collection and Frequency Tables
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3ST01",
    title: "Data Collection: Tally Marks, Frequency Tables and Categories",
    strand: "statistics",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to create categorical survey questions, record data systematically using tally marks, and organize frequencies into structured data tables.",
    successCriteria: [
      "I can create clear, non-overlapping categories for collecting data (e.g. favourite lunch fruit: Apple, Banana, Orange, Grapes, Other).",
      "I can record survey responses using standard tally marks in groups of 5 (four vertical bars and one diagonal cross-slash: 卌).",
      "I can convert tally marks into numerical frequency totals in a structured frequency table.",
    ],
    prerequisites: ["VC2M3N01"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Statistics).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3st01-concept",
        heading: "Collecting and Organizing Categorical Data",
        explanation:
          "Statistics is the science of collecting, organizing, and understanding data to answer questions about the world:\n\n1. **Categorical Data:** Data that falls into descriptive words or labels rather than measured numbers (e.g. favourite pet, transport to school, fruit choices).\n2. **Tally Marks in Fives:** When recording live responses, we draw a vertical line for each item: `|`, `||`, `|||`, `||||`. On the 5th item, we draw a diagonal slash across the four lines: `卌`. Grouping by fives allows us to count totals rapidly using skip-counting (5, 10, 15, 20...).\n3. **Frequency Tables:** A table that displays the category names, the tally marks collected, and the final numerical total called the **frequency**.",
        keyTerms: [
          {
            term: "Categorical Data",
            definition: "Information grouped into distinct descriptive categories or labels (e.g. colours, animal types).",
          },
          {
            term: "Tally",
            definition: "A quick visual counting mark, grouped in bundles of five (卌), used to record data as it is collected.",
          },
          {
            term: "Frequency",
            definition: "The total number of times a particular response or category occurs in a data set.",
          },
        ],
        visualAsset: {
          id: "vc2m3st01-transport-survey-table",
          type: "table",
          altText:
            "Frequency table displaying survey results for Year 3 transport to school including Walk, Car, Bus, Bicycle, and Scooter.",
          title: "Year 3 Travel to School Survey Results",
          data: {
            headers: ["Transport Mode", "Tally Groupings", "Frequency (Count)", "Percentage of Class"],
            rows: [
              ["Walk", "卌 卌 || (5 + 5 + 2)", 12, "40%"],
              ["Car", "卌 ||| (5 + 3)", 8, "27%"],
              ["Bus", "卌 | (5 + 1)", 6, "20%"],
              ["Bicycle / Scooter", "|||| (4)", 4, "13%"],
              ["Total Class Responses", "30 students surveyed", 30, "100%"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3st01-example",
        heading: "Worked Example: Converting Tallies to Frequency Totals",
        problem:
          "Maya surveyed her class on their favourite after-school activity. Her tallies were: Soccer (卌 卌 |), Swimming (卌 |||), Reading (卌 卌 卌), Art (||||). Calculate the frequency for each activity and find the total number of students surveyed.",
        steps: [
          {
            stepNumber: 1,
            label: "Calculate frequency for Soccer",
            working:
              "Two complete groups of 5 plus 1 single tick: (2 × 5) + 1 = 10 + 1 = 11 students.",
            why: "Skip counting by 5s for the bundles and adding single ticks gives the total count.",
          },
          {
            stepNumber: 2,
            label: "Calculate frequency for Swimming",
            working:
              "One complete group of 5 plus 3 single ticks: 5 + 3 = 8 students.",
            why: "Add the single ticks to the 5-bundle.",
          },
          {
            stepNumber: 3,
            label: "Calculate frequency for Reading and Art",
            working:
              "Reading: Three complete groups of 5: 3 × 5 = 15 students. Art: Four single ticks: 4 students.",
            why: "3 bundles of 5 equals 15; 4 individual ticks equals 4.",
          },
          {
            stepNumber: 4,
            label: "Calculate the total survey sample size",
            working:
              "Total = 11 (Soccer) + 8 (Swimming) + 15 (Reading) + 4 (Art) = 11 + 8 + 15 + 4 = 38 students.",
            why: "Adding all category frequencies gives the overall sample size.",
          },
        ],
        finalAnswer:
          "Frequencies: Soccer = 11, Swimming = 8, Reading = 15, Art = 4. Total students surveyed = 38.",
        commonError: {
          mistake: "Counting the diagonal slash as an extra 6th mark (thinking 卌 represents 6 items).",
          whyItHappens:
            "Counting the 4 vertical lines and mistakenly treating the slash as a separate additional unit.",
          howToAvoid:
            "Remember that the diagonal slash IS the 5th mark. A complete bundle 卌 is ALWAYS exactly 5.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3st01-misconception",
        heading: "Common Trap: Overlapping Survey Categories",
        claim: "In a pet survey, categories like 'Dogs', 'Puppies', and 'Big Dogs' work well.",
        whyWrong:
          "Categories must be mutually exclusive (non-overlapping). A puppy is also a dog, so a student wouldn't know which box to choose.",
        correction:
          "Always create distinct, clear categories (e.g. Dog, Cat, Bird, Fish, Other) so every response fits in exactly one category.",
        example: "If asked 'Do you like apples, fruit, or green apples?', the categories overlap and corrupt the survey data.",
      },
      {
        kind: "check",
        id: "vc2m3st01-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise reading tally charts, completing frequency tables, and interpreting survey categories.",
        curriculumCode: "VC2M3ST01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2M3ST02: Column Graphs and Picture Graphs
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3ST02",
    title: "Column Graphs and Picture Graphs: Reading and Comparing Data",
    strand: "statistics",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to construct and interpret column graphs and picture graphs (pictographs) with many-to-one scales (e.g. 1 symbol = 2 or 5 items).",
    successCriteria: [
      "I can read column graphs by checking the vertical axis scale, horizontal category labels, and graph title.",
      "I can interpret many-to-one keys in picture graphs (e.g. each 🏀 icon represents 2 students; half an icon = 1 student).",
      "I can compare categories by calculating differences (e.g. 'How many more chose apples than bananas?').",
    ],
    prerequisites: ["VC2M3ST01"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Statistics).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3st02-concept",
        heading: "Interpreting Graphs with Many-to-One Scales",
        explanation:
          "Visual graphs transform numbers in a table into pictures that allow instant comparisons:\n\n1. **Column Graphs:**\n• **Title:** Explains what the graph shows.\n• **Horizontal Axis (X-axis):** Shows the categories (e.g. Book genres, sports).\n• **Vertical Axis (Y-axis):** Shows the scale with numbers starting at 0. In Year 3, the vertical scale often counts in 2s, 5s, or 10s.\n• **Column Height:** The top of the column lines up with the exact value on the vertical scale.\n\n2. **Picture Graphs (Pictographs) & Keys:**\n• When data sets become large, drawing one symbol for every single response takes too long. We use a **many-to-one key** (e.g. 🌟 = 5 books read).\n• If a key says 🌟 = 5, then 4 stars = 4 × 5 = 20 books.\n• A half-symbol represents half of the key value (e.g. half of 5 is 2.5, or if 🌟 = 4, then half a star = 2).",
        keyTerms: [
          {
            term: "Many-to-One Scale",
            definition: "A scale where one symbol or grid unit represents multiple items (e.g. 1 icon = 5 votes).",
          },
          {
            term: "Key / Legend",
            definition: "A guide explaining what each symbol or colour on a graph represents.",
          },
          {
            term: "Axis (plural: Axes)",
            definition: "The horizontal line (categories) and vertical line (numbered scale) on a column graph.",
          },
        ],
        visualAsset: {
          id: "vc2m3st02-books-read-bar",
          type: "bar_chart",
          altText:
            "Bar chart displaying the number of books read by four Year 3 reading teams: Blue team 25, Red team 35, Green team 20, Yellow team 30.",
          title: "Year 3 Reading Challenge Books Read",
          data: {
            labels: ["Blue Team", "Red Team", "Green Team", "Yellow Team"],
            values: [25, 35, 20, 30],
            xAxisLabel: "Reading Teams",
            yAxisLabel: "Total Books Read",
            maxValue: 40,
            colour: "#1E3A8A",
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3st02-example",
        heading: "Worked Example: Comparing Data and Finding Differences",
        problem:
          "Refer to the 'Year 3 Reading Challenge' bar chart above: (a) Which team read the most books, and how many did they read? (b) How many more books did the Red Team read than the Green Team? (c) What is the total number of books read by all four teams combined?",
        steps: [
          {
            stepNumber: 1,
            label: "Read the highest column (most books)",
            working:
              "Look for the tallest column on the graph. The tallest column is the Red Team, reaching exactly to the 35 line on the vertical axis.",
            why: "The tallest column represents the category with the highest frequency.",
          },
          {
            stepNumber: 2,
            label: "Find the values to compare Red Team vs Green Team",
            working:
              "Red Team = 35 books. Green Team column height = 20 books.",
            why: "Reading both values accurately from the scale allows us to calculate the difference.",
          },
          {
            stepNumber: 3,
            label: "Calculate how many more books Red read than Green",
            working:
              "Difference = 35 - 20 = 15 books.",
            why: "'How many more' asks for the difference (subtraction) between the two values.",
          },
          {
            stepNumber: 4,
            label: "Sum all four team totals",
            working:
              "Total = 25 (Blue) + 35 (Red) + 20 (Green) + 30 (Yellow) = (25 + 35) + (20 + 30) = 60 + 50 = 110 books.",
            why: "Adding all column heights gives the total data count.",
          },
        ],
        finalAnswer:
          "(a) Red Team read the most (35 books). (b) Red Team read 15 more books than Green Team (35 - 20 = 15). (c) All teams combined read 110 books.",
        commonError: {
          mistake: "Misreading the vertical scale by assuming each grid line goes up by 1 instead of 5.",
          whyItHappens:
            "Not checking the numbers printed on the vertical axis before reading column heights.",
          howToAvoid:
            "Always inspect the 0 to first number gap on the vertical axis (0, 5, 10, 15...) to identify the step size.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3st02-misconception",
        heading: "Common Trap: Ignoring the Picture Graph Key",
        claim: "If a picture graph shows 4 smileys for apples and each smiley = 5 students, exactly 4 students like apples.",
        whyWrong:
          "Each smiley is not a single student. The key states that each smiley represents 5 students.",
        correction:
          "Always multiply the number of symbols by the value stated in the key: 4 symbols × 5 students = 20 students.",
        example: "3 bus icons with a key of 🚌 = 10 passengers equals 3 × 10 = 30 passengers.",
      },
      {
        kind: "check",
        id: "vc2m3st02-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise reading column graphs, interpreting picture graph keys, and answering comparison questions.",
        curriculumCode: "VC2M3ST02",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2M3ST03: Statistical Investigations and Data Interpretation
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3ST03",
    title: "Statistical Investigations: Asking Questions and Interpreting Findings",
    strand: "statistics",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to plan a simple statistical investigation: pose a clear question, collect and display data, and draw evidence-based conclusions.",
    successCriteria: [
      "I can formulate a clear, answerable statistical question (e.g. 'What is the most popular sport among Year 3 students?').",
      "I can choose an effective visual display (table, column graph, or pictograph) to present my collected data.",
      "I can write concluding statements summarizing what the data reveals and describe any unexpected variations.",
    ],
    prerequisites: ["VC2M3ST02"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Statistics).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3st03-concept",
        heading: "The Statistical Investigation Cycle",
        explanation:
          "A statistical investigation follows a 4-step inquiry cycle:\n\n1. **Pose a Question (Plan):** Create an inquiry question that can be answered with data. Good questions are specific and measurable (e.g. 'How do Year 3 students spend their recess time?' rather than 'Is recess fun?').\n2. **Collect Data (Gather):** Conduct a fair survey using non-overlapping categories and record responses with tally marks.\n3. **Display Data (Represent):** Create a clear column graph or frequency table with a title, labels, and appropriate scale.\n4. **Interpret & Conclude (Analyze):** Look at the results and describe what you discover:\n• Which category is the most common (the mode)?\n• Which category is the least common?\n• Are there surprising patterns or equal results?\n• What decision or action does the data suggest?",
        keyTerms: [
          {
            term: "Statistical Question",
            definition: "A question that can be answered by collecting data that is expected to vary from person to person.",
          },
          {
            term: "Mode / Most Common",
            definition: "The category or value that appears with the highest frequency in a data set.",
          },
          {
            term: "Conclusion",
            definition: "A summary statement explaining what the data proves, supported by numerical evidence.",
          },
        ],
        visualAsset: {
          id: "vc2m3st03-investigation-cycle-table",
          type: "table",
          altText:
            "Table detailing the four stages of a classroom statistical investigation with practical examples.",
          title: "The 4 Stages of a Statistical Investigation",
          data: {
            headers: ["Stage", "Inquiry Action", "Classroom Example", "Key Deliverable"],
            rows: [
              ["1. Pose", "Ask a clear question with variable outcomes", "'Which healthy snack should the school canteen stock?'", "Specific survey question"],
              ["2. Collect", "Gather responses systematically", "Survey 50 students across Year 3 with a tally sheet", "Completed tally sheet"],
              ["3. Display", "Construct a clear graph or table", "Draw a column graph with a scale of 2s and clear labels", "Labeled column graph"],
              ["4. Interpret", "Draw evidence-backed conclusions", "'Fruit skewers were chosen by 24 out of 50 students (mode).'", "Written summary report"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3sp03-example",
        heading: "Worked Example: Writing Conclusions from Investigation Data",
        problem:
          "A school environment club surveyed 60 students on the question: 'Which energy-saving action does your family do most often?' The results were: Turn off lights (28), Shorter showers (14), Walk instead of drive (12), Air-dry clothes (6). Write three evidence-based conclusions from this data.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the most common action (the mode)",
            working:
              "Turning off lights had 28 votes, which is the highest frequency of all categories. Conclusion 1: Turning off unused lights is the most common energy-saving action practiced by families (almost half of all respondents).",
            why: "Identifying the mode highlights the primary trend in the data.",
          },
          {
            stepNumber: 2,
            label: "Identify the least common action",
            working:
              "Air-drying clothes received only 6 votes out of 60 (only 1 in 10 families). Conclusion 2: Air-drying clothes is the least common energy-saving action.",
            why: "Naming the lowest category shows where potential improvement or education could focus.",
          },
          {
            stepNumber: 3,
            label: "Compare categories to find relative proportions",
            working:
              "Compare 'Turn off lights' (28) to 'Shorter showers' (14): 28 is exactly double 14. Conclusion 3: Exactly twice as many families prioritize turning off lights compared to taking shorter showers.",
            why: "Multiplicative comparisons (e.g. twice as many) provide deeper mathematical insight than simple lists.",
          },
          {
            stepNumber: 4,
            label: "Propose an evidence-based recommendation",
            working:
              "Recommendation: The environment club should run a campaign encouraging families to air-dry clothes and take shorter showers, since these areas have lower current adoption.",
            why: "Statistical investigations should connect data back to real-world actions.",
          },
        ],
        finalAnswer:
          "Conclusions: (1) Turning off lights is the most popular action (28/60). (2) Twice as many families turn off lights as take shorter showers (28 vs 14). (3) Air-drying clothes is the least common action (6/60), suggesting an opportunity for an awareness campaign.",
        commonError: {
          mistake: "Making personal opinions instead of evidence-based statements (e.g. writing 'I think showers are better' without citing the numbers).",
          whyItHappens:
            "Writing what you think instead of what the survey numbers actually demonstrate.",
          howToAvoid:
            "Always include the exact numbers from the data in your conclusion sentences (e.g. '28 out of 60 students...').",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3st03-misconception",
        heading: "Common Trap: Generalizing from a Biased Sample",
        claim: "If you survey 10 members of the school soccer team about their favourite sport, you can conclude that all Australian children prefer soccer.",
        whyWrong:
          "Surveying only soccer players creates a biased sample because they already love soccer. Their answers do not represent all children.",
        correction:
          "To draw broad conclusions, your sample must be representative (surveying a diverse mix of different students).",
        example: "Surveying only people at a dog park about pets will give heavily biased results towards dogs.",
      },
      {
        kind: "check",
        id: "vc2m3st03-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise evaluating survey questions, interpreting statistical charts, and writing data-supported conclusions.",
        curriculumCode: "VC2M3ST03",
        practiceCount: 5,
      },
    ],
  },
]);
