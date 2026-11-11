import type { ReactNode } from "react";
import { AlertCircle, BookOpen, Info, LoaderCircle } from "lucide-react";

/**
 * The four parent state blocks (§4.4 of Parent Journey specification):
 *
 * "The four state blocks: Loading, nothing yet, not enough yet, could not load.
 * They never share an icon, a colour or a sentence.
 *
 * 1. Loading: role='status', 'Checking this week's practice...'
 * 2. Nothing yet: 'Nothing finished yet', A fact about the child.
 * 3. Not enough yet: 'Not enough yet to show trends', Below the floor.
 * 4. Could not load: 'We couldn't load this section.', Nothing has changed. A fact about us."
 */

export interface BaseStateBlockProps {
  className?: string;
}

export function LoadingStateBlock({ className = "" }: BaseStateBlockProps): ReactNode {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center rounded-2xl border border-royal/10 bg-white p-8 text-center shadow-sm sm:p-12 ${className}`}
    >
      <LoaderCircle
        aria-hidden="true"
        className="h-8 w-8 animate-spin text-royal"
      />
      <h3 className="mt-4 text-base font-extrabold text-ink">
        Checking this week&apos;s practice...
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Loading your family&apos;s recent activity.
      </p>
    </div>
  );
}

export interface NothingYetStateBlockProps extends BaseStateBlockProps {
  childName?: string;
  description?: string;
  action?: ReactNode;
}

export function NothingYetStateBlock({
  childName,
  description,
  action,
  className = "",
}: NothingYetStateBlockProps): ReactNode {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-royal/10 bg-white p-8 text-center shadow-sm sm:p-12 ${className}`}
    >
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-royal/8 text-royal"
      >
        <BookOpen className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-extrabold text-ink">
        Nothing finished yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted">
        {description ??
          (childName
            ? `Once ${childName} completes a practice session or exam, their work will appear here.`
            : "Once practice is completed, work will appear here.")}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export interface NotEnoughYetStateBlockProps extends BaseStateBlockProps {
  papersCount?: number;
  marksCount?: number;
  description?: string;
}

export function NotEnoughYetStateBlock({
  papersCount,
  marksCount,
  description,
  className = "",
}: NotEnoughYetStateBlockProps): ReactNode {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center sm:p-12 ${className}`}
    >
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700"
      >
        <Info className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-extrabold text-ink">
        Not enough yet to show trends
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted">
        {description ??
          "Needs at least 2 finished papers and 8 marks to establish reliable evidence."}
      </p>
      {papersCount !== undefined && marksCount !== undefined && (
        <p className="mt-2 text-xs font-semibold text-muted">
          Current recorded work: {papersCount}{" "}
          {papersCount === 1 ? "paper" : "papers"} · {marksCount}{" "}
          {marksCount === 1 ? "mark" : "marks"}
        </p>
      )}
    </div>
  );
}

export interface CouldNotLoadStateBlockProps extends BaseStateBlockProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function CouldNotLoadStateBlock({
  title = "We couldn't load this section.",
  description = "Nothing has changed on your account. Please refresh or try again in a few minutes.",
  onRetry,
  className = "",
}: CouldNotLoadStateBlockProps): ReactNode {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-2xl border border-error/20 bg-error/5 p-8 text-center sm:p-12 ${className}`}
    >
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-error"
      >
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-extrabold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-royal px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-royal/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/30"
        >
          Try again
        </button>
      )}
    </div>
  );
}
