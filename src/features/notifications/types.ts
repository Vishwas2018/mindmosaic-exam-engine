export type NotificationType =
  | "assignment"
  | "learning-plan"
  | "intervention"
  | "subscription";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  href: string;
  createdAt: string;
  read: boolean;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  assignment: "Assignments",
  "learning-plan": "Learning plan",
  intervention: "Interventions",
  subscription: "Subscription",
};

export const NOTIFICATION_TYPE_ORDER: readonly NotificationType[] = [
  "assignment",
  "learning-plan",
  "intervention",
  "subscription",
];
