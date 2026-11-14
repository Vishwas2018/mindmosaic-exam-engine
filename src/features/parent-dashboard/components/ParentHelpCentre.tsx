"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  Info,
  Mail,
  Search,
} from "lucide-react";

import {
  PREVIEW_HELP_ARTICLES,
  PREVIEW_HELP_CATEGORIES,
  type PreviewHelpArticle,
} from "../fixtures";

export interface HelpCategoryItem {
  id: string;
  title: string;
  description: string;
  countLabel: string;
  articles: Array<{ slug: string; title: string }>;
}

export interface ParentHelpCentreProps {
  categories?: HelpCategoryItem[];
  articles?: Record<string, PreviewHelpArticle>;
  /** The signed-in parent's own children. No sample family default: a real page must pass real data. */
  childrenList: Array<{ id: string; name: string; yearLevel: number | null }>;
  userEmail: string;
  isLocalPreview?: boolean;
}

export function ParentHelpCentre({
  categories = PREVIEW_HELP_CATEGORIES,
  articles = PREVIEW_HELP_ARTICLES,
  childrenList,
  userEmail,
  isLocalPreview = false,
}: ParentHelpCentreProps) {
  const searchInputId = useId();
  const childSelectId = useId();
  const messageInputId = useId();

  // Navigation state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Contact form state
  const [contactChildId, setContactChildId] = useState<string>("");
  const [contactMessage, setContactMessage] = useState<string>("");
  /* "opened" only means the parent's email app was asked to open with the message: nothing is sent from here, so
     nothing claims it was received. */
  const [contactStatus, setContactStatus] = useState<"idle" | "opened">("idle");

  // Search filtering logic across all articles
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const matchedArticles = isSearching
    ? Object.values(articles).filter(
        (art) =>
          art.title.toLowerCase().includes(trimmedQuery) ||
          art.category.toLowerCase().includes(trimmedQuery) ||
          art.paragraphs.some((p) => p.toLowerCase().includes(trimmedQuery))
      )
    : [];

  const activeCategoryObj = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)
    : null;

  const activeArticle = selectedArticleSlug ? articles[selectedArticleSlug] : null;

  const contactChild = childrenList.find((ch) => ch.id === contactChildId);
  const mailtoHref = buildSupportMailto({
    accountEmail: userEmail,
    childLabel: contactChild
      ? contactChild.yearLevel
        ? `${contactChild.name}, Year ${contactChild.yearLevel}`
        : contactChild.name
      : null,
    message: contactMessage,
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    window.location.href = mailtoHref;
    setContactStatus("opened");
  };

  const resetToOverview = () => {
    setSelectedCategory(null);
    setSelectedArticleSlug(null);
    setSearchQuery("");
  };

  return (
    <div className="space-y-8">
      {/* Header & Context Greet */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
            Help Centre
          </h1>
          <p className="mt-1 text-sm text-muted">
            Answers to the things parents ask most, and a way to reach a person.
          </p>
        </div>

        {isLocalPreview && (
          <span
            data-testid="illustrative-badge"
            className="inline-flex items-center gap-1.5 rounded-full border border-royal/15 bg-white px-3 py-1 text-xs font-semibold text-muted shadow-xs self-start"
          >
            <HelpCircle className="h-3.5 w-3.5 text-royal" aria-hidden="true" />
            Illustrative sample family
          </span>
        )}
      </div>

      {/* Search Bar */}
      <div className="max-w-xl">
        <label
          htmlFor={searchInputId}
          className="block text-xs font-bold uppercase tracking-wider text-muted"
        >
          Search help
        </label>
        <div className="relative mt-2">
          <input
            id={searchInputId}
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedArticleSlug) setSelectedArticleSlug(null);
            }}
            placeholder="Try “PIN” or “invoice”"
            className="w-full rounded-xl border border-royal/20 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-muted/60 shadow-xs focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
          />
          <Search
            className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-muted"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Main Content Area: Article View vs Search Results vs Topic Tiles */}
      {activeArticle ? (
        /* Article View (Artboard #b28 Section 1 — "1 · An answer") */
        <section
          data-testid="article-detail-view"
          aria-labelledby="article-heading"
          className="rounded-2xl border border-royal/15 bg-white p-6 shadow-sm md:p-8 max-w-3xl space-y-6"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedArticleSlug(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-royal hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to topics
            </button>
            <span className="text-muted/40">/</span>
            <span className="text-xs font-semibold text-muted">{activeArticle.category}</span>
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-royal">
              {activeArticle.category}
            </p>
            <h2
              id="article-heading"
              className="mt-1 text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl"
            >
              {activeArticle.title}
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-ink/90">
            {activeArticle.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {activeArticle.note && (
            <div className="rounded-xl border border-royal/15 bg-royal/5 p-4 text-xs leading-relaxed text-ink/80 flex items-start gap-3">
              <Info className="h-4 w-4 text-royal shrink-0 mt-0.5" aria-hidden="true" />
              <div>{activeArticle.note}</div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {activeArticle.action && (
              <Link
                href={activeArticle.action.href}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-royal px-4 text-xs font-bold text-white shadow-xs transition hover:bg-royal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30"
              >
                {activeArticle.action.label}
              </Link>
            )}
            <a
              href="#contact-form"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-royal/20 bg-white px-4 text-xs font-bold text-ink transition hover:bg-royal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
            >
              This didn’t help
            </a>
          </div>
        </section>
      ) : isSearching ? (
        /* Search Results View */
        <section aria-label="Search results" className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-ink">
              Search results for “{searchQuery}” ({matchedArticles.length})
            </h2>
            <button
              type="button"
              onClick={resetToOverview}
              className="text-xs font-bold text-royal hover:underline"
            >
              Clear search
            </button>
          </div>

          {matchedArticles.length === 0 ? (
            <div className="rounded-2xl border border-royal/10 bg-white p-6 text-center text-sm text-muted">
              No matching articles found. Try another term, or send us a message below.
            </div>
          ) : (
            <div className="grid gap-3">
              {matchedArticles.map((art) => (
                <button
                  key={art.slug}
                  type="button"
                  onClick={() => setSelectedArticleSlug(art.slug)}
                  className="w-full text-left rounded-xl border border-royal/10 bg-white p-4 shadow-xs transition hover:border-royal/30 hover:bg-royal/5 flex items-center justify-between"
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-royal">
                      {art.category}
                    </span>
                    <h3 className="mt-0.5 text-sm font-extrabold text-ink">{art.title}</h3>
                    <p className="mt-1 text-xs text-muted line-clamp-1">{art.lead}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted/50 ml-4 shrink-0" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </section>
      ) : selectedCategory && activeCategoryObj ? (
        /* Selected Topic Articles View */
        <section
          aria-labelledby="category-heading"
          className="space-y-4 max-w-3xl"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-royal hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              All topics
            </button>
          </div>

          <div>
            <h2
              id="category-heading"
              className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl"
            >
              {activeCategoryObj.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{activeCategoryObj.description}</p>
          </div>

          <div className="grid gap-3 pt-2">
            {activeCategoryObj.articles.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setSelectedArticleSlug(item.slug)}
                className="w-full text-left rounded-xl border border-royal/10 bg-white p-4 shadow-xs transition hover:border-royal/30 hover:bg-royal/5 flex items-center justify-between"
              >
                <span className="text-sm font-extrabold text-ink">{item.title}</span>
                <ChevronRight className="h-4 w-4 text-muted/50 ml-4 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      ) : (
        /* 6 Topic Tiles Grid (Artboard #b27 & #b29) */
        <div
          data-testid="help-topics-grid"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                // If category has a premier direct article, or switch into category articles
                if (cat.articles.length > 0 && cat.id === "getting-started") {
                  setSelectedArticleSlug(cat.articles[0].slug);
                } else {
                  setSelectedCategory(cat.id);
                }
              }}
              className="group text-left rounded-2xl border border-royal/10 bg-white p-5 shadow-xs transition hover:border-royal/30 hover:shadow-sm flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <h2 className="text-base font-extrabold text-ink group-hover:text-royal transition">
                  {cat.title}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {cat.description}
                </p>
              </div>
              <p className="mt-4 text-[11px] font-semibold text-muted/80">
                {cat.countLabel}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Support Contact Journey (Artboard #b28 Section 2 — "2 · The message, and the three ways it ends") */}
      <section
        id="contact-form"
        data-testid="contact-support-section"
        aria-labelledby="contact-heading"
        className="rounded-2xl border border-royal/15 bg-white p-6 shadow-sm md:p-8 max-w-3xl space-y-6"
      >
        <div>
          <h2
            id="contact-heading"
            className="text-lg font-extrabold tracking-[-0.015em] text-ink sm:text-xl"
          >
            Can’t find it?
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Write to us. Tell us which child it is about and we will look at their details. A person reads every
            message and replies to <span className="font-semibold">{userEmail}</span>.
          </p>
        </div>

        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label htmlFor={childSelectId} className="block text-xs font-bold uppercase tracking-wider text-muted">
              Which child is this about?
            </label>
            <select
              id={childSelectId}
              value={contactChildId}
              onChange={(e) => setContactChildId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-royal/20 bg-white py-2.5 px-3.5 text-sm text-ink shadow-xs focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
            >
              <option value="">Not about a child</option>
              {childrenList.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.yearLevel ? `${ch.name}, Year ${ch.yearLevel}` : ch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={messageInputId} className="block text-xs font-bold uppercase tracking-wider text-muted">
              What is happening?
            </label>
            <textarea
              id={messageInputId}
              rows={4}
              required
              value={contactMessage}
              onChange={(e) => {
                setContactMessage(e.target.value);
                setContactStatus("idle");
              }}
              placeholder="Tell us what you expected and what happened instead."
              className="mt-1.5 w-full rounded-xl border border-royal/20 bg-white p-3.5 text-sm text-ink placeholder:text-muted/60 shadow-xs focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
            />
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={!contactMessage.trim()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-royal px-5 text-xs font-extrabold text-white shadow-xs transition hover:bg-royal/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Email this to {SUPPORT_EMAIL}
            </button>
            <p className="text-[11px] text-muted">
              This opens your email app with the message, your account and the child filled in. It is sent when you
              press send there.
            </p>
          </div>
        </form>

        {contactStatus === "opened" && (
          <div
            data-testid="contact-opened-note"
            role="status"
            className="rounded-xl border border-royal/15 bg-royal/5 p-4 text-xs text-ink space-y-1"
          >
            <p>
              <strong className="font-extrabold">Your email app should now be open.</strong> If nothing opened, write to{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-bold text-royal underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              and paste your message — it is still in the box above.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

const SUPPORT_EMAIL = "hello@mindmosaic.app";

/** A prefilled email to support. Exported for tests. Nothing is sent until the parent sends it themselves. */
export function buildSupportMailto({
  accountEmail,
  childLabel,
  message,
}: {
  accountEmail: string;
  childLabel: string | null;
  message: string;
}): string {
  const subject = childLabel ? `Help with ${childLabel}` : "Help with my MindMosaic account";
  const body = [
    message.trim(),
    "",
    "—",
    `Account: ${accountEmail}`,
    `Child: ${childLabel ?? "not about a child"}`,
  ].join("\n");
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
