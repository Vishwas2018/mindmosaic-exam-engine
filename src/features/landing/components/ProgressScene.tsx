import Link from "next/link";

import { chapter4Scenes, type Chapter4SceneData } from "../chapter4-progress";
import {
  AssembledParentMosaic,
  LatestResultModule,
  SubjectProgressModule,
} from "./chapter-four-visuals";
import { underlineLinkClasses, underlineTransition } from "./primitives";

const DIAMOND_TONES = ["bg-mm-brand", "bg-mm-coral", "bg-mm-lilac", "bg-mm-brand-mid"] as const;
const SCENE_TOTAL = chapter4Scenes.length;

/** One progress scene's text content: number, h3, proposition, body, facts, and optional link. */
export function ProgressCopy({ scene }: { scene: Chapter4SceneData }) {
  return (
    <div className="max-w-[520px]">
      <p className="m-0 mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">
        <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
        <span className="tabular-nums">
          {String(scene.number).padStart(2, "0")} / {String(SCENE_TOTAL).padStart(2, "0")}
        </span>
      </p>
      <h3
        id={`chapter-four-${scene.id}-heading`}
        className="m-0 text-balance text-[clamp(30px,3.4vw,50px)] leading-[1.04] tracking-[-0.034em] text-mm-ink"
      >
        {scene.heading}
      </h3>
      <p className="m-0 mt-4 text-pretty text-[clamp(17px,1.4vw,21px)] font-medium leading-[1.45] text-mm-ink">
        {scene.proposition}
      </p>
      <p className="m-0 mt-3 max-w-[46ch] text-pretty text-[15.5px] leading-[1.6] text-mm-ink-soft">
        {scene.body}
      </p>
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
      {scene.cta && (
        <div className="mt-5">
          <Link
            href={scene.cta.href}
            style={underlineTransition}
            className={underlineLinkClasses({
              tone: "brand",
              className: "text-[15px] font-semibold text-mm-brand",
            })}
          >
            {scene.cta.label}
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Natural flow visual for mobile, tablet and prefers-reduced-motion.
 */
function StaticSceneVisual({ scene }: { scene: Chapter4SceneData }) {
  switch (scene.id) {
    case "latest":
      return <LatestResultModule />;
    case "subjects":
      return <SubjectProgressModule />;
    case "parent":
      return <AssembledParentMosaic />;
  }
}

/**
 * Natural-flow scene representation: copy, then its own standalone product module.
 */
export function ProgressScene({ scene }: { scene: Chapter4SceneData }) {
  return (
    <section
      aria-labelledby={`chapter-four-${scene.id}-heading`}
      data-scene={scene.id}
      className="grid gap-7 border-t border-mm-line-soft py-[clamp(40px,6vw,72px)] md:grid-cols-2 md:items-center md:gap-10"
    >
      <ProgressCopy scene={scene} />
      <div className="min-w-0">
        <StaticSceneVisual scene={scene} />
      </div>
    </section>
  );
}
