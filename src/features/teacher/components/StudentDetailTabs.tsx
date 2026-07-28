"use client";

import { useState, type ReactNode } from "react";

import { Tabs } from "./Tabs";

type StudentDetailTab = "overview" | "mastery" | "notes";

const TABS: { key: StudentDetailTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "mastery", label: "Strand mastery" },
  { key: "notes", label: "Notes & intervention" },
];

/**
 * Assessment-pathway tabs for the Student Detail screen. The tab bar is
 * the only interactive part — each panel's content is server-rendered and
 * handed in as a prop, so this stays a thin client boundary.
 */
export function StudentDetailTabs({
  overview,
  mastery,
  notes,
}: {
  overview: ReactNode;
  mastery: ReactNode;
  notes: ReactNode;
}) {
  const [tab, setTab] = useState<StudentDetailTab>("overview");

  return (
    <div className="space-y-6">
      <Tabs label="Student view" tabs={TABS} active={tab} onChange={setTab} />
      {tab === "overview" && overview}
      {tab === "mastery" && mastery}
      {tab === "notes" && notes}
    </div>
  );
}
