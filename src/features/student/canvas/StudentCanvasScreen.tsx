"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import "@/features/student/styles/mm-canvas.css";
import artboardsData from "./canvas-artboards-data.json";

export type StudentCanvasScreenId =
  | "my-space"
  | "learn-hub"
  | "learn-lesson"
  | "practice"
  | "runner"
  | "exams"
  | "results"
  | "result-review"
  | "progress"
  | "help"
  | "profile";

type ViewportBucket = "desktop" | "tablet" | "mobile";

interface CanvasAstElement {
  t: string;
  p?: Record<string, unknown>;
  c?: CanvasAstNode[];
}

type CanvasAstNode = string | CanvasAstElement;

const ARTBOARDS = artboardsData as Record<string, CanvasAstNode[]>;

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function resolveArtboardKey(
  screen: StudentCanvasScreenId,
  state: string | undefined,
  viewport: ViewportBucket
): string {
  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";

  switch (screen) {
    case "my-space":
      if (state === "first-visit") return isMobile ? "FirstRunMobile" : "FirstRunDesktop";
      if (state === "no-resume") return "NoResume";
      if (state === "loading") return "Loading";
      if (state === "empty-error") return "EmptyError";
      return isMobile ? "Mobile" : isTablet ? "Tablet" : "Main";

    case "learn-hub":
      if (state === "states") return "LearnStates";
      if (state === "lesson") return isMobile ? "LearnLessonMobile" : "LearnLesson";
      return isMobile ? "LearnHubMobile" : isTablet ? "LearnHubTablet" : "LearnHub";

    case "learn-lesson":
      return isMobile ? "LearnLessonMobile" : "LearnLesson";

    case "practice":
      if (state === "first-visit") return "PracticeFirstVisit";
      if (state === "states") return "PracticeStates";
      return isMobile ? "PracticeMobile" : isTablet ? "PracticeTablet" : "Practice";

    case "runner":
      if (state === "question") {
        return isMobile ? "RunnerQMobile" : isTablet ? "RunnerQTablet" : "RunnerQ";
      }
      if (state === "types") return "RunnerTypes";
      if (state === "types-2") return "RunnerTypes2";
      if (state === "passage") return "RunnerPassage";
      if (state === "check") return "RunnerCheck";
      if (state === "finish") return "RunnerFinish";
      return isMobile ? "RunnerIntroMobile" : "RunnerIntro";

    case "exams":
      if (state === "paper") return "ExamPaper";
      if (state === "start") return "ExamStart";
      if (state === "runner") {
        return isMobile ? "ExamRunnerMobile" : isTablet ? "ExamRunnerTablet" : "ExamRunner";
      }
      if (state === "submit") return "ExamSubmit";
      if (state === "states") return "ExamStates";
      return isMobile ? "ExamBrowseMobile" : "ExamBrowse";

    case "results":
      if (state === "detail") return "ResultDetail";
      if (state === "states") return "ResultsStates";
      return isMobile ? "ResultsMobile" : isTablet ? "ResultsTablet" : "Results";

    case "result-review":
      return isMobile ? "ResultReviewMobile" : "ResultReview";

    case "progress":
      if (state === "states") return "ProgressStates";
      return isMobile ? "ProgressMobile" : isTablet ? "ProgressTablet" : "Progress";

    case "help":
      if (state === "article") return "HelpArticle";
      if (state === "report") return "HelpReport";
      return isMobile ? "HelpMobile" : "Help";

    case "profile":
      if (state === "sign-out") return "ProfileSignOut";
      return isMobile ? "ProfileMobile" : "Profile";
  }
}

function renderAstNode(node: CanvasAstNode, key: string): React.ReactNode {
  if (typeof node === "string") {
    return node;
  }
  const { t, p = {}, c } = node;
  const props: Record<string, unknown> = { ...p, key };

  if (VOID_TAGS.has(t) || !c || c.length === 0) {
    return React.createElement(t, props);
  }

  const children = c.map((child, idx) => renderAstNode(child, `${key}-${idx}`));
  return React.createElement(t, props, ...children);
}

function detectViewport(): ViewportBucket {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w <= 639) return "mobile";
  if (w <= 1023) return "tablet";
  return "desktop";
}

export function StudentCanvasScreen({
  screen,
  state,
}: {
  screen: StudentCanvasScreenId;
  state?: string;
}) {
  const router = useRouter();
  const [viewport, setViewport] = useState<ViewportBucket>(detectViewport);

  useEffect(() => {
    const update = () => setViewport(detectViewport());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleInteractiveClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Chip selection (.mm-chip)
      const chip = target.closest<HTMLButtonElement>("button.mm-chip:not([disabled])");
      if (chip) {
        const group = chip.closest(".mm-chips");
        if (group) {
          const attr = chip.hasAttribute("aria-checked") ? "aria-checked" : "aria-pressed";
          group.querySelectorAll<HTMLButtonElement>("button.mm-chip").forEach((b) => {
            b.setAttribute(attr, b === chip ? "true" : "false");
            b.classList.toggle("is-selected", b === chip);
          });
        } else {
          const pressed = chip.getAttribute("aria-pressed") === "true";
          chip.setAttribute("aria-pressed", pressed ? "false" : "true");
          chip.classList.toggle("is-selected", !pressed);
        }
        return;
      }

      // 2. Segmented control (.mm-seg button)
      const segBtn = target.closest<HTMLButtonElement>(".mm-seg button:not([disabled])");
      if (segBtn) {
        const seg = segBtn.closest(".mm-seg");
        if (seg) {
          seg.querySelectorAll<HTMLButtonElement>("button").forEach((b) => {
            b.setAttribute("aria-pressed", b === segBtn ? "true" : "false");
          });
        }
        return;
      }

      // 3. Switch toggle (.sw)
      const sw = target.closest<HTMLElement>(".sw");
      if (sw) {
        const checked = sw.getAttribute("aria-checked") === "true";
        const next = !checked;
        sw.setAttribute("aria-checked", next ? "true" : "false");
        const track = sw.querySelector(".sw__t");
        if (track) {
          track.classList.toggle("is-off", !next);
        }
        const label = sw.querySelector("span:last-child");
        if (label && (label.textContent === "On" || label.textContent === "Off")) {
          label.textContent = next ? "On" : "Off";
        }
        return;
      }

      // 4. Option card (.mm-opt)
      const opt = target.closest<HTMLElement>(".mm-opt:not([disabled])");
      if (opt && opt.tagName.toLowerCase() === "button") {
        const container = opt.closest(".mm-opts") ?? opt.parentElement;
        if (container) {
          container.querySelectorAll<HTMLElement>("button.mm-opt").forEach((b) => {
            b.setAttribute("aria-pressed", b === opt ? "true" : "false");
            b.classList.toggle("is-selected", b === opt);
          });
        }
        return;
      }

      // 5. Question palette button (.mm-pq)
      const pq = target.closest<HTMLElement>("button.mm-pq");
      if (pq) {
        const palette = pq.closest(".mm-palette");
        if (palette) {
          palette.querySelectorAll<HTMLElement>(".mm-pq").forEach((b) => {
            b.classList.toggle("is-current", b === pq);
          });
        }
        return;
      }

      // 6. Flag button ([data-flag])
      const flagBtn = target.closest<HTMLElement>("[data-flag]");
      if (flagBtn) {
        const pressed = flagBtn.getAttribute("aria-pressed") === "true";
        flagBtn.setAttribute("aria-pressed", pressed ? "false" : "true");
        return;
      }

      // 7. Internal anchor navigation
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (!href) return;
        if (href.startsWith("#")) {
          e.preventDefault();
          const id = href.slice(1);
          const dest = id ? document.getElementById(id) : null;
          if (dest) {
            dest.scrollIntoView({ behavior: "smooth" });
          }
          return;
        }
        if (href.startsWith("/") && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          router.push(href);
        }
      }
    },
    [router]
  );

  const artboardKey = resolveArtboardKey(screen, state, viewport);
  const nodes = ARTBOARDS[artboardKey] ?? [];

  return (
    <div
      className="mm-canvas-root"
      data-canvas-screen={screen}
      data-canvas-artboard={artboardKey}
      onClick={handleInteractiveClick}
    >
      {nodes.map((node, idx) => renderAstNode(node, `${artboardKey}-${idx}`))}
    </div>
  );
}
