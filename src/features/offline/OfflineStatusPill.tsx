import { CheckCircle2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { twMerge } from "tailwind-merge";

import type { OfflineQueueStatus } from "./types";

export interface OfflineStatusPillProps {
  status: OfflineQueueStatus;
  pendingCount?: number;
  className?: string;
}

const STATUS_CONFIG: Record<
  OfflineQueueStatus,
  { label: string; icon: typeof Wifi; classes: string; spin?: boolean }
> = {
  online: { label: "Online", icon: Wifi, classes: "border-success/15 bg-success/10 text-success" },
  offline: {
    label: "Offline — answers will sync later",
    icon: WifiOff,
    classes: "border-warning/15 bg-warning/10 text-warning",
  },
  syncing: {
    label: "Syncing…",
    icon: RefreshCw,
    classes: "border-royal/10 bg-royal/8 text-royal",
    spin: true,
  },
  synced: {
    label: "All answers synced",
    icon: CheckCircle2,
    classes: "border-success/15 bg-success/10 text-success",
  },
};

export function OfflineStatusPill({ status, pendingCount, className }: OfflineStatusPillProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const label =
    status === "offline" && pendingCount
      ? `Offline — ${pendingCount} answer${pendingCount === 1 ? "" : "s"} waiting to sync`
      : config.label;

  return (
    <span
      role="status"
      aria-live="polite"
      className={twMerge(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold leading-none tracking-[0.01em]",
        config.classes,
        className,
      )}
    >
      <Icon aria-hidden="true" className={twMerge("h-3.5 w-3.5", config.spin && "animate-spin")} />
      {label}
    </span>
  );
}
