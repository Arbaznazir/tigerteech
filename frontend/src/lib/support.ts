import { API_URL } from "@/lib/api";
import { getCustomerToken } from "@/lib/customer-auth";

export type SupportMessage = {
  id: string;
  ticketId: string;
  sender: "user" | "admin" | string;
  body: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  userId: string;
  orderId: string;
  status: string;
  userBurst: number;
  reopenCount?: number;
  reopensRemaining?: number;
  canSend: boolean;
  canReopen?: boolean;
  createdAt: string;
  updatedAt: string;
  preview?: string;
  orderName?: string;
  messages?: SupportMessage[];
  order?: {
    items?: { productName: string }[];
  };
};

export type AppNotification = {
  id: string;
  ticketId?: string;
  orderId?: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
};

async function authed<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getCustomerToken();
  if (!token) throw new Error("Please log in again.");
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  const json = (await res.json()) as { data?: T; error?: string | null };
  if (!res.ok || json.error || json.data == null) {
    throw new Error(json.error || "Request failed");
  }
  return json.data;
}

export function openTicket(orderId: string) {
  return authed<SupportTicket>("/api/v1/support/tickets", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}

export function listTickets() {
  return authed<{ items: SupportTicket[] }>("/api/v1/support/tickets");
}

export function getTicket(id: string) {
  return authed<SupportTicket>(`/api/v1/support/tickets/${id}`);
}

export function sendTicketMessage(id: string, body: string) {
  return authed<SupportTicket>(`/api/v1/support/tickets/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function reopenTicket(id: string) {
  return authed<SupportTicket>(`/api/v1/support/tickets/${id}/reopen`, {
    method: "POST",
  });
}

export function listNotifications() {
  return authed<{ items: AppNotification[]; unread: number }>(
    "/api/v1/notifications"
  );
}

export function markNotificationRead(id: string) {
  return authed<{ ok: boolean }>(`/api/v1/notifications/${id}/read`, {
    method: "POST",
  });
}

export function markTicketRead(id: string) {
  return authed<{ ok: boolean }>(`/api/v1/support/tickets/${id}/read`, {
    method: "POST",
  });
}

export function cancelOrder(id: string) {
  return authed<{ id: string; status: string }>(`/api/v1/orders/${id}/cancel`, {
    method: "POST",
  });
}
