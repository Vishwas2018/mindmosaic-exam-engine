import Link from "next/link";

import { chapter3Scenes, type JourneySceneData } from "../chapter3-journey";
import { LessonState, ProductFrame, QuestionState, ResultsState } from "./chapter-three-visuals";
import { underlineLinkClasses, underlineTransition } from "./primitives";

const DIAMOND_TONES = ["bg-mm-brand", "bg-mm-coral", "bg-mm-lilac", "bg-mm-brand-mid"] as const;
const SCENE_TOTAL = chapter3Scenes.length;

/** One journey step's words: number, h3, proposition, body, facts, note and an optional link. */
export function JourneyCopy({ scene }: { scene: JourneySceneData }) {
  return (
    <div className="max-w-[520px]">
      <p className="m-0 mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">
        <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
        <span className="tabular-nums">
          {String(scene.number).padStart(2, "0")} / {String(SCENE_TOTAL).padStart(2, "0")}
        </span>
      </p>
      <h3
        id={`chapter-three-${scene.id}-heading`}
        className="m-0 text-balance text-[clamp(30px,3.4vw,50px)] leading-[1.04] tracking-[-0.034em] text-mm-ink"
      >
        {scene.heading}
      </h3>
      <p className="m-0 mt-4 text-pretty text-[clamp(17px,1.4vw,21px)] font-medium leading-[1.45] text-mm-ink">
        {scene.proposition}
      </p>
      <p className="m-0 mt-3 max-w-[46ch] text-pretty text-[15.5px] leading-[1.6] text-mm-ink-soft">{scene.body}</p>
      <ul
        aria-label={`${scene.heading} What it includes`}
        className="m-0 mt-5 grid max-w-[34rem] list-none gap-y-2 p-0 text-[14.5px] leading-snug text-mm-ink-soft"
      >
        {scene.facts.map((fact, index) => (
          <li key={fact} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className={`mt-[5px] h-2 w-2 shrink-0 rotate-45 rounded-[1.5px] ${DIAMOND_TONES[index % DIAMOND_TONES.length]}`}
            />
            {fact}
          </li>
        ))}
      </ul>
      {scene.note && <p className="m-0 mt-4 max-w-[46ch] text-[13.5px] leading-[1.55] text-mm-muted">{scene.note}</p>}
      {scene.cta && (
        <div className="mt-5">
          <Link
            href={scene.cta.href}
            style={underlineTransition}
            className={underlineLinkClasses({ tone: "brand", className: "text-[15px] font-semibold text-mm-brand" })}
          >
            {scene.cta.label}
          </Link>
        </div>
      )}
    </div>
  );
}

/** The scene's product state, complete and read-only (natural flow: phones, tablets, reduced motion). */
function StaticState({ scene }: { scene: JourneySceneData }) {
  switch (scene.state) {
    case "lesson":
      return <LessonState build={null} />;
    case "question-select":
      return <QuestionState phase="select" appear={null} explain={null} label="Sample practice question" />;
    case "question-review":
      return <QuestionState phase="review" appear={null} explain={null} label="Sample question review" />;
    case "results":
      return <ResultsState build={null} />;
  }
}

/**
 * Natural-flow scene: copy, then its own product frame. Scenes 2 and 3 both
 * show the SAME question (select, then review), so on a phone the reader sees
 * the question again rather than having to remember it from further up.
 */
export function JourneyScene({ scene }: { scene: JourneySceneData }) {
  return (
    <section
      aria-labelledby={`chapter-three-${scene.id}-heading`}
      data-scene={scene.id}
      className="grid gap-7 border-t border-mm-line-soft py-[clamp(40px,6vw,72px)] md:grid-cols-2 md:items-center md:gap-10"
    >
      <JourneyCopy scene={scene} />
      <ProductFrame className="min-w-0">
        <StaticState scene={scene} />
      </ProductFrame>
    </section>
  );
}
