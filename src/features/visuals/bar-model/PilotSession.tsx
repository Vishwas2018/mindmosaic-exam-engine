"use client";

import {useRef, useState} from "react";
import {useStore} from "zustand";

import {barModelPilotFixtures} from "@/content/visual-fixtures/bar-model";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {VisualRenderer} from "@/features/exam-engine/visual-renderers";
import {validateBarModelVisual} from "./pipeline";
import {createPilotSessionStore, scorePilotSession} from "./pilot-session";

/** Internal QA simulation only. Draft fixtures never enter a student bank. */
export function PilotSession() {
  const [store] = useState(createPilotSessionStore);
  const state = useStore(store);
  const [entry, setEntry] = useState("");
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const items = barModelPilotFixtures.filter((item) => item.yearLevel === state.year);
  const fixture = items[state.index];
  const score = scorePilotSession(items, state.answers);
  const focusHeading = () => requestAnimationFrame(() => heading.current?.focus());
  const navigate = (index: number) => {
    state.go(index);
    setEntry("");
    setError("");
    focusHeading();
  };

  return (
    <section aria-label="Pilot practice session" className="mt-8 min-w-0 rounded-xl border border-royal/15 bg-white p-4 sm:p-6">
      <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold text-ink outline-none">
        {state.year === null ? "Try a pilot session" : state.mode === "summary" ? "Session summary" : `Year ${state.year} · Question ${state.index + 1} of ${items.length}`}
      </h2>
      {state.year === null ? (
        <>
          <p className="mt-2 max-w-prose text-muted">Choose a year to try 15 draft questions. This QA session stays in memory; it is cleared when you reload.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {([3, 5] as const).map((year) => <Button key={year} onClick={() => {state.start(year); setEntry(""); setError(""); focusHeading();}}>Start Year {year}</Button>)}
          </div>
        </>
      ) : state.mode === "summary" ? (
        <>
          <p className="mt-3" role="status">{score.correct} correct · {score.incorrect} incorrect · {score.unanswered} unanswered out of {items.length} questions.</p>
          <ol className="mt-4 divide-y divide-royal/15">
            {items.map((item, index) => <li key={item.name} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>Question {index + 1} · {state.answers[item.name] === undefined ? "Unanswered" : state.answers[item.name] === item.privateAnswerKey ? "Correct" : "Incorrect"}</span>
              <Button variant="ghost" onClick={() => {state.review(index); setError(""); focusHeading();}}>Review question {index + 1}</Button>
            </li>)}
          </ol>
          <Button className="mt-4" variant="secondary" onClick={() => {state.reset(); focusHeading();}}>Choose another year</Button>
        </>
      ) : fixture ? (() => {
        const answer = state.answers[fixture.name];
        const submitted = answer !== undefined;
        const review = state.mode === "review";
        const result = validateBarModelVisual(fixture.visual);
        return <>
          <p className="mt-2 text-sm text-muted">{fixture.skill} · {fixture.difficulty}{review ? " · Question review" : ""}</p>
          <p className="mt-4 max-w-prose text-lg text-ink">{fixture.prompt}</p>
          <div className="mt-4 min-w-0" data-panel="session-diagram">{result.visual && <VisualRenderer visual={result.visual} />}</div>
          {!submitted && !review ? <form className="mt-4 max-w-sm" noValidate onSubmit={(event) => {
            event.preventDefault();
            if (!state.submit(fixture.name, entry)) {setError("Enter a whole number of 0 or more."); return;}
            setError("");
          }}>
            <Input label={`Your answer (${fixture.unit.trim()})`} inputMode="numeric" autoComplete="off" value={entry} onChange={(event) => {setEntry(event.target.value); setError("");}} error={error} />
            <Button type="submit" className="mt-3">Submit answer</Button>
          </form> : <p role="status" className="mt-4 font-semibold text-ink">
            {submitted ? `Your answer: ${answer} ${fixture.unit.trim()}. ${answer === fixture.privateAnswerKey ? "Correct." : "Not quite."}` : "You did not answer this question."}
          </p>}
          {(submitted || review) && <div className="mt-4">
            <Button variant="secondary" aria-expanded={Boolean(state.revealed[fixture.name])} aria-controls="pilot-explanation" onClick={() => state.reveal(fixture.name)} disabled={Boolean(state.revealed[fixture.name])}>Show explanation</Button>
            {state.revealed[fixture.name] && <div id="pilot-explanation" className="mt-3 max-w-prose" role="region" aria-label="Worked explanation"><h3 className="font-semibold">Worked explanation</h3><p className="mt-1">{fixture.workedExplanation}</p></div>}
          </div>}
          <nav aria-label="Session questions" className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" disabled={state.index === 0} onClick={() => navigate(state.index - 1)}>Previous question</Button>
            {state.index < items.length - 1 && <Button variant="secondary" onClick={() => navigate(state.index + 1)}>Next question</Button>}
            <Button onClick={() => {state.finish(); focusHeading();}}>{review ? "Back to summary" : "Finish session"}</Button>
          </nav>
        </>;
      })() : null}
    </section>
  );
}
