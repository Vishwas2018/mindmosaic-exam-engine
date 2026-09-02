import type { Lesson } from "../schema";

export const LEVEL_5_MEASUREMENT_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2M5M01: Metric Unit Selection & Precision in Length, Mass, Capacity
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5M01",
    title: "Metric Conversions and Measurement Precision",
    strand: "measurement",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to choose appropriate metric units and convert between units of length, mass, and capacity using decimal multipliers.",
    successCriteria: [
      "I can convert between millimetres, centimetres, metres, and kilometres (×10, ×100, ×1000).",
      "I can convert between grams, kilograms, and tonnes (mass).",
      "I can convert between millilitres and litres (capacity) and express measurements as decimals (e.g. 1.75 L = 1,750 mL).",
    ],
    prerequisites: ["VC2M3M01", "VC2M5N01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Measurement).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5m01-concept",
        heading: "The Decimal Metric System",
        explanation:
          "The metric system is a base-10 measurement system where prefixes indicate powers of 10:\n• milli- = 1/1,000 (one thousandth)\n• centi- = 1/100 (one hundredth)\n• kilo- = 1,000 (one thousand)\n\nConversion Rules:\n• Length:\n  - 1 cm = 10 mm (cm to mm: × 10; mm to cm: ÷ 10)\n  - 1 m = 100 cm = 1,000 mm (m to cm: × 100; cm to m: ÷ 100)\n  - 1 km = 1,000 m (km to m: × 1,000; m to km: ÷ 1,000)\n• Mass:\n  - 1 kg = 1,000 g (kg to g: × 1,000; g to kg: ÷ 1,000)\n  - 1 tonne (t) = 1,000 kg (t to kg: × 1,000; kg to t: ÷ 1,000)\n• Capacity:\n  - 1 L = 1,000 mL (L to mL: × 1,000; mL to L: ÷ 1,000)\n\nTo convert from a larger unit to a smaller unit, MULTIPLY (you get more units). To convert from a smaller unit to a larger unit, DIVIDE (you get fewer units).",
        keyTerms: [
          {
            term: "Metric Prefix",
            definition: "A prefix attached to a base unit (e.g. milli-, centi-, kilo-) to indicate a decimal multiplier.",
          },
          {
            term: "Capacity",
            definition: "The amount of liquid a container can hold, typically measured in millilitres (mL) and litres (L).",
          },
          {
            term: "Mass",
            definition: "The amount of matter in an object, typically measured in grams (g), kilograms (kg), and tonnes (t).",
          },
        ],
        visualAsset: {
          id: "vc2m5m01-conversion-table",
          type: "table",
          altText: "Metric conversion table showing multipliers and dividers for length, mass, and capacity.",
          title: "Metric System Conversion Rules",
          data: {
            headers: ["Measurement", "Larger Unit", "Conversion Factor", "Smaller Unit"],
            rows: [
              ["Length (km to m)", "Kilometre (km)", "× 1,000", "Metre (m)"],
              ["Length (m to cm)", "Metre (m)", "× 100", "Centimetre (cm)"],
              ["Length (cm to mm)", "Centimetre (cm)", "× 10", "Millimetre (mm)"],
              ["Mass (t to kg)", "Tonne (t)", "× 1,000", "Kilogram (kg)"],
              ["Mass (kg to g)", "Kilogram (kg)", "× 1,000", "Gram (g)"],
              ["Capacity (L to mL)", "Litre (L)", "× 1,000", "Millilitre (mL)"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5m01-example",
        heading: "Worked Example: Multi-Step Metric Conversion",
        problem:
          "A chef has a 2.4 kg bag of flour. She uses 850 g for bread and 450 g for muffins. How many kilograms of flour remain in the bag?",
        steps: [
          {
            stepNumber: 1,
            label: "Convert 2.4 kg to grams",
            working: "2.4 kg × 1,000 = 2,400 g.",
            why: "Working in the same unit (grams) avoids mixing whole kilograms with decimal grams.",
          },
          {
            stepNumber: 2,
            label: "Calculate the total flour used",
            working: "850 g + 450 g = 1,300 g.",
            why: "Summing both baking amounts determines total usage.",
          },
          {
            stepNumber: 3,
            label: "Subtract the used flour from the starting amount",
            working: "2,400 g - 1,300 g = 1,100 g remaining.",
            why: "Starting mass minus used mass gives the leftover mass in grams.",
          },
          {
            stepNumber: 4,
            label: "Convert remaining grams back to kilograms",
            working: "1,100 g ÷ 1,000 = 1.1 kg (or 1.100 kg).",
            why: "Dividing by 1,000 shifts the decimal point three places left to convert to kilograms.",
          },
        ],
        finalAnswer: "1.1 kg of flour remains in the bag.",
        commonError: {
          mistake: "Dividing by 100 instead of 1,000 when converting between grams and kilograms (writing 2.4 kg = 240 g).",
          whyItHappens: "Confusing the metre-to-centimetre conversion (100) with kilo- conversions (1,000).",
          howToAvoid: "Remember: 'kilo' always means one thousand (1,000).",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5m01-misconception",
        heading: "Misconception: 1.5 Litres is 1,005 Millilitres",
        claim: "1.5 L equals 1,005 mL because the 5 is after the decimal.",
        whyWrong:
          "0.5 means 5 tenths of a litre (half a litre). Half of 1,000 mL is 500 mL. Therefore, 1.5 L = 1,500 mL. 1,005 mL would be written as 1.005 L.",
        correction:
          "Multiply the decimal value by 1,000: 1.5 × 1,000 = 1,500 mL.",
        example: "2.35 kg = 2,350 g, NOT 2,035 g.",
      },
      {
        kind: "check",
        id: "vc2m5m01-check",
        heading: "Check Your Understanding",
        prompt: "Practise metric conversions across length, mass, and capacity with decimal quantities.",
        curriculumCode: "VC2M5M01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2M5M02: Perimeter and Area Calculation (Regular & Irregular Shapes)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5M02",
    title: "Perimeter and Area of Regular and Composite Shapes",
    strand: "measurement",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to calculate the perimeter and area of rectangles, triangles, parallelograms, and composite (irregular L-shaped) polygons using standard formulas.",
    successCriteria: [
      "I can calculate the perimeter of any polygon by summing all outer side lengths.",
      "I can calculate the area of rectangles (Length × Width) and right-angled triangles (1/2 × Base × Height).",
      "I can split composite shapes into non-overlapping rectangles to find total area.",
    ],
    prerequisites: ["VC2M3M01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Measurement).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5m02-concept",
        heading: "Distinguishing Perimeter and Area",
        explanation:
          "Perimeter and area measure fundamentally different dimensions of a shape:\n\n• Perimeter (P): The total linear distance around the outside boundary of a two-dimensional shape. Measured in linear units (mm, cm, m, km).\n  - Rectangle: P = 2 × (Length + Width) or P = 2L + 2W.\n  - Regular polygon: P = number of sides × side length.\n\n• Area (A): The amount of flat surface enclosed inside a shape. Measured in square units (mm², cm², m², km²).\n  - Rectangle: Area = Length × Width (A = L × W).\n  - Triangle: Area = 1/2 × Base × Perpendicular Height (A = 1/2 × b × h).\n\n• Composite (L-shaped) figures: To find the area of an irregular polygon, split it into separate rectangles, find the area of each part, and sum them together.",
        keyTerms: [
          {
            term: "Perimeter",
            definition: "The total distance around the continuous boundary of a 2D shape.",
          },
          {
            term: "Area",
            definition: "The measurement of the enclosed surface of a 2D shape, expressed in square units.",
          },
          {
            term: "Composite Shape",
            definition: "A geometric figure formed by combining two or more simple shapes.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2m5m02-example",
        heading: "Worked Example: Area and Perimeter of an L-Shaped Room",
        problem:
          "An L-shaped room has a top horizontal edge of 9 m, a left vertical edge of 7 m, a bottom horizontal edge of 4 m, and a right vertical edge of 3 m. Find its perimeter and total area.",
        steps: [
          {
            stepNumber: 1,
            label: "Find the two missing inside side lengths",
            working:
              "• Missing horizontal inner edge = Top - Bottom = 9 m - 4 m = 5 m.\n• Missing vertical inner edge = Left - Right = 7 m - 3 m = 4 m.",
            why: "Opposite parallel segments must sum to the same total length in orthogonal polygons.",
          },
          {
            stepNumber: 2,
            label: "Calculate total perimeter",
            working: "Perimeter = 9 + 3 + 5 + 4 + 4 + 7 = 32 m.",
            why: "Summing all six outer side lengths gives the full boundary distance.",
          },
          {
            stepNumber: 3,
            label: "Decompose into two rectangles to calculate area",
            working:
              "Split vertically into Rectangle A (left side) and Rectangle B (right side):\n• Rectangle A: 4 m wide × 7 m high -> Area = 4 × 7 = 28 m².\n• Rectangle B: 5 m wide × 3 m high -> Area = 5 × 3 = 15 m².",
            why: "Splitting composite figures into simple rectangles allows formula application.",
          },
          {
            stepNumber: 4,
            label: "Sum the partial areas",
            working: "Total Area = 28 m² + 15 m² = 43 m².",
            why: "Total area equals the sum of its non-overlapping constituent areas.",
          },
        ],
        finalAnswer: "Perimeter = 32 m; Total Area = 43 m².",
        commonError: {
          mistake: "Using linear units (m) instead of square units (m²) for area.",
          whyItHappens: "Overlooking that area measures 2D space (length × width) rather than a 1D line.",
          howToAvoid: "Always write area with square notation: mm², cm², m², or km².",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5m02-misconception",
        heading: "Misconception: Shapes with Equal Area Have Equal Perimeters",
        claim: "If two rectangles have the same area, they must have the same perimeter.",
        whyWrong:
          "A rectangle measuring 6 m × 4 m has an area of 24 m² and a perimeter of 20 m (2×10). A long, narrow rectangle measuring 12 m × 2 m also has an area of 24 m², but its perimeter is 28 m (2×14).",
        correction:
          "Area and perimeter vary independently; long and narrow shapes have much larger perimeters than compact shapes with the same area.",
        example: "A 1 m × 24 m rectangle has area 24 m² and perimeter 50 m!",
      },
      {
        kind: "check",
        id: "vc2m5m02-check",
        heading: "Check Your Understanding",
        prompt: "Practise calculating the perimeter and area of regular, triangular, and composite shapes.",
        curriculumCode: "VC2M5M02",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2M5M03: 12-Hour & 24-Hour Time Conversions and Timetable Scheduling
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5M03",
    title: "12-Hour and 24-Hour Time Systems and Schedules",
    strand: "measurement",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to convert between 12-hour and 24-hour time notation and calculate elapsed time across timetables and schedules.",
    successCriteria: [
      "I can convert 12-hour am/pm times to 4-digit 24-hour notation (e.g. 7:45 pm -> 19:45; 12:15 am -> 00:15).",
      "I can convert 24-hour times back to 12-hour notation with am/pm indicators.",
      "I can calculate journey durations and arrival times using transport timetables.",
    ],
    prerequisites: ["VC2M3M03"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Measurement).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5m03-concept",
        heading: "Why 24-Hour Time Exists",
        explanation:
          "12-hour time splits the day into two 12-hour cycles:\n• a.m. (ante meridiem): midnight to midday (morning).\n• p.m. (post meridiem): midday to midnight (afternoon and night).\n\nBecause 7:00 could mean 7:00 am or 7:00 pm, emergency services, transport systems, and aviation use 24-hour time to prevent ambiguity.\n\nConversion Rules:\n• Midnight to 12:59 am: Hours become 00 (e.g. 12:30 am -> 00:30).\n• 1:00 am to 11:59 am: Add leading zero if needed, remove 'am' (e.g. 8:15 am -> 08:15).\n• 12:00 pm to 12:59 pm: Stays 12 (e.g. 12:45 pm -> 12:45).\n• 1:00 pm to 11:59 pm: ADD 12 to the hours, remove 'pm' (e.g. 5:20 pm -> (5 + 12):20 = 17:20).\n\nTo convert from 24-hour back to 12-hour:\n• If hours are 13 or greater, SUBTRACT 12 and add 'pm' (e.g. 21:10 -> 21 - 12 = 9:10 pm).",
        keyTerms: [
          {
            term: "12-Hour Time",
            definition: "A timekeeping convention where the 24-hour day is divided into two periods: a.m. and p.m.",
          },
          {
            term: "24-Hour Time",
            definition: "A continuous 24-hour time notation (from 00:00 to 23:59) that eliminates the need for am/pm labels.",
          },
          {
            term: "Elapsed Time",
            definition: "The total duration of time that passes from the start of an event to its conclusion.",
          },
        ],
        visualAsset: {
          id: "vc2m5m03-timetable",
          type: "table",
          altText: "Train timetable showing departure times in 24-hour format across multiple stations.",
          title: "Regional Train Schedule (24-Hour Notation)",
          data: {
            headers: ["Station", "Train 1", "Train 2", "Train 3"],
            rows: [
              ["Southern Cross", "08:15", "13:40", "17:25"],
              ["Footscray", "08:24", "13:49", "17:34"],
              ["Ballarat", "09:38", "15:03", "18:48"],
              ["Ararat", "10:32", "15:57", "19:42"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5m03-example",
        heading: "Worked Example: Calculating Journey Duration from a Timetable",
        problem:
          "Using the timetable above for Train 2: The train departs Southern Cross at 13:40 and arrives in Ararat at 15:57. Convert both times to 12-hour time and calculate the total journey duration in hours and minutes.",
        steps: [
          {
            stepNumber: 1,
            label: "Convert departure and arrival times to 12-hour format",
            working:
              "• Departure 13:40 -> (13 - 12):40 pm = 1:40 pm.\n• Arrival 15:57 -> (15 - 12):57 pm = 3:57 pm.",
            why: "Subtracting 12 from hours greater than 12 converts to standard afternoon 12-hour format.",
          },
          {
            stepNumber: 2,
            label: "Bridge elapsed time to the next whole hour",
            working: "From 13:40 to 14:00 is 20 minutes.",
            why: "Bridging to the nearest hour simplifies mental time addition.",
          },
          {
            stepNumber: 3,
            label: "Add the remaining full hours and minutes",
            working:
              "• From 14:00 to 15:00 is 1 hour.\n• From 15:00 to 15:57 is 57 minutes.",
            why: "Splitting time into whole hours and leftover minutes prevents calculation errors.",
          },
          {
            stepNumber: 4,
            label: "Combine all time increments",
            working: "1 hour + 20 minutes + 57 minutes = 1 hour 77 minutes = 2 hours 17 minutes (since 77 min = 1 hr 17 min).",
            why: "Converting 60 minutes into 1 whole hour provides the correct final duration format.",
          },
        ],
        finalAnswer: "Departure is 1:40 pm; Arrival is 3:57 pm; Total duration is 2 hours 17 minutes.",
        commonError: {
          mistake: "Subtracting times like normal decimals (e.g. 15.57 - 13.40 = 2.17 -> 2 hours 17 min by coincidence, but 14.10 - 13.50 = 0.60 which is wrong).",
          whyItHappens: "Forgetting that there are 60 minutes in an hour, not 100.",
          howToAvoid: "Always bridge through the hour (count minutes to the hour, count hours, then add remaining minutes).",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5m03-misconception",
        heading: "Misconception: 12:00 am is 12:00 in 24-Hour Time",
        claim: "Midnight (12:00 am) is written as 12:00 in 24-hour time.",
        whyWrong:
          "12:00 is midday (noon, 12:00 pm). Midnight marks the very start of the new 24-hour day, so the hours start at zero: 00:00 (or 24:00 at the end of the day).",
        correction:
          "Midnight (12:00 am) is 00:00; midday (12:00 pm) is 12:00.",
        example: "12:45 am is written as 00:45.",
      },
      {
        kind: "check",
        id: "vc2m5m03-check",
        heading: "Check Your Understanding",
        prompt: "Practise converting between 12-hour and 24-hour time systems and calculating elapsed travel durations.",
        curriculumCode: "VC2M5M03",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. VC2M5M04: Angle Measurement & Construction Using a Protractor
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5M04",
    title: "Angles: Measurement and Construction in Degrees",
    strand: "measurement",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to classify, measure, and construct angles in degrees up to 360° using a protractor.",
    successCriteria: [
      "I can classify angles by size: acute (< 90°), right (90°), obtuse (90°–180°), straight (180°), reflex (180°–360°), and revolution (360°).",
      "I can align a protractor's baseline and crosshair accurately to measure an angle in degrees.",
      "I can use the correct inner or outer scale of a protractor depending on the angle's opening direction.",
    ],
    prerequisites: ["VC2M3M05"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Measurement).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5m04-concept",
        heading: "Understanding Angles as Measures of Turn",
        explanation:
          "An angle is formed when two rays (arms) meet at a common vertex. Angles are measured in degrees (°), with a full circular rotation (revolution) equal to 360°.\n\nAngle Classifications:\n• Acute Angle: Greater than 0° and less than 90° (sharp turn).\n• Right Angle: Exactly 90° (perpendicular, marked with a square symbol).\n• Obtuse Angle: Greater than 90° and less than 180°.\n• Straight Angle: Exactly 180° (a flat line, equal to two right angles).\n• Reflex Angle: Greater than 180° and less than 360°.\n• Revolution / Full Turn: Exactly 360°.\n\nHow to Use a Protractor:\n1. Place the centre point (crosshair) directly over the vertex of the angle.\n2. Line up the 0° baseline of the protractor with one arm of the angle.\n3. Check whether that arm points to the 0 on the inner scale or outer scale. Follow THAT scale around to where the other arm points to read the measurement.",
        keyTerms: [
          {
            term: "Vertex",
            definition: "The point where two arms (rays or lines) meet to form an angle.",
          },
          {
            term: "Protractor",
            definition: "A semi-circular tool marked with degrees from 0° to 180° used to measure and draw angles.",
          },
          {
            term: "Reflex Angle",
            definition: "An angle that measures more than 180° but less than 360°.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2m5m04-example",
        heading: "Worked Example: Measuring and Classifying an Angle",
        problem:
          "An angle has one arm aligned horizontally to the right along the 0° line. The second arm points to the numbers 65° and 115° on the dual protractor scale. Classify the angle and determine its exact measurement.",
        steps: [
          {
            stepNumber: 1,
            label: "Inspect the angle visually to classify its type",
            working: "The opening between the arms is wider than a 90° right angle (it opens past the vertical line). It is an OBTUSE angle.",
            why: "Visual classification provides an immediate sanity check against reading the wrong scale.",
          },
          {
            stepNumber: 2,
            label: "Determine which scale starts at zero on the baseline",
            working: "The bottom arm points to the right. The scale on the right baseline that starts at 0° is the inner scale.",
            why: "Measurement must begin at 0° on the arm that lies on the baseline.",
          },
          {
            stepNumber: 3,
            label: "Read the measurement along the matching scale",
            working: "Following the scale from 0° past 90° leads to 115°. 65° belongs to the opposite (acute) scale.",
            why: "Because the angle is obtuse, the true reading must be greater than 90° (115°).",
          },
        ],
        finalAnswer: "The angle is an obtuse angle measuring exactly 115°.",
        commonError: {
          mistake: "Reading 65° instead of 115° from the protractor.",
          whyItHappens: "Reading whichever number is easiest to see rather than tracing from the 0° baseline.",
          howToAvoid: "Always ask yourself first: 'Is this angle acute (under 90°) or obtuse (over 90°)?' This eliminates the wrong number immediately.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5m04-misconception",
        heading: "Misconception: Longer Arms Make an Angle Larger",
        claim: "An angle with long drawn lines is larger in degrees than an angle with short lines.",
        whyWrong:
          "The length of the drawn lines (arms) has zero effect on the size of the angle. An angle measures the amount of turn (rotation) between the lines, not the length of the lines.",
        correction:
          "Angles measure rotation in degrees (°). A 30° angle with 10 cm arms is the exact same angle size as a 30° angle with 2 cm arms.",
        example: "Two clock hands forming a 90° angle at 3:00 remain 90° regardless of whether the clock is a tiny wristwatch or Big Ben.",
      },
      {
        kind: "check",
        id: "vc2m5m04-check",
        heading: "Check Your Understanding",
        prompt: "Practise classifying, measuring, and constructing angles in degrees using a protractor.",
        curriculumCode: "VC2M5M04",
        practiceCount: 5,
      },
    ],
  },
]);
