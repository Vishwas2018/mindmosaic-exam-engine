export interface ActiveSession {
  id: string;
  examTitle: string;
  resumeHref: string;
  startedAt: string;
  /** ISO timestamp; once past, the session is treated as expired, not active. */
  expiresAt?: string;
  questionsAnswered?: number;
  totalQuestions?: number;
}
