"use client";

import { useCallback, useEffect, useState } from "react";
import { Crosshair, X } from "lucide-react";

import { Button } from "@/components/ui/Button";

import type { UatElementCapture } from "../types";
import { captureElementMetadata } from "../utils/locator";

export interface ElementInspectorOverlayProps {
  active: boolean;
  onSelect: (capture: UatElementCapture) => void;
  onCancel: () => void;
}

function findUnderlyingPageElement(clientX: number, clientY: number): Element | null {
  if (typeof document === "undefined" || typeof document.elementsFromPoint !== "function") {
    return null;
  }
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const candidate of stack) {
    if (candidate.closest("[data-uat-assistant]")) continue;
    if (candidate.tagName === "HTML" || candidate.tagName === "BODY") continue;
    return candidate;
  }
  return null;
}

/**
 * Full-viewport capture shield + capture-phase event interceptor.
 *
 * Because pointer events land on the top-layer shield (`[data-uat-overlay="inspector-shield"]`)
 * AND window capture-phase listeners block click/submit/pointer/keyboard activation,
 * selecting an element can never submit an exam answer, trigger an approval, or follow a link.
 */
export function ElementInspectorOverlay({
  active,
  onSelect,
  onCancel,
}: ElementInspectorOverlayProps) {
  const [hoveredCapture, setHoveredCapture] = useState<UatElementCapture | null>(null);

  const updateHoverAt = useCallback((clientX: number, clientY: number) => {
    const el = findUnderlyingPageElement(clientX, clientY);
    if (!el) {
      setHoveredCapture(null);
      return;
    }
    setHoveredCapture(captureElementMetadata(el, window.location.href));
  }, []);

  const pickAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      const target = findUnderlyingPageElement(clientX, clientY);
      if (!target) return;
      const captured = captureElementMetadata(target, window.location.href);
      onSelect(captured);
    },
    [onSelect],
  );

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        onCancel();
        return;
      }
      // Block accidental Enter/Space activation on any previously focused underlying page control.
      const targetEl = event.target instanceof Element ? event.target : null;
      if (!targetEl?.closest("[data-uat-assistant]")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    const blockUnderlyingActivation = (event: Event) => {
      const targetEl = event.target instanceof Element ? event.target : null;
      if (targetEl?.closest("[data-uat-inspector-cancel]")) {
        return;
      }
      if (!targetEl?.closest("[data-uat-assistant]")) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("submit", blockUnderlyingActivation, true);
    window.addEventListener("click", blockUnderlyingActivation, true);
    window.addEventListener("mousedown", blockUnderlyingActivation, true);
    window.addEventListener("mouseup", blockUnderlyingActivation, true);
    window.addEventListener("pointerdown", blockUnderlyingActivation, true);
    window.addEventListener("pointerup", blockUnderlyingActivation, true);
    window.addEventListener("touchstart", blockUnderlyingActivation, { capture: true, passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("submit", blockUnderlyingActivation, true);
      window.removeEventListener("click", blockUnderlyingActivation, true);
      window.removeEventListener("mousedown", blockUnderlyingActivation, true);
      window.removeEventListener("mouseup", blockUnderlyingActivation, true);
      window.removeEventListener("pointerdown", blockUnderlyingActivation, true);
      window.removeEventListener("pointerup", blockUnderlyingActivation, true);
      window.removeEventListener("touchstart", blockUnderlyingActivation, true);
    };
  }, [active, onCancel]);

  if (!active) return null;

  const activeHover = active ? hoveredCapture : null;
  const box = activeHover?.boundingBox;

  return (
    <div
      data-uat-assistant="true"
      data-testid="uat-inspector-root"
      className="fixed inset-0 z-[2147483640] select-none font-[family-name:var(--font-geist)]"
    >
      {/* Visual highlight frame over the hovered underlying element */}
      {activeHover && box && box.width > 0 && box.height > 0 && (
        <div
          data-testid="uat-inspector-highlight"
          aria-hidden="true"
          style={{
            left: `${box.x}px`,
            top: `${box.y}px`,
            width: `${box.width}px`,
            height: `${box.height}px`,
          }}
          className="pointer-events-none fixed rounded-lg border-2 border-mm-brand bg-mm-brand/10 shadow-[0_0_0_2px_rgba(255,255,255,0.9)] transition-[left,top,width,height] duration-75 motion-reduce:transition-none"
        >
          <span className="absolute -top-7 left-0 max-w-[min(85vw,420px)] truncate rounded-md bg-mm-ink px-2 py-0.5 font-mono text-xs font-medium text-white shadow-sm">
            {activeHover.tagName} · {activeHover.locator}
          </span>
        </div>
      )}

      {/* Full-viewport pointer shield — absorbs clicks so underlying controls never fire */}
      <div
        data-testid="uat-inspector-shield"
        data-uat-overlay="inspector-shield"
        role="button"
        tabIndex={0}
        aria-label="Element selector active. Click or tap any element on the page to capture it without activating it, or press Escape to cancel."
        className="fixed inset-0 cursor-crosshair bg-mm-ink/5 focus-visible:outline-none"
        onPointerMove={(event) => updateHoverAt(event.clientX, event.clientY)}
        onMouseMove={(event) => updateHoverAt(event.clientX, event.clientY)}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          pickAtPoint(event.clientX, event.clientY);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
      />

      {/* Top instruction bar */}
      <div
        role="status"
        aria-live="polite"
        className="fixed top-4 left-1/2 z-[2147483645] flex w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 flex-wrap items-center justify-between gap-3 rounded-2xl border border-mm-line bg-mm-surface px-4 py-3 text-sm text-mm-ink shadow-[0_18px_50px_rgba(49,32,86,0.16)]"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mm-tint text-mm-brand">
            <Crosshair aria-hidden="true" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-mm-ink">Select an element to inspect</p>
            <p className="truncate text-xs text-mm-muted">
              {hoveredCapture
                ? `${hoveredCapture.locator} — page actions are paused`
                : "Hover or tap any element. Page controls will not be activated."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          data-uat-inspector-cancel="true"
          data-testid="uat-inspector-cancel"
          onClick={onCancel}
        >
          <X aria-hidden="true" className="h-4 w-4" />
          <span>Cancel (Esc)</span>
        </Button>
      </div>
    </div>
  );
}
