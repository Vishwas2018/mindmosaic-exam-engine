"use client";

import { useId, useState, type ReactNode } from "react";
import { clsx } from "clsx";

export interface TabSection {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Accessible tab strip for the admin dashboards (mockups 14 and 16).
 * Panels arrive fully server-rendered as ReactNode content; this client
 * component only switches which one is visible.
 */
export function TabbedSections({ sections }: { sections: TabSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const baseId = useId();

  return (
    <div>
      <div
        role="tablist"
        aria-label="Report sections"
        className="flex flex-wrap gap-1 border-b border-royal/10"
      >
        {sections.map((section) => {
          const isActive = section.id === activeId;
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${section.id}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${section.id}`}
              onClick={() => setActiveId(section.id)}
              className={clsx(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition",
                isActive
                  ? "border-royal text-royal"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              {section.label}
            </button>
          );
        })}
      </div>
      {sections.map((section) => (
        <div
          key={section.id}
          role="tabpanel"
          id={`${baseId}-panel-${section.id}`}
          aria-labelledby={`${baseId}-tab-${section.id}`}
          hidden={section.id !== activeId}
          className="pt-6"
        >
          {section.content}
        </div>
      ))}
    </div>
  );
}
