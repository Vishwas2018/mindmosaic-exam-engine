import {notFound} from "next/navigation";

import {barModelPilotFixtures} from "@/content/visual-fixtures/bar-model";
import {VisualRenderer} from "@/features/exam-engine/visual-renderers";
import {validateBarModelVisual} from "@/features/visuals/bar-model/pipeline";
import {isBarModelPreviewAllowed} from "@/features/visuals/bar-model/preview-gate";
import {PilotSession} from "@/features/visuals/bar-model/PilotSession";

const FIXTURES = barModelPilotFixtures.map((fixture) => ({
  ...fixture,
  group: "Pilot sample",
}));

function formatTarget(
  target: {numerator: string; denominator: string} | null,
): string {
  if (!target) return "none";
  return target.denominator === "1"
    ? target.numerator
    : `${target.numerator}/${target.denominator}`;
}

export default function BarModelPreviewPage() {
  // Second gate: the layout already refuses, but the page must never render
  // the solved targets in production even if it is ever mounted elsewhere.
  if (!isBarModelPreviewAllowed()) notFound();

  return (
    <main className="mm-root mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-sm font-medium text-royal">
        Dev only · not in production · not linked from navigation
      </p>
      <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
        Bar model pilot preview (30 sample questions)
      </h1>
      <p className="mt-2 text-muted">
        {FIXTURES.length} pilot items, split evenly across Year 3 and Year 5.
        Try the session below, or open the developer gallery to inspect the
        givens-only diagrams alongside separate solver diagnostics.
      </p>

      <PilotSession />
      <details className="mt-10">
        <summary className="cursor-pointer rounded-xl py-3 font-semibold text-royal focus-visible:outline-2 focus-visible:outline-royal">
          Developer fixture gallery (contains answer keys)
        </summary>
        <div className="mt-8 space-y-10">
          {FIXTURES.map((fixture) => {
            const result = validateBarModelVisual(fixture.visual);
            return (
              <section
                key={fixture.name}
                data-fixture={fixture.name}
                aria-labelledby={`fixture-${fixture.name}`}
                className="min-w-0"
              >
                <h2
                  id={`fixture-${fixture.name}`}
                  className="text-lg font-bold text-ink"
                >
                  {fixture.name}{" "}
                  <span className="text-sm font-medium text-muted">
                    · Year {fixture.yearLevel} · {fixture.group}
                  </span>
                </h2>

                <div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                  <div
                    data-panel="learner-view"
                    className="min-w-0 rounded-xl border border-royal/15 bg-white p-3 sm:p-5"
                  >
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                      Learner view
                    </h3>
                    {result.visual ? (
                      <VisualRenderer visual={result.visual} />
                    ) : null}
                  </div>

                  <aside
                    data-panel="diagnostics"
                    aria-label={`Developer diagnostics for ${fixture.name}`}
                    className="min-w-0 rounded-xl border border-dashed border-ember-text/60 bg-amber-50 p-3 text-sm text-ink sm:p-4"
                  >
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ember-text">
                      Developer diagnostics · never shown to learners
                    </h3>
                    <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                      <dt className="font-semibold">Layer</dt>
                      <dd data-testid="layer">{result.layer}</dd>
                      <dt className="font-semibold">Solved target</dt>
                      <dd data-testid="target" className="break-words">
                        {formatTarget(result.solution?.target ?? null)}
                        {result.solution && !result.solution.isWhole
                          ? " (not whole)"
                          : ""}
                      </dd>
                      <dt className="font-semibold">Expected</dt>
                      <dd className="break-words">
                        {formatTarget({
                          numerator: String(fixture.privateAnswerKey),
                          denominator: "1",
                        })}
                      </dd>
                      <dt className="font-semibold">Conservation checks</dt>
                      <dd>{result.solution?.conservationChecks ?? 0}</dd>
                      <dt className="font-semibold">Warnings</dt>
                      <dd data-testid="warnings" className="break-words">
                        {result.warningCodes.length > 0
                          ? result.warningCodes.join(", ")
                          : "none"}
                      </dd>
                      <dt className="font-semibold">Errors</dt>
                      <dd className="break-words">
                        {result.errorCodes.length > 0
                          ? result.errorCodes.join(", ")
                          : "none"}
                      </dd>
                    </dl>
                    {result.issues.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {result.issues.map((entry, index) => (
                          <li
                            key={`${entry.code}-${index}`}
                            className="break-words"
                          >
                            <code>{entry.code}</code> ({entry.severity}):{" "}
                            {entry.message}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </aside>
                </div>
              </section>
            );
          })}
        </div>
      </details>
    </main>
  );
}
