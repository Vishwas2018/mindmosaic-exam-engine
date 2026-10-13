"use client";

export interface ChapterProgressItem {
  id: string;
  number: number;
  label: string;
}

/**
 * The pinned stage's scene progress bar, shared by Chapters 2 and 3: "01 Name"
 * items under a hairline, the active one marked by weight, a bar and
 * aria-current (never colour alone). Items are plain buttons that ask the page
 * to scroll to that scene: ordinary smooth scrolling, no wheel handling.
 * Only rendered while the stage is pinned.
 */
export function ChapterSceneProgress({
  items,
  activeScene,
  onSelect,
  ariaLabel,
}: {
  items: readonly ChapterProgressItem[];
  /** Index into `items` of the current scene; anything out of range marks none active. */
  activeScene: number;
  onSelect: (sceneIndex: number) => void;
  ariaLabel: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="absolute inset-x-0 bottom-0 z-10">
      <div className="mm-width pb-6">
        <ol className="m-0 flex list-none items-stretch gap-1 border-t border-mm-line p-0">
          {items.map((item, index) => {
            const active = index === activeScene;
            return (
              <li key={item.id} className="relative flex-1">
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
                  <span className="tabular-nums text-mm-brand">{String(item.number).padStart(2, "0")}</span>
                  <span className="truncate">{item.label}</span>
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
