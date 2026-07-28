"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { twMerge } from "tailwind-merge";

export interface WidgetErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/** Compact inline error, for a single widget/panel rather than a full page. */
export function WidgetError({
  title = "This widget couldn't load",
  description,
  onRetry,
  retryLabel = "Retry",
  className,
}: WidgetErrorProps) {
  return (
    <div
      role="alert"
      className={twMerge(
        "flex items-start gap-3 rounded-2xl border border-error/15 bg-error/5 p-4",
        className,
      )}
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-error" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{title}</p>
        {description && (
          <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-royal hover:underline"
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export interface WidgetErrorBoundaryProps {
  children: ReactNode;
  fallback?: (retry: () => void) => ReactNode;
  onError?: (error: unknown) => void;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
}

/**
 * React has no hook for catching render errors, so this is the one place
 * in the shared shell surface a class component is unavoidable. Wraps any
 * single widget so its own render/lifecycle errors can't take down the
 * whole page.
 */
export class WidgetErrorBoundary extends Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  state: WidgetErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): WidgetErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error);
  }

  retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        this.props.fallback(this.retry)
      ) : (
        <WidgetError onRetry={this.retry} />
      );
    }
    return this.props.children;
  }
}
