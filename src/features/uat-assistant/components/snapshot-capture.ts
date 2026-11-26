"use client";

import type {
  UatAnnotationShape,
  UatBoundingBox,
  UatScreenshotCapture,
} from "../types";
import { isSensitiveDomElement, redactSensitiveText } from "../utils/redaction";

const MAX_DIMENSION = 1440;

function clampDimensions(width: number, height: number): { width: number; height: number } {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
  }
  const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Draws annotations onto a base screenshot data URL and produces the merged PNG data URL.
 */
export async function renderAnnotatedScreenshot(
  rawDataUrl: string,
  width: number,
  height: number,
  annotations: readonly UatAnnotationShape[],
): Promise<string> {
  if (annotations.length === 0) return rawDataUrl;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Could not load base screenshot image."));
    element.src = rawDataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return rawDataUrl;

  ctx.drawImage(img, 0, 0, width, height);
  drawAnnotationsOnContext(ctx, width, height, annotations);
  return canvas.toDataURL("image/png");
}

export function drawAnnotationsOnContext(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  annotations: readonly UatAnnotationShape[],
): void {
  const strokeWidth = Math.max(3, Math.round(Math.min(width, height) * 0.0045));

  for (const shape of annotations) {
    if (shape.points.length === 0) continue;
    ctx.save();
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (shape.kind === "pen") {
      ctx.beginPath();
      shape.points.forEach((pt, idx) => {
        const x = pt.x * width;
        const y = pt.y * height;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    } else if (shape.kind === "rect" || shape.kind === "redact") {
      const start = shape.points[0]!;
      const end = shape.points[shape.points.length - 1]!;
      const x = Math.min(start.x, end.x) * width;
      const y = Math.min(start.y, end.y) * height;
      const w = Math.abs(end.x - start.x) * width;
      const h = Math.abs(end.y - start.y) * height;

      if (shape.kind === "redact") {
        ctx.fillStyle = "#18151f";
        ctx.fillRect(x, y, Math.max(4, w), Math.max(4, h));
      } else {
        ctx.fillStyle = "rgba(255, 85, 90, 0.10)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      }
    } else if (shape.kind === "arrow") {
      const start = shape.points[0]!;
      const end = shape.points[shape.points.length - 1]!;
      const x1 = start.x * width;
      const y1 = start.y * height;
      const x2 = end.x * width;
      const y2 = end.y * height;
      const headLen = Math.max(12, strokeWidth * 4);
      const angle = Math.atan2(y2 - y1, x2 - x1);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Zero-permission, CSP-safe Canvas 2D visual layout snapshot of the current
 * viewport. Captures visible cards, controls, headings, and the selected element's
 * highlight frame while redacting sensitive inputs and unpublished review answers.
 */
export function captureDomLayoutSnapshot(
  highlightBox?: UatBoundingBox,
): UatScreenshotCapture {
  const vw = Math.max(320, window.innerWidth || 1280);
  const vh = Math.max(240, window.innerHeight || 800);
  const { width, height } = clampDimensions(vw, vh);
  const scaleX = width / vw;
  const scaleY = height / vh;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    ctx.fillStyle = bodyBg && bodyBg !== "rgba(0, 0, 0, 0)" ? bodyBg : "#fcfbf8";
    ctx.fillRect(0, 0, width, height);

    const pathname = window.location.pathname;
    const candidates = Array.from(
      document.querySelectorAll(
        "header, nav, main, section, article, aside, footer, button, a, input, select, textarea, h1, h2, h3, [role='button'], [data-testid]",
      ),
    );

    for (const el of candidates.slice(0, 260)) {
      if (el.closest("[data-uat-assistant]")) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) continue;

      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
        continue;
      }

      const x = rect.left * scaleX;
      const y = rect.top * scaleY;
      const w = rect.width * scaleX;
      const h = rect.height * scaleY;

      const bg = style.backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, w, h);
      }

      const borderCol = style.borderTopColor;
      const borderW = parseFloat(style.borderTopWidth || "0");
      if (borderW > 0 && borderCol && borderCol !== "rgba(0, 0, 0, 0)") {
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = Math.max(1, borderW * scaleX);
        ctx.strokeRect(x, y, w, h);
      }

      const tag = el.tagName.toLowerCase();
      const isTextLeaf =
        /^h[1-3]$/.test(tag) || tag === "button" || tag === "a" || tag === "input" || tag === "select";

      if (isTextLeaf) {
        const sensitive = isSensitiveDomElement(el, pathname);
        let label = "";
        if (sensitive) {
          label = "[REDACTED]";
        } else if (tag === "input" || tag === "select" || tag === "textarea") {
          label = el.getAttribute("placeholder") || el.getAttribute("aria-label") || `<${tag}>`;
        } else {
          label = redactSensitiveText((el.textContent ?? "").replace(/\s+/g, " ").trim()).slice(0, 48);
        }

        if (label) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x + 4, y + 2, Math.max(0, w - 8), Math.max(0, h - 4));
          ctx.clip();
          const fontPx = Math.max(10, Math.min(20, Math.round(parseFloat(style.fontSize || "14") * scaleY)));
          ctx.font = `${/^h[1-3]$/.test(tag) || tag === "button" ? "600" : "400"} ${fontPx}px system-ui, sans-serif`;
          ctx.fillStyle = style.color || "#18151f";
          ctx.textBaseline = "middle";
          ctx.fillText(label, x + 6, y + h / 2);
          ctx.restore();
        }
      }
    }

    // Top metadata banner so reviewers immediately know route & viewport.
    ctx.fillStyle = "rgba(24, 21, 31, 0.86)";
    ctx.fillRect(0, 0, width, 26);
    ctx.fillStyle = "#ffffff";
    ctx.font = "500 11px system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(`MindMosaic UAT Layout Snapshot · ${pathname} · ${vw}×${vh}`, 10, 13);
  }

  const initialAnnotations: UatAnnotationShape[] = [];
  if (highlightBox && highlightBox.width > 0 && highlightBox.height > 0) {
    const x1 = Math.max(0, Math.min(1, highlightBox.x / vw));
    const y1 = Math.max(0, Math.min(1, highlightBox.y / vh));
    const x2 = Math.max(0, Math.min(1, (highlightBox.x + highlightBox.width) / vw));
    const y2 = Math.max(0, Math.min(1, (highlightBox.y + highlightBox.height) / vh));
    initialAnnotations.push({
      id: `auto-target-${Date.now()}`,
      kind: "rect",
      color: "#cc2429",
      points: [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ],
    });
  }

  const rawDataUrl = canvas.toDataURL("image/png");
  if (ctx && initialAnnotations.length > 0) {
    drawAnnotationsOnContext(ctx, width, height, initialAnnotations);
  }
  const annotatedDataUrl = initialAnnotations.length > 0 ? canvas.toDataURL("image/png") : rawDataUrl;

  return {
    rawDataUrl,
    annotatedDataUrl,
    width,
    height,
    capturedAt: new Date().toISOString(),
    source: "snapshot",
    annotations: initialAnnotations,
  };
}

/**
 * Captures a real pixel frame of the current browser tab via Screen Capture API
 * (`getDisplayMedia`), temporarily hiding UAT modals during the single frame grab.
 */
export async function captureBrowserTabScreenshot(): Promise<UatScreenshotCapture> {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getDisplayMedia !== "function"
  ) {
    throw new Error("Tab screen capture isn't supported on this browser. Use Layout Snapshot or Upload/Paste instead.");
  }

  const overlays = Array.from(document.querySelectorAll<HTMLElement>("[data-uat-assistant]"));
  overlays.forEach((node) => {
    node.style.opacity = "0";
  });

  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "browser" } as MediaTrackConstraints,
      audio: false,
      preferCurrentTab: true,
    } as MediaStreamConstraints);

    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    await new Promise((r) => setTimeout(r, 90));

    const { width, height } = clampDimensions(video.videoWidth || 1280, video.videoHeight || 800);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable.");
    ctx.drawImage(video, 0, 0, width, height);

    const rawDataUrl = canvas.toDataURL("image/png");
    return {
      rawDataUrl,
      annotatedDataUrl: rawDataUrl,
      width,
      height,
      capturedAt: new Date().toISOString(),
      source: "tab",
      annotations: [],
    };
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
    overlays.forEach((node) => {
      node.style.opacity = "";
    });
  }
}

/**
 * Reads an uploaded or pasted PNG/JPEG/WebP image file into a downscaled screenshot object.
 */
export async function readImageFileAsScreenshot(
  file: File,
  source: "upload" | "clipboard" = "upload",
): Promise<UatScreenshotCapture> {
  if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
    throw new Error("Choose a PNG, JPEG, or WebP image.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Screenshot image must be under 10 MB.");
  }

  const fileDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Invalid image file."));
    element.src = fileDataUrl;
  });

  const { width, height } = clampDimensions(img.naturalWidth || 800, img.naturalHeight || 600);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  ctx.drawImage(img, 0, 0, width, height);

  const rawDataUrl = canvas.toDataURL("image/png");
  return {
    rawDataUrl,
    annotatedDataUrl: rawDataUrl,
    width,
    height,
    capturedAt: new Date().toISOString(),
    source,
    annotations: [],
  };
}
