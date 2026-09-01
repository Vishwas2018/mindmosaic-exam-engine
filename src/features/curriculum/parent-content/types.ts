/**
 * Type definitions for parent-facing curriculum presentation.
 * This is a presentation layer model separate from database / runtime contracts.
 */

export type ParentHomeActivitySetting =
  | "kitchen"
  | "shopping"
  | "car"
  | "reading"
  | "outdoor"
  | "home";

export interface ParentHomeActivity {
  readonly title: string;
  readonly setting: ParentHomeActivitySetting;
  readonly description: string;
  readonly estimatedMinutes: number;
}

export interface ParentCurriculumContent {
  readonly officialCode: string;
  readonly whatThisMeans: string;
  readonly whyItMatters: string;
  readonly homeActivities: readonly ParentHomeActivity[];
  readonly isStub?: boolean;
}

export type CoverageBadgeState =
  | "covered"
  | "partial"
  | "empty"
  | "classroom_only"
  | "not_assessed"
  | "unverified"
  | "transitional";

export interface CoverageBadgeMeta {
  readonly label: string;
  readonly description: string;
  readonly variant: "success" | "warning" | "neutral" | "purple" | "orange";
}
