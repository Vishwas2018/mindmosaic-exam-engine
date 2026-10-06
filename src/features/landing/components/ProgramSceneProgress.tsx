"use client";

import { chapter2Scenes } from "../chapter2-scenes";
import { chapterTwo } from "../content";

/**
 * Programme progress for the pinned stage: "01 NAPLAN ... 06 Selective", the
 * active one marked in words (aria-current) and by weight and a bar, never by
 * colour alone. The items are plain buttons that ask the page to scroll to
 * that scene: ordinary smooth scrolling, no wheel handling. Only rendered
 * while the stage is pinned; phones and reduced motion show each scene's own
 * "03 / 06" label instead.
 *
 * `activeLayer` is the chapter's layer index (0 is the intro, scenes are 1..6).
 */
export function ProgramSceneProgress({
  activeLayer,
  onSelect,
}: {
  activeLayer: number;
  onSelect: (sceneIndex: number) => void;
}) {
  const activeScene = activeLayer - 1;
  return (
    <nav aria-label={chapterTwo.progressLabel} className="absolute inset-x-0 bottom-0 z-10">
      <div className="mm-width pb-6">
        <ol className="m-0 flex list-none items-stretch gap-1 border-t border-mm-line p-0">
          {chapter2Scenes.map((scene, index) => {
            const active = index === activeScene;
            return (
              <li key={scene.id} className="relative flex-1">
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 -top-px h-[3px] rounded-full transition-colors duration-300 ${
                    active ? "bg-mm-brand" : index < activeScene ? "bg-mm-brand/35" : "bg-transparent"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-current={active ? "step" : undefined}
                  className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 pt-2 text-left text-[13.5px] transition-colors duration-200 hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 ${
                    active ? "font-semibold text-mm-ink" : "font-medium text-mm-muted"
                  }`}
                >
                  <span className="tabular-nums text-mm-brand">{String(scene.number).padStart(2, "0")}</span>
                  <span className="truncate">{scene.navLabel}</span>
                  {active && <span className="sr-only">(current)</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
