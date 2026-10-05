import { chapterTwoPlaceholder } from "../content";

/**
 * PLACEHOLDER for Chapter 2 of the cinematic landing page: a heading only,
 * so Chapter 1's hand-off has somewhere to land. Replace this component (and
 * the `chapterTwo` entry in `sections`) when Chapter 2 is built.
 */
export function ChapterTwoPlaceholder() {
  return (
    <section
      aria-labelledby="chapter-two-heading"
      data-chapter="2-placeholder"
      className="bg-mm-page py-[clamp(56px,10vw,120px)]"
    >
      <div className="mm-width">
        <h2
          id="chapter-two-heading"
          className="m-0 max-w-[20ch] text-[clamp(32px,4.4vw,60px)] leading-[1.06] tracking-[-0.03em] text-mm-ink"
        >
          {chapterTwoPlaceholder.heading}
        </h2>
      </div>
    </section>
  );
}
