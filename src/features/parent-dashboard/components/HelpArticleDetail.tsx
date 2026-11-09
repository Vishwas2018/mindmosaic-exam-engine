"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Info, ThumbsUp, ThumbsDown } from "lucide-react";
import { type PreviewHelpArticle } from "../fixtures";

export interface HelpArticleDetailProps {
  article: PreviewHelpArticle;
}

export function HelpArticleDetail({ article }: HelpArticleDetailProps) {
  const [feedback, setFeedback] = useState<"none" | "helpful" | "unhelpful">("none");

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/parent" className="hover:text-royal">
          Family Overview
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <Link href="/parent/help" className="hover:text-royal">
          Help Centre
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <span aria-current="page" className="text-ink">
          {article.title}
        </span>
      </nav>

      {/* Main Article Card (b28-1) */}
      <article className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-9 max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-wider text-royal">
          {article.category}
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {article.title}
        </h1>
        <p className="mt-2 text-base font-semibold text-muted">{article.lead}</p>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/90 border-t border-royal/8 pt-6">
          {article.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {article.note && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-royal/15 bg-royal/[0.04] p-4 text-xs text-ink leading-relaxed">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-royal" aria-hidden="true" />
            <div>{article.note}</div>
          </div>
        )}

        {/* Action button */}
        {article.action && (
          <div className="mt-6">
            <Link
              href={article.action.href}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-royal px-5 text-xs font-bold text-white transition hover:bg-royal-deep"
            >
              {article.action.label}
            </Link>
          </div>
        )}

        {/* Feedback Section */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-royal/8 pt-6">
          <span className="text-xs font-semibold text-muted">Was this article helpful?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFeedback("helpful")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                feedback === "helpful"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-royal/15 bg-white text-muted hover:border-royal hover:text-royal"
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Yes, helped</span>
            </button>
            <button
              type="button"
              onClick={() => setFeedback("unhelpful")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                feedback === "unhelpful"
                  ? "border-amber-600 bg-amber-50 text-amber-800"
                  : "border-royal/15 bg-white text-muted hover:border-royal hover:text-royal"
              }`}
            >
              <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Didn&apos;t help</span>
            </button>
          </div>
        </div>

        {feedback === "unhelpful" && (
          <div className="mt-4 rounded-xl bg-royal/[0.02] p-4 text-xs text-muted">
            Need further help?{" "}
            <Link href="/parent/help#contact" className="font-bold text-royal underline">
              Send us a message directly &rarr;
            </Link>
          </div>
        )}
      </article>

      {/* Back to Help Centre */}
      <div>
        <Link
          href="/parent/help"
          className="inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-muted hover:text-royal"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Help Centre</span>
        </Link>
      </div>
    </div>
  );
}
