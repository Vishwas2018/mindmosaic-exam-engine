export * from "./schema";

export interface LessonPathwayNode {
  curriculumCode: string;
  lessonHref: string;
  title: string;
  strand: string;
  level: string;
  sortOrder: number;
  estimatedMinutes: number;
  learningIntention: string;
  prerequisites: string[];
  status: "draft" | "in_review" | "published" | "archived";
  questionCount: number;
  practiceStatus: "covered" | "partial" | "none" | "classroom_only";
  practiceHref?: string;
}

export interface LessonPathway {
  strand: string;
  level: string;
  title: string;
  description: string;
  nodes: LessonPathwayNode[];
}

export type CurriculumLearningAreaId = "mathematics" | "english";

export interface CurriculumLearningAreaPathways {
  id: CurriculumLearningAreaId;
  title: string;
  lessonCount: number;
  pathways: LessonPathway[];
}

export interface CurriculumYearPathways {
  yearLevel: number | null;
  level: string | null;
  lessonCount: number;
  learningAreas: CurriculumLearningAreaPathways[];
}
