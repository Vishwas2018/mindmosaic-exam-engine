"use client";

import { useMemo, useState } from "react";
import { BookOpen, Calculator, Compass, Search, SlidersHorizontal } from "lucide-react";
import type { CurriculumCatalogueItem } from "@/features/curriculum/contracts";
import { getParentCurriculumContent } from "../parent-content";
import { CurriculumNodeCard } from "./CurriculumNodeCard";
import { SkillDetailModal } from "./SkillDetailModal";
import { TermSequencingNotice } from "./TermSequencingNotice";
import {
  ENGLISH_STRANDS,
  MATH_STRANDS,
  getNodeStrand,
  type ExplorerNodeItem,
  type LearningArea,
  type YearLevelChoice,
} from "./types";

export interface ParentCurriculumExplorerProps {
  initialItems: CurriculumCatalogueItem[];
}

export function ParentCurriculumExplorer({ initialItems }: ParentCurriculumExplorerProps) {
  const [selectedJurisdiction] = useState<string>("VIC");
  const [selectedLevel, setSelectedLevel] = useState<YearLevelChoice>("3");
  const [selectedLearningArea, setSelectedLearningArea] = useState<LearningArea>("Mathematics");
  const [selectedStrand, setSelectedStrand] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeModalItem, setActiveModalItem] = useState<ExplorerNodeItem | null>(null);

  // Transform raw catalogue items with parent-facing content
  const explorerItems = useMemo<ExplorerNodeItem[]>(() => {
    return initialItems.map((item) => {
      const code = item.node.officialCode || item.node.nodeKey;
      const isMath = code.startsWith("VC2M");
      const isL3 = code.startsWith("VC2M3") || code.startsWith("VC2E3");
      const strand = getNodeStrand(code);
      const parentContent = getParentCurriculumContent(code, item.node.label);

      return {
        catalogueItem: item,
        parentContent,
        strand,
        level: isL3 ? "3" : "5",
        learningArea: isMath ? "Mathematics" : "English",
      };
    });
  }, [initialItems]);

  // Current strands for the selected learning area
  const availableStrands = useMemo(() => {
    return selectedLearningArea === "Mathematics" ? MATH_STRANDS : ENGLISH_STRANDS;
  }, [selectedLearningArea]);

  // Filter items based on active level, learning area, strand, and search query
  const filteredItems = useMemo(() => {
    return explorerItems.filter((item) => {
      if (item.level !== selectedLevel) return false;
      if (item.learningArea !== selectedLearningArea) return false;
      if (selectedStrand !== "ALL" && item.strand !== selectedStrand) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (item.catalogueItem.node.officialCode || "").toLowerCase();
        const title = (item.catalogueItem.node.label || "").toLowerCase();
        const summary = (item.parentContent.whatThisMeans || "").toLowerCase();
        const why = (item.parentContent.whyItMatters || "").toLowerCase();
        return (
          code.includes(q) ||
          title.includes(q) ||
          summary.includes(q) ||
          why.includes(q) ||
          item.strand.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [explorerItems, selectedLevel, selectedLearningArea, selectedStrand, searchQuery]);

  // Counts by strand for active level & learning area
  const strandCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: 0 };
    for (const item of explorerItems) {
      if (item.level === selectedLevel && item.learningArea === selectedLearningArea) {
        counts.ALL = (counts.ALL || 0) + 1;
        counts[item.strand] = (counts[item.strand] || 0) + 1;
      }
    }
    return counts;
  }, [explorerItems, selectedLevel, selectedLearningArea]);

  // Reset strand filter when switching learning area
  const handleLearningAreaChange = (area: LearningArea) => {
    setSelectedLearningArea(area);
    setSelectedStrand("ALL");
  };

  return (
    <div className="space-y-8">
      {/* Hero / Header Section */}
      <section className="rounded-3xl border border-royal/10 bg-gradient-to-b from-royal/8 via-white to-white p-6 sm:p-10 shadow-xs">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-royal/15 bg-white/80 px-3.5 py-1 text-xs font-extrabold text-royal shadow-xs">
            <Compass className="h-4 w-4" aria-hidden="true" />
            <span>Parent Curriculum Explorer</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">
            What your child learns in Year {selectedLevel}
          </h1>

          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Explore the official Victorian Curriculum F–10 Version 2.0 in plain English. See the exact skills taught in the classroom, why they matter, and quick 5–15 minute activities you can do at home together.
          </p>
        </div>
      </section>

      {/* Main Selectors Toolbar */}
      <section
        aria-label="Curriculum filters"
        className="rounded-2xl border border-line bg-white p-4 sm:p-6 shadow-xs space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Jurisdiction Selector */}
          <div>
            <label
              htmlFor="jurisdiction-select"
              className="block text-xs font-extrabold uppercase tracking-wider text-muted mb-1.5"
            >
              Jurisdiction
            </label>
            <div className="relative">
              <select
                id="jurisdiction-select"
                value={selectedJurisdiction}
                disabled
                className="w-full min-h-12 rounded-xl border border-line bg-tint/40 px-3.5 py-2.5 text-sm font-bold text-ink cursor-default focus:outline-none"
              >
                <option value="VIC">Victoria (VCAA F–10 v2.0)</option>
              </select>
            </div>
            <p className="mt-1 text-[11px] text-muted">Official Victorian Curriculum v2.0</p>
          </div>

          {/* 2. Year Level Toggle */}
          <div>
            <span
              id="year-level-label"
              className="block text-xs font-extrabold uppercase tracking-wider text-muted mb-1.5"
            >
              Year / Curriculum Level
            </span>
            <div
              role="radiogroup"
              aria-labelledby="year-level-label"
              className="grid grid-cols-2 gap-2 min-h-12"
            >
              <button
                type="button"
                role="radio"
                aria-checked={selectedLevel === "3"}
                onClick={() => setSelectedLevel("3")}
                className={`min-h-12 rounded-xl border px-3 text-sm font-extrabold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                  selectedLevel === "3"
                    ? "border-royal bg-royal text-white shadow-sm"
                    : "border-line bg-white text-ink hover:border-royal/30 hover:bg-tint/30"
                }`}
              >
                Year 3 (Level 3)
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={selectedLevel === "5"}
                onClick={() => setSelectedLevel("5")}
                className={`min-h-12 rounded-xl border px-3 text-sm font-extrabold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                  selectedLevel === "5"
                    ? "border-royal bg-royal text-white shadow-sm"
                    : "border-line bg-white text-ink hover:border-royal/30 hover:bg-tint/30"
                }`}
              >
                Year 5 (Level 5)
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted">NAPLAN benchmark years</p>
          </div>

          {/* 3. Learning Area Toggle */}
          <div>
            <span
              id="learning-area-label"
              className="block text-xs font-extrabold uppercase tracking-wider text-muted mb-1.5"
            >
              Learning Area
            </span>
            <div
              role="radiogroup"
              aria-labelledby="learning-area-label"
              className="grid grid-cols-2 gap-2 min-h-12"
            >
              <button
                type="button"
                role="radio"
                aria-checked={selectedLearningArea === "Mathematics"}
                onClick={() => handleLearningAreaChange("Mathematics")}
                className={`min-h-12 flex items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-extrabold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                  selectedLearningArea === "Mathematics"
                    ? "border-royal bg-royal text-white shadow-sm"
                    : "border-line bg-white text-ink hover:border-royal/30 hover:bg-tint/30"
                }`}
              >
                <Calculator className="h-4 w-4" aria-hidden="true" />
                <span>Maths</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={selectedLearningArea === "English"}
                onClick={() => handleLearningAreaChange("English")}
                className={`min-h-12 flex items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-extrabold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                  selectedLearningArea === "English"
                    ? "border-royal bg-royal text-white shadow-sm"
                    : "border-line bg-white text-ink hover:border-royal/30 hover:bg-tint/30"
                }`}
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>English</span>
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted">Core curriculum domains</p>
          </div>
        </div>

        {/* Strand Tabs & Search Row */}
        <div className="border-t border-line/60 pt-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Strand Filter Tabs */}
            <div
              role="tablist"
              aria-label={`${selectedLearningArea} strands`}
              className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedStrand === "ALL"}
                onClick={() => setSelectedStrand("ALL")}
                className={`min-h-10 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                  selectedStrand === "ALL"
                    ? "bg-royal text-white shadow-xs"
                    : "bg-tint/60 text-muted hover:bg-tint hover:text-ink"
                }`}
              >
                All Strands ({strandCounts.ALL || 0})
              </button>

              {availableStrands.map((strand) => {
                const count = strandCounts[strand] || 0;
                const isSelected = selectedStrand === strand;
                return (
                  <button
                    key={strand}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedStrand(strand)}
                    className={`min-h-10 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                      isSelected
                        ? "bg-royal text-white shadow-xs"
                        : "bg-tint/60 text-muted hover:bg-tint hover:text-ink"
                    }`}
                  >
                    {strand} ({count})
                  </button>
                );
              })}
            </div>

            {/* Keyword Search Field */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills or codes..."
                aria-label="Filter skills by keyword"
                className="w-full min-h-10 rounded-xl border border-line bg-tint/30 pl-9 pr-3.5 py-1.5 text-xs sm:text-sm text-ink placeholder:text-muted focus:bg-white focus:border-royal focus:outline-none focus:ring-4 focus:ring-royal/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Term Sequencing Notice */}
      <TermSequencingNotice />

      {/* Results Header / Summary */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted border-b border-line pb-3">
        <p className="font-extrabold text-ink uppercase tracking-wider text-[11px]">
          Showing {filteredItems.length} {filteredItems.length === 1 ? "skill" : "skills"} in {selectedLearningArea} (Level {selectedLevel}
          {selectedStrand !== "ALL" ? ` • ${selectedStrand}` : ""})
        </p>
        <span className="font-medium">Victorian Curriculum v2.0</span>
      </div>

      {/* Node Cards Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <CurriculumNodeCard
              key={item.catalogueItem.node.nodeId}
              item={item}
              onSelect={setActiveModalItem}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center space-y-3 bg-white">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-tint text-muted">
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-extrabold text-ink">No matching skills found</h3>
          <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto">
            {searchQuery
              ? `No skills matched "${searchQuery}". Try a different keyword, clear the search, or switch strands.`
              : "No skills match the selected filter criteria."}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-2 text-xs font-bold text-royal hover:underline"
            >
              Clear search query
            </button>
          )}
        </div>
      )}

      {/* Skill Detail Modal */}
      <SkillDetailModal
        item={activeModalItem}
        open={Boolean(activeModalItem)}
        onClose={() => setActiveModalItem(null)}
      />
    </div>
  );
}
