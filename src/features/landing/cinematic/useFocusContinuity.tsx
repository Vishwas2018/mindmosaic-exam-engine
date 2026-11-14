"use client";

import { useLayoutEffect, type RefObject } from "react";

/*
 * Keyboard focus across the natural-flow <-> pinned tree swap.
 *
 * Chapters 3 and 4 render a different element tree when `choreographed` flips (server render and first client
 * render are always natural flow; the pinned tree replaces it after hydration, and again on a resize across the
 * breakpoint). The focused control is therefore unmounted and focus falls to <body>.
 *
 * Lifecycle (React 19.2, verified by logging each phase): the unmount cleanup of a layout effect that lives INSIDE the
 * deleted subtree runs in the commit's mutation phase, before the subtree's host nodes are removed, so
 * `document.activeElement` is still the control there. A cleanup on the chapter component itself runs AFTER its
 * children's deletions and would be too late. The replacement tree's layout effect runs in the same commit,
 * after its nodes are inserted. So one <FocusKeeper> in each tree is enough: no listeners, and it sees focus
 * wherever the user last put it, including a Tab pressed while hydration was in progress.
 */

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
/** The containers that exist in BOTH trees with the same copy inside them. */
const CONTAINER = "[data-scene], [data-handoff]";

function containerKey(container: Element): string {
  const scene = container.getAttribute("data-scene");
  return scene ? `scene:${scene}` : `handoff:${container.getAttribute("data-handoff")}`;
}

/** A tree-independent identity for a control: its container plus its position among that container's controls. */
export function focusKeyOf(section: HTMLElement, element: Element | null): string | null {
  if (!element || !section.contains(element)) return null;
  const container = element.closest(CONTAINER);
  if (!container || !section.contains(container)) return null;
  const index = Array.from(container.querySelectorAll(FOCUSABLE)).indexOf(element);
  return index < 0 ? null : `${containerKey(container)}#${index}`;
}

export function findByFocusKey(section: HTMLElement, key: string): HTMLElement | null {
  const [id, index] = key.split("#") as [string, string];
  for (const container of section.querySelectorAll(CONTAINER)) {
    if (containerKey(container) === id) return (container.querySelectorAll(FOCUSABLE)[Number(index)] as HTMLElement) ?? null;
  }
  return null;
}

/** Whether focus is genuinely lost (a removed node leaves it on <body>), as opposed to moved by the user. */
const focusIsLost = () => !document.activeElement || document.activeElement === document.body;

/**
 * `anchorFor` for a chapter whose scenes are layers `layerOffset..` of `starts` and whose last layer is the
 * hand-off: the middle of the layer's steady state, but never inside its own fade-in.
 */
export function makeAnchorFor(
  starts: readonly number[],
  crossfade: number,
  sceneIds: readonly string[],
  layerOffset: number,
) {
  return (container: Element): number | null => {
    const scene = container.getAttribute("data-scene");
    let layer = starts.length - 1;
    if (scene) {
      layer = sceneIds.indexOf(scene) + layerOffset;
      if (layer < layerOffset) return null;
    }
    const end = layer >= starts.length - 1 ? 1 : starts[layer + 1]!;
    const middle = starts[layer]! + (end - starts[layer]!) * 0.5;
    return Math.min(1, Math.max(middle, starts[layer]! + crossfade / 2));
  };
}

/** The one-slot mailbox between the tree being removed and the tree being added (a closure, not a ref prop). */
export interface FocusHandoff {
  put(key: string | null): void;
  take(): string | null;
}

export function createFocusHandoff(): FocusHandoff {
  let key: string | null = null;
  return {
    put: (next) => {
      key = next;
    },
    take: () => {
      const taken = key;
      key = null; // one shot: never re-applied
      return taken;
    },
  };
}

const HOLD_FRAMES = 90;
const INTERRUPTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

export interface FocusKeeperProps {
  sectionRef: RefObject<HTMLElement | null>;
  /** Shared by both trees' keepers: the key captured by the tree being removed, consumed by the one being added. */
  handoff: FocusHandoff;
  /** Chapter progress (0..1) at which the layer holding `container` is fully presented, or null for none. */
  anchorFor: (container: Element) => number | null;
  /** `pinnedTravelFactor` of the chapter: pinned progress = scroll progress * travel. */
  travel: number;
}

/**
 * Renders nothing. Put one at the top of EACH tree (natural flow and pinned), with the same `handoff`.
 * On unmount it records which control had focus; on mount, if focus was genuinely lost, it focuses the same
 * control again (without scrolling) and holds the control's layer on screen for a bounded number of frames.
 */
export function FocusKeeper({ sectionRef, handoff, anchorFor, travel }: FocusKeeperProps) {
  // All four props are stable for the life of the chapter (a ref, a state-held mailbox, a memoised function, a constant), so this
  // effect mounts and unmounts exactly with its tree.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    let raf = 0;
    let release = () => {};

    const key = handoff.take();
    if (key && section && focusIsLost()) {
      const target = findByFocusKey(section, key);
      if (target) {
        target.focus({ preventScroll: true });
        const container = target.closest(CONTAINER);
        const progress = container ? anchorFor(container) : null;
        if (progress !== null && document.activeElement === target) {
          // The browser's own smooth scroll toward the control's old, natural-flow position is still in flight, and
          // an instant scrollTo does not stop it (see ChapterTwoPrograms). Hold the layer's anchor for a bounded
          // number of frames, re-asserting only while the page has drifted, and let go on any user input.
          let frames = 0;
          release = () => {
            cancelAnimationFrame(raf);
            for (const type of INTERRUPTS) window.removeEventListener(type, release);
          };
          const hold = () => {
            const stage = section.getBoundingClientRect().top + window.scrollY;
            const wanted = stage + (progress / travel) * section.offsetHeight;
            if (Math.abs(window.scrollY - wanted) > 1) window.scrollTo({ top: wanted, behavior: "instant" });
            if (++frames < HOLD_FRAMES) raf = requestAnimationFrame(hold);
            else release();
          };
          for (const type of INTERRUPTS) window.addEventListener(type, release, { passive: true });
          raf = requestAnimationFrame(hold);
        }
      }
    }

    return () => {
      release();
      // Runs when this tree is removed, before its nodes are: focus is still where the user left it. The section is
      // read now, not at mount: a child's layout effect runs before its parent's ref attaches, so `section` above
      // is null for the very first (hydration) mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately the live value: the section element outlives both trees
      const live = sectionRef.current;
      handoff.put(live ? focusKeyOf(live, document.activeElement) : null);
    };
  }, [sectionRef, handoff, anchorFor, travel]);

  return null;
}
