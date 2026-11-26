import { z } from "zod";

export const UAT_ISSUE_STATUSES = ["open", "fixed", "retest", "closed"] as const;
export type UatIssueStatus = (typeof UAT_ISSUE_STATUSES)[number];

export const UAT_ISSUE_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type UatIssueSeverity = (typeof UAT_ISSUE_SEVERITIES)[number];

export const UAT_ISSUE_CATEGORIES = [
  "ui_visual",
  "functional",
  "accessibility",
  "content",
  "performance",
  "responsive",
  "auth_permissions",
  "other",
] as const;
export type UatIssueCategory = (typeof UAT_ISSUE_CATEGORIES)[number];

export const UAT_PORTAL_SURFACES = [
  "admin",
  "student",
  "parent",
  "teacher",
  "public",
  "dev",
] as const;
export type UatPortalSurface = (typeof UAT_PORTAL_SURFACES)[number];

export const UAT_LOCATOR_STRATEGIES = ["testid", "id", "role", "label", "css"] as const;
export type UatLocatorStrategy = (typeof UAT_LOCATOR_STRATEGIES)[number];

export const uatBoundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
});
export type UatBoundingBox = z.infer<typeof uatBoundingBoxSchema>;

export const uatElementCaptureSchema = z.object({
  locator: z.string().min(1).max(500),
  locatorStrategy: z.enum(UAT_LOCATOR_STRATEGIES),
  tagName: z.string().min(1).max(64),
  role: z.string().max(64).nullable(),
  accessibleName: z.string().max(240).nullable(),
  visibleSnippet: z.string().max(300),
  pageUrl: z.string().max(1000),
  redacted: z.boolean().optional(),
  boundingBox: uatBoundingBoxSchema.optional(),
});
export type UatElementCapture = z.infer<typeof uatElementCaptureSchema>;

export const uatAnnotationPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
export type UatAnnotationPoint = z.infer<typeof uatAnnotationPointSchema>;

export const UAT_ANNOTATION_KINDS = ["rect", "arrow", "pen", "redact"] as const;
export type UatAnnotationKind = (typeof UAT_ANNOTATION_KINDS)[number];

export const uatAnnotationShapeSchema = z.object({
  id: z.string().min(1).max(80),
  kind: z.enum(UAT_ANNOTATION_KINDS),
  color: z.string().min(1).max(32),
  points: z.array(uatAnnotationPointSchema).min(1).max(2000),
});
export type UatAnnotationShape = z.infer<typeof uatAnnotationShapeSchema>;

export const uatScreenshotSchema = z.object({
  /**
   * The ONLY retained image: already flattened, with every redaction burned into the pixels. The unredacted source frame
   * is never part of this object, so it cannot reach IndexedDB, JSON exports, drafts or GitHub. (A legacy `rawDataUrl`
   * key in old exports/records is dropped by this schema and by the storage scrubber.)
   */
  annotatedDataUrl: z
    .string()
    .max(6_000_000)
    .refine((val) => /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(val), {
      message: "Annotated screenshot must be a valid base64 PNG, JPEG, or WebP data URL.",
    }),
  width: z.number().int().positive().max(8192),
  height: z.number().int().positive().max(8192),
  capturedAt: z.string().max(64),
  source: z.enum(["tab", "snapshot", "upload", "clipboard"]),
  annotations: z.array(uatAnnotationShapeSchema).max(200),
  /** How many redaction masks were burned into the image (the masks themselves are not kept as editable shapes). */
  redactionCount: z.number().int().min(0).max(200).default(0),
});
export type UatScreenshotCapture = z.infer<typeof uatScreenshotSchema>;

export const uatEnvironmentContextSchema = z.object({
  browser: z.string().min(1).max(160),
  viewport: z.object({
    width: z.number().int().nonnegative().max(16384),
    height: z.number().int().nonnegative().max(16384),
    devicePixelRatio: z.number().positive().max(10),
  }),
  timestamp: z.string().min(1).max(64),
  route: z.string().min(1).max(500),
  pageUrl: z.string().min(1).max(1000),
  portal: z.enum(UAT_PORTAL_SURFACES),
  testSessionId: z.string().min(1).max(120),
  testSessionLabel: z.string().min(1).max(160),
  activeRole: z.string().max(64).nullable(),
});
export type UatEnvironmentContext = z.infer<typeof uatEnvironmentContextSchema>;

export const uatAiDraftSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  stepsToReproduce: z.array(z.string().min(1).max(600)).min(1).max(20),
  actualResult: z.string().min(1).max(2000),
  expectedResult: z.string().min(1).max(2000),
  severity: z.enum(UAT_ISSUE_SEVERITIES),
  category: z.enum(UAT_ISSUE_CATEGORIES),
  generatedAt: z.string().max(64),
  providerId: z.string().max(64),
  modelId: z.string().max(120),
  mode: z.enum(["ai", "local_structured"]),
});
export type UatAiDraft = z.infer<typeof uatAiDraftSchema>;

export const uatGitHubLinkSchema = z.object({
  number: z.number().int().positive(),
  url: z.string().url().max(500),
  repo: z.string().min(3).max(200),
  createdAt: z.string().max(64),
});
export type UatGitHubLink = z.infer<typeof uatGitHubLinkSchema>;

export const uatIssueSchema = z.object({
  id: z.string().min(1).max(120),
  status: z.enum(UAT_ISSUE_STATUSES),
  title: z.string().min(1).max(200),
  originalNotes: z.string().min(1).max(8000),
  description: z.string().max(4000),
  stepsToReproduce: z.array(z.string().min(1).max(600)).max(20),
  actualResult: z.string().max(2000),
  expectedResult: z.string().max(2000),
  severity: z.enum(UAT_ISSUE_SEVERITIES),
  category: z.enum(UAT_ISSUE_CATEGORIES),
  inputMethod: z.enum(["text", "voice", "mixed"]),
  element: uatElementCaptureSchema.nullable(),
  environment: uatEnvironmentContextSchema,
  aiDraft: uatAiDraftSchema.nullable(),
  screenshot: uatScreenshotSchema.nullable(),
  githubIssue: uatGitHubLinkSchema.nullable(),
  createdAt: z.string().min(1).max(64),
  updatedAt: z.string().min(1).max(64),
});
export type UatIssue = z.infer<typeof uatIssueSchema>;

export const uatDraftStateSchema = z.object({
  id: z.literal("active-draft"),
  title: z.string().max(200),
  originalNotes: z.string().max(8000),
  description: z.string().max(4000),
  stepsText: z.string().max(6000),
  actualResult: z.string().max(2000),
  expectedResult: z.string().max(2000),
  severity: z.enum(UAT_ISSUE_SEVERITIES),
  category: z.enum(UAT_ISSUE_CATEGORIES),
  inputMethod: z.enum(["text", "voice", "mixed"]),
  element: uatElementCaptureSchema.nullable(),
  aiDraft: uatAiDraftSchema.nullable(),
  screenshot: uatScreenshotSchema.nullable(),
  updatedAt: z.string().max(64),
});
export type UatDraftState = z.infer<typeof uatDraftStateSchema>;

export const uatTestSessionSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().min(1).max(160),
  startedAt: z.string().min(1).max(64),
});
export type UatTestSession = z.infer<typeof uatTestSessionSchema>;

export const uatExportBundleSchema = z.object({
  schemaVersion: z.literal(1),
  product: z.literal("MindMosaic UAT Assistant"),
  exportedAt: z.string().min(1).max(64),
  issueCount: z.number().int().nonnegative(),
  issues: z.array(uatIssueSchema).max(2000),
});
export type UatExportBundle = z.infer<typeof uatExportBundleSchema>;

export const uatImproveRequestSchema = z.object({
  originalNotes: z.string().trim().min(3).max(6000),
  route: z.string().trim().min(1).max(500),
  pageUrl: z.string().trim().min(1).max(1000),
  portal: z.enum(UAT_PORTAL_SURFACES),
  browser: z.string().trim().min(1).max(160),
  viewport: z.object({
    width: z.number().int().nonnegative().max(16384),
    height: z.number().int().nonnegative().max(16384),
  }),
  element: uatElementCaptureSchema.nullable(),
});
export type UatImproveRequest = z.infer<typeof uatImproveRequestSchema>;

export const uatGitHubCreateRequestSchema = z.object({
  confirmed: z.literal(true),
  issueId: z.string().trim().min(1).max(120),
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(10).max(24000),
  severity: z.enum(UAT_ISSUE_SEVERITIES),
  category: z.enum(UAT_ISSUE_CATEGORIES),
});
export type UatGitHubCreateRequest = z.infer<typeof uatGitHubCreateRequestSchema>;

export const STATUS_LABELS: Record<UatIssueStatus, string> = {
  open: "Open",
  fixed: "Fixed",
  retest: "Retest",
  closed: "Closed",
};

export const SEVERITY_LABELS: Record<UatIssueSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const CATEGORY_LABELS: Record<UatIssueCategory, string> = {
  ui_visual: "UI & visual",
  functional: "Functional",
  accessibility: "Accessibility",
  content: "Question / content",
  performance: "Performance",
  responsive: "Responsive / mobile",
  auth_permissions: "Auth & permissions",
  other: "Other",
};
