"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { ErrorState, buttonClasses } from "@/components/ui";
import { SUBJECT_LABELS } from "@/features/exam-engine/components/describe-config";
import { PracticeSession } from "@/features/exam-engine/practice-mode";
import {
  filterEligibleQuestions,
  ISOLABLE_SUBJECT_FILTERS,
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

const DEFAULT_QUESTION_COUNT = 8;

function parseYearLevel(raw: string | null): YearLevelFilter {
  if (raw === "3" || raw === "5") return Number(raw) as 3 | 5;
  return "mixed";
}

function parseExamStyle(raw: string | null): ExamStyleFilter {
  return raw === "naplan_style" || raw === "icas_style" ? raw : "mixed";
}

function parseSubject(raw: string | null): SubjectFilter {
  /* Checked against the selection vocabulary so a new subject becomes
     linkable the moment it exists; anything unrecognised falls back to
     "mixed" rather than starting a session with an empty pool. */
  return ISOLABLE_SUBJECT_FILTERS.find((subject) => subject === raw) ?? "mixed";
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
  const curriculumCode = searchParams.get("curriculumCode") ?? searchParams.get("node");
  const subject = parseSubject(searchParams.get("subject"));
  const yearLevel = parseYearLevel(searchParams.get("year"));
  const examStyle = parseExamStyle(searchParams.get("style"));
  const skill = searchParams.get("skill");
  const requestedCount = Number(searchParams.get("count")) || DEFAULT_QUESTION_COUNT;
  /* Explicit opt-in to the unreviewed auto-generated seeds. Absent or any
     other value means gated content only — see the pool note below. */
  const includeExtended = searchParams.get("extended") === "1";

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [banks, setBanks] = useState<GuestBanks | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/exam/guest-bank")
      .then((response) => (response.ok ? (response.json() as Promise<GuestBanks>) : Promise.reject()))
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
  }, []);

  const questions = useMemo(() => {
    if (!banks) return [];
    /*
     * Gated content only, unless `?extended=1` is explicitly present.
     *
     * This used to be an unconditional `[...banks.curated, ...banks.practice]`
     * — no toggle, no query flag, no way to avoid it — which made every
     * skill drill and the "Diagnostic check" launcher on /student/learn
     * serve the ~1,100 unreviewed auto-generated seeds by default. That is
     * the same publication-policy inversion as the configurator's
     * pre-ticked checkbox, in the one place there was no checkbox at all.
     *
     * `published` (curated + factory-published) is the floor rather than
     * `curated`: every item in it is gate-passed, and it is what the exam
     * configurator falls back to, so the two surfaces agree about what
     * "gated" means.
     */
    const pool = includeExtended
      ? [...banks.published, ...banks.practice]
      : banks.published;

    const mappedIds = curriculumCode ? getMappedQuestionIdsForNode(curriculumCode) : null;
    if (mappedIds && mappedIds.length > 0) {
      const matched = pool.filter((q) => mappedIds.includes(q.id));
      const seed = buildSeed({ subject, yearLevel, examStyle, skill: curriculumCode });
      return seededShuffle(matched, seed).slice(0, requestedCount);
    }

    const eligible = filterEligibleQuestions(pool, { subject, yearLevel, examStyle });
    const scoped = skill
      ? eligible.filter((q) => (q.metadata.skill ?? q.metadata.topic) === skill)
      : eligible;
    const seed = buildSeed({ subject, yearLevel, examStyle, skill });
    return seededShuffle(scoped, seed).slice(0, requestedCount);
  }, [banks, curriculumCode, subject, yearLevel, examStyle, skill, requestedCount, includeExtended]);

  const title = curriculumCode
    ? `Practice: ${curriculumCode}`
    : (skill ?? SUBJECT_LABELS[subject]);

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

  if (status === "error") {
    return (
      <main id="main-content" className="site-width py-16">
        <ErrorState
          title="We couldn't load practice questions"
          description="Check your connection and try again."
          action={
            <Link href="/student/learn" className={buttonClasses({ variant: "secondary" })}>
              Back to Learning Hub
            </Link>
          }
        />
      </main>
    );
  }

  return <PracticeSession questions={questions} title={title} exitHref="/student/learn" />;
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
