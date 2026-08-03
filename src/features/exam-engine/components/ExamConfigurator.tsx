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
  /**
   * Pre-select year level / exam style / subject away from this
   * component's own defaults (Grade 3, NAPLAN-style, Numeracy). Used by a
   * templated catalogue-program route to open the configurator already
   * pointed at that program's combination. Omit for the original
   * unscoped behaviour.
   */
  initialScope?: Pick<ExamSelectionConfig, "yearLevel" | "examStyle" | "subject">;
  /**
   * When true (only meaningful together with `initialScope`), year level /
   * exam style / subject render as fixed labels instead of editable
   * selects — the whole point of a specific catalogue program is that
   * those three are its identity, not a preference to change mid-visit.
   * Question count, timing and the extended-bank toggle stay editable
   * regardless.
   */
  lockScope?: boolean;
  /**
   * Starting value for the "include extended practice bank" checkbox.
   * Always user-editable regardless of `lockScope` — this only picks
   * where a program starts from, e.g. because its curated-bank count is
   * too thin on its own.
   */
  initialBankId?: ExamBankId;
}

interface GuestBanks {
  curated: readonly AuthoringQuestion[];
  published: readonly AuthoringQuestion[];
  practice: readonly AuthoringQuestion[];
}

/**
 * Exam setup panel. Students choose year level, exam style, subject,
 * question count and timing; the eligible-question count updates live and
 * starting a session runs the deterministic seeded selection (guests) or
 * creates a server-selected session (signed-in).
 */
export function ExamConfigurator({
  bankEligibility,
  initialScope,
  lockScope = false,
  initialBankId,
}: ExamConfiguratorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startExam = useExamStore((state) => state.startExam);
  const startServerExam = useExamStore((state) => state.startServerExam);
  const auth = useAuth();
  /* Signed-in visitors of any role go through the server session flow —
     the page payload carries no bank for them to practise from locally. */
  const serverMode = auth.status === "authenticated";

  const [yearLevel, setYearLevel] = useState<YearLevelFilter>(initialScope?.yearLevel ?? 3);
  const [examStyle, setExamStyle] = useState<ExamStyleFilter>(
    initialScope?.examStyle ?? "naplan_style",
  );
  const [subject, setSubject] = useState<SubjectFilter>(initialScope?.subject ?? "numeracy");
  const [questionCount, setQuestionCount] = useState<QuestionCountOption>(10);
  const [timing, setTiming] = useState<TimingMode>("timed");
  /* Off by default: the exam draws only from gated content (see baseBankId
     below). When on, it also includes the large auto-generated practice bank
     (1000+ items), which has never been through the publication gates — so
     ungated content is only ever reachable by deliberate opt-in. */
  const [includePractice, setIncludePractice] = useState(initialBankId === "practice");
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

  /*
   * The bank this configurator falls back to with the practice toggle OFF.
   * A program that pins "published" keeps its gate-passed pool (curated +
   * factory-published) as its floor rather than dropping to curated-only;
   * everything else keeps the historical curated floor, including the
   * unscoped "Mixed practice" entry, which passes no initialBankId at all.
   * Since curated ⊂ published ⊂ practice, turning the toggle on is always a
   * widening and turning it off never serves ungated content.
   */
  const baseBankId: ExamBankId = initialBankId === "published" ? "published" : "curated";
  const bankId: ExamBankId = includePractice ? "practice" : baseBankId;
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
      pool = banks[bankId];
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
    <Card className="overflow-hidden p-0" variant="default">
      {/*
        Masthead — framed like the cover of a real exam booklet: an
        eyebrow, a live serif headline that reads back the current
        selection (reuses describeConfig, no new formatting logic), and an
        availability count styled as a corner stamp rather than a plain
        status line.
      */}
      <div className="relative border-b border-dashed border-royal/20 bg-[linear-gradient(145deg,#FFFFFF_0%,#F7F4FF_100%)] px-6 py-7 sm:px-8 sm:py-8">
        <p
          data-testid="eligible-count"
          aria-live="polite"
          className="absolute right-5 top-5 -rotate-3 rounded-full border border-royal-orange/20 bg-white px-3 py-1.5 text-xs font-extrabold leading-none text-warning shadow-[0_6px_16px_rgba(49,32,86,0.1)] sm:right-7 sm:top-7"
        >
          {eligibleCount} matching question{eligibleCount === 1 ? "" : "s"} available
        </p>

        <Badge variant="orange">
          <ListChecks aria-hidden="true" className="h-3.5 w-3.5" />
          Practice paper
        </Badge>
        <h2
          data-testid="config-summary"
          className="mt-3 max-w-[calc(100%-9rem)] font-[family-name:var(--font-dm-serif)] text-2xl font-normal leading-tight tracking-[-0.02em] text-ink sm:text-3xl"
        >
          {describeConfig(config)}
        </h2>
      </div>

      <div className="px-6 py-7 sm:px-8 sm:py-8">
        <fieldset className="m-0 grid gap-4 border-0 p-0 sm:grid-cols-3">
          <legend className="col-span-full mb-3 w-full p-0 text-xs font-extrabold uppercase tracking-[0.14em] text-royal">
            Paper
          </legend>
          <Select
            label="Year level"
            data-testid="select-year-level"
            value={String(yearLevel)}
            disabled={lockScope}
            hint={lockScope ? "Fixed for this program" : undefined}
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
            disabled={lockScope}
            hint={lockScope ? "Fixed for this program" : undefined}
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
            disabled={lockScope}
            onChange={(event) => setSubject(event.currentTarget.value as SubjectFilter)}
            hint={
              lockScope
                ? "Fixed for this program"
                : subject === "mixed"
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
        </fieldset>

        <fieldset className="m-0 mt-7 grid gap-4 border-0 p-0 sm:grid-cols-2">
          <legend className="col-span-full mb-3 w-full p-0 text-xs font-extrabold uppercase tracking-[0.14em] text-royal">
            Sitting
          </legend>
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
        </fieldset>

        <label
          data-testid="toggle-practice"
          className="mt-5 flex items-center gap-3 rounded-2xl bg-page p-4 text-sm font-bold text-ink"
        >
          <input
            type="checkbox"
            checked={includePractice}
            onChange={(event) => setIncludePractice(event.currentTarget.checked)}
            className="h-4 w-4 accent-orange"
          />
          Include the extended practice bank (1000+ extra auto-generated questions)
        </label>
      </div>

      {/* Tear line — the cover sheet ends, the ticket stub begins. */}
      <div className="mx-6 border-t-2 border-dashed border-royal/20 sm:mx-8" aria-hidden="true" />

      <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          {timing === "timed" ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
              <Clock3 aria-hidden="true" className="h-4 w-4 text-royal" />
              {durationMinutes} minute limit with safe auto-submit
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
              <Clock3 aria-hidden="true" className="h-4 w-4 text-royal" />
              Untimed — your time taken is still recorded
            </p>
          )}
        </div>
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

      {(insufficient || startError) && (
        <p
          data-testid="insufficient-message"
          role="status"
          className="mx-6 mb-6 rounded-xl bg-warning/10 px-4 py-3 text-sm font-semibold text-warning sm:mx-8"
        >
          {startError ??
            `Only ${eligibleCount} question${eligibleCount === 1 ? "" : "s"} match this combination, which is fewer than the ${requestedCount} requested. Choose a smaller set or broaden your selection.`}
        </p>
      )}

      {navigationFailed && (
        <p
          data-testid="navigation-failed"
          role="alert"
          className="mx-6 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error sm:mx-8"
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
