"use client";

import { ArrowRight, ExternalLink, Lightbulb } from "lucide-react";
import { getVcaaSourceUrl } from "../parent-content";
import { CoverageBadge } from "./CoverageBadge";
import type { ExplorerNodeItem } from "./types";

export interface CurriculumNodeCardProps {
  item: ExplorerNodeItem;
  onSelect: (item: ExplorerNodeItem) => void;
}

export function CurriculumNodeCard({ item, onSelect }: CurriculumNodeCardProps) {
  const { catalogueItem, parentContent, strand } = item;
  const officialCode = catalogueItem.node.officialCode || catalogueItem.node.nodeKey;
  const vcaaUrl = getVcaaSourceUrl(officialCode);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-royal/30 hover:shadow-md">
      {/* Header / Code & Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-royal bg-royal/10 border border-royal/15 px-2 py-0.5 rounded-lg">
              {officialCode}
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
              {strand}
            </span>
          </div>
          <CoverageBadge coverage={catalogueItem.coverage} />
        </div>

        {/* Title */}
        <h3 className="text-base font-extrabold text-ink group-hover:text-royal transition-colors leading-snug mb-2">
          {catalogueItem.node.label}
        </h3>

        {/* Plain-English summary */}
        <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-3 mb-4">
          {parentContent.whatThisMeans}
        </p>
      </div>

      {/* Footer Details & Action Affordances */}
      <div className="pt-4 border-t border-line/60 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-muted">
          {/* Home activity count affordance */}
          <div className="flex items-center gap-1.5 text-royal font-bold bg-royal/5 border border-royal/10 rounded-lg px-2.5 py-1">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {parentContent.homeActivities.length} home activities • 5–15 mins
            </span>
          </div>

          {/* Outbound VCAA Link */}
          <a
            href={vcaaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-muted hover:text-royal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30 rounded py-1 px-1.5 transition-colors"
            title="View official descriptor on VCAA website"
          >
            VCAA
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>

        {/* Open Modal Trigger Button */}
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="w-full min-h-11 flex items-center justify-center gap-2 rounded-xl bg-tint/70 hover:bg-royal hover:text-white text-ink text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 active:translate-y-px"
          aria-label={`Explore details and home activities for ${officialCode}: ${catalogueItem.node.label}`}
        >
          <span>Explore skill &amp; activities</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
