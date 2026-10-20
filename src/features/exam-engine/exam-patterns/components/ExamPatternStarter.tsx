"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  /* Non-student roles (admin, parent, teacher) are intentionally prohibited from creating student exam sessions (MM-AUTH-01). */
  const isNonStudentRole =
    auth.status === "authenticated" && auth.role !== null && auth.role !== "student";

  /* A signed-in-only paper is never put in the public guest bank, so a guest cannot start it at all. */
  const signInRequired = pattern.guestAccess === "signed_in_only" && !serverMode && auth.status !== "loading";

  const asPracticeModule = readiness.state === "short";
  const servedCount = asPracticeModule ? readiness.availableCount : pattern.questionCount;
  const minutes = asPracticeModule
    ? reducedModuleMinutes(pattern, servedCount)
    : pattern.timeMinutes;

  const [form, setForm] = useState(0);
  const [confidenceMode, setConfidenceMode] = useState(false);
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

  const config = patternExamConfig(pattern, servedCount, asPracticeModule, confidenceMode);
  const sittingLabel = patternSittingLabel(pattern, servedCount, asPracticeModule);

  const handleStart = async () => {
    if (isStarting || isCreating) return;
    setStartError(null);

    if (isNonStudentRole) {
      setStartError(
        "Exam sessions are only available to student accounts. Please sign in with a student account to start this exam.",
      );
      return;
    }

    const options = {
      asPracticeModule,
      form,
      formCount: Math.max(1, readiness.distinctPapers),
      confidenceMode,
    };

    if (serverMode) {
      setIsCreating(true);
      const started = await startServerPatternExam(pattern, options);
      setIsCreating(false);
      if (!started) {
        const errorMsg =
          useExamStore.getState().lastServerError ??
          "We couldn't start this paper just now. Check your connection and try again.";
        setStartError(errorMsg);
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
        timing={confidenceMode ? "untimed" : "timed"}
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
          {confidenceMode
            ? `${servedCount} questions · Untimed (Confidence Mode)`
            : describePaperShape(servedCount, minutes)}
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

        {signInRequired && (
          <p
            data-testid="sign-in-required-notice"
            role="status"
            className="mb-6 rounded-xl bg-royal/10 px-4 py-3 text-sm font-semibold leading-6 text-royal"
          >
            This paper is for signed-in students, so the questions stay on our server until you sit them.{" "}
            <Link href="/sign-in" className="font-bold underline">
              Sign in to start
            </Link>
            .
          </p>
        )}

        {isNonStudentRole && (
          <div
            data-testid="non-student-role-notice"
            role="status"
            className="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-ink"
          >
            <p className="font-bold text-ink">
              {auth.role === "admin" && "You are signed in as an administrator."}
              {auth.role === "parent" && "You are signed in as a parent."}
              {auth.role === "teacher" && "You are signed in as a teacher."}
            </p>
            <p className="mt-1 text-muted">
              Exam sessions record student progress and can only be sat by student accounts.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              {auth.role === "admin" && (
                <Link
                  href="/admin"
                  className="font-bold text-royal underline underline-offset-2 hover:text-royal/80 focus-visible:outline-2 focus-visible:outline-royal"
                >
                  Admin dashboard
                </Link>
              )}
              {auth.role === "parent" && (
                <Link
                  href="/parent"
                  className="font-bold text-royal underline underline-offset-2 hover:text-royal/80 focus-visible:outline-2 focus-visible:outline-royal"
                >
                  Parent dashboard
                </Link>
              )}
              {auth.role === "teacher" && (
                <Link
                  href="/teacher"
                  className="font-bold text-royal underline underline-offset-2 hover:text-royal/80 focus-visible:outline-2 focus-visible:outline-royal"
                >
                  Teacher dashboard
                </Link>
              )}
              <Link
                href="/sign-in"
                className="font-bold text-royal underline underline-offset-2 hover:text-royal/80 focus-visible:outline-2 focus-visible:outline-royal"
              >
                Sign in with a student account
              </Link>
            </div>
          </div>
        )}

        {/* Confidence Mode puts every explanation in the browser before it is asked for. A signed-in-only paper is
            served answer-stripped, so the option is not offered: it needs a per-answer server reveal first. */}
        {pattern.examStyle === "scholarship_style" && pattern.guestAccess !== "signed_in_only" && (
          <fieldset className="m-0 mb-6 border-0 p-0">
            <legend className="mb-3 p-0 text-xs font-extrabold uppercase tracking-[0.14em] text-royal">
              Sitting mode
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={!confidenceMode}
                data-testid="mode-timed-simulation"
                onClick={() => setConfidenceMode(false)}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand ${
                  !confidenceMode
                    ? "border-mm-brand bg-purple-50/50 shadow-sm ring-1 ring-mm-brand"
                    : "border-mm-line bg-white hover:border-mm-brand/50"
                }`}
              >
                <span className="text-sm font-bold text-ink">Timed simulation</span>
                <span className="mt-1 text-xs text-muted">
                  Strict exam timing ({minutes} min). Auto-submits on expiry.
                </span>
              </button>

              <button
                type="button"
                aria-pressed={confidenceMode}
                data-testid="mode-confidence-mode"
                onClick={() => setConfidenceMode(true)}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand ${
                  confidenceMode
                    ? "border-mm-brand bg-purple-50/50 shadow-sm ring-1 ring-mm-brand"
                    : "border-mm-line bg-white hover:border-mm-brand/50"
                }`}
              >
                <span className="text-sm font-bold text-ink">Confidence Mode</span>
                <span className="mt-1 text-xs text-muted">
                  Untimed practice. Immediate step-by-step explanations after each answer.
                </span>
              </button>
            </div>
          </fieldset>
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
          {confidenceMode
            ? `You will answer ${servedCount} question${
                servedCount === 1 ? "" : "s"
              } at your own pace. Explanations will appear as soon as you answer each question.`
            : `You will answer ${servedCount} question${
                servedCount === 1 ? "" : "s"
              } in ${minutes} minutes. You can flag questions and come back to them, and the paper submits itself if the time runs out.`}
        </p>
      </div>

      <div className="mx-6 border-t-2 border-dashed border-royal/20 sm:mx-8" aria-hidden="true" />

      <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
          <Clock3 aria-hidden="true" className="h-4 w-4 text-royal" />
          {confidenceMode
            ? "Untimed · Step-by-step explanations after each answer"
            : `${minutes} minute limit with safe auto-submit`}
        </p>
        <Button
          variant="orange"
          size="lg"
          data-testid="start-pattern"
          onClick={() => {
            setStartError(null);
            setStage("instructions");
          }}
          disabled={
            isStarting ||
            isCreating ||
            auth.status === "loading" ||
            signInRequired ||
            isNonStudentRole
          }
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
