"use client";

import { Download, ShieldCheck } from "lucide-react";

import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { StatCard } from "@/features/admin-analytics/components/StatCard";
import {
  summariseBatchProgress,
  type ReviewBankId,
  type ReviewEntry,
} from "../contracts";
import { buildGovernedExportCsv } from "../export-csv";

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function BatchReadinessPanel({
  bankId,
  entries,
}: {
  readonly bankId: ReviewBankId;
  readonly entries: readonly ReviewEntry[];
}) {
  const batches = summariseBatchProgress(entries);
  const totals = batches.reduce(
    (acc, batch) => ({
      total: acc.total + batch.total,
      approved: acc.approved + batch.approved,
      revise: acc.revise + batch.revise,
      reject: acc.reject + batch.reject,
      pending: acc.pending + batch.pending,
      practice: acc.practice + batch.practiceCount,
      mock: acc.mock + batch.mockCount,
      writing: acc.writing + batch.writingCount,
    }),
    {
      total: 0,
      approved: 0,
      revise: 0,
      reject: 0,
      pending: 0,
      practice: 0,
      mock: 0,
      writing: 0,
    },
  );

  const practiceMcqExport = buildGovernedExportCsv(entries, {
    itemKind: "question",
    poolFilter: "practice",
    includeDecisions: "approved_only",
  });
  const mockMcqExport = buildGovernedExportCsv(entries, {
    itemKind: "question",
    poolFilter: "mock",
    includeDecisions: "approved_only",
  });
  const writingExport = buildGovernedExportCsv(entries, {
    itemKind: "writing_prompt",
    poolFilter: "practice",
    includeDecisions: "approved_only",
  });
  const mockWritingExport = buildGovernedExportCsv(entries, {
    itemKind: "writing_prompt",
    poolFilter: "mock",
    includeDecisions: "approved_only",
  });

  const headCell =
    "px-4 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wider text-muted";
  const bodyCell = "border-t border-royal/8 px-4 py-3 text-sm text-ink";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Human approved"
          value={`${totals.approved} / ${totals.total}`}
          detail="Current revision only"
        />
        <StatCard
          label="Revision / Rejected"
          value={`${totals.revise} / ${totals.reject}`}
          detail="Blocked from publication"
        />
        <StatCard
          label="Practice pool"
          value={String(totals.practice)}
          detail="Separated from unseen mock slots"
        />
        <StatCard
          label="Mock exam reserve"
          value={String(totals.mock)}
          detail="Never mixed into practice exports"
        />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-[family-name:var(--font-instrument-sans)] text-base font-bold text-ink">
              Batch progress &amp; publication readiness
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Tracks human-verified review decisions per batch. AI validation
              passes never count towards human approval.
            </p>
          </div>
          <Badge variant="purple">
            <ShieldCheck aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
            Governed export only — zero auto-publish
          </Badge>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              Batch review progress and publication readiness
            </caption>
            <thead>
              <tr>
                <th scope="col" className={headCell}>
                  Batch
                </th>
                <th scope="col" className={headCell}>
                  Approval progress
                </th>
                <th scope="col" className={headCell}>
                  Approved
                </th>
                <th scope="col" className={headCell}>
                  Revise
                </th>
                <th scope="col" className={headCell}>
                  Rejected
                </th>
                <th scope="col" className={headCell}>
                  Pending
                </th>
                <th scope="col" className={headCell}>
                  Pool split
                </th>
                <th scope="col" className={headCell}>
                  Readiness
                </th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => {
                const pct =
                  batch.total > 0
                    ? Math.round((batch.approved / batch.total) * 100)
                    : 0;
                const ready = batch.approved > 0 && batch.pending === 0 && batch.revise === 0;
                return (
                  <tr key={batch.batchId}>
                    <td className={`${bodyCell} font-mono text-xs font-bold`}>
                      {batch.batchId}
                    </td>
                    <td className={`${bodyCell} min-w-36`}>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={pct} className="w-24" />
                        <span className="text-xs font-bold tabular-nums text-muted">
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className={`${bodyCell} tabular-nums text-success font-bold`}>
                      {batch.approved}
                    </td>
                    <td className={`${bodyCell} tabular-nums text-warning`}>
                      {batch.revise}
                    </td>
                    <td className={`${bodyCell} tabular-nums text-error`}>
                      {batch.reject}
                    </td>
                    <td className={`${bodyCell} tabular-nums text-muted`}>
                      {batch.pending}
                    </td>
                    <td className={`${bodyCell} text-xs`}>
                      <span className="font-semibold">
                        {batch.practiceCount} practice
                      </span>
                      {batch.mockCount > 0 && (
                        <>
                          {" · "}
                          <span className="font-semibold text-royal">
                            {batch.mockCount} mock
                          </span>
                        </>
                      )}
                      {batch.writingCount > 0 && (
                        <>
                          {" · "}
                          <span className="text-muted">
                            {batch.writingCount} writing
                          </span>
                        </>
                      )}
                    </td>
                    <td className={bodyCell}>
                      {ready ? (
                        <Badge variant="success">Ready for export</Badge>
                      ) : batch.approved > 0 ? (
                        <Badge variant="purple">Partial ({batch.approved})</Badge>
                      ) : (
                        <Badge variant="neutral">Draft — awaiting review</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <h3 className="font-[family-name:var(--font-instrument-sans)] text-base font-bold text-ink">
            Governed publication export (separate Practice, Mock &amp; Writing
            tracks)
          </h3>
          <p className="mt-1 text-sm text-muted">
            Download publish-compatible review sheets bound to D3 content hashes
            for human-approved items only. Practice and mock-reserved pools are
            exported separately so unseen mock items never leak into everyday
            practice. Written Expression prompts export directly for
            MindMosaic&apos;s existing{" "}
            <code className="font-mono">human_writing_prompt_approval</code>{" "}
            workflow.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={practiceMcqExport.rowCount === 0}
            onClick={() =>
              downloadTextFile(
                `${bankId}-practice-mcq-approved.csv`,
                practiceMcqExport.csv,
              )
            }
          >
            <Download aria-hidden="true" className="mr-1.5 h-4 w-4" />
            Export Practice MCQ CSV ({practiceMcqExport.rowCount})
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={mockMcqExport.rowCount === 0}
            onClick={() =>
              downloadTextFile(
                `${bankId}-mock-reserve-mcq-approved.csv`,
                mockMcqExport.csv,
              )
            }
          >
            <Download aria-hidden="true" className="mr-1.5 h-4 w-4" />
            Export Mock Reserve MCQ CSV ({mockMcqExport.rowCount})
          </Button>
          {totals.writing > 0 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={writingExport.rowCount === 0}
                onClick={() =>
                  downloadTextFile(
                    `${bankId}-practice-writing-prompts-approved.csv`,
                    writingExport.csv,
                  )
                }
              >
                <Download aria-hidden="true" className="mr-1.5 h-4 w-4" />
                Export Practice Writing Prompts CSV ({writingExport.rowCount})
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={mockWritingExport.rowCount === 0}
                onClick={() =>
                  downloadTextFile(
                    `${bankId}-mock-reserve-writing-prompts-approved.csv`,
                    mockWritingExport.csv,
                  )
                }
              >
                <Download aria-hidden="true" className="mr-1.5 h-4 w-4" />
                Export Mock Reserve Writing CSV ({mockWritingExport.rowCount})
              </Button>
            </>
          )}
        </div>

        <details className="rounded-xl border border-royal/12 bg-page p-4 text-xs text-muted">
          <summary className="cursor-pointer font-semibold text-ink">
            Governed DEV CLI pipeline commands (explicit human execution only)
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 font-mono text-[11px] leading-5 text-ink">
{`# 1. Re-verify DEV review decisions against Git drafts and export publish-compatible CSVs:
npx tsx scripts/export-admin-review-approvals.mts --bank ${bankId} --pool practice --out tmp/review-export

# 2. Record governed human approvals for Written Expression prompts (existing writing-prompt workflow):
npm run content:record-approvals -- --sheet tmp/review-export/writing-prompts-approved.csv --reviewer "<Your Full Name>"

# 3. Publish factory-staged MCQ/Reading candidates & assemble scholarship pool:
npm run questions:publish -- --candidate-ids <ids> --sheet tmp/review-export/questions-approved.csv --reviewer "<Your Full Name>"
npm run questions:assemble-scholarship
npm run content:verify-publication`}
          </pre>
        </details>
      </Card>
    </div>
  );
}
