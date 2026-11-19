"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { ErrorState, buttonClasses } from "@/components/ui";
import {
  PracticeSession,
  parsePracticeSessionParams,
} from "@/features/exam-engine/practice-mode";
import { getDrillLaunchRequest } from "@/features/exam-engine/recommendation";
import type { CandidateQuestion } from "@/features/exam-engine/types";
import { skillLabel } from "@/features/parent-dashboard/skill-label";

interface ServerPracticeSessionPayload {
  ok: boolean;
  questions: readonly CandidateQuestion[];
  count: number;
  /** Signed token binding the delivered question ids; required by /api/practice/check (A-01). */
  practiceToken: string;
  title: string;
  estimatedMinutes: number;
}

function PracticeSkillSessionContent() {
  const searchParams = useSearchParams();
  const parsedParams = useMemo(
    () => parsePracticeSessionParams(searchParams),
    [searchParams],
  );

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
  const [candidateSession, setCandidateSession] = useState<ServerPracticeSessionPayload | null>(null);
  const [drillShortfall, setDrillShortfall] = useState<number | null>(null);

  useEffect(() => {
    if (!isValidSession) return;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const params = new URLSearchParams(searchParams.toString());
    if (!searchParams.has("strand")) params.set("source", "learning");
    const url = drillLaunchRequest ? "/api/practice/session/questions" : "/api/practice/session/questions?" + params;
    void fetch(url, drillLaunchRequest ? {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(drillLaunchRequest),
    } : options).then(async (response) => {
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setDrillShortfall(data.error === "insufficient_questions" ? data.eligibleCount : null);
        setStatus("error");
        return;
      }
      setCandidateSession(data as ServerPracticeSessionPayload);
      setStatus("ready");
    }).catch(() => {
      if (!controller.signal.aborted) setStatus("error");
    });
    return () => controller.abort();
  }, [isValidSession, drillLaunchRequest, searchParams]);

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

  // 2. Handle missing or expired drill launch record
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
  if (status === "error" || !candidateSession) {
    const isDrill = parsedParams.mode === "drill";
    const isStudio =
      parsedParams.mode === "standard" && searchParams.has("strand");
    return (
      <main id="main-content" className="site-width py-16" role="alert">
        <ErrorState
          title={drillShortfall !== null ? "There aren't enough published questions for this skill yet" : "We couldn't load practice questions"}
          description={drillShortfall === null
            ? "Check your connection and try again."
            : "Only " + drillShortfall + " eligible published questions found for " + skillLabel(drillLaunchRequest?.skillOrTopic ?? "") + "; 5 are needed for a full practice drill."}
          action={drillShortfall !== null ? (
            <div className="flex flex-wrap gap-2.5">
              <Link href="/results" className={buttonClasses({ variant: "secondary" })}>Back to results</Link>
              <Link href="/student/learn" className={buttonClasses({ variant: "secondary" })}>Choose another skill</Link>
            </div>
          ) : (
            <Link
              href={
                isDrill
                  ? "/results"
                  : isStudio
                  ? "/student/practice"
                  : "/student/learn"
              }
              className={buttonClasses({ variant: "secondary" })}
            >
              {isDrill
                ? "Back to results"
                : isStudio
                ? "Back to Practice Studio"
                : "Back to Learning Hub"}
            </Link>
          )}
        />
      </main>
    );
  }

  const isStudio = parsedParams.mode === "standard" && searchParams.has("strand");
  const isDrill = parsedParams.mode === "drill";
  const exitHref = isDrill ? "/results" : isStudio ? "/student/practice" : "/student/learn";
  const exitLabel = isDrill ? "Back to results" : isStudio ? "Back to Practice Studio" : "Back to Learn";
  if (candidateSession.questions.length === 0) {
    return (
      <main id="main-content" className="site-width py-16" role="alert">
        <ErrorState
          title={isStudio ? "No practice questions available for this strand yet" : "No practice is available for this skill yet"}
          description="We couldn't find published questions for this selection. Try another skill."
          action={<Link href={exitHref} className={buttonClasses({ variant: "primary" })}>{!isStudio && !isDrill ? "Back to Learning Hub" : exitLabel}</Link>}
        />
      </main>
    );
  }

  return (
    <PracticeSession
      questions={candidateSession.questions}
      title={candidateSession.title}
      practiceToken={candidateSession.practiceToken}
      exitHref={exitHref}
      exitLabel={exitLabel}
      showIntro={isStudio}
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
