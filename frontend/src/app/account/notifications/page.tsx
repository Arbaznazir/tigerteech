"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  listNotifications,
  markNotificationRead,
  type AppNotification,
} from "@/lib/support";
import { useStore } from "@/lib/store";

export default function NotificationsPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const user = useStore((s) => s.user);
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (hydrated && !user) router.replace("/account/login");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!user) return;
    void listNotifications().then((page) => setItems(page.items || []));
  }, [user]);

  if (!hydrated || !user) {
    return <div className="container-site py-20 text-center text-muted">Loading…</div>;
  }

  return (
    <div className="container-site max-w-3xl py-10 md:py-14">
      <Link href="/account" className="text-[12px] font-semibold uppercase tracking-wide text-muted">
        Account
      </Link>
      <h1 className="font-display mt-3 text-4xl">Notifications</h1>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nothing yet. Replies about your orders show up here.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  void markNotificationRead(item.id).finally(() => {
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
                      router.push(`/account/orders/${item.orderId}${focus}`);
                    }
                  });
                }}
                className={`block w-full rounded-2xl border border-line p-4 text-left ${
                  item.readAt ? "bg-paper" : "bg-orange/10"
                }`}
              >
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
                <p className="mt-2 text-[11px] text-muted">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
