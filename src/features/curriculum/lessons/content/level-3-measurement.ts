import type { Lesson } from "../schema";

export const LEVEL_3_MEASUREMENT_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2M3M01: Metric Units and Estimation Benchmarks
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3M01",
    title: "Metric Measurement: Units, Benchmarks and Estimation",
    strand: "measurement",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to choose appropriate metric units for length, mass and capacity, and use personal benchmarks to make reasonable estimates.",
    successCriteria: [
      "I can select the best metric unit for length (mm, cm, m, km), mass (g, kg), and capacity (mL, L).",
      "I can use body and everyday benchmarks (e.g. 1 cm is roughly the width of a fingernail, 1 L is a standard milk carton, 1 kg is a bag of sugar) to estimate sizes.",
      "I can explain why using an inappropriate unit (like measuring a classroom in millimetres) makes measurement clumsy and prone to error.",
    ],
    prerequisites: ["VC2M3N02"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Measurement).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3m01-concept",
        heading: "Choosing the Right Metric Unit",
        explanation:
          "The metric system uses a consistent set of units to measure three fundamental physical attributes:\n\n1. **Length (How long or tall something is):**\n• Millimetres (mm): Tiny objects (e.g. coin thickness, ant length).\n• Centimetres (cm): Hand-held objects (e.g. pencil length, book height).\n• Metres (m): Room and playground dimensions (e.g. classroom length, door height).\n• Kilometres (km): Long travel distances (e.g. distance between towns).\n\n2. **Mass (How heavy something is):**\n• Grams (g): Light objects (e.g. paperclip ≈ 1 g, apple ≈ 150 g).\n• Kilograms (kg): Heavier objects (e.g. textbook ≈ 1 kg, adult bicycle ≈ 14 kg). 1 kg = 1,000 g.\n\n3. **Capacity (How much liquid a container holds):**\n• Millilitres (mL): Small amounts (e.g. medicine spoon = 5 mL, juice box = 250 mL).\n• Litres (L): Large containers (e.g. milk jug = 1 L or 2 L, bucket = 10 L). 1 L = 1,000 mL.",
        keyTerms: [
          {
            term: "Benchmark",
            definition: "A familiar object or reference point with a known measurement used to estimate unknown sizes.",
          },
          {
            term: "Capacity",
            definition: "The maximum amount of liquid or fluid that a three-dimensional container can hold.",
          },
          {
            term: "Mass",
            definition: "The amount of matter in an object, measured in grams (g) and kilograms (kg).",
          },
        ],
        visualAsset: {
          id: "vc2m3m01-units-benchmark-table",
          type: "table",
          altText:
            "Table matching physical attributes to metric units, symbols, and real-life everyday benchmarks.",
          title: "Metric Units and Real-World Estimation Benchmarks",
          data: {
            headers: ["Attribute", "Unit Name", "Symbol", "Everyday Benchmark", "Standard Example"],
            rows: [
              ["Length", "Millimetre", "mm", "Thickness of an Australian 5c coin", "Tip of a pencil lead"],
              ["Length", "Centimetre", "cm", "Width of your little fingernail", "Length of an eraser (~5 cm)"],
              ["Length", "Metre", "m", "Width of a single doorway", "Length of a school desk (~1 m)"],
              ["Length", "Kilometre", "km", "A 12-minute brisk walk", "Distance from school to local park"],
              ["Mass", "Gram", "g", "Weight of a standard paperclip", "Mass of a teaspoon of sugar (~4 g)"],
              ["Mass", "Kilogram", "kg", "Standard bag of flour or 1 L bottle of water", "Mass of a heavy school bag (~3-5 kg)"],
              ["Capacity", "Millilitre", "mL", "A few drops from an eyedropper (~1 mL)", "Volume of a teaspoon (5 mL)"],
              ["Capacity", "Litre", "L", "Standard carton of milk", "Water in a large drink bottle (1 L)"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3m01-example",
        heading: "Worked Example: Selecting Units and Estimating Mass",
        problem:
          "Leo is packing a picnic basket for a school excursion. He has three items: a single grape, a full family watermelon, and a juice bottle. For each item, choose the best metric unit and explain your estimate.",
        steps: [
          {
            stepNumber: 1,
            label: "Classify the physical attribute being measured",
            working:
              "We are measuring how heavy the items are (mass). The two standard metric units for mass are grams (g) for light items and kilograms (kg) for heavy items.",
            why: "Identifying the attribute prevents confusing mass with volume or length.",
          },
          {
            stepNumber: 2,
            label: "Select unit and benchmark for Item 1 (single grape)",
            working:
              "A single grape is very light, far lighter than a 1 kg bag of flour. The appropriate unit is grams (g). Estimated mass: around 5 g to 8 g.",
            why: "Small snacks and light food items are measured in grams.",
          },
          {
            stepNumber: 3,
            label: "Select unit and benchmark for Item 2 (whole watermelon)",
            working:
              "A whole watermelon is heavy and requires two hands to lift, similar to lifting several 1 kg bags of flour. The appropriate unit is kilograms (kg). Estimated mass: around 3 kg to 4 kg.",
            why: "Heavy objects that exceed 1,000 g are more clearly and efficiently described in kilograms.",
          },
          {
            stepNumber: 4,
            label: "Select unit for Item 3 (juice bottle liquid capacity)",
            working:
              "For the liquid held inside the bottle, we measure capacity. A personal drink bottle holds about 500 mL (millilitres) or 1 L (litre).",
            why: "Container volume is measured in mL or L depending on whether it is smaller or larger than a 1 L carton.",
          },
        ],
        finalAnswer:
          "Grape: grams (g, ~6 g); Watermelon: kilograms (kg, ~3.5 kg); Juice inside bottle: millilitres or litres (mL / L, ~500 mL).",
        commonError: {
          mistake: "Choosing kilograms for a tiny item or grams for a heavy car.",
          whyItHappens:
            "Students sometimes guess units without comparing against a physical benchmark like a 1 kg bag of flour.",
          howToAvoid:
            "Always ask: 'Is this heavier or lighter than a 1-litre bottle of water (1 kg)?' If lighter, use grams; if heavier, use kilograms.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3m01-misconception",
        heading: "Common Trap: Confusing Size (Volume) with Heaviness (Mass)",
        claim: "A large bag of fluffy popcorn must weigh more than a small steel ball bearing because the popcorn bag is bigger.",
        whyWrong:
          "Size (volume) measures how much physical space an object occupies, whereas mass measures how heavy the matter inside is. Fluffy materials have very low density.",
        correction:
          "A large item can be very light (like a 50 g bag of popcorn), while a compact metal item can be very heavy (like a 200 g steel weight).",
        example: "A big balloon filled with air has a large volume but a mass of only 3 grams.",
      },
      {
        kind: "check",
        id: "vc2m3m01-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise choosing metric units (mm, cm, m, km, g, kg, mL, L) and estimating everyday objects.",
        curriculumCode: "VC2M3M01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2M3M02: Measuring with Scaled Instruments
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3M02",
    title: "Scaled Instruments: Reading Rulers, Scales and Measuring Jugs",
    strand: "measurement",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to read scaled measuring instruments accurately by working out the value of unlabelled tick marks.",
    successCriteria: [
      "I can line up the zero mark (not the edge) of a ruler with the start of an object.",
      "I can calculate the scale interval (step size) between tick marks on a measuring jug, thermometer, or kitchen scale.",
      "I can read measurements to the nearest marked unit and record the correct abbreviation.",
    ],
    prerequisites: ["VC2M3M01"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Measurement).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3m02-concept",
        heading: "How to Read Scaled Instruments Accurately",
        explanation:
          "Measuring instruments (rulers, tape measures, kitchen scales, measuring jugs, and thermometers) use graduated scales with numbered lines and unlabelled tick marks.\n\nTo read any scale correctly, follow the Three-Step Scale Rule:\n1. **Find Two Consecutive Numbered Marks:** Look at two neighbouring numbers on the scale (for example, 100 mL and 200 mL). Find the difference between them (200 - 100 = 100 mL).\n2. **Count the Intervals (Spaces):** Count how many equal spaces divide those two numbers. If there are 5 spaces between 100 mL and 200 mL, each space is worth: 100 ÷ 5 = 20 mL.\n3. **Count Up from the Nearest Number:** Start at the lower numbered mark and count up by the step size to the needle, water line, or marker.\n\n*Important Ruler Rule:* Always align the start of the object with the `0` mark, NOT the physical plastic end of the ruler, because many rulers leave a small gap before zero.",
        keyTerms: [
          {
            term: "Scale Interval / Step",
            definition: "The exact numerical value represented by the gap between two consecutive tick marks on a measuring tool.",
          },
          {
            term: "Zero Alignment",
            definition: "Positioning the very beginning of an object precisely on the zero line of a measuring scale.",
          },
          {
            term: "Graduation",
            definition: "The printed marks and numbers on a measuring scale showing units of measurement.",
          },
        ],
        visualAsset: {
          id: "vc2m3m02-scale-interval-table",
          type: "table",
          altText:
            "Table demonstrating how to calculate scale intervals across different measuring instruments.",
          title: "Scale Interval Calculation Guide",
          data: {
            headers: ["Instrument", "Numbered Span", "Difference", "Number of Spaces", "Value per Tick Mark"],
            rows: [
              ["Centimetre Ruler", "0 cm to 1 cm", "1 cm (10 mm)", "10 spaces", "1 mm (0.1 cm)"],
              ["Kitchen Measuring Jug", "200 mL to 300 mL", "100 mL", "5 spaces", "20 mL per tick mark"],
              ["Bathroom Weight Scale", "40 kg to 50 kg", "10 kg", "10 spaces", "1 kg per tick mark"],
              ["Classroom Thermometer", "20°C to 30°C", "10°C", "5 spaces", "2°C per tick mark"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3m02-example",
        heading: "Worked Example: Reading a Measuring Jug with Unlabelled Ticks",
        problem:
          "A measuring jug has numbered marks at 100 mL, 200 mL, 300 mL, 400 mL, and 500 mL. Between 300 mL and 400 mL, there are 4 tick marks dividing the space into 5 equal intervals. Water fills the jug up to the 3rd tick mark above 300 mL. What is the total volume of water?",
        steps: [
          {
            stepNumber: 1,
            label: "Calculate the total volume span between numbered marks",
            working:
              "The two numbered marks are 300 mL and 400 mL. The difference is: 400 mL - 300 mL = 100 mL.",
            why: "Knowing the total numerical distance between labels is the starting point for finding the tick value.",
          },
          {
            stepNumber: 2,
            label: "Determine the value of each interval (tick mark)",
            working:
              "The 100 mL span is split into 5 equal spaces. Value per space = 100 ÷ 5 = 20 mL.",
            why: "Dividing the span by the number of intervals gives the exact value of each jump.",
          },
          {
            stepNumber: 3,
            label: "Count up from the lower numbered mark (300 mL)",
            working:
              "Start at 300 mL. Jump 3 tick marks: 300 + (3 × 20) = 300 + 60 = 360 mL.",
            why: "The water level is at the 3rd tick mark above 300 mL.",
          },
          {
            stepNumber: 4,
            label: "State the final measurement with units",
            working:
              "The liquid volume is 360 mL.",
            why: "Measurements must always include the correct unit symbol.",
          },
        ],
        finalAnswer:
          "The volume of water in the jug is 360 mL (each tick mark represents 20 mL; 300 mL + 60 mL = 360 mL).",
        commonError: {
          mistake: "Assuming every tick mark is worth 1 unit (e.g. reading 300 + 3 = 303 mL).",
          whyItHappens:
            "Students count tick marks as single units without checking the scale interval between the major numbers.",
          howToAvoid:
            "Always divide the numbered difference (e.g. 100 mL) by the number of spaces (e.g. 5 spaces = 20 mL each).",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3m02-misconception",
        heading: "Common Trap: Starting from the End of the Ruler Instead of Zero",
        claim: "You should place the physical edge of the wooden ruler against the object you are measuring.",
        whyWrong:
          "Most rulers have a blank safety margin (a few millimetres of plastic or wood) before the '0' mark starts. Starting from the edge adds extra phantom length.",
        correction:
          "Always line up the start of the object precisely with the printed '0' line.",
        example: "If an object starts at the physical edge and reaches 7 cm, but the 0 mark is 4 mm in, the object is actually only 6 cm 6 mm long.",
      },
      {
        kind: "check",
        id: "vc2m3m02-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise reading rulers, scaled jugs, and kitchen dials to measure length, mass, and capacity accurately.",
        curriculumCode: "VC2M3M02",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2M3M03: Time Units and Durations
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3M03",
    title: "Units of Time: Seconds, Minutes, Hours and Durations",
    strand: "measurement",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to convert between units of time (seconds, minutes, hours, days, weeks, months, years) and calculate elapsed time intervals.",
    successCriteria: [
      "I know the formal conversions: 60 seconds = 1 minute, 60 minutes = 1 hour, 24 hours = 1 day, 7 days = 1 week.",
      "I can calculate the duration (elapsed time) between a start time and a finish time.",
      "I can compare the duration of events using the same time unit.",
    ],
    prerequisites: ["VC2M3M01"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Measurement).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3m03-concept",
        heading: "Units of Time and Calculating Elapsed Duration",
        explanation:
          "Time is measured using a base-60 and astronomical calendar system rather than base-10:\n• 1 minute = 60 seconds\n• 1 hour = 60 minutes\n• 1 day = 24 hours (one full rotation of Earth)\n• 1 week = 7 days\n• 1 year = 12 months = 52 weeks = 365 days (366 in a leap year)\n\n**Calculating Duration (Elapsed Time):**\nDuration is the amount of time that passes from the start of an event to its finish. To calculate duration across hours and minutes:\n1. Jump forward by full hours to get as close to the finish time as possible without passing it.\n2. Jump forward by remaining minutes to reach the exact finish time.\n3. Add the hour jumps and minute jumps together.",
        keyTerms: [
          {
            term: "Duration / Elapsed Time",
            definition: "The total amount of time that passes between the start and end of an activity.",
          },
          {
            term: "Timeline Jump Strategy",
            definition: "Calculating time intervals by jumping forward to the next whole hour, then adding the remaining minutes.",
          },
        ],
        visualAsset: {
          id: "vc2m3m03-time-conversions-table",
          type: "table",
          altText:
            "Table showing standard time unit conversions and equivalent benchmark durations.",
          title: "Standard Time Unit Equivalences",
          data: {
            headers: ["Larger Unit", "Equals", "Smaller Unit", "Everyday Activity Benchmark"],
            rows: [
              ["1 minute", "=", "60 seconds", "Tying shoelaces and putting on a hat"],
              ["1 hour", "=", "60 minutes", "A standard primary school maths lesson"],
              ["1 day", "=", "24 hours", "One full day and night cycle"],
              ["1 week", "=", "7 days", "Monday to Sunday school & weekend cycle"],
              ["1 year", "=", "12 months / 365 days", "One complete birthday cycle / grade year"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3m03-example",
        heading: "Worked Example: Calculating Event Duration",
        problem:
          "A school swimming carnival starts at 9:45 am and finishes at 1:15 pm on the same day. How long did the swimming carnival run?",
        steps: [
          {
            stepNumber: 1,
            label: "Bridge to the nearest whole hour",
            working:
              "From 9:45 am, jump 15 minutes forward to reach the clean hour: 10:00 am (15 minutes).",
            why: "Reaching a clean hour landmark makes subsequent hour jumps straightforward.",
          },
          {
            stepNumber: 2,
            label: "Jump in whole hours to the finish hour",
            working:
              "From 10:00 am, jump forward to 1:00 pm: 10:00 am → 11:00 am (1 h) → 12:00 pm (2 h) → 1:00 pm (3 h).",
            why: "Counting full hours between 10:00 am and 1:00 pm equals 3 full hours.",
          },
          {
            stepNumber: 3,
            label: "Add the remaining minutes to the finish time",
            working:
              "From 1:00 pm to the finish time 1:15 pm is another 15 minutes.",
            why: "The event ended at 1:15 pm.",
          },
          {
            stepNumber: 4,
            label: "Combine hours and minutes",
            working:
              "Total hours: 3 hours. Total minutes: 15 min + 15 min = 30 minutes. Combined: 3 hours and 30 minutes.",
            why: "Adding all individual jumps gives the complete elapsed duration.",
          },
        ],
        finalAnswer:
          "The swimming carnival ran for 3 hours and 30 minutes (or 3½ hours).",
        commonError: {
          mistake: "Treating time like base-10 decimals (e.g. calculating 1:15 - 9:45 using decimal subtraction as 115 - 945).",
          whyItHappens:
            "Time resets at 60 minutes, not 100. Standard decimal subtraction fails across hour boundaries.",
          howToAvoid:
            "Always use a number-line jump strategy: jump to the next hour (60 min), count whole hours, then add extra minutes.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3m03-misconception",
        heading: "Common Trap: Thinking There Are 100 Minutes in an Hour",
        claim: "An hour has 100 minutes, so half an hour is 50 minutes.",
        whyWrong:
          "Time is based on historical astronomical units of 60 (sexagesimal system). There are exactly 60 minutes in an hour.",
        correction:
          "Half an hour is 60 ÷ 2 = 30 minutes. A quarter of an hour is 60 ÷ 4 = 15 minutes.",
        example: "A movie that is 90 minutes long is 1 hour (60 min) + 30 minutes (half an hour) = 1½ hours.",
      },
      {
        kind: "check",
        id: "vc2m3m03-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise converting time units and calculating elapsed durations for daily schedules and events.",
        curriculumCode: "VC2M3M03",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. VC2M3M04: Analog and Digital Clocks to the Minute
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3M04",
    title: "Telling Time: Analog and Digital Clocks to the Minute",
    strand: "measurement",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to read and convert time to the exact minute on both analog clocks (with hands) and digital displays.",
    successCriteria: [
      "I can read the hour hand and minute hand on an analog clock to the exact minute.",
      "I can convert between analog phrases ('twenty-five past four', 'ten to eight') and digital formats (4:25, 7:50).",
      "I can use 'past' for the first 30 minutes of the hour and 'to' for the second 30 minutes.",
    ],
    prerequisites: ["VC2M3M03"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Measurement).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3m04-concept",
        heading: "Reading Analog Hands and Digital Time to the Minute",
        explanation:
          "An analog clock has two main hands that rotate clockwise:\n• **Short Hour Hand:** Shows the current hour. It slowly moves from one number to the next over 60 minutes.\n• **Long Minute Hand:** Shows minutes past the hour. The 12 big numbers on the clock represent multiples of 5 minutes (1 = 5 min, 2 = 10 min, ... 12 = 00 / 60 min). The tiny tick marks between numbers represent single minutes.\n\n**The 'Past' vs 'To' Rule:**\n• **Minutes 1 to 30 (Right side of clock):** We say minutes **PAST** the current hour. E.g., minute hand on 4 → '20 past 3' = 3:20.\n• **Minutes 31 to 59 (Left side of clock):** We say minutes **TO** the *next* hour. Count how many minutes remain until the minute hand reaches 12. E.g., at 7:45, there are 15 minutes left until 8:00 → 'quarter to 8'.",
        keyTerms: [
          {
            term: "Analog Clock",
            definition: "A circular clock face with rotating hour and minute hands pointing to numbers 1 to 12.",
          },
          {
            term: "Digital Clock",
            definition: "A numeric display showing hours and minutes separated by a colon (e.g. 08:35).",
          },
          {
            term: "'To' the Hour",
            definition: "Describing time after the half-hour by the number of minutes remaining before the upcoming hour.",
          },
        ],
        visualAsset: {
          id: "vc2m3m04-clock-reading-table",
          type: "table",
          altText:
            "Table showing analog hand positions, verbal phrases, and matching 12-hour digital formats.",
          title: "Analog Hand Positions & Digital Time Equivalents",
          data: {
            headers: ["Minute Hand Position", "Verbal Description", "Digital Time (Hour 4)", "Explanation"],
            rows: [
              ["Pointing exactly at 12", "4 o'clock", "4:00", "0 minutes past the hour"],
              ["Pointing at 3 (15 min)", "Quarter past 4", "4:15", "15 minutes (¼ of 60) past 4"],
              ["Pointing at 6 (30 min)", "Half past 4", "4:30", "30 minutes (½ of 60) past 4"],
              ["Pointing at 8 (40 min)", "Twenty to 5", "4:40", "20 minutes remaining until 5:00"],
              ["Pointing at 9 (45 min)", "Quarter to 5", "4:45", "15 minutes remaining until 5:00"],
              ["Pointing 2 ticks past 10 (52 min)", "Eight minutes to 5", "4:52", "8 minutes remaining until 5:00"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3m04-example",
        heading: "Worked Example: Converting an Analog Clock Face to Digital Time",
        problem:
          "An analog clock shows the short hour hand between 6 and 7 (closer to 7). The long minute hand points to 3 small tick marks past the number 8. What is the exact digital time and how do you state it in words?",
        steps: [
          {
            stepNumber: 1,
            label: "Determine the current hour",
            working:
              "The short hand is between 6 and 7. Since it has not reached 7 yet, the current hour is 6.",
            why: "The hour does not change to 7 until the minute hand reaches the 12 at the very top.",
          },
          {
            stepNumber: 2,
            label: "Calculate minutes past the hour from the minute hand",
            working:
              "The big number 8 represents 8 × 5 = 40 minutes. The hand is 3 tick marks past 8: 40 + 3 = 43 minutes.",
            why: "Each big number is 5 minutes, and each single tick is 1 additional minute.",
          },
          {
            stepNumber: 3,
            label: "Write in digital format",
            working:
              "Hour is 6, minutes are 43. Digital time = 6:43.",
            why: "Digital displays show Hours : Minutes past the hour.",
          },
          {
            stepNumber: 4,
            label: "Convert to verbal 'minutes to' phrasing",
            working:
              "Minutes until the next hour (7:00): 60 - 43 = 17 minutes. In words: 'Seventeen minutes to 7'.",
            why: "Because 43 is past 30, we count down to the next hour (7 o'clock).",
          },
        ],
        finalAnswer:
          "The digital time is 6:43. In words, this is '17 minutes to 7' (or 43 minutes past 6).",
        commonError: {
          mistake: "Reading the hour as 7 because the short hand is close to the 7.",
          whyItHappens:
            "As the minute hand approaches 60, the hour hand naturally drifts very close to the next number.",
          howToAvoid:
            "Check if the minute hand has reached 12. If the minute hand is still on the left side (e.g. at 43 min), the hour is still the lower number (6).",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3m04-misconception",
        heading: "Common Trap: Saying the Old Hour with 'To'",
        claim: "At 4:50, the time in words is 'ten to four'.",
        whyWrong:
          "At 4:50, 4 o'clock already happened 50 minutes ago! The clock is moving toward 5 o'clock.",
        correction:
          "When using 'to', always state the *next* upcoming hour: 4:50 is 'ten minutes to 5'.",
        example: "8:55 is 'five to 9', not 'five to 8'.",
      },
      {
        kind: "check",
        id: "vc2m3m04-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise reading analog clocks, converting to digital time, and using 'past' and 'to' phrasing.",
        curriculumCode: "VC2M3M04",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. VC2M3M05: Angles and Measures of Turn
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3M05",
    title: "Angles and Turns: Identifying Right Angles, Acute and Obtuse",
    strand: "measurement",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify angles as measures of turn and compare angles against a benchmark right angle (quarter turn).",
    successCriteria: [
      "I can explain that an angle is the amount of turn between two lines meeting at a vertex.",
      "I can identify a right angle as a square corner (quarter turn = 90°).",
      "I can classify angles as smaller than a right angle (acute) or larger than a right angle (obtuse).",
    ],
    prerequisites: ["VC2M3M01"],
    status: "draft",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Measurement).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3m05-concept",
        heading: "Angles as Measures of Turn",
        explanation:
          "An angle is not a distance or a length — an angle is the amount of **turning** between two straight arms (rays) that meet at a shared point called the **vertex**.\n\n**The Benchmark Right Angle (Quarter Turn):**\nA right angle is the exact amount of turn in a quarter turn. It creates a neat 'square corner', like the corner of a sheet of A4 paper, a picture frame, or a book cover. We mark right angles with a small square symbol in the corner.\n\n**Classifying Angles by Comparison to a Right Angle:**\n• **Right Angle:** Exactly a quarter turn (90°). Looks like a capital letter 'L'.\n• **Acute Angle:** Smaller opening than a right angle (a sharp, narrow turn).\n• **Obtuse Angle:** Greater opening than a right angle, but less than a straight line (a wide, open turn).\n• **Straight Angle:** Exactly half a turn (two right angles joined together = 180°).",
        keyTerms: [
          {
            term: "Right Angle",
            definition: "An angle that forms a square corner, created by a quarter turn (90 degrees).",
          },
          {
            term: "Acute Angle",
            definition: "An angle that is smaller (narrower) than a right angle.",
          },
          {
            term: "Obtuse Angle",
            definition: "An angle that is larger (wider) than a right angle, but less than a straight line.",
          },
          {
            term: "Vertex",
            definition: "The common point or corner where the two arms of an angle meet.",
          },
        ],
        visualAsset: {
          id: "vc2m3m05-angle-types-table",
          type: "table",
          altText:
            "Table comparing right angles, acute angles, obtuse angles, and straight angles with visual descriptions and everyday examples.",
          title: "Angle Classification Benchmark Guide",
          data: {
            headers: ["Angle Type", "Turn Description", "Comparison to Right Angle", "Real-World Everyday Example"],
            rows: [
              ["Acute Angle", "Small turn (less than ¼ turn)", "Smaller than a square corner", "Open scissors blade, slice of pizza"],
              ["Right Angle", "Quarter turn (¼ turn)", "Exact square corner (90°)", "Corner of a book, door frame, clock at 3:00"],
              ["Obtuse Angle", "Wide turn (between ¼ and ½ turn)", "Larger than a square corner", "Open laptop screen, reclining beach chair"],
              ["Straight Angle", "Half turn (½ turn)", "Two right angles forming a straight line", "Clock hands at 6:00, flat open book"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3m05-example",
        heading: "Worked Example: Testing Angles Using a Paper Right-Angle Tester",
        problem:
          "You are inspecting the corner of a road yield sign (an equilateral triangle). Describe how to use the corner of a square piece of paper to test and classify each angle of the triangle.",
        steps: [
          {
            stepNumber: 1,
            label: "Create a benchmark right-angle tester",
            working:
              "Take a standard index card or piece of paper. The corner of the paper forms an exact right angle (square corner).",
            why: "A paper corner provides a reliable, portable standard right angle for physical comparison.",
          },
          {
            stepNumber: 2,
            label: "Align the tester with the triangle's vertex and one arm",
            working:
              "Place the paper corner directly on one vertex of the triangle. Line up the bottom edge of the paper along one side of the triangle.",
            why: "Aligning the vertex and one arm allows you to see where the second arm falls relative to the square corner.",
          },
          {
            stepNumber: 3,
            label: "Observe the position of the second arm",
            working:
              "The triangle's second side sits inside the paper's edge, meaning the opening is narrower than the paper's square corner.",
            why: "If the second arm is hidden under or inside the square corner, the angle is smaller than a right angle.",
          },
          {
            stepNumber: 4,
            label: "Classify the angle",
            working:
              "Since the opening is smaller than a right angle, each angle of the equilateral triangle is an ACUTE angle (specifically 60°).",
            why: "Any angle smaller than a right angle is defined as acute.",
          },
        ],
        finalAnswer:
          "The angles of the triangle are ACUTE because when tested against a square corner, the turn is smaller than a right angle.",
        commonError: {
          mistake: "Thinking an angle with longer arm lines is 'bigger' than an angle with short arm lines.",
          whyItHappens:
            "Students confuse line length with angle size (amount of turn).",
          howToAvoid:
            "Remember that angle size depends only on the amount of opening between the arms, not how long the lines are drawn.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3m05-misconception",
        heading: "Common Trap: Arm Length Affecting Angle Size",
        claim: "An angle drawn with 10 cm long lines is larger than an angle with 2 cm lines, even if both show a 30° opening.",
        whyWrong:
          "The length of the lines does not change the amount of turn. Extending the arms of an angle does not open or close the corner.",
        correction:
          "Angle size measures the rotational opening at the vertex. A 90° corner on a stamp is the exact same angle size as a 90° corner on a football field.",
        example: "A tiny square post-it note and a huge television screen both have identical 90° right angles at every corner.",
      },
      {
        kind: "check",
        id: "vc2m3m05-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise identifying right angles, acute angles, and obtuse angles in 2D shapes and clock faces.",
        curriculumCode: "VC2M3M05",
        practiceCount: 5,
      },
    ],
  },
]);
