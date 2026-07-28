"use client";

import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export interface TabItem<Key extends string> {
  key: Key;
  label: string;
}

/**
 * Minimal ARIA tablist. Renders only the tab bar — the consuming screen
 * owns the panel markup, switching on `active`, which keeps this generic
 * enough for the Student Detail, Analytics and Assignments screens alike.
 */
export function Tabs<Key extends string>({
  tabs,
  active,
  onChange,
  label,
  className,
}: {
  tabs: readonly TabItem<Key>[];
  active: Key;
  onChange: (key: Key) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={twMerge(
        "flex flex-wrap gap-1 rounded-2xl border border-royal/10 bg-white p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            id={`tab-${tab.key}`}
            aria-controls={`tabpanel-${tab.key}`}
            onClick={() => onChange(tab.key)}
            className={
              isActive
                ? "rounded-xl bg-royal px-4 py-2 text-sm font-bold text-white"
                : "rounded-xl px-4 py-2 text-sm font-bold text-muted transition hover:bg-royal/5 hover:text-ink"
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel<Key extends string>({
  tabKey,
  active,
  children,
}: {
  tabKey: Key;
  active: Key;
  children: ReactNode;
}) {
  if (tabKey !== active) return null;
  return (
    <div role="tabpanel" id={`tabpanel-${tabKey}`} aria-labelledby={`tab-${tabKey}`}>
      {children}
    </div>
  );
}
