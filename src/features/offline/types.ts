export type OfflineQueueStatus = "online" | "offline" | "syncing" | "synced";

export interface QueuedAnswer<T = unknown> {
  id: string;
  payload: T;
  queuedAt: string;
  status: "pending" | "failed";
}
