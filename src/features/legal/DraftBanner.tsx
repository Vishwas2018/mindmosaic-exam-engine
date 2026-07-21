import { AlertTriangle } from "lucide-react";

/**
 * Required on every legal-adjacent page (privacy, terms, accessibility):
 * these are honest structured drafts written from the actual product
 * behaviour, not final legal text a professional has signed off on.
 */
export function DraftBanner() {
  return (
    <div role="note" className="border-y border-warning/25 bg-warning/8">
      <div className="site-width flex items-start gap-3 py-4">
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-warning"
        />
        <p className="text-sm font-semibold leading-6 text-ink">
          <span className="font-extrabold text-warning">
            DRAFT — requires legal/professional review before public launch.
          </span>{" "}
          This page is a structured, honest draft describing how MindMosaic
          actually works today. It is not final legal text and has not been
          reviewed by a qualified professional — do not treat it as binding.
        </p>
      </div>
    </div>
  );
}
