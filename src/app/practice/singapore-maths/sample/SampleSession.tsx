"use client";

import {useCallback, useRef, useState} from "react";

import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {VisualRenderer} from "@/features/exam-engine/visual-renderers";
import {parsePilotAnswer} from "@/features/visuals/bar-model/pilot-session";
import type {SamplePracticeFixture} from "@/content/visual-fixtures/bar-model/sample-practice.server";

interface SampleSessionProps {
  year: 3 | 5;
  fixtures: readonly SamplePracticeFixture[];
}

export function SampleSession({year, fixtures}: SampleSessionProps) {
  const [index, setIndex] = useState(0);
  const [entry, setEntry] = useState("");
  const [error, setError] = useState("");
  const [correct, setCorrect] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealedExplanations, setRevealedExplanations] = useState<Record<string, boolean>>({});
  const [summary, setSummary] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const fixture = fixtures[index];
  const answered = Object.keys(answers).length;
  const scoreCorrect = fixtures.reduce(
    (n, f) => n + (answers[f.name] !== undefined ? 1 : 0),
    0,
  );

  const focusHeading = () => requestAnimationFrame(() => headingRef.current?.focus());

  const navigate = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(fixtures.length - 1, next)));
      setEntry("");
      setError("");
      setSubmitted(false);
      setCorrect(false);
      setRevealed(false);
      setExplanation("");
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
    if (answers[fixture.name] !== undefined) return;

    setError("");
    try {
      const response = await fetch("/api/practice/singapore-maths/sample/submit", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({questionId: fixture.name, answer}),
      });
      const data = await response.json();
      if (data.correct === true) {
        setCorrect(true);
        setSubmitted(true);
        setAnswers({...answers, [fixture.name]: answer});
        if (data.workedExplanation) {
          setExplanation(data.workedExplanation);
        }
      } else {
        setCorrect(false);
        setSubmitted(true);
        setAnswers({...answers, [fixture.name]: answer});
      }
    } catch {
      setError("Could not reach the server. Try again.");
    }
  };

  const handleReveal = async () => {
    if (revealedExplanations[fixture.name]) return;
    try {
      const response = await fetch("/api/practice/singapore-maths/sample/reveal", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({questionId: fixture.name}),
      });
      if (response.ok) {
        const data = await response.json();
        setExplanation(data.workedExplanation);
        setRevealed(true);
        setRevealedExplanations({...revealedExplanations, [fixture.name]: true});
      }
    } catch {
      setError("Could not load the explanation.");
    }
  };

  const handleFinish = () => {
    setSummary(true);
    setIndex(0);
    focusHeading();
  };

  const reviewQuestion = (i: number) => {
    setIndex(i);
    setSummary(false);
    setSubmitted(false);
    setCorrect(false);
    setRevealed(false);
    setExplanation("");
    setEntry("");
    setError("");
    focusHeading();
  };

  const resetSession = () => {
    setIndex(0);
    setSummary(false);
    setSubmitted(false);
    setCorrect(false);
    setRevealed(false);
    setExplanation("");
    setEntry("");
    setError("");
    setAnswers({});
    setRevealedExplanations({});
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
                {answers[item.name] === undefined ? "Unanswered" : "Answered"}
              </span>
              <Button variant="ghost" onClick={() => reviewQuestion(i)}>
                Review question {i + 1}
              </Button>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={resetSession}>
            Choose another year
          </Button>
        </div>
      </section>
    );
  }

  if (!fixture) return null;

  const alreadyAnswered = answers[fixture.name] !== undefined;

  return (
    <section aria-label="Practice session" className="mt-8 min-w-0 rounded-xl border border-royal/15 bg-white p-4 sm:p-6">
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-ink outline-none">
        Year {year} · Question {index + 1} of {fixtures.length}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {fixture.skill} · {fixture.difficulty}
      </p>
      <p className="mt-4 max-w-prose text-lg text-ink">{fixture.prompt}</p>
      <div className="mt-4 min-w-0" data-panel="session-diagram">
        <VisualRenderer visual={fixture.visual} />
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
          <Button type="submit" className="mt-3">
            Submit answer
          </Button>
        </form>
      ) : (
        <p role="status" className="mt-4 font-semibold text-ink">
          Your answer: {answers[fixture.name]} {fixture.unit.trim()}.{" "}
          {correct ? "Correct." : "Not quite."}
        </p>
      )}

      {alreadyAnswered && (
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
          {revealed && explanation && (
            <div id="sample-explanation" className="mt-3 max-w-prose" role="region" aria-label="Worked explanation">
              <h3 className="font-semibold">Worked explanation</h3>
              <p className="mt-1">{explanation}</p>
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
