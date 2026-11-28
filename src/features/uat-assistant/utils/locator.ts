import type { UatElementCapture, UatLocatorStrategy } from "../types";
import {
  isSensitiveDomElement,
  isUnpublishedReviewSurface,
  redactSensitiveText,
  sanitizeUrlForReport,
} from "./redaction";

/**
 * Rejects auto-generated React `useId()` or transient framework IDs so captured
 * locators stay stable across reloads and builds.
 */
function isStableId(id: string): boolean {
  if (!id || id.length > 80) return false;
  if (/^(:r|_r_|radix-|headlessui-|react-aria)/i.test(id)) return false;
  return /^[A-Za-z][A-Za-z0-9_:-]*$/.test(id);
}

function escapeCssValue(raw: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(raw);
  }
  return raw.replace(/(["\\#.:[\]()>+~*^$|= ])/g, "\\$1");
}

function escapeAttrQuotes(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function inferImplicitRole(el: Element): string | null {
  const explicit = el.getAttribute("role")?.trim();
  if (explicit) return explicit;
  const tag = el.tagName.toLowerCase();
  if (tag === "button") return "button";
  if (tag === "a" && el.hasAttribute("href")) return "link";
  if (tag === "select") return "combobox";
  if (tag === "textarea") return "textbox";
  if (tag === "dialog") return "dialog";
  if (tag === "nav") return "navigation";
  if (tag === "main") return "main";
  if (tag === "header") return "banner";
  if (tag === "footer") return "contentinfo";
  if (/^h[1-6]$/.test(tag)) return "heading";
  if (tag === "input") {
    const type = (el.getAttribute("type") ?? "text").toLowerCase();
    if (type === "checkbox") return "checkbox";
    if (type === "radio") return "radio";
    if (type === "search") return "searchbox";
    if (type === "submit" || type === "button" || type === "reset") return "button";
    return "textbox";
  }
  return null;
}

function resolveAssociatedLabel(el: Element): string | null {
  const ariaLabel = el.getAttribute("aria-label")?.trim();
  if (ariaLabel) return ariaLabel;

  const labelledBy = el.getAttribute("aria-labelledby")?.trim();
  if (labelledBy && el.ownerDocument) {
    const parts = labelledBy
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id)?.textContent?.trim() ?? "")
      .filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
  }

  const id = el.getAttribute("id");
  if (id && el.ownerDocument) {
    const labelEl = el.ownerDocument.querySelector(`label[for="${escapeAttrQuotes(id)}"]`);
    const text = labelEl?.textContent?.trim();
    if (text) return text;
  }

  const wrappingLabel = el.closest("label");
  if (wrappingLabel) {
    const clone = wrappingLabel.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("input, select, textarea").forEach((node) => node.remove());
    const text = clone.textContent?.trim();
    if (text) return text;
  }

  return null;
}

function safeVisibleSnippet(el: Element, pathname: string, redacted: boolean): string {
  const tag = el.tagName.toLowerCase();
  if (redacted) {
    return `<${tag}> (sensitive content redacted)`;
  }

  // Never read `.value` of form inputs or textareas — testers may have typed credentials, names, or answers.
  if (tag === "input" || tag === "textarea" || tag === "select" || el.hasAttribute("contenteditable")) {
    const label = resolveAssociatedLabel(el);
    const placeholder = el.getAttribute("placeholder")?.trim();
    const inputType = tag === "input" ? ` type="${el.getAttribute("type") ?? "text"}"` : "";
    const descriptor = label ? `"${label}"` : placeholder ? `placeholder "${placeholder}"` : "form control";
    return redactSensitiveText(`<${tag}${inputType}> ${descriptor}`).slice(0, 200);
  }

  // On unpublished draft/review routes, only record short UI control text, never full question/answer prose.
  if (isUnpublishedReviewSurface(pathname)) {
    const isControl = tag === "button" || tag === "a" || tag === "label" || /^h[1-6]$/.test(tag);
    if (!isControl) {
      return `<${tag}> on review surface (draft content omitted for answer secrecy)`;
    }
  }

  const rawText = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!rawText) {
    const alt = el.getAttribute("alt")?.trim() || el.getAttribute("aria-label")?.trim();
    return alt ? `<${tag}> "${redactSensitiveText(alt).slice(0, 140)}"` : `<${tag}>`;
  }

  const clipped = rawText.length > 140 ? `${rawText.slice(0, 137)}...` : rawText;
  return redactSensitiveText(clipped);
}

function buildCssPath(el: Element): string {
  const segments: string[] = [];
  let current: Element | null = el;
  let depth = 0;

  while (current && current.nodeType === 1 && depth < 6) {
    const tag = current.tagName.toLowerCase();
    if (tag === "html" || tag === "body") break;

    const testId = current.getAttribute("data-testid")?.trim();
    if (testId) {
      segments.unshift(`[data-testid="${escapeAttrQuotes(testId)}"]`);
      break;
    }

    const id = current.getAttribute("id")?.trim();
    if (id && isStableId(id)) {
      segments.unshift(`#${escapeCssValue(id)}`);
      break;
    }

    if (tag === "main" || tag === "header" || tag === "footer" || tag === "nav") {
      segments.unshift(tag);
      break;
    }

    const parent: Element | null = current.parentElement;
    if (!parent) {
      segments.unshift(tag);
      break;
    }

    const sameTagSiblings = Array.from(parent.children).filter(
      (sibling) => sibling.tagName === current!.tagName,
    );
    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(current) + 1;
      segments.unshift(`${tag}:nth-of-type(${index})`);
    } else {
      segments.unshift(tag);
    }

    current = parent;
    depth += 1;
  }

  return segments.join(" > ") || el.tagName.toLowerCase();
}

export function buildStableLocator(
  el: Element,
  redacted: boolean,
): { locator: string; strategy: UatLocatorStrategy } {
  const testId = el.getAttribute("data-testid")?.trim();
  if (testId) {
    return { locator: `[data-testid="${escapeAttrQuotes(testId)}"]`, strategy: "testid" };
  }

  const id = el.getAttribute("id")?.trim();
  if (id && isStableId(id)) {
    return { locator: `#${escapeCssValue(id)}`, strategy: "id" };
  }

  const ariaLabel = !redacted ? el.getAttribute("aria-label")?.trim() : undefined;
  if (ariaLabel && ariaLabel.length <= 80) {
    return {
      locator: `${el.tagName.toLowerCase()}[aria-label="${escapeAttrQuotes(redactSensitiveText(ariaLabel))}"]`,
      strategy: "label",
    };
  }

  const role = inferImplicitRole(el);
  if (!redacted && role && (role === "button" || role === "link" || role === "heading" || role === "tab")) {
    const name = (resolveAssociatedLabel(el) || (el.textContent ?? "").replace(/\s+/g, " ").trim()).slice(0, 60);
    if (name) {
      return {
        locator: `role=${role}[name="${escapeAttrQuotes(redactSensitiveText(name))}"]`,
        strategy: "role",
      };
    }
  }

  return { locator: buildCssPath(el), strategy: "css" };
}

/**
 * Captures safe, read-only metadata for a selected DOM element without
 * activating or mutating it.
 */
export function captureElementMetadata(el: Element, currentUrl: string): UatElementCapture {
  const sanitizedUrl = sanitizeUrlForReport(currentUrl);
  let pathname = "/";
  try {
    pathname = new URL(sanitizedUrl, "https://mindmosaic.local").pathname;
  } catch {
    pathname = "/";
  }

  const redacted = isSensitiveDomElement(el, pathname);
  const { locator, strategy } = buildStableLocator(el, redacted);
  const role = inferImplicitRole(el);
  const rawLabel = redacted ? null : resolveAssociatedLabel(el);
  const accessibleName = rawLabel ? redactSensitiveText(rawLabel).slice(0, 160) : null;
  const visibleSnippet = safeVisibleSnippet(el, pathname, redacted);

  const rect = typeof el.getBoundingClientRect === "function" ? el.getBoundingClientRect() : null;
  const boundingBox =
    rect && Number.isFinite(rect.width) && Number.isFinite(rect.height)
      ? {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.max(0, Math.round(rect.width)),
          height: Math.max(0, Math.round(rect.height)),
        }
      : undefined;

  return {
    locator,
    locatorStrategy: strategy,
    tagName: el.tagName.toLowerCase(),
    role,
    accessibleName,
    visibleSnippet,
    pageUrl: sanitizedUrl,
    redacted,
    boundingBox,
  };
}
