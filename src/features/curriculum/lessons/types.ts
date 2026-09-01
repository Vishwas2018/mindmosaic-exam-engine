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
  /**
   * True when the curriculum outcome is assessed through live/physical
   * classroom work (see classroom-only.ts) and must never present an
   * online practice call to action, even though the lesson content itself
   * is browsable.
   */
  isClassroomOnly: boolean;
}

export interface LessonPathway {
  strand: string;
  level: string;
  title: string;
  description: string;
  nodes: LessonPathwayNode[];
}

/** The two Victorian Curriculum learning areas this catalogue currently authors. */
export type CurriculumLearningArea = "Mathematics" | "English";

export interface LearningAreaPathwayGroup {
  learningArea: CurriculumLearningArea;
  pathways: readonly LessonPathway[];
}
