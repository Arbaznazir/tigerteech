"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  listNotifications,
  markNotificationRead,
  type AppNotification,
} from "@/lib/support";
import { getCustomerToken } from "@/lib/customer-auth";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  tone?: "light" | "dark";
};

export function NotificationBell({ className, tone = "light" }: Props) {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const hydrated = useStore((s) => s.hydrated);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!user || !getCustomerToken()) {
      setItems([]);
      setUnread(0);
      return;
    }
    try {
      const page = await listNotifications();
      setItems(page.items || []);
      setUnread(page.unread || 0);
    } catch {
      setItems([]);
      setUnread(0);
    }
  }, [user]);

  useEffect(() => {
    if (!hydrated || !user) return;
    void refresh();
    const id = window.setInterval(() => void refresh(), 45000);
    const onNotify = () => void refresh();
    window.addEventListener("tt:notifications", onNotify);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("tt:notifications", onNotify);
    };
  }, [hydrated, user, refresh]);

  useEffect(() => {
    if (!open) return;
    void refresh();
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, refresh]);

  if (!hydrated || !user) return null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex size-10 items-center justify-center rounded-full transition",
          tone === "dark"
            ? "border border-white/12 bg-white/[0.06] text-white"
            : "text-ink hover:bg-soft hover:text-orange"
        )}
      >
        <Bell className="size-[18px] md:size-[20px]" strokeWidth={1.7} />
        {unread > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-orange text-[9px] font-bold text-ink">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-[70] mt-2 w-[min(92vw,320px)] overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_18px_48px_rgba(18,16,14,0.2)]">
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
              Notifications
            </p>
            <Link
              href="/account/notifications"
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold text-orange"
            >
              View all
            </Link>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3.5 py-6 text-center text-[12px] text-muted">
                No updates yet.
              </li>
            ) : (
              items.slice(0, 8).map((item) => (
                <li key={item.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      void markNotificationRead(item.id)
                        .catch(() => undefined)
                        .finally(() => {
                          setOpen(false);
                          void refresh();
                          if (item.ticketId) {
                            router.push(`/account/help/${item.ticketId}`);
                          } else if (item.orderId) {
                            const focus =
                              /measurement/i.test(item.title) ||
                              /measurement/i.test(item.body)
                                ? "?focus=measurements"
                                : /address/i.test(item.title) ||
                                    /address/i.test(item.body)
                                  ? "?focus=address"
                                  : "";
                            router.push(
                              `/account/orders/${item.orderId}${focus}`
                            );
                          } else {
                            router.push("/account/notifications");
                          }
                        });
                    }}
                    className={cn(
                      "block w-full px-3.5 py-3 text-left transition hover:bg-soft/70",
                      !item.readAt && "bg-orange/8"
                    )}
                  >
                    <p className="text-[13px] font-semibold text-ink">
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-muted">
                      {item.body}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
