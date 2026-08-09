import Link from "next/link";
import { clsx } from "clsx";

import type { HubArticle } from "../content";
import { hubCategory, TONE_TEXT } from "./hub-presentation";
import { HubMedia } from "./HubMedia";

/** Three across at `lg`, two at `sm`, one below — mirrored in the grid. */
const CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

/**
 * One guide in the library.
 *
 * The card is deliberately inert until a guide has somewhere to go. Every
 * entry in the hub today is a commissioned brief, not a written article, so
 * none of them carries an href — and a card that lifts and magnifies its
 * picture under the cursor promises a destination. The hover treatment is
 * written once, on the `group` that only the linked branch applies, so the
 * moment an article gains an href it becomes a real card with the full
 * interaction and nothing else has to change.
 *
 * That is also the extension point for new categories: a guide's accent,
 * icon and fallback plate all come from HUB_CATEGORY, so adding a category
 * is one entry there rather than a branch at every call site.
 */
export function HubGuideCard({ article }: { article: HubArticle }) {
  const { icon: Icon, tone } = hubCategory(article.category);

  const body = (
    <>
      <HubMedia
        media={article.media}
        category={article.category}
        sizes={CARD_SIZES}
        objectPosition={article.media?.position}
        className="aspect-16/10 w-full border-b border-mm-line"
        markClassName="h-8 w-8"
      />

      <div className="flex flex-1 flex-col gap-2 p-5">
        <p
          className={clsx(
            "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]",
            TONE_TEXT[tone],
          )}
        >
          <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {article.category}
        </p>

        <h3 className="text-[17.5px] font-bold leading-[1.3] text-mm-ink">{article.title}</h3>
        <p className="flex-1 text-[14.5px] leading-[1.55] text-mm-muted">{article.body}</p>

        <p className="mt-1 flex flex-wrap items-center gap-2 border-t border-mm-line-soft pt-3 text-[12.5px] font-medium text-mm-muted">
          <span>{article.audience}</span>
          <span aria-hidden="true" className="text-mm-lilac">
            ·
          </span>
          <span>{article.length}</span>
        </p>
      </div>
    </>
  );

  const shell =
    "flex h-full flex-col overflow-hidden rounded-[16px] border border-mm-line bg-white shadow-[0_1px_2px_rgba(24,21,31,0.05)]";

  if (!article.href) {
    return <article className={shell}>{body}</article>;
  }

  return (
    <Link
      href={article.href}
      className={clsx(
        shell,
        "group transition duration-200 ease-out hover:-translate-y-0.5 hover:border-mm-brand/40 hover:shadow-[0_14px_32px_rgba(24,21,31,0.10)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand motion-reduce:transform-none motion-reduce:transition-none",
      )}
    >
      {body}
    </Link>
  );
}
