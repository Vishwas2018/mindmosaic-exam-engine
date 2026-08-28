import type { ParentCurriculumContent } from "./types";

export const MATH_LEVEL_5_PARENT_CONTENT: Record<string, ParentCurriculumContent> = {
  VC2M5N01: {
    officialCode: "VC2M5N01",
    whatThisMeans:
      "Your child interprets, compares, orders, and positions decimals with up to three decimal places (thousandths) on a number line.",
    whyItMatters:
      "Precision decimals are essential for scientific measurements (like split-second sports timing or millilitres) and financial calculations.",
    homeActivities: [
      {
        title: "Stopwatch Split Seconds",
        setting: "home",
        description:
          "Use a phone stopwatch to time quick sprints or reaction games. Compare times with three decimal places (e.g. 4.218s vs 4.281s) to see who was faster.",
        estimatedMinutes: 10,
      },
      {
        title: "Supermarket Unit Price Detective",
        setting: "shopping",
        description:
          "Compare grocery shelf tags showing unit prices with decimals (e.g. $0.455 per 100g vs $0.450 per 100g) to find the better buy.",
        estimatedMinutes: 10,
      },
    ],
  },
  VC2M5N02: {
    officialCode: "VC2M5N02",
    whatThisMeans:
      "Children break whole numbers into factor pairs and prime factors, identify multiples, and use divisibility rules (like checking if a number ends in 0 or 5).",
    whyItMatters:
      "Factors and multiples are the essential building blocks for simplifying fractions, finding common denominators, and cryptography.",
    homeActivities: [
      {
        title: "Factor Array Grid",
        setting: "home",
        description:
          "Give a number like 24. Challenge your child to write all factor pairs (1x24, 2x12, 3x8, 4x6) and sketch the rectangles they form.",
        estimatedMinutes: 10,
      },
      {
        title: "Divisibility Quick Check",
        setting: "car",
        description:
          "Spot number plates and test divisibility rules together (e.g. is 342 divisible by 3? Add digits 3+4+2=9, so yes!).",
        estimatedMinutes: 5,
      },
    ],
  },
  VC2M5N03: {
    officialCode: "VC2M5N03",
    whatThisMeans:
      "Your child compares and orders fractions and mixed numbers (like 2 1/3) that have related denominators (such as 1/2, 1/4, and 1/8) using common multiples.",
    whyItMatters:
      "Comparing fractions with different denominators is essential for understanding scale, scaling recipes, and advanced algebra.",
    homeActivities: [
      {
        title: "Recipe Fraction Adjuster",
        setting: "kitchen",
        description:
          "Look at a pancake recipe. Ask your child: 'If we have 3/4 cup milk and 5/8 cup water, which ingredient has more liquid?'",
        estimatedMinutes: 10,
      },
      {
        title: "Fraction Clothesline",
        setting: "home",
        description:
          "Write fractions (1/4, 1/2, 3/8, 5/4, 1 1/2) on index cards and hang them in ascending order along a string from 0 to 2.",
        estimatedMinutes: 15,
      },
    ],
  },
  VC2M5N04: {
    officialCode: "VC2M5N04",
    whatThisMeans:
      "Children connect percentages to fractions and decimals, understanding that 100% represents a complete whole (e.g. 50% = 1/2 = 0.5; 25% = 1/4 = 0.25).",
    whyItMatters:
      "Percentages are universally used in sales discounts, interest rates, battery indicators, and health statistics.",
    homeActivities: [
      {
        title: "Discount Calculation",
        setting: "shopping",
        description:
          "When you see a '25% off' or '50% off' sign, ask your child to calculate the dollar discount on a $40 or $80 item.",
        estimatedMinutes: 5,
      },
      {
        title: "Phone Battery Benchmarks",
        setting: "home",
        description:
          "Check the battery percentage on a device (e.g. 75%). Ask your child to convert that percentage into a simplified fraction (3/4) and decimal (0.75).",
        estimatedMinutes: 5,
      },
    ],
  },
  VC2M5N05: {
    officialCode: "VC2M5N05",
    whatThisMeans:
      "Your child adds and subtracts fractions with related denominators (like 1/3 + 1/6) by finding an equivalent fraction with a matching denominator.",
    whyItMatters:
      "Equivalent fractions enable combining fractional quantities accurately in cooking, construction, and data analysis.",
    homeActivities: [
      {
        title: "Baking Fraction Sums",
        setting: "kitchen",
        description:
          "Ask: 'If we combine 1/2 cup of brown sugar and 1/4 cup of white sugar, how many total cups of sugar do we have?' (2/4 + 1/4 = 3/4).",
        estimatedMinutes: 5,
      },
      {
        title: "Chocolate Bar Subtraction",
        setting: "kitchen",
        description:
          "With a 12-piece chocolate bar, show that eating 1/3 (4 pieces) and then another 1/6 (2 pieces) leaves 6 pieces (1/2 bar).",
        estimatedMinutes: 10,
      },
    ],
  },
  VC2M5N06: {
    officialCode: "VC2M5N06",
    whatThisMeans:
      "Children multiply large multi-digit numbers by 1-digit or 2-digit numbers using formal algorithms and mental strategies, checking their answers for reasonableness.",
    whyItMatters:
      "Multi-digit multiplication is essential for calculating areas, budgets, inventory quantities, and long-term costs.",
    homeActivities: [
      {
        title: "Road Trip Distance",
        setting: "car",
        description:
          "Say: 'If we drive at an average speed of 85 km/h for 4 hours, how far will we travel?' Calculate together using partitioning (80x4 + 5x4).",
        estimatedMinutes: 5,
      },
      {
        title: "Bulk Buy Comparison",
        setting: "shopping",
        description:
          "If a box contains 24 snack packets and we buy 3 boxes, calculate the total snacks (24 x 3 = 72) before reaching the checkout.",
        estimatedMinutes: 5,
      },
    ],
  },
  VC2M5N07: {
    officialCode: "VC2M5N07",
    whatThisMeans:
      "Your child divides multi-digit numbers, handles remainders, and expresses leftover amounts as whole numbers, fractions, or decimals depending on the problem context.",
    whyItMatters:
      "Knowing how to interpret remainders (rounding up for buses, dividing into fractions for food) is essential for practical problem solving.",
    homeActivities: [
      {
        title: "Pizza Sharing with Leftovers",
        setting: "kitchen",
        description:
          "Divide 14 cookies among 4 people. Discuss why 3 cookies each with 2 leftover (or 3 1/2 cookies each) makes sense.",
        estimatedMinutes: 5,
      },
      {
        title: "Bus Capacity Problem",
        setting: "home",
        description:
          "Ask: 'If 75 students are going on an excursion and each bus holds 20 people, how many buses are needed?' (3 r 15 = 4 buses).",
        estimatedMinutes: 10,
      },
    ],
  },
  VC2M5N08: {
    officialCode: "VC2M5N08",
    whatThisMeans:
      "Children use rounding and estimation strategies to verify whether financial and mathematical solutions are realistic and reasonable.",
    whyItMatters:
      "In financial literacy and everyday commerce, estimating totals protects against overcharging and billing errors.",
    homeActivities: [
      {
        title: "Shopping Basket Sanity Check",
        setting: "shopping",
        description:
          "Look at 4 items in the trolley ($4.90, $12.15, $8.85, $3.10). Estimate the total ($5 + $12 + $9 + $3 = $29) before scanning at the till.",
        estimatedMinutes: 5,
      },
      {
        title: "Restaurant Bill Review",
        setting: "home",
        description:
          "Look at a takeaway menu receipt. Quickly round the items to check if the final charged amount is reasonable.",
        estimatedMinutes: 5,
      },
    ],
  },
  VC2M5N09: {
    officialCode: "VC2M5N09",
    whatThisMeans:
      "Your child formulates and solves multi-step mathematical models for practical scenarios like event planning, sports schedules, or budgeting.",
    whyItMatters:
      "Modelling develops strategic thinking by requiring children to translate wordy, ambiguous real-world situations into clear mathematical equations.",
    homeActivities: [
      {
        title: "Birthday Party Budgeter",
        setting: "home",
        description:
          "Give a $100 pretend budget for 6 party guests. Have your child budget for food, decorations, and party bags, showing all calculations.",
        estimatedMinutes: 15,
      },
      {
        title: "Garden Bed Turf Calculator",
        setting: "outdoor",
        description:
          "Plan a small garden border or patch of grass, calculating the perimeter, area, and estimated cost of supplies.",
        estimatedMinutes: 15,
      },
    ],
  },
  VC2M5N10: {
    officialCode: "VC2M5N10",
    whatThisMeans:
      "Children create and trace computational algorithms with loops (iteration) and conditional branches (if-then-else) to generate number patterns and test divisibility.",
    whyItMatters:
      "Branching and looping algorithms are core computational concepts underpinning computer programming and automated data processing.",
    homeActivities: [
      {
        title: "FizzBuzz Family Game",
        setting: "car",
        description:
          "Take turns counting up from 1. If divisible by 3 say 'Fizz', if divisible by 5 say 'Buzz', if both say 'FizzBuzz'!",
        estimatedMinutes: 10,
      },
      {
        title: "Collatz Sequence Puzzle",
        setting: "home",
        description:
          "Pick a number: if even, divide by 2; if odd, multiply by 3 and add 1. Repeat until reaching 1 (e.g. 6 -> 3 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1).",
        estimatedMinutes: 10,
      },
    ],
  },
  VC2M5A01: {
    officialCode: "VC2M5A01",
    whatThisMeans:
      "Your child explores multiplication and division as inverse operations, using known multiplication facts to solve division and factor families.",
    whyItMatters:
      "Deep understanding of inverse operations allows students to rearrange equations and manipulate algebraic expressions effortlessly.",
    homeActivities: [
      {
        title: "Inverse Fact Quickfire",
        setting: "car",
        description:
          "Give a multiplication fact like '8 x 7 = 56'. Ask your child to immediately state the two related division facts (56 / 7 = 8, 56 / 8 = 7).",
        estimatedMinutes: 5,
      },
      {
        title: "Missing Dimension Box",
        setting: "kitchen",
        description:
          "Point to a rectangular tray or box: 'The area is 72 cm² and one side is 8 cm. What is the other side?' (72 / 8 = 9 cm).",
        estimatedMinutes: 5,
      },
    ],
  },
  VC2M5A02: {
    officialCode: "VC2M5A02",
    whatThisMeans:
      "Children find unknown values in equations involving multiplication and division (like 4 x ? = 36 or ? / 6 = 7) using arithmetic properties.",
    whyItMatters:
      "Finding unknown values directly prepares students for formal single-variable algebra and symbol manipulation.",
    homeActivities: [
      {
        title: "Balance the Equation",
        setting: "home",
        description:
          "Write an equation with an unknown: '5 x ? + 4 = 39'. Walk through solving it backwards (39 - 4 = 35, 35 / 5 = 7).",
        estimatedMinutes: 10,
      },
      {
        title: "Secret Multiplier Game",
        setting: "home",
        description:
          "Think of a secret rule (e.g. 'multiply by 6'). Let your child give input numbers while you output answers until they deduce the rule.",
        estimatedMinutes: 10,
      },
    ],
  },
  VC2M5M01: {
    officialCode: "VC2M5M01",
    whatThisMeans:
      "Your child chooses appropriate metric units and uses fractional combinations (e.g. 1.25 kg = 1 kg 250 g) to measure length, mass, and capacity with high accuracy.",
    whyItMatters:
      "Unit conversion fluency is essential in cooking, carpentry, engineering, and international scientific standards.",
    homeActivities: [
      {
        title: "Pantry Metric Conversions",
        setting: "kitchen",
        description:
          "Find a 1.5 L bottle or 1.25 kg bag and have your child convert the measurement to millilitres (1500 mL) or grams (1250 g).",
        estimatedMinutes: 5,
      },
      {
        title: "Room Precision Measurement",
        setting: "home",
        description:
          "Measure a desk or window frame with a tape measure, recording the measurement in both metres (1.45 m) and millimetres (1450 mm).",
        estimatedMinutes: 10,
      },
    ],
  },
  VC2M5M02: {
    officialCode: "VC2M5M02",
    whatThisMeans:
      "Children solve practical perimeter and area problems for regular rectangles, compound shapes, and irregular floorplans using square centimetres and metres.",
    whyItMatters:
      "Calculating perimeter and area is a daily necessity for buying flooring, painting walls, fencing gardens, and designing spaces.",
    homeActivities: [
      {
        title: "Rug Area vs Perimeter",
        setting: "home",
        description:
          "Measure a living room rug. Calculate the perimeter (for a border trim) and the area (for floor coverage) and compare the units (m vs m²).",
        estimatedMinutes: 10,
      },
      {
        title: "Compound Bedroom Floorplan",
        setting: "home",
        description:
          "Sketch an L-shaped room. Show your child how to split it into two simple rectangles to calculate total floor area.",
        estimatedMinutes: 15,
      },
    ],
  },
  VC2M5M03: {
    officialCode: "VC2M5M03",
    whatThisMeans:
      "Your child converts between 12-hour and 24-hour time systems (e.g. 3:45 pm = 15:45) and calculates elapsed time in transport timetables.",
    whyItMatters:
      "24-hour time is standard across aviation, public transport, emergency services, military, and digital scheduling.",
    homeActivities: [
      {
        title: "Flight or Train Timetable",
        setting: "home",
        description:
          "Look at an online train or bus schedule in 24-hour time. Ask your child to convert departure times like 17:23 and 21:05 to am/pm.",
        estimatedMinutes: 10,
      },
      {
        title: "Movie Duration Calculator",
        setting: "home",
        description:
          "If a movie starts at 19:15 and runs for 1 hour 48 minutes, calculate what time the film will finish in both 24-hour and 12-hour formats.",
        estimatedMinutes: 5,
      },
    ],
  },
  VC2M5M04: {
    officialCode: "VC2M5M04",
    whatThisMeans:
      "Children estimate, measure, and draw angles in degrees using a protractor, classifying angles as acute (<90°), right (90°), obtuse (90°–180°), or reflex (>180°).",
    whyItMatters:
      "Angle measurement is fundamental to geometry, architecture, robotics, navigation, and visual design.",
    homeActivities: [
      {
        title: "Protractor Hunt",
        setting: "home",
        description:
          "Use a plastic protractor to measure the angle of an open door, a laptop screen tilt, or roof pitch, classifying each angle.",
        estimatedMinutes: 15,
      },
      {
        title: "Clock Face Angles",
        setting: "home",
        description:
          "Look at a clock at 3:00 (90°), 6:00 (180°), and 1:00 (30°). Ask your child to estimate the angle between the hour and minute hands.",
        estimatedMinutes: 5,
      },
    ],
  },
  VC2M5SP01: {
    officialCode: "VC2M5SP01",
    whatThisMeans:
      "Your child matches 3D solid shapes to their 2D folding nets and builds 3D models from cardboard or paper templates.",
    whyItMatters:
      "Connecting 2D nets to 3D solids develops spatial reasoning essential for packaging design, engineering, and 3D printing.",
    homeActivities: [
      {
        title: "Cereal Box Unfolder",
        setting: "kitchen",
        description:
          "Carefully unglue and flatten an empty cereal or biscuit box to reveal its flat 2D net, identifying which tabs fold into which faces.",
        estimatedMinutes: 10,
      },
      {
        title: "Cube Net Challenge",
        setting: "home",
        description:
          "Draw 6 connected squares on grid paper. Challenge your child to see if their arrangement can fold into a complete cube without overlapping faces.",
        estimatedMinutes: 15,
      },
    ],
  },
  VC2M5SP02: {
    officialCode: "VC2M5SP02",
    whatThisMeans:
      "Children construct and use grid coordinate systems (x-axis and y-axis) to locate coordinates, plot points (x, y), and describe movement across a plane.",
    whyItMatters:
      "Coordinate systems are the foundation for GPS navigation, map reading, game development, and graphing algebraic equations.",
    homeActivities: [
      {
        title: "Battleship Coordinates",
        setting: "home",
        description:
          "Play a quick pen-and-paper game of Battleship on a 10x10 grid, calling out coordinates like (3, 7) — remembering 'x across first, then y up'.",
        estimatedMinutes: 15,
      },
      {
        title: "Map Coordinate Spotter",
        setting: "home",
        description:
          "Look at a street directory grid map or national park map and locate landmarks using alpha-numeric or Cartesian coordinates.",
        estimatedMinutes: 10,
      },
    ],
  },
  VC2M5SP03: {
    officialCode: "VC2M5SP03",
    whatThisMeans:
      "Your child performs and describes transformations on shapes: translations (slides), reflections (flips), and rotations (turns), identifying lines of symmetry.",
    whyItMatters:
      "Transformational geometry is central to computer graphics, animation, pattern design, and structural symmetry in biology and architecture.",
    homeActivities: [
      {
        title: "Mirror Reflection Symmetry",
        setting: "home",
        description:
          "Place a small pocket mirror along lines in shapes, logos, or alphabet letters (like A, M, H) to test for vertical and horizontal reflection symmetry.",
        estimatedMinutes: 10,
      },
      {
        title: "Tile Tessellation Pattern",
        setting: "home",
        description:
          "Cut out a cardboard shape (like a triangle or hexagon). Trace it repeatedly, sliding, flipping, and rotating it to tile a piece of paper with no gaps.",
        estimatedMinutes: 15,
      },
    ],
  },
  VC2M5ST01: {
    officialCode: "VC2M5ST01",
    whatThisMeans:
      "Children acquire, organise, and analyse data using spreadsheets and tables, identifying the most frequent category or value (the mode) and describing distribution shape.",
    whyItMatters:
      "Understanding the mode and distribution of data helps students interpret surveys, consumer trends, and scientific research.",
    homeActivities: [
      {
        title: "Shoe Size Mode Finder",
        setting: "home",
        description:
          "List the shoe sizes of 8 friends or relatives. Identify the 'mode' (the size that appears most frequently in the group).",
        estimatedMinutes: 10,
      },
      {
        title: "Pantry Expiry Audit",
        setting: "kitchen",
        description:
          "Tally canned goods by category (beans, soup, tomatoes) into a spreadsheet or table and determine which item is the mode of the pantry.",
        estimatedMinutes: 10,
      },
    ],
  },
  VC2M5ST02: {
    officialCode: "VC2M5ST02",
    whatThisMeans:
      "Your child reads and interprets line graphs showing continuous change over time (such as temperature throughout the day or child growth milestones).",
    whyItMatters:
      "Line graphs are the standard tool for monitoring continuous trends, financial markets, weather forecasts, and scientific experiments.",
    homeActivities: [
      {
        title: "Daily Temperature Curve",
        setting: "home",
        description:
          "Look at a 24-hour weather forecast line graph on a weather app. Ask your child to identify the peak temperature time and the steepest drop.",
        estimatedMinutes: 5,
      },
      {
        title: "Plant Growth Chart",
        setting: "outdoor",
        description:
          "Measure a potted plant or seedling once a week and plot the height on a line graph to observe the rate of growth over time.",
        estimatedMinutes: 10,
      },
    ],
  },
  VC2M5ST03: {
    officialCode: "VC2M5ST03",
    whatThisMeans:
      "Children plan and conduct full statistical investigations: formulating a clear question, collecting data, selecting appropriate charts, and reporting evidence-based findings.",
    whyItMatters:
      "Statistical investigations teach students to separate opinions from evidence and present data-backed arguments clearly.",
    homeActivities: [
      {
        title: "Screen Time vs Sleep Survey",
        setting: "home",
        description:
          "Pose the question: 'Do family members sleep longer on days they use screens less?' Collect 5 days of data, plot it, and discuss conclusions.",
        estimatedMinutes: 15,
      },
      {
        title: "Local Traffic Speed Study",
        setting: "outdoor",
        description:
          "Observe vehicles at an intersection for 15 minutes, categorise driver turning choices, and present a short summary of findings.",
        estimatedMinutes: 15,
      },
    ],
  },
  VC2M5P01: {
    officialCode: "VC2M5P01",
    whatThisMeans:
      "Your child lists all possible outcomes of a chance event and differentiates between equally likely outcomes (like a fair die) and unequal outcomes (like a weighted spinner).",
    whyItMatters:
      "Recognising equal versus unequal probabilities is vital for evaluating game fairness, risk assessment, and decision theory.",
    homeActivities: [
      {
        title: "Fair vs Unfair Spinner",
        setting: "home",
        description:
          "Draw two circles: one split into 4 equal quarters, one split with 1 huge half and 2 small quarters. Discuss why only the first spinner is fair.",
        estimatedMinutes: 10,
      },
      {
        title: "Marble Bag Probability",
        setting: "home",
        description:
          "Put 5 blue marbles and 1 red marble in a cup. Discuss whether drawing blue vs red is equally likely and what outcome is most probable.",
        estimatedMinutes: 5,
      },
    ],
  },
  VC2M5P02: {
    officialCode: "VC2M5P02",
    whatThisMeans:
      "Children conduct repeated probability trials, record relative frequencies (e.g. 18 heads out of 30 tosses), and use experimental data to estimate likelihoods.",
    whyItMatters:
      "Experimental probability bridges intuitive guesses and statistical modelling used in forecasting, insurance, and science.",
    homeActivities: [
      {
        title: "50-Coin Toss Experiment",
        setting: "home",
        description:
          "Toss a coin 50 times, recording results in blocks of 10. Watch how the cumulative ratio of heads draws closer to 50% as trials increase.",
        estimatedMinutes: 15,
      },
      {
        title: "Two-Dice Sum Probability",
        setting: "home",
        description:
          "Roll two dice 30 times and sum the results. Tally the totals to see why 7 appears much more often than 2 or 12.",
        estimatedMinutes: 15,
      },
    ],
  },
};
