"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ArrowUpRight,
  Camera,
  Eraser,
  EyeOff,
  ImageUp,
  Monitor,
  PenTool,
  RotateCcw,
  Square,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/Button";

import type {
  UatAnnotationKind,
  UatAnnotationPoint,
  UatAnnotationShape,
  UatBoundingBox,
  UatScreenshotCapture,
} from "../types";
import {
  burnRedaction,
  captureBrowserTabScreenshot,
  captureDomLayoutSnapshot,
  drawAnnotationsOnContext,
  type CapturedFrame,
  readImageFileAsScreenshot,
  renderAnnotatedScreenshot,
} from "./snapshot-capture";

export interface ScreenshotAnnotatorProps {
  screenshot: UatScreenshotCapture | null;
  onChange: (next: UatScreenshotCapture | null) => void;
  selectedElementBox?: UatBoundingBox;
}

const TOOL_CONFIG: readonly {
  kind: UatAnnotationKind;
  label: string;
  icon: typeof Square;
  color: string;
}[] = [
  { kind: "rect", label: "Highlight box", icon: Square, color: "#cc2429" },
  { kind: "arrow", label: "Arrow", icon: ArrowUpRight, color: "#5925a8" },
  { kind: "pen", label: "Freehand", icon: PenTool, color: "#cc2429" },
  { kind: "redact", label: "Redact mask (permanent)", icon: EyeOff, color: "#000000" },
];

export function ScreenshotAnnotator({
  screenshot,
  onChange,
  selectedElementBox,
}: ScreenshotAnnotatorProps) {
  const fileInputId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  /**
   * In-memory working image: redactions are burned into these pixels the moment a redact box is drawn. It lives only
   * in this component (never in props/state that is persisted), so the unredacted frame is dropped on every redaction.
   */
  const baseUrlRef = useRef<string | null>(null);
  /** Marks already flattened into baseUrlRef (a restored draft), so they are not drawn twice. */
  const bakedRef = useRef<readonly UatAnnotationShape[]>([]);
  /**
   * Single source of truth for edits. Every edit (mark, undo, redaction) runs through one serial queue and reads/writes
   * this record, never a stale render closure, so a slow mark render can never overwrite a later redaction with an
   * image that still contains the unredacted pixels.
   */
  const workRef = useRef<{
    marks: readonly UatAnnotationShape[];
    redactions: number;
    shot: UatScreenshotCapture;
  } | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const [baseVersion, setBaseVersion] = useState(0);

  const [activeTool, setActiveTool] = useState<UatAnnotationKind>("rect");
  const [draftShape, setDraftShape] = useState<UatAnnotationShape | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redrawCanvas = useCallback(
    (img: HTMLImageElement | null, shapes: readonly UatAnnotationShape[], current: UatAnnotationShape | null) => {
      const canvas = canvasRef.current;
      if (!canvas || !img || !screenshot) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, screenshot.width, screenshot.height);
      ctx.drawImage(img, 0, 0, screenshot.width, screenshot.height);
      const live = shapes.slice(bakedRef.current.length);
      const all = current ? [...live, current] : live;
      drawAnnotationsOnContext(ctx, screenshot.width, screenshot.height, all);
    },
    [screenshot],
  );

  useEffect(() => {
    if (!screenshot) {
      baseImageRef.current = null;
      baseUrlRef.current = null;
      bakedRef.current = [];
      workRef.current = null;
      return;
    }
    if (!baseUrlRef.current) {
      // Restored from a saved draft: the stored image is already flattened (and already redacted).
      baseUrlRef.current = screenshot.annotatedDataUrl;
      bakedRef.current = screenshot.annotations;
      workRef.current = { marks: [], redactions: screenshot.redactionCount, shot: screenshot };
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      baseImageRef.current = img;
      redrawCanvas(img, screenshot.annotations, null);
    };
    img.src = baseUrlRef.current;
    return () => {
      cancelled = true;
    };
    // baseVersion: reload the working image after a redaction replaced it.
  }, [screenshot, redrawCanvas, baseVersion]);

  const emit = useCallback(
    (mergedUrl: string) => {
      const work = workRef.current;
      if (!work) return;
      onChange({
        ...work.shot,
        annotations: [...bakedRef.current, ...work.marks],
        annotatedDataUrl: mergedUrl,
        redactionCount: work.redactions,
      });
    },
    [onChange],
  );

  const enqueue = useCallback((job: () => Promise<void>, failure: string) => {
    queueRef.current = queueRef.current
      .then(job)
      .catch(() => setErrorMessage(failure));
  }, []);

  /** Starts a fresh in-memory working copy for a newly captured or uploaded frame. */
  const adoptFrame = useCallback(
    (frame: CapturedFrame) => {
      baseUrlRef.current = frame.baseDataUrl;
      bakedRef.current = [];
      workRef.current = { marks: frame.capture.annotations, redactions: 0, shot: frame.capture };
      queueRef.current = Promise.resolve();
      setBaseVersion((v) => v + 1);
      onChange(frame.capture);
    },
    [onChange],
  );

  /** Applies a change to the editable (non-redaction) marks. */
  const commitMarks = useCallback(
    (change: (current: readonly UatAnnotationShape[]) => UatAnnotationShape[]) => {
      enqueue(async () => {
        const work = workRef.current;
        const base = baseUrlRef.current;
        if (!work || !base) return;
        const marks = change(work.marks);
        const mergedUrl = await renderAnnotatedScreenshot(base, work.shot.width, work.shot.height, marks);
        work.marks = marks;
        emit(mergedUrl);
      }, "Could not apply annotation to screenshot.");
    },
    [enqueue, emit],
  );

  /** Redaction is destructive on purpose: pixels are overwritten now and the previous frame is discarded. */
  const commitRedaction = useCallback(
    (shape: UatAnnotationShape) => {
      enqueue(async () => {
        const work = workRef.current;
        const base = baseUrlRef.current;
        if (!work || !base) return;
        const burned = await burnRedaction(base, work.shot.width, work.shot.height, shape);
        baseUrlRef.current = burned;
        work.redactions += 1;
        setBaseVersion((v) => v + 1);
        const mergedUrl = await renderAnnotatedScreenshot(burned, work.shot.width, work.shot.height, work.marks);
        emit(mergedUrl);
      }, "Redaction could not be applied, so the screenshot was not changed. Remove it or try again.");
    },
    [enqueue, emit],
  );

  const toNormalizedPoint = (event: React.PointerEvent<HTMLCanvasElement>): UatAnnotationPoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
    const y = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0;
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
  };

  const handleCaptureSnapshot = () => {
    setErrorMessage(null);
    try {
      adoptFrame(captureDomLayoutSnapshot(selectedElementBox));
    } catch {
      setErrorMessage("Could not capture layout snapshot.");
    }
  };

  const handleCaptureTab = async () => {
    setErrorMessage(null);
    setIsCapturing(true);
    try {
      adoptFrame(await captureBrowserTabScreenshot());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Screen capture was cancelled or blocked.";
      setErrorMessage(`${msg} You can also use Layout snapshot or upload an image.`);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileSelected = async (file: File | undefined, source: "upload" | "clipboard") => {
    if (!file) return;
    setErrorMessage(null);
    try {
      adoptFrame(await readImageFileAsScreenshot(file, source));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not load screenshot file.");
    }
  };

  return (
    <div
      className="rounded-2xl border border-mm-line bg-mm-tint-soft/60 p-4"
      onPaste={(event) => {
        const items = event.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i += 1) {
          const item = items[i];
          if (item && item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              void handleFileSelected(file, "clipboard");
              break;
            }
          }
        }
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-mm-ink">Screenshot & annotations (optional)</p>
          <p className="text-xs text-mm-muted">
            Capture a layout snapshot, share your current tab frame, or paste/upload an image (Ctrl+V).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="uat-capture-snapshot"
            onClick={handleCaptureSnapshot}
          >
            <Camera aria-hidden="true" className="h-4 w-4" />
            <span>Layout snapshot</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="uat-capture-tab"
            isLoading={isCapturing}
            loadingLabel="Capturing…"
            onClick={handleCaptureTab}
          >
            <Monitor aria-hidden="true" className="h-4 w-4" />
            <span>Capture tab</span>
          </Button>
          <label
            htmlFor={fileInputId}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-royal/15 bg-white px-4 py-2 text-sm font-semibold text-royal transition hover:border-royal/30 hover:bg-soft-purple focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-mm-brand"
          >
            <ImageUp aria-hidden="true" className="h-4 w-4" />
            <span>Upload image</span>
            <input
              id={fileInputId}
              data-testid="uat-upload-screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                void handleFileSelected(file, "upload");
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="mt-2.5 text-xs font-semibold text-error">
          {errorMessage}
        </p>
      )}

      {screenshot && (
        <div className="mt-4 space-y-3">
          <div
            role="toolbar"
            aria-label="Screenshot annotation tools"
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-mm-line bg-mm-surface p-2"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {TOOL_CONFIG.map((tool) => {
                const Icon = tool.icon;
                const pressed = activeTool === tool.kind;
                return (
                  <button
                    key={tool.kind}
                    type="button"
                    data-testid={`uat-tool-${tool.kind}`}
                    aria-pressed={pressed}
                    onClick={() => setActiveTool(tool.kind)}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand ${
                      pressed
                        ? "border-mm-brand bg-mm-brand text-white"
                        : "border-mm-line bg-mm-surface text-mm-ink-soft hover:border-mm-brand/40 hover:bg-mm-tint-soft"
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                data-testid="uat-annotation-undo"
                disabled={screenshot.annotations.length === 0}
                onClick={() => {
                  commitMarks((current) => current.slice(0, -1));
                }}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-mm-line bg-mm-surface px-3 py-1.5 text-xs font-semibold text-mm-ink-soft transition hover:border-mm-brand/40 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
              >
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                data-testid="uat-annotation-clear"
                disabled={screenshot.annotations.length === 0}
                onClick={() => commitMarks(() => [])}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-mm-line bg-mm-surface px-3 py-1.5 text-xs font-semibold text-mm-ink-soft transition hover:border-mm-brand/40 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
              >
                <Eraser aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Clear marks</span>
              </button>
              <button
                type="button"
                data-testid="uat-screenshot-remove"
                onClick={() => onChange(null)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-error/25 bg-mm-alert px-3 py-1.5 text-xs font-semibold text-error transition hover:border-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-mm-line bg-mm-surface">
            <canvas
              ref={canvasRef}
              data-testid="uat-annotation-canvas"
              width={screenshot.width}
              height={screenshot.height}
              aria-label="Screenshot annotation canvas. Drag across the image to highlight or redact regions."
              className="block max-h-72 w-full cursor-crosshair touch-none object-contain bg-mm-page"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                const pt = toNormalizedPoint(event);
                const toolMeta = TOOL_CONFIG.find((t) => t.kind === activeTool) ?? TOOL_CONFIG[0]!;
                const nextShape: UatAnnotationShape = {
                  id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  kind: activeTool,
                  color: toolMeta.color,
                  points: [pt, pt],
                };
                setDraftShape(nextShape);
                redrawCanvas(baseImageRef.current, screenshot.annotations, nextShape);
              }}
              onPointerMove={(event) => {
                if (!draftShape) return;
                const pt = toNormalizedPoint(event);
                const updated: UatAnnotationShape =
                  draftShape.kind === "pen"
                    ? { ...draftShape, points: [...draftShape.points, pt] }
                    : { ...draftShape, points: [draftShape.points[0]!, pt] };
                setDraftShape(updated);
                redrawCanvas(baseImageRef.current, screenshot.annotations, updated);
              }}
              onPointerUp={() => {
                if (!draftShape) return;
                const finalized = draftShape;
                setDraftShape(null);
                if (finalized.kind === "redact") {
                  commitRedaction(finalized);
                } else {
                  commitMarks((current) => [...current, finalized]);
                }
              }}
              onPointerCancel={() => {
                setDraftShape(null);
                redrawCanvas(baseImageRef.current, screenshot.annotations, null);
              }}
            />
          </div>
          <p className="text-xs text-mm-muted tabular-nums">
            {screenshot.width}×{screenshot.height}px · {screenshot.annotations.length} annotation(s) ·{" "}
            {screenshot.redactionCount} redaction(s) · Use{" "}
            <strong className="font-semibold text-mm-ink-soft">Redact mask</strong> to cover sensitive on-screen text.{" "}
            Redaction is permanent: the covered pixels are overwritten and cannot be undone or recovered from saved
            exports.
          </p>
        </div>
      )}
    </div>
  );
}
