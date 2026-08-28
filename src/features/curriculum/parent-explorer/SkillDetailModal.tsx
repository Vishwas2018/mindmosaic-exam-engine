"use client";

import {
  BookOpen,
  Car,
  Clock,
  ExternalLink,
  Home,
  ShoppingBag,
  Sparkles,
  Sun,
  Utensils,
} from "lucide-react";
import { Modal } from "@/components/ui";
import { getVcaaSourceUrl, type ParentHomeActivitySetting } from "../parent-content";
import { CoverageBadge } from "./CoverageBadge";
import type { ExplorerNodeItem } from "./types";

export interface SkillDetailModalProps {
  item: ExplorerNodeItem | null;
  open: boolean;
  onClose: () => void;
}

function SettingIcon({ setting }: { setting: ParentHomeActivitySetting }) {
  switch (setting) {
    case "kitchen":
      return <Utensils className="h-4 w-4 text-royal-orange" aria-hidden="true" />;
    case "shopping":
      return <ShoppingBag className="h-4 w-4 text-brand-deep" aria-hidden="true" />;
    case "car":
      return <Car className="h-4 w-4 text-royal" aria-hidden="true" />;
    case "reading":
      return <BookOpen className="h-4 w-4 text-indigo-600" aria-hidden="true" />;
    case "outdoor":
      return <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />;
    case "home":
    default:
      return <Home className="h-4 w-4 text-royal" aria-hidden="true" />;
  }
}

export function SkillDetailModal({ item, open, onClose }: SkillDetailModalProps) {
  if (!item) return null;

  const { catalogueItem, parentContent, strand, level, learningArea } = item;
  const officialCode = catalogueItem.node.officialCode || catalogueItem.node.nodeKey;
  const vcaaUrl = getVcaaSourceUrl(officialCode);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={catalogueItem.node.label}
      description={`Victorian Curriculum F–10 Version 2.0 • Level ${level} • ${learningArea} (${strand})`}
      className="max-w-2xl"
    >
      <div className="space-y-6 pt-2">
        {/* Metadata Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-royal bg-royal/10 border border-royal/15 px-2.5 py-1 rounded-lg">
              {officialCode}
            </span>
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {strand}
            </span>
          </div>
          <CoverageBadge coverage={catalogueItem.coverage} />
        </div>

        {/* What this means */}
        <div className="space-y-2">
          <h3 className="text-sm font-extrabold tracking-tight text-ink uppercase text-[11px] text-muted">
            What this skill means
          </h3>
          <p className="text-sm sm:text-base leading-relaxed text-ink/90">
            {parentContent.whatThisMeans}
          </p>
        </div>

        {/* Why it matters */}
        <div className="rounded-2xl border border-royal/10 bg-royal/5 p-4 sm:p-5 space-y-1.5">
          <h3 className="text-xs font-extrabold text-royal uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Why it matters for your child
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed text-ink/85">
            {parentContent.whyItMatters}
          </p>
        </div>

        {/* Low-barrier Home Activities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold tracking-wider text-muted uppercase">
              Everyday Home Activities ({parentContent.homeActivities.length})
            </h3>
            <span className="text-xs text-muted font-medium">Quick &amp; practical</span>
          </div>

          <div className="space-y-3">
            {parentContent.homeActivities.map((activity, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-line bg-tint/30 p-4 transition-all hover:border-royal/20 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white border border-line shadow-xs">
                      <SettingIcon setting={activity.setting} />
                    </span>
                    <h4 className="font-extrabold text-ink text-sm sm:text-base">
                      {activity.title}
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-muted bg-white border border-line rounded-lg px-2 py-0.5 shrink-0">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {activity.estimatedMinutes} mins
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-ink/80 leading-relaxed pl-9">
                  {activity.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Outbound VCAA Link Footer */}
        <div className="border-t border-line pt-4 flex items-center justify-between flex-wrap gap-3 text-xs text-muted">
          <span>Source: Victorian Curriculum and Assessment Authority (VCAA)</span>
          <a
            href={vcaaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-royal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30 rounded-md py-1 px-2"
          >
            View on official VCAA site
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    </Modal>
  );
}
