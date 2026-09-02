import type { Lesson } from "../schema";

export const LEVEL_5_STATISTICS_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2M5ST01: Categorical & Discrete Distributions & Mode
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5ST01",
    title: "Data Distributions: Frequency Tables, Displays and the Mode",
    strand: "statistics",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to represent categorical and discrete numerical data using tables, side-by-side column graphs, and identify the mode and shape of data distributions.",
    successCriteria: [
      "I can construct and interpret frequency tables for categorical and discrete numerical data.",
      "I can identify the mode (most common value or category) and describe spread and outliers in a distribution.",
      "I can interpret side-by-side column graphs comparing two related categories.",
    ],
    prerequisites: ["VC2M3ST01", "VC2M3ST02"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Statistics).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5st01-concept",
        heading: "Types of Data and Measures of Central Tendency",
        explanation:
          "Data is information collected through surveys, observations, or experiments:\n• Categorical Data: Data sorted into non-numeric categories or labels (e.g. favourite sport, travel mode, eye colour).\n• Discrete Numerical Data: Data that can be counted in exact whole numbers (e.g. number of siblings, goals scored, pets owned).\n\nKey statistical features:\n• Frequency: How many times a particular value or category occurs.\n• Mode: The category or score that occurs most frequently (the most popular value). A dataset can have one mode (unimodal), two modes (bimodal), or no mode if all values appear equally.\n• Range: The difference between the highest and lowest values (spread = Maximum - Minimum).\n• Outlier: An unusual data point that sits significantly far away from the rest of the distribution.",
        keyTerms: [
          {
            term: "Categorical Data",
            definition: "Data grouped by descriptive words or categories rather than numbers.",
          },
          {
            term: "Discrete Data",
            definition: "Numerical data that takes distinct, separate values (countable items).",
          },
          {
            term: "Mode",
            definition: "The most frequently occurring score, category, or value in a dataset.",
          },
          {
            term: "Range",
            definition: "The difference between the maximum and minimum values in a numerical dataset.",
          },
        ],
        visualAsset: {
          id: "vc2m5st01-bar-chart",
          type: "bar_chart",
          altText: "Bar chart displaying favourite school electives: Art 14, Music 8, Drama 12, Robotics 18.",
          title: "Year 5 Elective Preferences (N = 52)",
          data: {
            labels: ["Art", "Music", "Drama", "Robotics"],
            values: [14, 8, 12, 18],
            colour: "#3b82f6",
            xAxisLabel: "Elective",
            yAxisLabel: "Number of Students",
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5st01-example",
        heading: "Worked Example: Finding the Mode and Range of Test Scores",
        problem:
          "A group of 10 students scored the following marks out of 20: 14, 17, 12, 18, 17, 15, 17, 19, 14, 20. Find the mode and the range of the scores.",
        steps: [
          {
            stepNumber: 1,
            label: "Order the scores from least to greatest",
            working: "Ordered scores: 12, 14, 14, 15, 17, 17, 17, 18, 19, 20.",
            why: "Arranging numbers in ascending order simplifies frequency counting and identifying extremes.",
          },
          {
            stepNumber: 2,
            label: "Identify the mode (most frequent score)",
            working: "• 14 appears 2 times.\n• 17 appears 3 times.\n• All other scores appear once.\nMode = 17.",
            why: "The mode is the value with the highest tally frequency.",
          },
          {
            stepNumber: 3,
            label: "Calculate the range",
            working: "Range = Maximum score - Minimum score = 20 - 12 = 8 marks.",
            why: "The range quantifies the spread of performance across the cohort.",
          },
        ],
        finalAnswer: "The mode of the test scores is 17 (scored by 3 students), and the range is 8 marks (20 - 12).",
        commonError: {
          mistake: "Stating the mode is 3 because 17 appears 3 times.",
          whyItHappens: "Confusing the frequency count with the data value itself.",
          howToAvoid: "The mode is the actual score (17), not the number of times it was scored (3).",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5st01-misconception",
        heading: "Misconception: A Dataset Must Always Have Exactly One Mode",
        claim: "Every set of numbers has a single mode.",
        whyWrong:
          "If two values share the highest frequency, the dataset is bimodal. If every number appears only once, there is NO mode.",
        correction:
          "Check the frequency counts carefully: a dataset can have zero, one, two, or more modes.",
        example: "In {3, 3, 5, 8, 8, 9}, both 3 and 8 are modes (bimodal). In {2, 4, 6, 8}, there is no mode.",
      },
      {
        kind: "check",
        id: "vc2m5st01-check",
        heading: "Check Your Understanding",
        prompt: "Practise distinguishing categorical vs numerical data and finding the mode and range.",
        curriculumCode: "VC2M5ST01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2M5ST02: Continuous Data, Line Graphs & Rate of Change
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5ST02",
    title: "Line Graphs and Continuous Change Over Time",
    strand: "statistics",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to interpret line graphs representing continuous data over time and calculate rates of change across intervals.",
    successCriteria: [
      "I can explain why line graphs represent continuous change (like temperature or time) rather than categorical data.",
      "I can read values from both axes with correct units and scale intervals.",
      "I can determine periods of fastest increase, decrease, or steady change by analyzing the slope of line segments.",
    ],
    prerequisites: ["VC2M3ST02"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Statistics).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5st02-concept",
        heading: "Interpreting Continuous Data on Line Graphs",
        explanation:
          "A line graph displays continuous data—measurements that change smoothly over an unbroken interval of time (e.g. temperature, plant growth, heart rate, distance travelled):\n• Horizontal Axis (x-axis): Represents the continuous time variable (e.g. hours, days, months).\n• Vertical Axis (y-axis): Represents the measured quantity with its scale and units (e.g. °C, cm, km/h).\n\nReading trends and rate of change from the line's slope:\n• Steep upward slope: Rapid increase.\n• Gentle upward slope: Slow increase.\n• Flat horizontal line: No change (constant value).\n• Downward slope: Decrease.\n• Rate of Change: Calculated as (End Value - Start Value) ÷ Time Interval.",
        keyTerms: [
          {
            term: "Continuous Data",
            definition: "Data that can take any numeric value within an unbroken range (often measured over time).",
          },
          {
            term: "Line Graph",
            definition: "A graph using points connected by line segments to show continuous changes over time.",
          },
          {
            term: "Rate of Change",
            definition: "The speed or magnitude at which a variable changes over a specific interval of time.",
          },
          {
            term: "Interpolation",
            definition: "Estimating an unknown value between two known data points on a continuous graph.",
          },
        ],
        visualAsset: {
          id: "vc2m5st02-line-graph",
          type: "line_graph",
          altText: "Line graph plotting hourly temperature from 8 am to 4 pm: 8am=14C, 10am=18C, 12pm=23C, 2pm=25C, 4pm=21C.",
          title: "Daily Outdoor Temperature Record (°C)",
          data: {
            points: [
              { x: 8, y: 14, label: "8 am" },
              { x: 10, y: 18, label: "10 am" },
              { x: 12, y: 23, label: "12 pm" },
              { x: 14, y: 25, label: "2 pm" },
              { x: 16, y: 21, label: "4 pm" },
            ],
            xAxisLabel: "Time of Day",
            yAxisLabel: "Temperature (°C)",
            colour: "#2563eb",
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5st02-example",
        heading: "Worked Example: Analyzing Rates of Temperature Change",
        problem:
          "Using the temperature line graph above: (a) What was the temperature at 12 pm? (b) Between which two consecutive two-hour time periods did the temperature increase the fastest?",
        steps: [
          {
            stepNumber: 1,
            label: "Read the point at 12 pm",
            working: "Locate 12 pm (x = 12) on the horizontal axis and trace vertically to the plotted point. The y-value is 23°C.",
            why: "Direct coordinate lookup gives the recorded measurement at noon.",
          },
          {
            stepNumber: 2,
            label: "Calculate temperature change for each two-hour interval",
            working:
              "• 8 am to 10 am: 18°C - 14°C = +4°C increase.\n• 10 am to 12 pm: 23°C - 18°C = +5°C increase.\n• 12 pm to 2 pm: 25°C - 23°C = +2°C increase.\n• 2 pm to 4 pm: 21°C - 25°C = -4°C decrease.",
            why: "Calculating deltas (change = end - start) establishes rate of change.",
          },
          {
            stepNumber: 3,
            label: "Compare increases to identify the fastest rise",
            working: "The largest increase is +5°C, which occurred between 10 am and 12 pm.",
            why: "The steepest upward slope indicates the greatest rate of change.",
          },
        ],
        finalAnswer: "(a) 12 pm temperature was 23°C; (b) The temperature increased fastest between 10 am and 12 pm (+5°C).",
        commonError: {
          mistake: "Confusing the highest single point (25°C at 2 pm) with the period of greatest INCREASE (10 am to 12 pm).",
          whyItHappens: "Looking for the maximum value rather than the steepest slope.",
          howToAvoid: "Check the steepness (slope) of the line segment connecting consecutive points.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5st02-misconception",
        heading: "Misconception: Line Graphs Can Be Used for Discrete Categories",
        claim: "You can draw a line graph connecting favourite fruits (Apples, Bananas, Oranges).",
        whyWrong:
          "Connecting discrete categories with a line implies there are meaningful values halfway between 'Apple' and 'Banana'. Line graphs are only mathematically meaningful when the horizontal axis represents a continuous scale (like time, temperature, or distance).",
        correction:
          "Use bar or column graphs for categorical data; reserve line graphs for continuous data across time.",
        example: "Use column graphs for pet types; use line graphs for a pet's weight over 12 months.",
      },
      {
        kind: "check",
        id: "vc2m5st02-check",
        heading: "Check Your Understanding",
        prompt: "Practise interpreting line graphs, finding rates of change, and reading continuous trends.",
        curriculumCode: "VC2M5ST02",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2M5ST03: Statistical Investigation Planning, Data Collection & Bias
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5ST03",
    title: "Statistical Investigations: Sampling, Bias and Analysis",
    strand: "statistics",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to plan and conduct statistical investigations, design fair survey questions, identify potential sampling bias, and draw evidence-based conclusions.",
    successCriteria: [
      "I can formulate statistical questions that can be investigated with data.",
      "I can design unbiased survey questions and choose representative sampling methods.",
      "I can identify sources of bias and explain how sample size impacts the reliability of conclusions.",
    ],
    prerequisites: ["VC2M5ST01", "VC2M5ST02"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Statistics).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5st03-concept",
        heading: "The Statistical Inquiry Cycle (PPDAC)",
        explanation:
          "A statistical investigation follows a 5-stage inquiry cycle:\n1. Problem: Posing a clear, answerable investigative question (e.g. 'Do Year 5 students spend more time reading or on screens on weeknights?').\n2. Plan: Deciding what data to collect, how to sample the population, and creating fair survey questions.\n3. Data: Collecting, recording, and cleaning the data systematically.\n4. Analysis: Creating tables, calculating modes and ranges, and building clear graphs.\n5. Conclusion: Answering the original question with evidence and discussing limitations.\n\nSampling and Bias:\n• Population: The entire group you want to understand.\n• Sample: A smaller subset chosen from the population.\n• Sampling Bias: When the sample is not representative of the whole population (e.g. surveying only students at basketball training about favourite sports).",
        keyTerms: [
          {
            term: "Population",
            definition: "The complete group of individuals or objects being studied in an investigation.",
          },
          {
            term: "Sample",
            definition: "A representative subset of a population selected for data collection.",
          },
          {
            term: "Sampling Bias",
            definition: "A flaw in sample selection that causes some members of the population to be favored or excluded.",
          },
          {
            term: "Leading Question",
            definition: "A survey question phrased in a way that suggests or nudges the respondent towards a particular answer.",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2m5st03-example",
        heading: "Worked Example: Detecting Bias in a School Canteen Survey",
        problem:
          "A student wants to find out the most popular food item in the whole school (Prep to Year 6, 600 students). She surveys 20 Year 5 students outside the computer lab at lunchtime. Identify two sources of bias in her investigation and explain how to improve it.",
        steps: [
          {
            stepNumber: 1,
            label: "Identify sampling group bias (Grade representation)",
            working: "She only surveyed Year 5 students. Younger students (Prep to Year 4) and Year 6 students may have very different food preferences. The sample is not representative of all year levels.",
            why: "A valid sample must represent all sub-groups in the total school population.",
          },
          {
            stepNumber: 2,
            label: "Identify location and sample size bias",
            working: "Surveying only outside the computer lab selects a specific interest group, and 20 students out of 600 (3.3%) is a small sample size.",
            why: "Location clustering and small sample sizes increase error margin.",
          },
          {
            stepNumber: 3,
            label: "Formulate an improved, unbiased sampling plan",
            working: "Select a random sample of 10 students from every year level (Prep through Year 6), giving 70 randomly chosen students surveyed across various school areas.",
            why: "Stratified random sampling ensures balanced representation across ages and interests.",
          },
        ],
        finalAnswer: "Bias 1: Only Year 5 was surveyed; Bias 2: Surveying outside one specific room introduces location bias with a tiny sample (20/600). Improvement: Randomly sample 10 students from every year level.",
        commonError: {
          mistake: "Thinking a survey of 20 people is completely invalid simply because it is small.",
          whyItHappens: "Believing you must survey every single person in a school (a census).",
          howToAvoid: "Sampling is valid and efficient if the sample is randomly and representatively chosen.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5st03-misconception",
        heading: "Misconception: 'Voluntary Response' Surveys Give Unbiased Results",
        claim: "Putting an open online poll on a website is the best way to get unbiased data.",
        whyWrong:
          "Voluntary online polls suffer from self-selection bias: only people with strong opinions (often negative or extreme) bother to respond. People with moderate views usually do not participate.",
        correction:
          "Use random sampling where individuals are selected systematically rather than relying on self-selection.",
        example: "A voluntary poll asking if school uniforms are hated will mostly attract students who dislike uniforms.",
      },
      {
        kind: "check",
        id: "vc2m5st03-check",
        heading: "Check Your Understanding",
        prompt: "Practise planning statistical investigations, identifying biased questions, and analyzing sampling methods.",
        curriculumCode: "VC2M5ST03",
        practiceCount: 5,
      },
    ],
  },
]);
