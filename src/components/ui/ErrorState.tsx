import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { twMerge } from "tailwind-merge";

export interface ErrorStateProps {
  title?: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className={twMerge(
        "rounded-3xl border border-error/15 bg-error/5 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-error/10 text-error">
        <AlertTriangle aria-hidden="true" className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-extrabold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </section>
  );
}
