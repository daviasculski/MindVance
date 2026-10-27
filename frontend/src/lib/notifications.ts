import { apiRequest } from "./api";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  ideaId: string | null;
  /** "idea:<id>" | "evaluate" | "triage" | "decision" */
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function listNotifications(token: string): Promise<{ unreadCount: number; items: AppNotification[] }> {
  return apiRequest("/notifications", { token });
}

export function markNotificationRead(id: string, token: string): Promise<unknown> {
  return apiRequest(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH", token });
}

export function markAllNotificationsRead(token: string): Promise<unknown> {
  return apiRequest("/notifications/read-all", { method: "PATCH", token });
}

/** "há 5 min", "há 2 h", "há 3 dias" */
export function timeAgo(date: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}
