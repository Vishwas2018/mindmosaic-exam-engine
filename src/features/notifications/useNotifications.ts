"use client";

import { useCallback, useMemo, useState } from "react";

import {
  NOTIFICATION_TYPE_ORDER,
  type AppNotification,
  type NotificationType,
} from "./types";

export interface NotificationGroup {
  type: NotificationType;
  notifications: AppNotification[];
}

export interface UseNotificationsResult {
  notifications: AppNotification[];
  groupedByType: NotificationGroup[];
  unreadCount: number;
  markOneRead: (id: string) => void;
  markAllRead: () => void;
}

/**
 * In-memory, prop-driven notification store. Callers own the actual data
 * fetch/subscription (Realtime, polling, whatever) and pass the resulting
 * list in as `initialNotifications`; this hook only tracks read/unread UI
 * state locally, so it re-seeds whenever the caller passes a new list in
 * (e.g. after a refetch) but never calls out to a backend itself.
 */
export function useNotifications(
  initialNotifications: AppNotification[],
): UseNotificationsResult {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markOneRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const groupedByType = useMemo(() => {
    return NOTIFICATION_TYPE_ORDER.map((type) => ({
      type,
      notifications: notifications.filter((notification) => notification.type === type),
    })).filter((group) => group.notifications.length > 0);
  }, [notifications]);

  return { notifications, groupedByType, unreadCount, markOneRead, markAllRead };
}
