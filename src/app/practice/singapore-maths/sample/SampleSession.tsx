"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";

import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {VisualRenderer} from "@/features/exam-engine/visual-renderers";
import {parsePilotAnswer} from "@/features/visuals/bar-model/pilot-session";
import type {VisualAsset} from "@/features/exam-engine/types";
import type {SamplePracticeFixture} from "@/content/visual-fixtures/bar-model/sample-practice.server";

interface SampleSessionProps {
  year: 3 | 5;
  fixtures: readonly SamplePracticeFixture[];
}

/** What the server recorded for a question. The explanation is present only when the recorded answer is correct. */
interface AnswerRecord {
  answer: number;
  correct: boolean;
  explanation?: string;
}

interface RestoredSubmission {
  questionId: string;
  answer: number;
  correct: boolean;
  workedExplanation?: string;
}

const SAMPLE_API = "/api/practice/singapore-maths/sample";

export function SampleSession({year, fixtures}: SampleSessionProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [entry, setEntry] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [restoring, setRestoring] = useState(true);
  const [summary, setSummary] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  /*
   * The server is the only source of truth for what has been answered. On mount (and so after a
   * refresh, a second tab, or a different server instance) the recorded answers for this student's
   * current attempt are restored, so the page can never disagree with the recorded verdicts.
   * A guest, or any failure, simply starts empty: submitting then fails visibly instead.
   */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${SAMPLE_API}/session?year=${year}`);
        if (!response.ok) return;
        const data = (await response.json()) as {submissions?: RestoredSubmission[]};
        if (cancelled || !Array.isArray(data.submissions)) return;
        const restored: Record<string, AnswerRecord> = {};
        for (const s of data.submissions) {
          restored[s.questionId] = {answer: s.answer, correct: s.correct, explanation: s.workedExplanation};
        }
        setAnswers(restored);
      } catch {
        /* start empty */
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year]);

  const fixture = fixtures[index];
  const record = answers[fixture.name];
  const alreadyAnswered = record !== undefined;
  const correct = alreadyAnswered ? record.correct : false;
  const answered = Object.keys(answers).length;
  const scoreCorrect = fixtures.reduce(
    (n, f) => n + (answers[f.name]?.correct === true ? 1 : 0),
    0,
  );

  const focusHeading = () => requestAnimationFrame(() => headingRef.current?.focus());

  const navigate = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(fixtures.length - 1, next)));
      setEntry("");
      setError("");
      setNotice("");
      setRevealed(false);
      focusHeading();
    },
    [fixtures.length],
  );

  const handleSubmit = async () => {
    const answer = parsePilotAnswer(entry);
    if (answer === null) {
      setError("Enter a whole number of 0 or more.");
      return;
    }
    if (alreadyAnswered) return;

    setError("");
    setNotice("");
    try {
      const response = await fetch(`${SAMPLE_API}/submit`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({questionId: fixture.name, answer}),
      });
      const data = await response.json();
      if (!response.ok) {
        // Unauthorised, not-found, or any other server rejection must not be
        // recorded as an answered question. Use a generic message so the
        // client never leaks server-side error details to the child.
        setError("Could not submit that answer. Try again.");
        return;
      }
      /* The server's RECORDED answer and verdict are authoritative — never the text just typed. */
      const recordedAnswer = typeof data.answer === "number" ? data.answer : answer;
      setAnswers({
        ...answers,
        [fixture.name]: {
          answer: recordedAnswer,
          correct: data.correct === true,
          explanation: typeof data.workedExplanation === "string" ? data.workedExplanation : undefined,
        },
      });
      if (data.alreadyAnswered === true && recordedAnswer !== answer) {
        setNotice(
          `You had already answered this question with ${recordedAnswer}. Your first answer is the one that counts. Start a new attempt from the summary to try again.`,
        );
      }
      setRevealed(false);
    } catch {
      setError("Could not reach the server. Try again.");
    }
  };

  /* The explanation arrived with the correct answer (or with the restored state): showing it needs no request. */
  const handleReveal = () => {
    if (revealed || !correct) return;
    if (!record?.explanation) {
      setError("Explanation not available. Please reload the page.");
      return;
    }
    setRevealed(true);
  };

  const handleFinish = () => {
    setSummary(true);
    setIndex(0);
    focusHeading();
  };

  const reviewQuestion = (i: number) => {
    setIndex(i);
    setSummary(false);
    setRevealed(false);
    setNotice("");
    setEntry("");
    setError("");
    focusHeading();
  };

  /* Retrying is an explicit new attempt: earlier attempts are kept on the server, not deleted. */
  const startNewAttempt = async () => {
    try {
      const response = await fetch(`${SAMPLE_API}/session?year=${year}`, {method: "DELETE"});
      if (!response.ok) {
        setError("Could not start a new attempt. Try again.");
        return;
      }
    } catch {
      setError("Could not reach the server. Try again.");
      return;
    }
    setIndex(0);
    setSummary(false);
    setRevealed(false);
    setNotice("");
    setEntry("");
    setError("");
    setAnswers({});
    focusHeading();
  };

  if (summary) {
    const total = fixtures.length;
    const unanswered = total - answered;
    const incorrect = answered - scoreCorrect;
    return (
      <section aria-label="Session summary" className="mt-8 min-w-0 rounded-xl border border-royal/15 bg-white p-4 sm:p-6">
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-ink outline-none">
          Session summary
        </h2>
        <p className="mt-3" role="status">
          {scoreCorrect} correct · {incorrect} incorrect · {unanswered} unanswered out of {total} questions.
        </p>
        <ol className="mt-4 divide-y divide-royal/15">
          {fixtures.map((item, i) => (
            <li key={item.name} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                Question {i + 1} ·{" "}
                {answers[item.name] === undefined
                  ? "Unanswered"
                  : answers[item.name].correct
                  ? "Correct"
                  : "Incorrect"}
              </span>
              <Button variant="ghost" onClick={() => reviewQuestion(i)}>
                Review question {i + 1}
              </Button>
            </li>
          ))}
        </ol>
        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={startNewAttempt}>
            Start a new attempt
          </Button>
          <Button variant="ghost" onClick={() => router.push("/practice/singapore-maths/sample")}>
            Choose another year
          </Button>
        </div>
      </section>
    );
  }

  if (!fixture) return null;

  return (
    <section aria-label="Practice session" aria-busy={restoring} className="mt-8 min-w-0 rounded-xl border border-royal/15 bg-white p-4 sm:p-6">
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-ink outline-none">
        Year {year} · Question {index + 1} of {fixtures.length}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {fixture.skill} · {fixture.difficulty}
      </p>
      <p className="mt-4 max-w-prose text-lg text-ink">{fixture.prompt}</p>
      <div className="mt-4 min-w-0" data-panel="session-diagram">
        <VisualRenderer visual={fixture.visual as VisualAsset} />
      </div>

      {!alreadyAnswered ? (
        <form
          className="mt-4 max-w-sm"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <Input
            label={`Your answer (${fixture.unit.trim()})`}
            inputMode="numeric"
            autoComplete="off"
            value={entry}
            onChange={(event) => {
              setEntry(event.target.value);
              setError("");
            }}
            error={error}
          />
          <Button type="submit" className="mt-3" disabled={restoring}>
            {restoring ? "Loading your answers…" : "Submit answer"}
          </Button>
        </form>
      ) : (
        <p role="status" className="mt-4 font-semibold text-ink">
          Your answer: {record!.answer} {fixture.unit.trim()}.{" "}
          {correct ? "Correct." : "Not quite."}
        </p>
      )}

      {notice ? (
        <p className="mt-3 max-w-prose text-sm text-muted" role="status">
          {notice}
        </p>
      ) : null}

      {alreadyAnswered && correct && (
        <div className="mt-4">
          <Button
            variant="secondary"
            aria-expanded={revealed}
            aria-controls="sample-explanation"
            onClick={handleReveal}
            disabled={revealed}
          >
            Show explanation
          </Button>
          {revealed && record?.explanation && (
            <div id="sample-explanation" className="mt-3 max-w-prose" role="region" aria-label="Worked explanation">
              <h3 className="font-semibold">Worked explanation</h3>
              <p className="mt-1">{record.explanation}</p>
            </div>
          )}
        </div>
      )}

      <nav aria-label="Session questions" className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" disabled={index === 0} onClick={() => navigate(index - 1)}>
          Previous question
        </Button>
        {index < fixtures.length - 1 && (
          <Button variant="secondary" onClick={() => navigate(index + 1)}>
            Next question
          </Button>
        )}
        <Button onClick={handleFinish}>Finish session</Button>
      </nav>
    </section>
  );
}
