import { clsx } from "clsx";
import { BookOpen, CheckCircle2, Clock, HelpCircle, Sparkles } from "lucide-react";
import type { CurriculumCoverage } from "@/features/curriculum/contracts";
import { resolveCoverageBadge } from "../parent-content";

export interface CoverageBadgeProps {
  coverage?: CurriculumCoverage | null;
  officialCode?: string;
  className?: string;
}

export function CoverageBadge({ coverage, officialCode, className }: CoverageBadgeProps) {
  const { state, meta } = resolveCoverageBadge(coverage, officialCode);

  const getIcon = () => {
    switch (state) {
      case "covered":
        return <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />;
      case "partial":
        return <Sparkles className="h-3.5 w-3.5 text-warning" aria-hidden="true" />;
      case "classroom_only":
        return <BookOpen className="h-3.5 w-3.5 text-muted" aria-hidden="true" />;
      case "not_assessed":
      case "unverified":
      case "transitional":
        return <HelpCircle className="h-3.5 w-3.5 text-muted" aria-hidden="true" />;
      case "empty":
      default:
        return <Clock className="h-3.5 w-3.5 text-muted" aria-hidden="true" />;
    }
  };

  const getVariantStyles = () => {
    switch (meta.variant) {
      case "success":
        return "border-success/20 bg-success/10 text-success font-bold";
      case "warning":
        return "border-warning/25 bg-warning/10 text-warning font-bold";
      case "purple":
        return "border-royal/20 bg-royal/10 text-royal font-bold";
      case "orange":
        return "border-royal-orange/20 bg-royal-orange/10 text-warning font-bold";
      case "neutral":
      default:
        return "border-line bg-tint/60 text-muted font-medium";
    }
  };

  return (
    <span
      className={clsx(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors",
        getVariantStyles(),
        className,
      )}
      title={meta.description}
      aria-label={`Practice coverage: ${meta.label} (${meta.description})`}
    >
      {getIcon()}
      <span>{meta.label}</span>
    </span>
  );
}
