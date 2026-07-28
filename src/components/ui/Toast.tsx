"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  Info,
  TriangleAlert,
  XCircle,
  X,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  variant?: ToastVariant;
  title: string;
  description?: string;
  /** Auto-dismiss delay in ms. Pass `0` to keep the toast until dismissed. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "description">> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  /** Show a toast. Returns its id so it can be dismissed programmatically. */
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;

const variantConfig: Record<
  ToastVariant,
  { icon: typeof Info; accent: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle2,
    accent: "border-success/20",
    iconColor: "text-success",
  },
  error: { icon: XCircle, accent: "border-error/20", iconColor: "text-error" },
  warning: {
    icon: TriangleAlert,
    accent: "border-warning/20",
    iconColor: "text-warning",
  },
  info: { icon: Info, accent: "border-royal/15", iconColor: "text-royal" },
};

/**
 * Wrap the app (or a subtree) in `ToastProvider` and call `useToast().toast(…)`
 * to show transient messages. The viewport is an `aria-live` region so screen
 * readers announce new toasts; errors use `role="alert"` for assertive
 * delivery, everything else uses `role="status"`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idCounter = useRef(0);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      idCounter.current += 1;
      const id = `toast-${idCounter.current}`;
      const duration = options.duration ?? DEFAULT_DURATION;
      const item: ToastItem = {
        id,
        variant: options.variant ?? "info",
        title: options.title,
        description: options.description,
        duration,
      };
      setToasts((current) => [...current, item]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const active = timers.current;
    return () => {
      active.forEach((timer) => clearTimeout(timer));
      active.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      data-testid="toast-viewport"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
    >
      {toasts.map((item) => {
        const config = variantConfig[item.variant];
        const Icon = config.icon;
        return (
          <div
            key={item.id}
            data-testid="toast"
            data-variant={item.variant}
            role={item.variant === "error" ? "alert" : "status"}
            className={twMerge(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white p-4 shadow-[0_12px_32px_rgba(42,16,81,0.16)]",
              config.accent,
            )}
          >
            <Icon
              aria-hidden="true"
              className={twMerge("mt-0.5 h-5 w-5 flex-none", config.iconColor)}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-ink">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-sm leading-5 text-muted">
                  {item.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              aria-label="Dismiss notification"
              className="-mr-1 -mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a <ToastProvider>.");
  }
  return context;
}
