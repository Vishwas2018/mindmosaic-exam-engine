export type CandidateAnswer =
  | string
  | number
  | boolean
  | readonly string[]
  | Readonly<Record<string, string>>
  | null;

export type ExamResponses = Readonly<Record<string, CandidateAnswer | undefined>>;
