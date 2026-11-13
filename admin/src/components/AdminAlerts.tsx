"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, MessageCircle, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import { playOrderSound, playQuerySound } from "@/lib/alert-sounds";
import { cn } from "@/lib/cn";

type InboxOrder = {
  id: string;
  customerName: string;
  orderName: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
};

type InboxQuery = {
  id: string;
  userName: string;
  userPhone: string;
  orderName: string;
  preview: string;
  userBurst: number;
  updatedAt: string;
};

type Inbox = {
  pendingOrders: number;
  openQueries: number;
  awaitingReply: number;
  orders: InboxOrder[];
  queries: InboxQuery[];
};

type FeedItem = {
  key: string;
  kind: "order" | "query";
  title: string;
  body: string;
  href: string;
  at: string;
};

const SEEN_ORDERS_KEY = "tt_admin_seen_orders";
const SEEN_QUERIES_KEY = "tt_admin_seen_queries";

function readSeen(key: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeSeen(key: string, set: Set<string>) {
  sessionStorage.setItem(key, JSON.stringify([...set].slice(-80)));
}

export function AdminAlerts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const primed = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api<Inbox>("/api/v1/admin/inbox");
      setInbox(data);

      const seenOrders = readSeen(SEEN_ORDERS_KEY);
      const seenQueries = readSeen(SEEN_QUERIES_KEY);
      let orderHit = false;
      let queryHit = false;
      const nextFeed: FeedItem[] = [];

      for (const order of data.orders || []) {
        const key = `order:${order.id}`;
        nextFeed.push({
          key,
          kind: "order",
          title: "New order",
          body: `${order.customerName || "Customer"} · ${order.orderName}`,
          href: `/orders?focus=${order.id}`,
          at: order.createdAt,
        });
        if (primed.current && !seenOrders.has(order.id)) {
          orderHit = true;
        }
        seenOrders.add(order.id);
      }

      for (const q of data.queries || []) {
        const stamp = `${q.id}:${q.updatedAt}`;
        const key = `query:${stamp}`;
        nextFeed.push({
          key,
          kind: "query",
          title: "Customer message",
          body: `${q.userName || "Customer"} · ${q.orderName}${
            q.preview ? ` — ${q.preview}` : ""
          }`,
          href: `/queries?ticket=${q.id}`,
          at: q.updatedAt,
        });
        if (primed.current && !seenQueries.has(stamp)) {
          queryHit = true;
        }
        seenQueries.add(stamp);
      }

      writeSeen(SEEN_ORDERS_KEY, seenOrders);
      writeSeen(SEEN_QUERIES_KEY, seenQueries);

      if (!primed.current) {
        primed.current = true;
      } else {
        if (orderHit) playOrderSound();
        if (queryHit) playQuerySound();
      }

      setFeed(
        nextFeed
          .sort(
            (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
          )
          .slice(0, 12)
      );
    } catch {
      // ignore transient poll errors
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 12000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Browsers require a user gesture before audio can play.
  useEffect(() => {
    const once = () => {
      try {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (AC) void new AC().resume();
      } catch {
        /* ignore */
      }
      document.removeEventListener("pointerdown", once);
    };
    document.addEventListener("pointerdown", once);
    return () => document.removeEventListener("pointerdown", once);
  }, []);

  const pending = inbox?.pendingOrders || 0;
  const queries = inbox?.awaitingReply || inbox?.openQueries || 0;
  const badge = pending + (inbox?.awaitingReply || 0);

  return (
    <div ref={rootRef} className="relative flex items-center gap-2">
      <Link
        href="/orders?status=pending"
        className="hidden items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ink)] transition hover:border-[var(--orange)] sm:inline-flex"
        title="New orders"
      >
        <ShoppingBag className="size-3.5 text-[var(--orange)]" />
        Orders
        {pending > 0 ? (
          <span className="rounded-full bg-[var(--orange)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ink)]">
            {pending}
          </span>
        ) : null}
      </Link>
      <Link
        href="/queries"
        className="hidden items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ink)] transition hover:border-[var(--orange)] sm:inline-flex"
        title="Customer queries"
      >
        <MessageCircle className="size-3.5 text-[var(--orange)]" />
        Queries
        {queries > 0 ? (
          <span className="rounded-full bg-[var(--ink)] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {inbox?.awaitingReply || inbox?.openQueries || 0}
          </span>
        ) : null}
      </Link>

      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex size-9 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--ink)] transition hover:border-[var(--orange)]"
      >
        <Bell className="size-4" strokeWidth={2} />
        {badge > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--orange)] text-[9px] font-bold text-[var(--ink)]">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_20px_50px_rgba(18,16,14,0.2)]">
          <div className="border-b border-[var(--line)] px-3.5 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink)]">
              Notifications
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              {pending} new order{pending === 1 ? "" : "s"} ·{" "}
              {inbox?.awaitingReply || 0} quer
              {(inbox?.awaitingReply || 0) === 1 ? "y" : "ies"} waiting
            </p>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {feed.length === 0 ? (
              <li className="px-3.5 py-8 text-center text-[12px] text-[var(--muted)]">
                You’re caught up.
              </li>
            ) : (
              feed.map((item) => (
                <li key={item.key} className="border-b border-[var(--line)] last:border-0">
                  <button
                    type="button"
                    className="flex w-full gap-2.5 px-3.5 py-3 text-left transition hover:bg-[var(--soft)]"
                    onClick={() => {
                      setOpen(false);
                      if (item.kind === "order") playOrderSound();
                      else playQuerySound();
                      router.push(item.href);
                    }}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl",
                        item.kind === "order"
                          ? "bg-[var(--orange)]/15 text-[var(--ink)]"
                          : "bg-[var(--soft)] text-[var(--ink)]"
                      )}
                    >
                      {item.kind === "order" ? (
                        <ShoppingBag className="size-3.5" />
                      ) : (
                        <MessageCircle className="size-3.5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-[var(--ink)]">
                        {item.title}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[12px] text-[var(--muted)]">
                        {item.body}
                      </span>
                    </span>
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

export function useAdminNavBadges() {
  const [pendingOrders, setPendingOrders] = useState(0);
  const [awaitingReply, setAwaitingReply] = useState(0);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const data = await api<Inbox>("/api/v1/admin/inbox");
        if (!alive) return;
        setPendingOrders(data.pendingOrders || 0);
        setAwaitingReply(data.awaitingReply || 0);
      } catch {
        /* ignore */
      }
    };
    void tick();
    const id = window.setInterval(tick, 12000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  return { pendingOrders, awaitingReply };
}
