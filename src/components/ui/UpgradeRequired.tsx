import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { twMerge } from "tailwind-merge";

export interface UpgradeRequiredProps {
  title?: string;
  description: string;
  planName?: string;
  action?: ReactNode;
  className?: string;
}

export function UpgradeRequired({
  title = "Upgrade to unlock this",
  description,
  planName,
  action,
  className,
}: UpgradeRequiredProps) {
  return (
    <section
      role="status"
      className={twMerge(
        "rounded-3xl border border-royal-orange/20 bg-[linear-gradient(145deg,#FFFFFF_0%,#FFF7EC_100%)] px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-royal-orange/12 text-warning">
        <Sparkles aria-hidden="true" className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-extrabold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
      {planName && (
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-royal-orange">
          {planName}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </section>
  );
}
