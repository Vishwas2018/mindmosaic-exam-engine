"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Clock3, ListChecks } from "lucide-react";

import { Badge, Button, Card } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { ExamInstructions } from "@/features/exam-engine/components/ExamInstructions";
import { useBoundedNavigation } from "@/features/exam-engine/components/use-bounded-navigation";
import { useExamStore } from "@/features/exam-engine/state";
import type { AuthoringQuestion } from "@/features/exam-engine/types";

import type { ExamPattern } from "../exam-pattern";
import type { PatternReadiness } from "../pattern-readiness";
import { patternSubjectName } from "../pattern-presentation";
import {
  describePaperShape,
  patternExamConfig,
  patternSittingLabel,
  reducedModuleMinutes,
} from "../pattern-session";

interface GuestBanks {
  curated: readonly AuthoringQuestion[];
  published: readonly AuthoringQuestion[];
  practice: readonly AuthoringQuestion[];
}

/**
 * The start screen for one full-length practice paper.
 *
 * It is the ExamConfigurator's start path with the configuring removed: the
 * pattern already fixes the question count, the time limit and the bank, so
 * the only choices left are which paper (when the bank supports more than
 * one disjoint form) and, where the full-length shape is not satisfiable,
 * whether to sit the shorter practice module instead.
 *
 * Both halves of the existing start path are kept, unchanged in behaviour: a
 * signed-in student gets a server-selected session (the server resolves the
 * same pattern and stores the ids before they see a question); a guest draws
 * locally from the gated bank fetched from /api/exam/guest-bank. Simulations
 * never offer the extended practice bank — a full-length paper padded with
 * ungated seeds is exactly what the pattern doc forbids.
 */
export function ExamPatternStarter({
  pattern,
  readiness,
}: {
  pattern: ExamPattern;
  readiness: PatternReadiness;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const startPatternExam = useExamStore((state) => state.startPatternExam);
  const startServerPatternExam = useExamStore((state) => state.startServerPatternExam);
  const serverMode = auth.status === "authenticated";

  const asPracticeModule = readiness.state === "short";
  const servedCount = asPracticeModule ? readiness.availableCount : pattern.questionCount;
  const minutes = asPracticeModule
    ? reducedModuleMinutes(pattern, servedCount)
    : pattern.timeMinutes;

  const [form, setForm] = useState(0);
  const [stage, setStage] = useState<"overview" | "instructions">("overview");
  const [startError, setStartError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const guestBanksPromise = useRef<Promise<GuestBanks> | null>(null);
  const loadGuestBanks = useCallback(() => {
    guestBanksPromise.current ??= fetch("/api/exam/guest-bank")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Guest bank request failed: ${response.status}`);
        }
        return response.json() as Promise<GuestBanks>;
      })
      .catch((error) => {
        guestBanksPromise.current = null;
        throw error;
      });
    return guestBanksPromise.current;
  }, []);

  useEffect(() => {
    if (auth.status === "anonymous" || auth.status === "unconfigured") {
      loadGuestBanks().catch(() => {});
    }
  }, [auth.status, loadGuestBanks]);

  useEffect(() => {
    router.prefetch("/exam");
  }, [router]);

  const { exhausted: navigationFailed, retry: retryNavigation } = useBoundedNavigation(
    router,
    "/exam",
    isStarting,
    "push",
  );

  const config = patternExamConfig(pattern, servedCount, asPracticeModule);
  const sittingLabel = patternSittingLabel(pattern, servedCount, asPracticeModule);

  const handleStart = async () => {
    if (isStarting || isCreating) return;
    setStartError(null);

    const options = {
      asPracticeModule,
      form,
      formCount: Math.max(1, readiness.distinctPapers),
    };

    if (serverMode) {
      setIsCreating(true);
      const started = await startServerPatternExam(pattern, options);
      setIsCreating(false);
      if (!started) {
        setStartError(
          "We couldn't start this paper just now. Check your connection and try again.",
        );
        return;
      }
      setIsStarting(true);
      return;
    }

    /* Guest flow, mirroring the configurator's: an explicit ?seed= makes a
       sitting reproducible for tests and for sharing. */
    const seed = searchParams.get("seed") ?? undefined;
    let pool: readonly AuthoringQuestion[];
    try {
      setIsCreating(true);
      const banks = await loadGuestBanks();
      /* Gated content only. No extended-bank opt-in on this pathway. */
      pool = banks.published;
    } catch {
      setStartError(
        "We couldn't load the questions. Check your connection and try again.",
      );
      setIsCreating(false);
      return;
    }
    setIsCreating(false);
    const started = startPatternExam(pool, pattern, { ...options, seed });
    if (!started) {
      setStartError(
        "We don't have enough reviewed questions for this paper yet. Try another one.",
      );
      return;
    }
    setIsStarting(true);
  };

  if (stage === "instructions") {
    return (
      <ExamInstructions
        config={config}
        title={sittingLabel}
        questionCount={servedCount}
        timing="timed"
        durationMinutes={minutes}
        includesManualMarking={false}
        onBack={() => {
          setStartError(null);
          setStage("overview");
        }}
        onStart={() => void handleStart()}
        isBusy={isStarting || isCreating}
        error={startError}
        navigationFailed={navigationFailed}
        onRetryNavigation={retryNavigation}
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0" variant="default">
      <div className="border-b border-dashed border-royal/20 bg-[linear-gradient(145deg,#FFFFFF_0%,#F7F4FF_100%)] px-6 py-7 sm:px-8 sm:py-8">
        <Badge variant={asPracticeModule ? "purple" : "orange"}>
          <ListChecks aria-hidden="true" className="h-3.5 w-3.5" />
          {asPracticeModule ? "Practice module" : "Full-length practice"}
        </Badge>
        <h2
          data-testid="pattern-sitting-label"
          className="mt-3 font-[family-name:var(--font-dm-serif)] text-2xl font-normal leading-tight tracking-[-0.02em] text-ink sm:text-3xl"
        >
          {sittingLabel}
        </h2>
        <p
          className="mt-3 text-base font-bold text-muted"
          data-testid="pattern-sitting-shape"
        >
          {describePaperShape(servedCount, minutes)}
        </p>
      </div>

      <div className="px-6 py-7 sm:px-8 sm:py-8">
        {asPracticeModule && (
          <p
            data-testid="reduced-module-notice"
            role="status"
            className="mb-6 rounded-xl bg-warning/10 px-4 py-3 text-sm font-semibold leading-6 text-warning"
          >
            We do not have enough reviewed questions for the full-length{" "}
            {pattern.questionCount}-question paper yet — {readiness.availableCount} are
            ready. You can sit those {readiness.availableCount} as a practice module, with
            the time adjusted to match. It is not the full-length paper.
          </p>
        )}

        {readiness.distinctPapers > 1 && (
          <fieldset className="m-0 mb-6 border-0 p-0">
            <legend className="mb-3 p-0 text-xs font-extrabold uppercase tracking-[0.14em] text-royal">
              Which paper?
            </legend>
            <p className="mb-3 text-sm leading-6 text-muted">
              These papers share no questions, so you can sit each one without seeing
              anything twice.
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: readiness.distinctPapers }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-pressed={form === index}
                  data-testid={`pattern-form-${index}`}
                  onClick={() => setForm(index)}
                  className={`inline-flex min-h-12 min-w-24 items-center justify-center rounded-[10px] border px-4 text-[15px] font-bold transition focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand ${
                    form === index
                      ? "border-mm-brand bg-mm-brand text-white"
                      : "border-mm-line bg-white text-mm-ink-soft hover:border-mm-brand"
                  }`}
                >
                  Paper {index + 1}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <p className="text-sm leading-6 text-muted">
          You will answer {servedCount} question{servedCount === 1 ? "" : "s"} in{" "}
          {minutes} minutes. You can flag questions and come back to them, and the paper
          submits itself if the time runs out.
        </p>
      </div>

      <div className="mx-6 border-t-2 border-dashed border-royal/20 sm:mx-8" aria-hidden="true" />

      <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
          <Clock3 aria-hidden="true" className="h-4 w-4 text-royal" />
          {minutes} minute limit with safe auto-submit
        </p>
        <Button
          variant="orange"
          size="lg"
          data-testid="start-pattern"
          onClick={() => {
            setStartError(null);
            setStage("instructions");
          }}
          disabled={isStarting || isCreating || auth.status === "loading"}
        >
          {asPracticeModule
            ? `Start ${patternSubjectName(pattern)} practice module`
            : "Review instructions"}
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>

      {startError && (
        <p
          data-testid="pattern-start-error"
          role="status"
          className="mx-6 mb-6 rounded-xl bg-warning/10 px-4 py-3 text-sm font-semibold text-warning sm:mx-8"
        >
          {startError}
        </p>
      )}
    </Card>
  );
}
