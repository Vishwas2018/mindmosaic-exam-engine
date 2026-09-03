"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { ErrorState, buttonClasses } from "@/components/ui";
import { SUBJECT_LABELS } from "@/features/exam-engine/components/describe-config";
import {
  PracticeSession,
  parsePracticeSessionParams,
} from "@/features/exam-engine/practice-mode";
import {
  buildDrill,
  getDrillLaunchRequest,
  type DrillTarget,
} from "@/features/exam-engine/recommendation";
import {
  filterEligibleQuestions,
  seededShuffle,
  type ExamStyleFilter,
  type SubjectFilter,
  type YearLevelFilter,
} from "@/features/exam-engine/selection";
import { getMappedQuestionIdsForNode } from "@/features/curriculum/lessons/alignments";
import type { Question } from "@/schemas/question.schema";

/**
 * Guest-bank payload — answer keys and explanations included (see
 * /api/exam/guest-bank). Reused here rather than a new endpoint:
 * practice-engine sessions are ungraded drills, so the same
 * client-side-selection trade-off the guest exam flow already accepts
 * (docs/ASSESSMENT_SECURITY_MODEL.md) applies regardless of whether the
 * student is signed in.
 */
interface GuestBanks {
  curated: readonly Question[];
  published: readonly Question[];
  practice: readonly Question[];
}

/** Deterministic per-session seed: stable across re-renders of the same filters. */
function buildSeed(params: {
  subject: SubjectFilter;
  yearLevel: YearLevelFilter;
  examStyle: ExamStyleFilter;
  skill: string | null;
}): string {
  return `practice-${params.subject}-${params.yearLevel}-${params.examStyle}-${params.skill ?? "any"}`;
}

function PracticeSkillSessionContent() {
  const searchParams = useSearchParams();
  const parsedParams = useMemo(
    () => parsePracticeSessionParams(searchParams),
    [searchParams],
  );

  // For drill mode, validate the launch record BEFORE requesting the answer-bearing guest bank
  const drillLaunchRequest = useMemo(() => {
    if (parsedParams.ok && parsedParams.mode === "drill") {
      return getDrillLaunchRequest(parsedParams.params.launchId);
    }
    return null;
  }, [parsedParams]);

  const isValidSession =
    parsedParams.ok &&
    (parsedParams.mode === "standard" || drillLaunchRequest !== null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [banks, setBanks] = useState<GuestBanks | null>(null);

  useEffect(() => {
    // Do not request the answer-bearing bank if the session is invalid, expired, or missing
    if (!isValidSession) {
      return;
    }

    let cancelled = false;
    fetch("/api/exam/guest-bank")
      .then((response) =>
        response.ok ? (response.json() as Promise<GuestBanks>) : Promise.reject(),
      )
      .then((data) => {
        if (!cancelled) {
          setBanks(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [isValidSession]);

  // 1. Handle invalid query parameters
  if (!parsedParams.ok) {
    return (
      <main id="main-content" className="site-width py-16" role="alert">
        <ErrorState
          title="Invalid drill parameters"
          description={parsedParams.error}
          action={
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/results"
                className={buttonClasses({ variant: "primary" })}
              >
                Back to results
              </Link>
              <Link
                href="/student/learn"
                className={buttonClasses({ variant: "secondary" })}
              >
                Learning Hub
              </Link>
            </div>
          }
        />
      </main>
    );
  }

  // 2. Handle missing or expired drill launch record (without requesting bank)
  if (parsedParams.mode === "drill" && !drillLaunchRequest) {
    return (
      <main id="main-content" className="site-width py-16" role="alert">
        <ErrorState
          title="Practice drill session not found"
          description="This practice drill launch record has expired or was opened in a different browser session."
          action={
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/results"
                className={buttonClasses({ variant: "primary" })}
              >
                Back to results
              </Link>
              <Link
                href="/student/learn"
                className={buttonClasses({ variant: "secondary" })}
              >
                Choose another skill
              </Link>
            </div>
          }
        />
      </main>
    );
  }

  // 3. Loading state
  if (status === "loading") {
    return (
      <main id="main-content" className="site-width py-16">
        <ErrorState
          title="Loading your practice session…"
          description="One moment while we put together your questions."
        />
      </main>
    );
  }

  // 4. Network / fetch error
  if (status === "error" || !banks) {
    const isDrill = parsedParams.mode === "drill";
    return (
      <main id="main-content" className="site-width py-16" role="alert">
        <ErrorState
          title="We couldn't load practice questions"
          description="Check your connection and try again."
          action={
            <Link
              href={isDrill ? "/results" : "/student/learn"}
              className={buttonClasses({ variant: "secondary" })}
            >
              {isDrill ? "Back to results" : "Back to Learning Hub"}
            </Link>
          }
        />
      </main>
    );
  }

  // =========================================================================
  // DRILL MODE: strict validation, published-bank only, buildDrill() workflow
  // =========================================================================
  if (parsedParams.mode === "drill" && drillLaunchRequest) {
    const launchRequest = drillLaunchRequest;

    // Filter previous question IDs to those present in the published bank
    const publishedIds = new Set(banks.published.map((q) => q.id));
    const verifiedPreviousIds = launchRequest.previousQuestionIds.filter((id) =>
      publishedIds.has(id),
    );

    const drillTarget: DrillTarget = {
      recommendation: {
        subject: launchRequest.subject,
        skillOrTopic: launchRequest.skillOrTopic,
        source: launchRequest.source,
        lostMarks: 0,
        accuracy: 0,
        attemptedCount: 0,
        totalCount: 0,
        reason: "",
      },
      yearLevel: launchRequest.yearLevel,
      examStyle: launchRequest.examStyle,
      previousQuestionIds: verifiedPreviousIds,
      seed: launchRequest.seed,
    };

    // Execute the deterministic 5-question drill builder over banks.published ONLY
    const drillResult = buildDrill(banks.published, drillTarget);

    if (!drillResult.ok) {
      if (drillResult.reason === "insufficient_questions") {
        return (
          <main id="main-content" className="site-width py-16" role="alert">
            <ErrorState
              title="There aren't enough published questions for this skill yet"
              description={`Only ${drillResult.eligibleCount} eligible published question${
                drillResult.eligibleCount === 1 ? "" : "s"
              } found for ${launchRequest.skillOrTopic}; 5 are needed for a full practice drill.`}
              action={
                <div className="flex flex-wrap gap-2.5">
                  <Link
                    href="/results"
                    className={buttonClasses({ variant: "primary" })}
                  >
                    Back to results
                  </Link>
                  <Link
                    href="/student/learn"
                    className={buttonClasses({ variant: "secondary" })}
                  >
                    Choose another skill
                  </Link>
                </div>
              }
            />
          </main>
        );
      }

      return (
        <main id="main-content" className="site-width py-16" role="alert">
          <ErrorState
            title="Unable to build practice drill"
            description={drillResult.message}
            action={
              <Link
                href="/results"
                className={buttonClasses({ variant: "primary" })}
              >
                Back to results
              </Link>
            }
          />
        </main>
      );
    }

    // Resolve returned IDs against banks.published with strict validation
    const resolvedQuestions: Question[] = [];
    const seenIds = new Set<string>();
    let resolutionError: string | null = null;

    for (const id of drillResult.questionIds) {
      const question = banks.published.find((q) => q.id === id);
      if (!question) {
        resolutionError = `Question ${id} was not found in the published bank.`;
        break;
      }
      if (seenIds.has(id)) {
        resolutionError = `Question ${id} is duplicated in drill selection.`;
        break;
      }
      seenIds.add(id);

      const matchesSkillOrTopic =
        launchRequest.source === "topic"
          ? question.metadata.topic === launchRequest.skillOrTopic ||
            question.metadata.skill === launchRequest.skillOrTopic
          : (question.metadata.skill ?? question.metadata.topic) ===
            launchRequest.skillOrTopic;

      if (
        question.metadata.subject !== launchRequest.subject ||
        !matchesSkillOrTopic
      ) {
        resolutionError = `Question ${id} does not match the requested subject and skill.`;
        break;
      }
      resolvedQuestions.push(question);
    }

    if (resolutionError || resolvedQuestions.length !== 5) {
      return (
        <main id="main-content" className="site-width py-16" role="alert">
          <ErrorState
            title="Invalid drill selection"
            description={
              resolutionError ??
              "A practice drill must contain exactly 5 questions."
            }
            action={
              <Link
                href="/results"
                className={buttonClasses({ variant: "primary" })}
              >
                Back to results
              </Link>
            }
          />
        </main>
      );
    }

    return (
      <PracticeSession
        questions={resolvedQuestions}
        title={`Practise: ${launchRequest.skillOrTopic}`}
        exitHref="/results"
        exitLabel="Back to results"
      />
    );
  }

  // =========================================================================
  // STANDARD PRACTICE MODE: backwards-compatible standard practice
  // =========================================================================
  if (parsedParams.mode !== "standard") {
    return null;
  }

  const stdParams = parsedParams.params;
  const pool = stdParams.extended
    ? [...banks.published, ...banks.practice]
    : banks.published;

  // Skill-scoped requests (curriculumCode set) must NEVER fall through to the
  // unscoped mixed pool below — an empty mapping means fail closed, not "give
  // the student whatever's in the entire bank" (see the fail-closed
  // requirement this route was fixed for: a zero-coverage node must not leak
  // cross-subject/cross-year content).
  if (stdParams.curriculumCode) {
    const mappedIds = getMappedQuestionIdsForNode(stdParams.curriculumCode);
    const matched = pool.filter((q) => mappedIds.includes(q.id));

    if (matched.length === 0) {
      return (
        <main id="main-content" className="site-width py-16" role="alert">
          <ErrorState
            title="No practice is available for this skill yet"
            description={`We don't have any published practice questions for ${stdParams.curriculumCode} yet. Check back soon, or choose another skill.`}
            action={
              <Link
                href="/student/learn"
                className={buttonClasses({ variant: "primary" })}
              >
                Back to Learning Hub
              </Link>
            }
          />
        </main>
      );
    }

    const seed =
      stdParams.seed ??
      buildSeed({
        subject: stdParams.subject,
        yearLevel: stdParams.year,
        examStyle: stdParams.style,
        skill: stdParams.curriculumCode,
      });
    const questions = seededShuffle(matched, seed).slice(0, stdParams.count);

    return (
      <PracticeSession
        questions={questions}
        title={`Practice: ${stdParams.curriculumCode}`}
        exitHref="/student/learn"
        exitLabel="Back to Learn"
      />
    );
  }

  // General practice (no curriculumCode): the mixed/eligible pool is only
  // ever reachable when the caller did NOT ask for a specific skill.
  const eligible = filterEligibleQuestions(pool, {
    subject: stdParams.subject,
    yearLevel: stdParams.year,
    examStyle: stdParams.style,
  });

  const scoped = stdParams.skill
    ? eligible.filter(
        (q) => (q.metadata.skill ?? q.metadata.topic) === stdParams.skill,
      )
    : eligible;

  const seed =
    stdParams.seed ??
    buildSeed({
      subject: stdParams.subject,
      yearLevel: stdParams.year,
      examStyle: stdParams.style,
      skill: stdParams.skill,
    });

  const questions = seededShuffle(scoped, seed).slice(0, stdParams.count);

  return (
    <PracticeSession
      questions={questions}
      title={stdParams.skill ?? SUBJECT_LABELS[stdParams.subject]}
      exitHref="/student/learn"
      exitLabel="Back to Learn"
    />
  );
}

/*
 * useSearchParams() bails the page out of static rendering and requires a
 * Suspense boundary around anything that calls it — without this, `next
 * build` fails to prerender this route at all (missing-suspense-with-csr-
 * bailout). The fallback mirrors the inner component's own "loading" state.
 */
export default function PracticeSkillSessionPage() {
  return (
    <Suspense
      fallback={
        <main id="main-content" className="site-width py-16">
          <ErrorState
            title="Loading your practice session…"
            description="One moment while we put together your questions."
          />
        </main>
      }
    >
      <PracticeSkillSessionContent />
    </Suspense>
  );
}
