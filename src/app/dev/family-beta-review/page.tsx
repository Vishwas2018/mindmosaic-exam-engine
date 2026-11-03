import Link from "next/link";

import {
  FAMILY_BETA_YEAR_3_CONFIG,
  FAMILY_BETA_YEAR_5_CONFIG,
  loadFamilyBetaFixedPaperQuestions,
  type FamilyBetaPaperConfig,
  type FamilyBetaPaperKind,
} from "@/server/family-beta-fixed-papers";
import {
  FINDING_EXPLANATIONS,
  findingsForQuestion,
  type FindingKind,
} from "@/server/family-beta-review-findings";

interface PaperSummary {
  readonly kind: FamilyBetaPaperKind;
  readonly config: FamilyBetaPaperConfig;
  readonly marks: number;
  readonly byKind: Readonly<Record<string, number>>;
  readonly flagged: { slot: number; kinds: string[] }[];
}

function summarise(kind: FamilyBetaPaperKind, config: FamilyBetaPaperConfig): PaperSummary {
  const authoring = loadFamilyBetaFixedPaperQuestions(kind);
  const byKind: Record<string, number> = {};
  const flagged: { slot: number; kinds: string[] }[] = [];

  config.pinnedQuestions.forEach((pin, index) => {
    const findings = findingsForQuestion(authoring[index]);
    if (findings.length > 0) {
      flagged.push({ slot: pin.slot, kinds: findings.map((f) => f.kind) });
    }
    byKind[pin.type] = (byKind[pin.type] ?? 0) + 1;
  });

  return {
    kind,
    config,
    marks: config.pinnedQuestions.reduce((a, p) => a + p.marks, 0),
    byKind,
    flagged,
  };
}

export default function FamilyBetaReviewIndexPage() {
  const papers = [
    summarise("year3", FAMILY_BETA_YEAR_3_CONFIG),
    summarise("year5", FAMILY_BETA_YEAR_5_CONFIG),
  ];
  const usedKinds = new Set<FindingKind>();
  for (const p of papers)
    for (const f of p.flagged) for (const k of f.kinds) usedKinds.add(k as FindingKind);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">
        Family beta — content review (pending human approval)
      </h1>

      <p className="mt-3 rounded-lg border border-red-400 bg-red-50 p-3 text-sm font-semibold text-red-900">
        No item in either paper carries a human approval record (`approvedBy`). Both papers are
        agent-reviewed only and are not reachable by a family user. Opening or reading these pages
        does not constitute approval.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Papers</h2>
      <ul className="mt-3 space-y-4">
        {papers.map((p) => (
          <li key={p.kind} className="rounded-xl border border-slate-300 bg-white p-4">
            <h3 className="font-semibold text-slate-900">
              <Link href={`/dev/family-beta-review/${p.kind}`} className="underline">
                {p.config.title}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-slate-700">
              {p.config.questionCount} questions · {p.marks} marks · {p.config.timeMinutes} min ·{" "}
              {p.flagged.length} item{p.flagged.length === 1 ? "" : "s"} with findings
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {Object.entries(p.byKind)
                .sort()
                .map(([t, n]) => `${t} ×${n}`)
                .join(" · ")}
            </p>
            {p.flagged.length > 0 ? (
              <p className="mt-2 text-xs text-amber-900">
                findings on Q
                {p.flagged.map((f) => `${f.slot} (${f.kinds.join(", ")})`).join(", Q")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {usedKinds.size > 0 ? (
        <>
          <h2 className="mt-8 text-lg font-semibold text-slate-900">What each finding means</h2>
          <dl className="mt-3 space-y-3">
            {[...usedKinds].sort().map((k) => (
              <div key={k} className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                <dt className="text-sm font-semibold text-amber-900">{k}</dt>
                <dd className="mt-1 text-sm text-amber-900">{FINDING_EXPLANATIONS[k]}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}

      <h2 className="mt-8 text-lg font-semibold text-slate-900">What has been verified</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-slate-700">
        <li>
          All 78 pinned items resolve in the published bank and every canonical SHA-256 matches the
          pin, so the rendered content is the reviewed version.
        </li>
        <li>
          Every expected answer on these pages was solved independently and agreed with the stored
          answer key for all 78 items.
        </li>
        <li>
          Candidate delivery carries no answer key, explanation or rationale for any of the 78
          items.
        </li>
        <li>
          Scoring is server-side only. Be aware that on THIS page the expected answers and
          explanations are in the page payload — the reveal button only hides them visually — because
          this is a reviewer surface. That is why it is gated to non-production deployments and must
          never be opened by a student. The exam itself delivers no answer key.
        </li>
      </ul>
    </main>
  );
}
