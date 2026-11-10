import type { StudentContext } from "../require-student";
import type { StudentAttemptOverview } from "../attempt-summary";
import type { StudentPortalShellData } from "../components/student-portal-shell-data";

export const PREVIEW_STUDENT_CONTEXT: StudentContext = {
  userId: "preview-student-aisha",
  displayName: "Aisha Raman",
  yearLevel: 3,
  onboardingCompleted: true,
  diagnosticCompleted: true,
  interests: ["Space", "Marine Biology", "Puzzles"],
  weeklyGoalMinutes: 60,
};

export const PREVIEW_STUDENT_OVERVIEW: StudentAttemptOverview = {
  attempts: [
    {
      id: "att-num-301",
      submittedAt: "2026-11-05T10:15:00Z",
      title: "NAPLAN-style Numeracy",
      subjectLabel: "Numeracy",
      timing: "timed",
      totalQuestions: 32,
      scorePercent: 75,
      attemptedQuestions: 29,
      pendingManualReview: false,
      mode: "standard",
    },
    {
      id: "att-read-302",
      submittedAt: "2026-11-03T14:30:00Z",
      title: "NAPLAN-style Reading",
      subjectLabel: "Reading",
      timing: "timed",
      totalQuestions: 25,
      scorePercent: 84,
      attemptedQuestions: 25,
      pendingManualReview: false,
      mode: "standard",
    },
    {
      id: "att-lang-303",
      submittedAt: "2026-10-30T16:00:00Z",
      title: "NAPLAN-style Language conventions",
      subjectLabel: "Language conventions",
      timing: "timed",
      totalQuestions: 20,
      scorePercent: 80,
      attemptedQuestions: 20,
      pendingManualReview: false,
      mode: "standard",
    },
    {
      id: "att-icas-304",
      submittedAt: "2026-10-25T11:20:00Z",
      title: "ICAS-style English",
      subjectLabel: "Reading",
      timing: "untimed",
      totalQuestions: 15,
      scorePercent: 86,
      attemptedQuestions: 15,
      pendingManualReview: false,
      mode: "standard",
    },
  ],
  mastery: [
    {
      subject: "reading",
      label: "Reading",
      percent: 85,
      marksEarned: 34,
      marksAvailable: 40,
    },
    {
      subject: "language_conventions",
      label: "Language conventions",
      percent: 80,
      marksEarned: 16,
      marksAvailable: 20,
    },
    {
      subject: "numeracy",
      label: "Numeracy",
      percent: 75,
      marksEarned: 24,
      marksAvailable: 32,
    },
  ],
  recommendedFocus: {
    subject: "numeracy",
    label: "Numeracy",
    percent: 75,
    marksEarned: 24,
    marksAvailable: 32,
  },
};

export const PREVIEW_STUDENT_SHELL_DATA: StudentPortalShellData = {
  mathematicsPathways: [],
  weekDots: [
    { label: "M", dayKey: "2026-11-03", state: "done" },
    { label: "T", dayKey: "2026-11-04", state: "missed" },
    { label: "W", dayKey: "2026-11-05", state: "done" },
    { label: "T", dayKey: "2026-11-06", state: "done" },
    { label: "F", dayKey: "2026-11-07", state: "done" },
    { label: "S", dayKey: "2026-11-08", state: "missed" },
    { label: "S", dayKey: "2026-11-09", state: "today_pending" },
  ],
  currentStreak: 3,
  sessionsThisWeek: 4,
  weeklyTarget: 5,
  hasActiveSession: false,
};

export interface PreviewReviewQuestion {
  number: number;
  strand: string;
  prompt: string;
  options: Array<{ key: string; label: string }>;
  studentAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  isFlagged: boolean;
  explanation: string;
}

export const PREVIEW_REVIEW_QUESTIONS: PreviewReviewQuestion[] = [
  {
    number: 1,
    strand: "Number and algebra",
    prompt: "A bakery makes 48 apple pies in the morning. By noon, 31 pies are sold. How many pies are left?",
    options: [
      { key: "A", label: "15" },
      { key: "B", label: "17" },
      { key: "C", label: "19" },
      { key: "D", label: "79" },
    ],
    studentAnswer: "B",
    correctAnswer: "B",
    isCorrect: true,
    isFlagged: false,
    explanation: "Subtract the sold pies from the starting number: 48 - 31 = 17 pies remaining.",
  },
  {
    number: 2,
    strand: "Measurement and geometry",
    prompt: "Which shape has exactly 5 vertices and 5 straight edges?",
    options: [
      { key: "A", label: "Quadrilateral" },
      { key: "B", label: "Hexagon" },
      { key: "C", label: "Pentagon" },
      { key: "D", label: "Octagon" },
    ],
    studentAnswer: "C",
    correctAnswer: "C",
    isCorrect: true,
    isFlagged: false,
    explanation: "A pentagon is a 2D polygon with exactly 5 sides (edges) and 5 corners (vertices).",
  },
  {
    number: 3,
    strand: "Number and algebra",
    prompt: "Maya packs 6 eggs into each carton. She fills 4 cartons completely. How many eggs did she pack?",
    options: [
      { key: "A", label: "10" },
      { key: "B", label: "20" },
      { key: "C", label: "24" },
      { key: "D", label: "28" },
    ],
    studentAnswer: "A",
    correctAnswer: "C",
    isCorrect: false,
    isFlagged: true,
    explanation: "You need to multiply the number of cartons by the eggs in each carton: 4 × 6 = 24 eggs. Adding 4 + 6 = 10 gives an incorrect sum.",
  },
  {
    number: 4,
    strand: "Statistics and probability",
    prompt: "In a bag there are 8 red marbles and 2 blue marbles. If Liam takes one marble without looking, how likely is it that he picks a red marble?",
    options: [
      { key: "A", label: "Impossible" },
      { key: "B", label: "Unlikely" },
      { key: "C", label: "Likely" },
      { key: "D", label: "Certain" },
    ],
    studentAnswer: "C",
    correctAnswer: "C",
    isCorrect: true,
    isFlagged: false,
    explanation: "There are 8 red marbles out of 10 total marbles. Because most marbles are red (8 out of 10), it is 'likely' to draw a red marble.",
  },
  {
    number: 5,
    strand: "Measurement and geometry",
    prompt: "A train departs the station at 9:15 am and arrives at 10:05 am. How long was the journey in minutes?",
    options: [
      { key: "A", label: "45 minutes" },
      { key: "B", label: "50 minutes" },
      { key: "C", label: "55 minutes" },
      { key: "D", label: "60 minutes" },
    ],
    studentAnswer: "A",
    correctAnswer: "B",
    isCorrect: false,
    isFlagged: false,
    explanation: "From 9:15 am to 10:00 am is 45 minutes. From 10:00 am to 10:05 am is another 5 minutes. 45 + 5 = 50 minutes.",
  },
  {
    number: 6,
    strand: "Number and algebra",
    prompt: "What is the missing number in this sequence? 12, 16, 20, __, 28",
    options: [
      { key: "A", label: "22" },
      { key: "B", label: "24" },
      { key: "C", label: "25" },
      { key: "D", label: "26" },
    ],
    studentAnswer: null,
    correctAnswer: "B",
    isCorrect: false,
    isFlagged: true,
    explanation: "The pattern increases by adding 4 each step (12 + 4 = 16, 16 + 4 = 20). 20 + 4 = 24, and 24 + 4 = 28.",
  },
  {
    number: 7,
    strand: "Number and algebra",
    prompt: "Which number sentence has the same value as 7 × 3?",
    options: [
      { key: "A", label: "7 + 7 + 7" },
      { key: "B", label: "3 + 7" },
      { key: "C", label: "7 + 3" },
      { key: "D", label: "7 × 7 × 7" },
    ],
    studentAnswer: "A",
    correctAnswer: "A",
    isCorrect: true,
    isFlagged: false,
    explanation: "Multiplication is repeated addition. 7 × 3 means 3 groups of 7, which is written as 7 + 7 + 7 = 21.",
  },
  {
    number: 8,
    strand: "Measurement and geometry",
    prompt: "A ribbon is 85 cm long. Ben cuts off 38 cm. How long is the remaining ribbon?",
    options: [
      { key: "A", label: "43 cm" },
      { key: "B", label: "47 cm" },
      { key: "C", label: "53 cm" },
      { key: "D", label: "57 cm" },
    ],
    studentAnswer: "B",
    correctAnswer: "B",
    isCorrect: true,
    isFlagged: false,
    explanation: "85 - 38 = 47 cm.",
  },
];
