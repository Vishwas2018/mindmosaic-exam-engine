export * from "./schema";

export interface LessonPathwayNode {
  curriculumCode: string;
  title: string;
  strand: string;
  level: string;
  sortOrder: number;
  estimatedMinutes: number;
  learningIntention: string;
  prerequisites: string[];
  status: "draft" | "in_review" | "published" | "archived";
  questionCount: number;
}

export interface LessonPathway {
  strand: string;
  level: string;
  title: string;
  description: string;
  nodes: LessonPathwayNode[];
}
