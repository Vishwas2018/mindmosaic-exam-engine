"use client";

import { hero } from "../content";

/**
 * Chapter 1's scene navigator: six 2px tracks that fill with scroll progress, the active label in
 * Royal Indigo with a small coral tile. Each button scrolls (natively, smoothly) to the start of that
 * scene's hold; they are 44px tall and keyboard focusable. The stage owns the fills: it hands each
 * track's fill element back through `registerFill` and writes `transform` on it every frame.
 */
export function HeroSceneNav({
  active,
  onSelect,
  registerFill,
}: {
  active: number;
  onSelect: (index: number) => void;
  registerFill: (index: number, element: HTMLSpanElement | null) => void;
}) {
  return (
    <nav aria-label="Scenes" className="grid w-[min(660px,46vw)] grid-cols-6 gap-2.5">
      {hero.scenes.map((scene, index) => {
        const current = index === active;
        return (
          <button
            key={scene.id}
            type="button"
            onClick={() => onSelect(index)}
            aria-current={current ? "step" : undefined}
            aria-label={`Scene ${index + 1}: ${scene.label}`}
            className="flex min-h-11 cursor-pointer flex-col gap-[9px] rounded-md bg-transparent p-0 pt-1.5 text-left outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30"
          >
            <span className="relative block h-0.5 w-full overflow-hidden rounded-sm bg-mm-ink/15">
              <span
                ref={(element) => registerFill(index, element)}
                className="absolute inset-0 origin-left scale-x-0 bg-mm-brand"
                style={{ transform: "scaleX(0)" }}
              />
            </span>
            <span
              className={`flex items-center gap-1.5 text-[12.5px] transition-colors duration-200 motion-reduce:transition-none ${
                current ? "font-semibold text-mm-brand" : "font-medium text-mm-ink-soft"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-[5px] w-[5px] rounded-[1px] bg-mm-coral transition-opacity duration-200 motion-reduce:transition-none ${
                  current ? "opacity-100" : "opacity-0"
                }`}
              />
              <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              <span>{scene.label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
