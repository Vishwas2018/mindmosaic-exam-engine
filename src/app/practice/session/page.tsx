"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { ErrorState, buttonClasses } from "@/components/ui";
import { SUBJECT_LABELS } from "@/features/exam-engine/components/describe-config";
import { PracticeSession } from "@/features/exam-engine/practice-mode";
import {
  filterEligibleQuestions,
  seededShuffle,
  type ExamStyleFilter,
  type SubjectFilter,
  type YearLevelFilter,
} from "@/features/exam-engine/selection";
import type { Question } from "@/schemas/question.schema";

/**
 * Guest-bank payload — curated plus the extended auto-generated set,
 * answer keys and explanations included (see /api/exam/guest-bank). Reused
 * here rather than a new endpoint: practice-engine sessions are ungraded
 * drills, so the same client-side-selection trade-off the guest exam flow
 * already accepts (docs/ASSESSMENT_SECURITY_MODEL.md) applies regardless
 * of whether the student is signed in.
 */
interface GuestBanks {
  curated: readonly Question[];
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
  return raw === "numeracy" || raw === "reading" || raw === "language" ? raw : "mixed";
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
  const subject = parseSubject(searchParams.get("subject"));
  const yearLevel = parseYearLevel(searchParams.get("year"));
  const examStyle = parseExamStyle(searchParams.get("style"));
  const skill = searchParams.get("skill");
  const requestedCount = Number(searchParams.get("count")) || DEFAULT_QUESTION_COUNT;

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
    const pool = [...banks.curated, ...banks.practice];
    const eligible = filterEligibleQuestions(pool, { subject, yearLevel, examStyle });
    const scoped = skill
      ? eligible.filter((q) => (q.metadata.skill ?? q.metadata.topic) === skill)
      : eligible;
    const seed = buildSeed({ subject, yearLevel, examStyle, skill });
    return seededShuffle(scoped, seed).slice(0, requestedCount);
  }, [banks, subject, yearLevel, examStyle, skill, requestedCount]);

  const title = skill ?? SUBJECT_LABELS[subject];

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
