"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { OfflineQueueStatus, QueuedAnswer } from "./types";

export interface UseOfflineQueueOptions<T> {
  /** Attempts to sync one queued item; throw/reject to mark it failed and keep it queued. */
  syncItem: (item: QueuedAnswer<T>) => Promise<void>;
  /** Defaults to reading `navigator.onLine`; inject for tests or non-browser environments. */
  getIsOnline?: () => boolean;
  /** Defaults to the browser's online/offline events; inject for tests. */
  subscribeToConnectivity?: (onChange: (online: boolean) => void) => () => void;
  /** Automatically calls flush() when connectivity is regained. Default true. */
  autoFlushOnReconnect?: boolean;
}

export interface UseOfflineQueueResult<T> {
  queue: QueuedAnswer<T>[];
  status: OfflineQueueStatus;
  pendingCount: number;
  enqueue: (payload: T) => string;
  flush: () => Promise<void>;
  retry: (id: string) => Promise<void>;
}

function defaultGetIsOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function defaultSubscribeToConnectivity(onChange: (online: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

/**
 * Storage-free, in-memory sync queue for answers captured while offline.
 * Connectivity and the actual sync call are both injectable so this is
 * unit-testable without a real network or browser events.
 */
export function useOfflineQueue<T>({
  syncItem,
  getIsOnline = defaultGetIsOnline,
  subscribeToConnectivity = defaultSubscribeToConnectivity,
  autoFlushOnReconnect = true,
}: UseOfflineQueueOptions<T>): UseOfflineQueueResult<T> {
  const [queue, setQueue] = useState<QueuedAnswer<T>[]>([]);
  const [status, setStatus] = useState<OfflineQueueStatus>(() =>
    getIsOnline() ? "online" : "offline",
  );
  const nextId = useRef(0);
  const queueRef = useRef(queue);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const flush = useCallback(async () => {
    if (!getIsOnline()) {
      setStatus("offline");
      return;
    }
    const pending = queueRef.current.filter(
      (item) => item.status === "pending" || item.status === "failed",
    );
    if (pending.length === 0) {
      setStatus("synced");
      return;
    }
    setStatus("syncing");
    let anyFailed = false;
    for (const item of pending) {
      try {
        await syncItem(item);
        setQueue((current) => current.filter((entry) => entry.id !== item.id));
      } catch {
        anyFailed = true;
        setQueue((current) =>
          current.map((entry) => (entry.id === item.id ? { ...entry, status: "failed" } : entry)),
        );
      }
    }
    setStatus(anyFailed ? (getIsOnline() ? "online" : "offline") : "synced");
  }, [getIsOnline, syncItem]);

  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const retry = useCallback(
    async (id: string) => {
      const item = queueRef.current.find((entry) => entry.id === id);
      if (!item) return;
      if (!getIsOnline()) {
        setStatus("offline");
        return;
      }
      setStatus("syncing");
      try {
        await syncItem(item);
        setQueue((current) => current.filter((entry) => entry.id !== id));
        const stillPending = queueRef.current.some(
          (entry) => entry.id !== id && (entry.status === "pending" || entry.status === "failed"),
        );
        setStatus(stillPending ? "online" : "synced");
      } catch {
        setQueue((current) =>
          current.map((entry) => (entry.id === id ? { ...entry, status: "failed" } : entry)),
        );
        setStatus(getIsOnline() ? "online" : "offline");
      }
    },
    [getIsOnline, syncItem],
  );

  const enqueue = useCallback((payload: T) => {
    nextId.current += 1;
    const id = `queued-${nextId.current}`;
    setQueue((current) => [
      ...current,
      { id, payload, queuedAt: new Date().toISOString(), status: "pending" },
    ]);
    return id;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToConnectivity((online) => {
      setStatus((current) => (current === "syncing" ? current : online ? "online" : "offline"));
      if (online && autoFlushOnReconnect) {
        void flushRef.current();
      }
    });
    return unsubscribe;
  }, [subscribeToConnectivity, autoFlushOnReconnect]);

  const pendingCount = queue.filter(
    (item) => item.status === "pending" || item.status === "failed",
  ).length;

  return { queue, status, pendingCount, enqueue, flush, retry };
}
