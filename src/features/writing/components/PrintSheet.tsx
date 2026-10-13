import type { ReactNode } from "react";

import { MindMosaicLogo } from "@/components/branding";

import type { WritingTask } from "../task";

import { PrintButton } from "./PrintButton";

/**
 * Lines per page at 9mm pitch. A4 with 15mm margins leaves 267mm; page one
 * spends roughly 105mm on the header and the task, page two roughly 25mm on a
 * running header. The e2e print test renders a real PDF and asserts exactly two
 * pages, so a change here that overflows fails loudly.
 */
const PAGE_ONE_LINES = 16;
const PAGE_TWO_LINES = 26;

function RuledLines({ count }: { count: number }) {
  return (
    <div aria-hidden="true" data-testid="ruled-lines" className="mt-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-[9mm] border-b border-neutral-500" />
      ))}
    </div>
  );
}

/**
 * An A4 print layout: the prompt, the time allowed and ruled lines on two
 * pages, under a MindMosaic header. It deliberately carries no answer, no
 * marking guidance and no hint: it is the same task a child reads on screen.
 *
 * The page-level @page rule and `break-after` do the pagination; on screen the
 * sheet renders as a centred preview and the toolbar stays out of the print.
 */
export function PrintSheet({ task, back }: { task: WritingTask; back: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white">
      <style>{`@page { size: A4; margin: 15mm; } @media print { html, body { background: #fff !important; } }`}</style>

      <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-3 px-4 py-4 print:hidden">
        {back}
        <PrintButton />
      </div>

      <main className="mx-auto max-w-[210mm] bg-white px-[15mm] py-[10mm] text-black shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <section data-testid="print-page" className="print-page" style={{ breakAfter: "page" }}>
          <header className="flex items-end justify-between gap-4 border-b-2 border-black pb-3">
            <MindMosaicLogo size="md" />
            <p className="text-right text-sm font-semibold">Writing practice</p>
          </header>

          <h1 className="mt-4 text-2xl font-extrabold">{task.title}</h1>
          <p className="mt-1 text-base font-semibold" data-testid="print-time-allowed">
            Time allowed: {task.timeLimitMinutes} minutes
          </p>

          <div className="mt-3 grid grid-cols-2 gap-6 text-sm">
            <p className="border-b border-neutral-500 pb-1">Name:</p>
            <p className="border-b border-neutral-500 pb-1">Date:</p>
          </div>

          <p className="mt-5 whitespace-pre-line text-lg leading-8" data-testid="print-prompt">
            {task.prompt}
          </p>
          {task.suggestedWords ? (
            <p className="mt-2 text-sm">
              A guide: about {task.suggestedWords.min} to {task.suggestedWords.max} words. Quality matters more than length.
            </p>
          ) : null}
          <p className="mt-2 text-sm">Write your response on the lines. Use the next page if you need more room.</p>

          <RuledLines count={PAGE_ONE_LINES} />
        </section>

        <section data-testid="print-page" className="print-page">
          <p className="border-b border-neutral-500 pb-1 text-sm font-semibold">
            MindMosaic writing practice · {task.title} (continued)
          </p>
          <RuledLines count={PAGE_TWO_LINES} />
        </section>
      </main>
    </div>
  );
}
