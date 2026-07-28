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
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title?: string;
  description: string;
  variant: ToastVariant;
  /** Milliseconds before auto-dismiss; 0 disables auto-dismiss. */
  duration: number;
}

export type ToastInput = Partial<Omit<Toast, "id">> &
  Pick<Toast, "description">;

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "border-success/20 bg-white text-success",
  error: "border-error/20 bg-white text-error",
  warning: "border-warning/20 bg-white text-warning",
  info: "border-royal/15 bg-white text-royal",
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    nextId.current += 1;
    const id = `toast-${nextId.current}`;
    const toast: Toast = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "info",
      duration: input.duration ?? DEFAULT_DURATION,
    };
    setToasts((current) => [...current, toast]);
    return id;
  }, []);

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  const Icon = VARIANT_ICON[toast.variant];

  return (
    <div
      role="status"
      className={twMerge(
        "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-[0_18px_50px_rgba(49,32,86,0.12)]",
        VARIANT_CLASSES[toast.variant],
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        {toast.title && <p className="text-sm font-bold text-ink">{toast.title}</p>}
        <p className="text-sm leading-5 text-muted">{toast.description}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-full p-1 text-muted hover:bg-royal/8 hover:text-ink"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
