"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { NOTIFICATION_TYPE_LABELS, type AppNotification } from "./types";
import type { NotificationGroup } from "./useNotifications";

export interface NotificationCentreProps {
  notifications: AppNotification[];
  groupedByType: NotificationGroup[];
  unreadCount: number;
  onMarkOneRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate?: (notification: AppNotification) => void;
  className?: string;
}

export function NotificationCentre({
  groupedByType,
  unreadCount,
  onMarkOneRead,
  onMarkAllRead,
  onNavigate,
  className,
}: NotificationCentreProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const hasNotifications = groupedByType.length > 0;

  return (
    <div ref={containerRef} className={twMerge("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-royal transition hover:bg-royal/8"
      >
        <Bell aria-hidden="true" className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-extrabold leading-none text-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <span aria-live="polite" className="sr-only">
        {unreadCount > 0 ? `${unreadCount} unread notifications` : "No unread notifications"}
      </span>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-royal/10 bg-white shadow-[0_18px_50px_rgba(49,32,86,0.15)]"
        >
          <div className="flex items-center justify-between border-b border-royal/10 px-4 py-3">
            <h2 className="text-sm font-extrabold text-ink">Notifications</h2>
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1 text-xs font-bold text-royal hover:underline disabled:pointer-events-none disabled:opacity-40"
            >
              <Check aria-hidden="true" className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          {hasNotifications ? (
            <ul role="list" className="max-h-96 divide-y divide-royal/8 overflow-y-auto">
              {groupedByType.map((group) => (
                <li key={group.type}>
                  <p className="bg-page px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-muted">
                    {NOTIFICATION_TYPE_LABELS[group.type]}
                  </p>
                  <ul role="list">
                    {group.notifications.map((notification) => (
                      <li key={notification.id} className="flex items-start gap-2 px-4 py-3">
                        <a
                          href={notification.href}
                          onClick={() => onNavigate?.(notification)}
                          className="min-w-0 flex-1"
                        >
                          <span className="flex items-center gap-2">
                            {!notification.read && (
                              <span
                                aria-hidden="true"
                                className="h-2 w-2 shrink-0 rounded-full bg-royal-orange"
                              />
                            )}
                            <span
                              className={twMerge(
                                "truncate text-sm text-ink",
                                notification.read ? "font-medium" : "font-extrabold",
                              )}
                            >
                              {notification.title}
                            </span>
                          </span>
                          {notification.description && (
                            <span className="mt-0.5 block truncate text-xs text-muted">
                              {notification.description}
                            </span>
                          )}
                        </a>
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => onMarkOneRead(notification.id)}
                            aria-label={`Mark "${notification.title}" as read`}
                            className="shrink-0 rounded-full p-1 text-muted hover:bg-royal/8 hover:text-royal"
                          >
                            <Check aria-hidden="true" className="h-4 w-4" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted">You&apos;re all caught up.</p>
          )}
        </div>
      )}
    </div>
  );
}
