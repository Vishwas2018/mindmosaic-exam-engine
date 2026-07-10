import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { twMerge } from "tailwind-merge";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={twMerge(
        "rounded-3xl border border-dashed border-royal/20 bg-white/70 px-6 py-12 text-center",
        className,
      )}
      aria-labelledby="empty-state-title"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/8 text-royal">
        {icon ?? <Inbox aria-hidden="true" className="h-6 w-6" />}
      </div>
      <h2 id="empty-state-title" className="text-xl font-extrabold text-ink">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </section>
  );
}
