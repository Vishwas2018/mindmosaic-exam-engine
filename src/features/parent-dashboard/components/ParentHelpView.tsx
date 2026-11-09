"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  KeyRound,
  FileText,
  BarChart2,
  PenTool,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  Info,
} from "lucide-react";
import { PREVIEW_HELP_CATEGORIES } from "../fixtures";
import { SupportContactForm } from "./SupportContactForm";

export function ParentHelpView() {
  const [searchQuery, setSearchQuery] = useState("");

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case "getting-started":
        return KeyRound;
      case "practice-papers":
        return FileText;
      case "results-marks":
        return BarChart2;
      case "writing-marking":
        return PenTool;
      case "membership-billing":
        return CreditCard;
      case "privacy-data":
      default:
        return ShieldCheck;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Help Centre</h1>
          <p className="mt-1 text-base text-muted sm:text-lg">
            Answers to the things parents ask most, and a way to reach a person.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Illustrative sample family
        </span>
      </div>

      {/* Search Input with Honest Limitation Badge (b27) */}
      <div className="max-w-xl">
        <label htmlFor="hq" className="block text-xs font-semibold text-ink">
          Search help
        </label>
        <div className="relative mt-1.5">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id="hq"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Try "PIN" or "invoice"'
            aria-describedby="hq-help"
            className="block w-full rounded-xl border border-royal/15 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-muted/60 focus-visible:border-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
          />
        </div>
        <p id="hq-help" className="mt-2 text-xs text-muted">
          <span className="mr-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800">
            NEEDS A BUILD
          </span>
          knowledgebase search backend needs the articles to exist as database records first. Browsing by topic below works directly.
        </p>
      </div>

      {/* 6 Curated Categories Grid (b27/b29) */}
      <section aria-labelledby="h-categories" className="space-y-4">
        <h2 id="h-categories" className="text-xl font-bold text-ink">
          Browse topics
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PREVIEW_HELP_CATEGORIES.map((cat) => {
            const Icon = getCategoryIcon(cat.id);
            return (
              <div
                key={cat.id}
                className="flex flex-col justify-between rounded-2xl border border-royal/10 bg-white p-6 shadow-sm transition hover:border-royal/30"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-royal/8 text-royal">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-ink">{cat.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{cat.description}</p>
                </div>

                <ul className="mt-5 space-y-2.5 border-t border-royal/8 pt-4">
                  {cat.articles.map((art) => (
                    <li key={art.slug}>
                      <Link
                        href={`/parent/help/${art.slug}`}
                        className="group flex items-center justify-between text-xs font-semibold text-ink transition hover:text-royal"
                      >
                        <span className="group-hover:underline underline-offset-2">{art.title}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted transition group-hover:translate-x-0.5 group-hover:text-royal" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Section Anchor (b28) */}
      <section id="contact" aria-labelledby="h-contact" className="pt-6 border-t border-royal/10">
        <SupportContactForm />
      </section>
    </div>
  );
}
