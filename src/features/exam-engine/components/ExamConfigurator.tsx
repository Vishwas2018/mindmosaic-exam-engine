"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Clock3, ListChecks } from "lucide-react";

import { Badge, Button, Card, Select } from "@/components/ui";
import { useAuth } from "@/features/auth";
import {
  EXAM_STYLE_OPTIONS,
  QUESTION_COUNT_OPTIONS,
  SUBJECT_OPTIONS,
  YEAR_LEVEL_OPTIONS,
  durationSecondsFor,
  eligibilityKey,
  type BankEligibilitySummary,
  type ExamBankId,
  type ExamSelectionConfig,
  type ExamStyleFilter,
  type QuestionCountOption,
  type SubjectFilter,
  type TimingMode,
  type YearLevelFilter,
} from "@/features/exam-engine/selection";
import { useExamStore } from "@/features/exam-engine/state";
import type { AuthoringQuestion } from "@/features/exam-engine/types";

import { STYLE_LABELS, SUBJECT_LABELS, YEAR_LABELS, describeConfig } from "./describe-config";
import { useBoundedNavigation } from "./use-bounded-navigation";

export interface ExamConfiguratorProps {
  /**
   * Per-bank eligibility summaries (counts and full-exam durations per
   * filter combination) computed server-side. This is the only bank data
   * in the page payload: no question content, no answer keys — see
   * docs/ASSESSMENT_SECURITY_MODEL.md (Phase 0 addendum). Guests fetch
   * the actual bank from /api/exam/guest-bank when they start; signed-in
   * visitors get server-selected questions from /api/exam/session.
   */
  bankEligibility: Record<ExamBankId, BankEligibilitySummary>;
}

interface GuestBanks {
  curated: readonly AuthoringQuestion[];
  practice: readonly AuthoringQuestion[];
}

/**
 * Exam setup panel. Students choose year level, exam style, subject,
 * question count and timing; the eligible-question count updates live and
 * starting a session runs the deterministic seeded selection (guests) or
 * creates a server-selected session (signed-in).
 */
export function ExamConfigurator({ bankEligibility }: ExamConfiguratorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startExam = useExamStore((state) => state.startExam);
  const startServerExam = useExamStore((state) => state.startServerExam);
  const auth = useAuth();
  /* Signed-in visitors of any role go through the server session flow —
     the page payload carries no bank for them to practise from locally. */
  const serverMode = auth.status === "authenticated";

  const [yearLevel, setYearLevel] = useState<YearLevelFilter>(3);
  const [examStyle, setExamStyle] = useState<ExamStyleFilter>("naplan_style");
  const [subject, setSubject] = useState<SubjectFilter>("numeracy");
  const [questionCount, setQuestionCount] = useState<QuestionCountOption>(10);
  const [timing, setTiming] = useState<TimingMode>("timed");
  /* Off by default: the exam draws from the curated production bank. When on,
     it also includes the large auto-generated practice bank (1000+ items). */
  const [includePractice, setIncludePractice] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  /* True from the moment a session is created until the /exam navigation
     commits (which unmounts this component). Disables Start so a second
     click, or a repeated Enter key press, can never create a second
     session behind the first. */
  const [isStarting, setIsStarting] = useState(false);
  /* True while a start is in flight (guest bank download or server
     session creation) — same double-start protection, pre-session. */
  const [isCreating, setIsCreating] = useState(false);

  /*
   * Guest banks are fetched once, lazily, and only for guests. The
   * promise (not state) is the cache: the count display never needs the
   * bank — it reads the eligibility summaries — so nothing re-renders on
   * arrival; startExam awaits it at click time.
   */
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
        /* Allow a retry on the next Start click instead of caching failure. */
        guestBanksPromise.current = null;
        throw error;
      });
    return guestBanksPromise.current;
  }, []);

  useEffect(() => {
    /* Warm the guest bank download while the guest is still configuring. */
    if (auth.status === "anonymous" || auth.status === "unconfigured") {
      loadGuestBanks().catch(() => {});
    }
  }, [auth.status, loadGuestBanks]);

  /*
   * Warm the router cache for the exam route while the student is still
   * configuring. /exam is fully static, so a completed prefetch lets the
   * eventual push commit straight from the client cache instead of doing a
   * network round trip at click time — a hung or dropped response there
   * would otherwise strand a live session on the setup screen.
   */
  useEffect(() => {
    router.prefetch("/exam");
  }, [router]);

  const { exhausted: navigationFailed, retry: retryNavigation } = useBoundedNavigation(
    router,
    "/exam",
    isStarting,
    "push",
  );

  const bankId: ExamBankId = includePractice ? "practice" : "curated";
  const summary =
    bankEligibility[bankId][eligibilityKey({ yearLevel, examStyle, subject })];
  const eligibleCount = summary?.count ?? 0;

  const requestedCount = questionCount === "full" ? eligibleCount : questionCount;
  const insufficient = eligibleCount === 0 || eligibleCount < requestedCount;

  const config: ExamSelectionConfig = {
    yearLevel,
    examStyle,
    subject,
    questionCount,
    timing,
  };

  /*
   * For a fixed count this is a flat lookup; for "full" it previews the
   * duration the server precomputed for exactly the questions the current
   * filters match (every eligible question is selected in "full" mode).
   */
  const durationMinutes = Math.round(
    (questionCount === "full"
      ? (summary?.fullDurationSeconds ?? 0)
      : durationSecondsFor(questionCount)) / 60,
  );

  const handleStart = async () => {
    /* Guards a double-click or a repeated Enter key press: once a start is
       in flight or a session exists, a second call is a no-op rather than
       creating (and immediately discarding) a second session. */
    if (isStarting || isCreating) return;
    setStartError(null);

    if (serverMode) {
      /* Server-selected session: the server chooses the seed and stores
         the question ids before the student sees a single question. Any
         ?seed= in the URL is deliberately ignored for signed-in sessions. */
      setIsCreating(true);
      const started = await startServerExam(config, { bankId });
      setIsCreating(false);
      if (!started) {
        setStartError(
          "We couldn't start your exam just now. Check your connection and try again.",
        );
        return;
      }
      setIsStarting(true);
      return;
    }

    /* Guest flow: fully client-side, exactly as before — an explicit
       ?seed= makes sessions reproducible for tests and sharing. */
    const seed = searchParams.get("seed") ?? undefined;
    let pool: readonly AuthoringQuestion[];
    try {
      setIsCreating(true);
      const banks = await loadGuestBanks();
      pool = includePractice ? banks.practice : banks.curated;
    } catch {
      setStartError(
        "We couldn't load the practice questions. Check your connection and try again.",
      );
      return;
    } finally {
      setIsCreating(false);
    }
    const started = startExam(pool, config, { seed, bankId });
    if (!started) {
      setStartError(
        "Not enough questions match this combination. Try a broader selection.",
      );
      return;
    }
    /* The session now exists in the store; useBoundedNavigation takes over
       navigating to /exam, retrying a bounded number of times in case the
       app router drops the push while racing a concurrent route fetch. */
    setIsStarting(true);
  };

  return (
    <Card className="p-6 sm:p-8" variant="default">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="orange">
            <ListChecks aria-hidden="true" className="h-3.5 w-3.5" />
            Build your practice
          </Badge>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-ink sm:text-3xl">
            Set up an exam
          </h2>
        </div>
        <p
          data-testid="eligible-count"
          className="text-sm font-bold text-muted"
          aria-live="polite"
        >
          {eligibleCount} matching question{eligibleCount === 1 ? "" : "s"} available
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          label="Year level"
          data-testid="select-year-level"
          value={String(yearLevel)}
          onChange={(event) =>
            setYearLevel(
              event.currentTarget.value === "mixed"
                ? "mixed"
                : (Number(event.currentTarget.value) as 3 | 5),
            )
          }
        >
          {YEAR_LEVEL_OPTIONS.map((option) => (
            <option key={String(option)} value={String(option)}>
              {YEAR_LABELS[String(option)]}
            </option>
          ))}
        </Select>

        <Select
          label="Exam style"
          data-testid="select-exam-style"
          value={examStyle}
          onChange={(event) =>
            setExamStyle(event.currentTarget.value as ExamStyleFilter)
          }
        >
          {EXAM_STYLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {STYLE_LABELS[option]}
            </option>
          ))}
        </Select>

        <Select
          label="Subject"
          data-testid="select-subject"
          value={subject}
          onChange={(event) => setSubject(event.currentTarget.value as SubjectFilter)}
          hint={
            subject === "mixed"
              ? "Mixed subjects include writing tasks marked by a person."
              : undefined
          }
        >
          {SUBJECT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SUBJECT_LABELS[option]}
            </option>
          ))}
        </Select>

        <Select
          label="Number of questions"
          data-testid="select-question-count"
          value={String(questionCount)}
          onChange={(event) =>
            setQuestionCount(
              event.currentTarget.value === "full"
                ? "full"
                : (Number(event.currentTarget.value) as 10 | 20 | 30),
            )
          }
        >
          {QUESTION_COUNT_OPTIONS.map((option) => (
            <option key={String(option)} value={String(option)}>
              {option === "full" ? "Full available set" : `${option} questions`}
            </option>
          ))}
        </Select>

        <Select
          label="Timing"
          data-testid="select-timing"
          value={timing}
          onChange={(event) => setTiming(event.currentTarget.value as TimingMode)}
          hint={
            timing === "timed"
              ? `Timed exams of this size run for ${durationMinutes} minutes.`
              : "No countdown. Your time taken is still recorded."
          }
        >
          <option value="timed">Timed</option>
          <option value="untimed">Untimed</option>
        </Select>
      </div>

      <label
        data-testid="toggle-practice"
        className="mt-4 flex items-center gap-3 rounded-2xl bg-page p-4 text-sm font-bold text-ink"
      >
        <input
          type="checkbox"
          checked={includePractice}
          onChange={(event) => setIncludePractice(event.currentTarget.checked)}
          className="h-4 w-4 accent-orange"
        />
        Include the extended practice bank (1000+ extra auto-generated questions)
      </label>

      <div className="mt-7 flex flex-col gap-4 rounded-2xl bg-page p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-royal">
            Your selection
          </p>
          <p data-testid="config-summary" className="mt-1 text-sm font-bold text-ink">
            {describeConfig(config)}
          </p>
          {timing === "timed" && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
              {durationMinutes} minute limit with safe auto-submit
            </p>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Button
            variant="orange"
            size="lg"
            data-testid="start-exam"
            onClick={() => void handleStart()}
            disabled={insufficient || isStarting || isCreating || auth.status === "loading"}
          >
            {isStarting || isCreating ? "Opening exam…" : "Start exam"}
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {(insufficient || startError) && (
        <p
          data-testid="insufficient-message"
          role="status"
          className="mt-4 rounded-xl bg-warning/10 px-4 py-3 text-sm font-semibold text-warning"
        >
          {startError ??
            `Only ${eligibleCount} question${eligibleCount === 1 ? "" : "s"} match this combination, which is fewer than the ${requestedCount} requested. Choose a smaller set or broaden your selection.`}
        </p>
      )}

      {navigationFailed && (
        <p
          data-testid="navigation-failed"
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error"
        >
          Your exam is ready, but we could not open it automatically.
          <Button variant="secondary" size="sm" onClick={retryNavigation}>
            Try again
          </Button>
        </p>
      )}
    </Card>
  );
}
