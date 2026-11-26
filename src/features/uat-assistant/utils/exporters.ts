import {
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  uatExportBundleSchema,
  type UatAiDraft,
  type UatElementCapture,
  type UatEnvironmentContext,
  type UatExportBundle,
  type UatIssue,
  type UatIssueCategory,
  type UatIssueSeverity,
} from "../types";
import { redactSensitiveText, sanitizeUrlForReport } from "./redaction";

/**
 * Deterministic, zero-hallucination local structurer used when an AI provider
 * is not configured or unavailable, or when a tester wants an instant draft
 * grounded strictly in their own words and captured context.
 */
export function buildLocalStructuredDraft(
  originalNotes: string,
  context: Pick<UatEnvironmentContext, "route" | "pageUrl" | "portal" | "browser" | "viewport">,
  element: UatElementCapture | null,
): UatAiDraft {
  const cleanNotes = redactSensitiveText(originalNotes.trim());
  const firstSentence =
    cleanNotes
      .split(/(?<=[.!?])\s+|\n+/)[0]
      ?.replace(/[.!?]+$/, "")
      .trim() ?? cleanNotes;

  const routePrefix = `[${context.portal.toUpperCase()}] `;
  const rawTitle =
    firstSentence.length > 96 ? `${firstSentence.slice(0, 93).trim()}...` : firstSentence || "UI/UX discrepancy";
  const title = `${routePrefix}${rawTitle}`.slice(0, 160);

  const lower = cleanNotes.toLowerCase();
  const severity: UatIssueSeverity =
    /\b(crash|500|data loss|stuck|blocked|cannot submit|security|leak|broken|unusable)\b/.test(lower)
      ? "high"
      : /\b(overlap|cutoff|clipped|mobile|responsive|contrast|focus|keyboard|slow|error)\b/.test(lower)
        ? "medium"
        : "low";

  const category: UatIssueCategory =
    /\b(focus|aria|screen reader|keyboard|contrast|tab order|wcag|a11y)\b/.test(lower)
      ? "accessibility"
      : /\b(mobile|375|768|tablet|overflow|wrap|viewport|responsive)\b/.test(lower)
        ? "responsive"
        : /\b(question|stem|option|answer|passage|curriculum|typo|spelling)\b/.test(lower)
          ? "content"
          : /\b(sign in|login|role|permission|redirect|403|401|session)\b/.test(lower)
            ? "auth_permissions"
            : /\b(slow|lag|freeze|lcp|loading)\b/.test(lower)
              ? "performance"
              : /\b(align|colour|color|font|spacing|padding|border|icon|visual|style)\b/.test(lower)
                ? "ui_visual"
                : "functional";

  const steps: string[] = [
    `Open \`${sanitizeUrlForReport(context.pageUrl)}\` (${context.browser}, ${context.viewport.width}x${context.viewport.height}).`,
  ];
  if (element) {
    steps.push(
      `Locate \`${element.locator}\` (${element.tagName}${element.accessibleName ? ` "${element.accessibleName}"` : ""}).`,
    );
  }
  steps.push("Observe the behaviour described in the tester notes.");

  return {
    title,
    description: cleanNotes,
    stepsToReproduce: steps,
    actualResult: cleanNotes,
    expectedResult:
      "To verify against product specification: the selected control and layout should behave cleanly without the observed discrepancy.",
    severity,
    category,
    generatedAt: new Date().toISOString(),
    providerId: "local",
    modelId: "deterministic-template-v1",
    mode: "local_structured",
  };
}

/**
 * Formats a single UAT defect as professional GitHub-Flavoured Markdown.
 */
export function formatIssueMarkdown(issue: UatIssue): string {
  const lines: string[] = [
    `## ${redactSensitiveText(issue.title)}`,
    "",
    `- **ID:** \`${issue.id}\``,
    `- **Status:** ${STATUS_LABELS[issue.status]}`,
    `- **Severity:** ${SEVERITY_LABELS[issue.severity]}`,
    `- **Category:** ${CATEGORY_LABELS[issue.category]}`,
    `- **Portal / Route:** \`${issue.environment.portal}\` · \`${issue.environment.route}\``,
    `- **Page URL:** \`${sanitizeUrlForReport(issue.environment.pageUrl)}\``,
    `- **Environment:** ${issue.environment.browser} · ${issue.environment.viewport.width}×${issue.environment.viewport.height} (@${issue.environment.viewport.devicePixelRatio}x)`,
    `- **Test Session:** ${issue.environment.testSessionLabel} (\`${issue.environment.testSessionId}\`)`,
    `- **Captured At:** ${issue.createdAt}`,
  ];

  if (issue.githubIssue) {
    lines.push(`- **GitHub Issue:** [#${issue.githubIssue.number}](${issue.githubIssue.url})`);
  }

  if (issue.element) {
    lines.push(
      "",
      "### Selected Element",
      `- **Locator (${issue.element.locatorStrategy}):** \`${issue.element.locator}\``,
      `- **Element:** \`<${issue.element.tagName}>\`${issue.element.role ? ` (role: \`${issue.element.role}\`)` : ""}`,
      `- **Visible Description:** ${redactSensitiveText(issue.element.visibleSnippet)}`,
    );
  }

  lines.push("", "### Description", redactSensitiveText(issue.description || issue.originalNotes));

  if (issue.stepsToReproduce.length > 0) {
    lines.push("", "### Steps to Reproduce");
    issue.stepsToReproduce.forEach((step, idx) => {
      lines.push(`${idx + 1}. ${redactSensitiveText(step)}`);
    });
  }

  lines.push(
    "",
    "### Actual Result",
    redactSensitiveText(issue.actualResult || issue.originalNotes),
    "",
    "### Expected Result",
    redactSensitiveText(issue.expectedResult || "Not specified by tester."),
    "",
    "### Tester's Original Notes (Verbatim)",
    `> ${redactSensitiveText(issue.originalNotes).replace(/\n/g, "\n> ")}`,
  );

  if (issue.screenshot) {
    lines.push(
      "",
      "### Screenshot Metadata",
      `Captured via **${issue.screenshot.source}** (${issue.screenshot.width}×${issue.screenshot.height}, ${issue.screenshot.annotations.length} annotation(s)). Image data is stored locally in the UAT JSON export.`,
    );
  }

  return lines.join("\n");
}

/**
 * Formats a collection of UAT defects into a complete Markdown triage report.
 */
export function formatIssuesReportMarkdown(issues: readonly UatIssue[]): string {
  const counts = {
    open: issues.filter((i) => i.status === "open").length,
    fixed: issues.filter((i) => i.status === "fixed").length,
    retest: issues.filter((i) => i.status === "retest").length,
    closed: issues.filter((i) => i.status === "closed").length,
  };

  const header = [
    "# MindMosaic UAT Defect Report",
    "",
    `**Exported:** ${new Date().toISOString()}  `,
    `**Total Defects:** ${issues.length} (Open: ${counts.open} · Fixed: ${counts.fixed} · Retest: ${counts.retest} · Closed: ${counts.closed})`,
    "",
  ];

  if (issues.length === 0) {
    return [...header, "_No defects recorded._", ""].join("\n");
  }

  const summaryTable = [
    "| ID | Status | Severity | Category | Route | Title |",
    "|---|---|---|---|---|---|",
    ...issues.map(
      (issue) =>
        `| \`${issue.id}\` | ${STATUS_LABELS[issue.status]} | ${SEVERITY_LABELS[issue.severity]} | ${CATEGORY_LABELS[issue.category]} | \`${issue.environment.route}\` | ${redactSensitiveText(issue.title).replace(/\|/g, "\\|")} |`,
    ),
    "",
    "---",
    "",
  ];

  const sections = issues.map((issue) => formatIssueMarkdown(issue)).join("\n\n---\n\n");
  return [...header, ...summaryTable, sections, ""].join("\n");
}

/**
 * Formats the sanitized Markdown body used when creating a GitHub issue after
 * explicit tester confirmation.
 */
export function formatGitHubIssueBody(issue: UatIssue): string {
  return [
    formatIssueMarkdown({
      ...issue,
      // Omit local base64 image data URLs; GitHub issue bodies have a 65536-char limit.
      screenshot: issue.screenshot,
    }),
    "",
    "---",
    "_Created via MindMosaic AI UAT Assistant (DEV environment, human-confirmed)._",
  ].join("\n");
}

/**
 * Serializes issues into a versioned JSON export bundle.
 */
export function serializeExportBundle(
  issues: readonly UatIssue[],
  options: { includeScreenshots?: boolean } = {},
): string {
  const includeScreenshots = options.includeScreenshots ?? true;
  const sanitizedIssues: UatIssue[] = issues.map((issue) => ({
    ...issue,
    title: redactSensitiveText(issue.title),
    originalNotes: redactSensitiveText(issue.originalNotes),
    description: redactSensitiveText(issue.description),
    stepsToReproduce: issue.stepsToReproduce.map((s) => redactSensitiveText(s)),
    actualResult: redactSensitiveText(issue.actualResult),
    expectedResult: redactSensitiveText(issue.expectedResult),
    environment: {
      ...issue.environment,
      pageUrl: sanitizeUrlForReport(issue.environment.pageUrl),
    },
    element: issue.element
      ? {
          ...issue.element,
          pageUrl: sanitizeUrlForReport(issue.element.pageUrl),
          visibleSnippet: redactSensitiveText(issue.element.visibleSnippet),
        }
      : null,
    screenshot: includeScreenshots ? issue.screenshot : null,
  }));

  const bundle: UatExportBundle = {
    schemaVersion: 1,
    product: "MindMosaic UAT Assistant",
    exportedAt: new Date().toISOString(),
    issueCount: sanitizedIssues.length,
    issues: sanitizedIssues,
  };

  return JSON.stringify(bundle, null, 2);
}

export type ParseImportOutcome =
  | { readonly ok: true; readonly bundle: UatExportBundle }
  | { readonly ok: false; readonly message: string };

/**
 * Validates and parses an imported JSON defect bundle.
 */
export function parseImportBundle(rawJson: string): ParseImportOutcome {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      ok: false,
      message: "The selected file is not valid JSON. Choose a MindMosaic UAT export (.json) file and try again.",
    };
  }

  const validation = uatExportBundleSchema.safeParse(parsed);
  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    const pathLabel = firstIssue?.path.join(".") || "root";
    return {
      ok: false,
      message: `Import file failed schema validation at "${pathLabel}": ${firstIssue?.message ?? "invalid format"}. Your existing defects were not changed.`,
    };
  }

  return { ok: true, bundle: validation.data };
}

/**
 * Non-destructively merges imported issues with existing local issues.
 * Newer `updatedAt` wins on ID collision so recent status updates are kept.
 */
export function mergeImportedIssues(
  existing: readonly UatIssue[],
  incoming: readonly UatIssue[],
): { merged: UatIssue[]; added: number; updated: number } {
  const byId = new Map<string, UatIssue>();
  for (const item of existing) {
    byId.set(item.id, item);
  }

  let added = 0;
  let updated = 0;
  for (const candidate of incoming) {
    const prev = byId.get(candidate.id);
    if (!prev) {
      byId.set(candidate.id, candidate);
      added += 1;
    } else if (Date.parse(candidate.updatedAt) >= Date.parse(prev.updatedAt)) {
      byId.set(candidate.id, candidate);
      updated += 1;
    }
  }

  const merged = Array.from(byId.values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return { merged, added, updated };
}
