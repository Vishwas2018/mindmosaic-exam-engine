"use client";

import { useState } from "react";
import { clsx } from "clsx";

import { AuthMosaicPanel } from "./AuthMosaicPanel";
import { SIGN_UP_STEPS, SignUpWizard } from "./SignUpWizard";

/**
 * Sign up — screen 7's two halves. The step tracker lives in the plum panel
 * and the form lives in the card, but the step itself belongs to the
 * wizard, so this thin client component owns it and hands it to both.
 *
 * Tracker states, from the handoff: done steps get a coral tile with a
 * tick, the current step gets lavender on plum, upcoming steps get
 * `rgba(255,255,255,0.10)`.
 */
export function SignUpScreen() {
  const [step, setStep] = useState(1);

  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <AuthMosaicPanel
        columns={10}
        eyebrow="Free to start"
        heading="Set up in three steps. No card required."
        footnote="A student profile holds a first name and year level only. We never sell personal information and there is no advertising on the platform."
      >
        <ol className="grid gap-0.5">
          {SIGN_UP_STEPS.map((definition, index) => {
            const n = index + 1;
            const done = n < step;
            const current = n === step;
            return (
              <li
                key={definition.name}
                aria-current={current ? "step" : undefined}
                className={clsx(
                  "grid grid-cols-[40px_minmax(0,1fr)] gap-4 py-4",
                  index < SIGN_UP_STEPS.length - 1 && "border-b border-white/12",
                )}
              >
                <span
                  aria-hidden="true"
                  className={clsx(
                    "grid h-[34px] w-[34px] place-items-center rounded-[10px] font-[family-name:var(--font-display)] text-sm font-extrabold",
                    done
                      ? "bg-mm-coral text-white"
                      : current
                        ? "bg-mm-lilac text-mm-plum"
                        : "bg-white/10 text-white/72",
                  )}
                >
                  {done ? "✓" : n}
                </span>
                <span className="grid min-w-0 gap-1">
                  <span
                    className={clsx(
                      "text-[16.5px] font-bold",
                      current || done ? "text-white" : "text-white/78",
                    )}
                  >
                    {/* Screen-reader users get the state in words; sighted
                        users get it from the tile. */}
                    {definition.name}
                    <span className="sr-only">
                      {done ? " — completed" : current ? " — current step" : " — not started"}
                    </span>
                  </span>
                  <span className="text-sm leading-[1.5] text-white/84">
                    {definition.railBody}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </AuthMosaicPanel>

      <main
        id="main-content"
        className="grid content-center px-[clamp(20px,4vw,64px)] py-[clamp(28px,3vw,56px)]"
      >
        <div className="mx-auto w-full min-w-0 max-w-[620px]">
          <SignUpWizard onStepChange={setStep} />
        </div>
      </main>
    </div>
  );
}
