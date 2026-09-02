/**
 * Practise Missed Skills CTA — displayed on the results page when the
 * recommendation engine identifies eligible objective mistakes.
 *
 * This component:
 * - Displays the highest-priority recommendation with supporting evidence.
 * - Allows choosing among up to three targets using an accessible radiogroup.
 * - Stores a typed DrillLaunchRequest in sessionStorage.
 * - Uses a pure deterministic fixed-length seed builder.
 * - Navigates with an opaque URL containing only mode=drill and launchId.
 * - Handles storage unavailability gracefully without leaving the page.
 * - Shows a positive message when no eligible mistakes exist.
 * - Announces failures through accessible `role="alert"` messages with retry.
 */
"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RefreshCw, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui";
import { useBoundedNavigation } from "@/features/exam-engine/components/use-bounded-navigation";
import type {
  RecommendationResult,
  SkillRecommendation,
} from "@/features/exam-engine/recommendation";
import type { ExamSelectionConfig } from "@/features/exam-engine/selection";

import { buildDrillSeed, saveDrillLaunchRequest } from "./drill-handoff";

export interface PractiseMissedSkillsProps {
  /** The recommendation result from `recommendSkills`. */
  result: RecommendationResult;
  /** The assessment's selection config, for year level and style. */
  config: ExamSelectionConfig;
  /** Question IDs from the just-completed assessment. */
  previousQuestionIds: readonly string[];
}

export function PractiseMissedSkills({
  result,
  config,
  previousQuestionIds,
}: PractiseMissedSkillsProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [targetPath, setTargetPath] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { exhausted: navigationFailed, retry: retryNavigation } =
    useBoundedNavigation(router, targetPath, isNavigating);

  const handleLaunch = useCallback(
    (recommendation: SkillRecommendation) => {
      setStorageError(null);

      const seed = buildDrillSeed({
        subject: recommendation.subject,
        skillOrTopic: recommendation.skillOrTopic,
        yearLevel: config.yearLevel,
        examStyle: config.examStyle,
        previousQuestionIds,
      });

      const saveResult = saveDrillLaunchRequest({
        launchId: "",
        subject: recommendation.subject,
        skillOrTopic: recommendation.skillOrTopic,
        source: recommendation.source,
        yearLevel: config.yearLevel,
        examStyle: config.examStyle,
        previousQuestionIds: [...previousQuestionIds],
        seed,
      });

      if (!saveResult.ok) {
        setStorageError(
          saveResult.reason.startsWith("Invalid launch parameters")
            ? saveResult.reason
            : "We couldn't start your practice drill because browser storage is unavailable. Please enable storage or try again.",
        );
        setIsNavigating(false);
        return;
      }

      // Opaque URL containing only mode=drill and launchId
      const params = new URLSearchParams();
      params.set("mode", "drill");
      params.set("launchId", saveResult.launchId);

      const path = `/practice/session?${params.toString()}`;
      setTargetPath(path);
      setIsNavigating(true);
    },
    [config, previousQuestionIds],
  );

  // Perfect objective score — show positive message.
  if (result.perfectObjective || result.recommendations.length === 0) {
    return (
      <div
        className="mt-6 flex items-start gap-4 rounded-2xl border border-success/25 bg-success/6 p-5"
        data-testid="no-missed-skills"
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-success/12 text-success"
        >
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-ink">
            No missed objective skills to revise from this session
          </p>
          <p className="mt-0.5 text-xs font-semibold text-muted">
            Great job! Use the actions below to keep practising or try a new exam.
          </p>
        </div>
      </div>
    );
  }

  const { recommendations } = result;
  const selected = recommendations[selectedIndex] ?? recommendations[0];

  const handleRadioKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const total = recommendations.length;
    if (total <= 1) return;

    let nextIndex = index;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (index + 1) % total;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (index - 1 + total) % total;
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      nextIndex = index;
    } else {
      return;
    }

    setSelectedIndex(nextIndex);
    setIsNavigating(false);
    setStorageError(null);

    const targetEl = radioRefs.current[nextIndex];
    if (targetEl) {
      targetEl.focus();
    }
  };

  return (
    <div className="mt-6 space-y-3" data-testid="practise-missed-skills">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-royal-orange/25 bg-royal-orange/6 p-5">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-royal-orange/12 text-warning"
        >
          <Target className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-ink">
            Practise missed skills
          </p>
          <p className="mt-0.5 text-xs font-semibold text-muted">
            {selected.reason}
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleLaunch(selected)}
          disabled={isNavigating && !navigationFailed}
          data-testid="launch-drill"
        >
          <Target aria-hidden="true" className="h-5 w-5" />
          {isNavigating && !navigationFailed
            ? "Launching…"
            : `Practise ${selected.skillOrTopic}`}
        </Button>
      </div>

      {/* Multiple targets — accessible WAI-ARIA radiogroup */}
      {recommendations.length > 1 && (
        <div
          role="radiogroup"
          aria-label="Choose a skill to practise"
          className="flex flex-wrap gap-2"
        >
          {recommendations.map((rec, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={`${rec.subject}-${rec.skillOrTopic}`}
                ref={(el) => {
                  radioRefs.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onKeyDown={(e) => handleRadioKeyDown(e, index)}
                onClick={() => {
                  setSelectedIndex(index);
                  setIsNavigating(false);
                  setStorageError(null);
                }}
                data-testid={`drill-target-${index}`}
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand ${
                  isSelected
                    ? "border-mm-brand bg-mm-brand text-white"
                    : "border-mm-line bg-white text-mm-ink-soft hover:border-mm-brand"
                }`}
              >
                {isSelected && (
                  <Check aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                {rec.skillOrTopic}
                <span className="tabular-nums opacity-70">
                  {rec.accuracy}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Storage failure state */}
      {storageError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/25 bg-error/8 p-4 text-sm font-semibold text-error"
          data-testid="drill-storage-error"
        >
          <p>{storageError}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleLaunch(selected)}
            data-testid="retry-storage"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Bounded navigation failure state */}
      {navigationFailed && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/25 bg-error/8 p-4 text-sm font-semibold text-error"
          data-testid="drill-error"
        >
          <p>
            We couldn&apos;t navigate to your practice drill. Please check your connection.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={retryNavigation}
            data-testid="retry-launch"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
