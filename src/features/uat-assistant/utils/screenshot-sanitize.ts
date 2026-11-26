/**
 * Removes any retained UNREDACTED image data from a stored/imported/exported defect record.
 *
 * Earlier builds kept the untouched source frame (`rawDataUrl`) next to the annotated copy, so a redaction was only a
 * mask drawn over recoverable pixels. The current schema retains one flattened image with redactions burned in. This
 * function upgrades any older record shape:
 *   - the `rawDataUrl` key is dropped;
 *   - if the record asked for redactions but the annotated image is byte-identical to the raw one (so the mask was never
 *     rendered into it), the image cannot be trusted and the whole screenshot is discarded.
 * It is pure and idempotent.
 */
export interface SanitizeResult<T> {
  readonly value: T;
  /** True when something was removed or rewritten, so callers can persist the cleaned record. */
  readonly changed: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizeScreenshotField(screenshot: unknown): SanitizeResult<unknown> {
  if (!isRecord(screenshot)) return { value: screenshot, changed: false };
  const hasRaw = "rawDataUrl" in screenshot;
  if (!hasRaw) return { value: screenshot, changed: false };

  const { rawDataUrl, ...rest } = screenshot;
  const annotations = Array.isArray(rest.annotations) ? rest.annotations : [];
  const redactShapes = annotations.filter((a) => isRecord(a) && a.kind === "redact");
  if (redactShapes.length > 0 && rest.annotatedDataUrl === rawDataUrl) {
    return { value: null, changed: true };
  }
  return {
    value: { ...rest, redactionCount: typeof rest.redactionCount === "number" ? rest.redactionCount : redactShapes.length },
    changed: true,
  };
}

/** Applies {@link sanitizeScreenshotField} to a defect-like record (`{ screenshot }`). */
export function sanitizeIssueRecord<T>(issue: T): SanitizeResult<T> {
  if (!isRecord(issue) || !("screenshot" in issue)) return { value: issue, changed: false };
  const result = sanitizeScreenshotField(issue.screenshot);
  if (!result.changed) return { value: issue, changed: false };
  return { value: { ...issue, screenshot: result.value } as T, changed: true };
}
