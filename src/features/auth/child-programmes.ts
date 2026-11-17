/**
 * Programmes a parent can say a child is enrolled in or interested in, chosen
 * when the child is added (AddChildCard) and during parent sign-up
 * (SignUpWizard). Stored on profiles.programmes (see
 * supabase/migrations/20261105090000_profile_programmes.sql).
 *
 * This is a statement of intent, not entitlement: choosing a programme whose
 * content isn't published yet grants nothing and promises nothing. Ids are
 * stable strings; the slugs for the competition/selective/scholarship tracks
 * match programme-catalog.ts so they can be joined later.
 *
 * Deliberately separate from profiles.interests, which holds the student's own
 * subject interests from their onboarding modal and is overwritten by it.
 *
 * No "server-only"/"use client": imported by both the client form and the
 * route handler.
 */
export const CHILD_PROGRAMMES = [
  { id: "australian-curriculum", label: "Australian Curriculum", hint: "Year-level practice" },
  { id: "naplan-icas", label: "NAPLAN / ICAS style", hint: "Exam-style papers" },
  { id: "australian-maths-competition", label: "AMC", hint: "Maths competition" },
  { id: "maths-olympiad", label: "Maths Olympiad", hint: "Advanced problem solving" },
  { id: "selective-entry", label: "Selective Entry", hint: "Placement test prep" },
  { id: "scholarship-prep", label: "Scholarship", hint: "Scholarship test prep" },
  { id: "singapore-maths", label: "Singapore Maths", hint: "Model drawing" },
] as const;

export type ChildProgrammeId = (typeof CHILD_PROGRAMMES)[number]["id"];

export const CHILD_PROGRAMME_IDS = CHILD_PROGRAMMES.map((p) => p.id) as [
  ChildProgrammeId,
  ...ChildProgrammeId[],
];
