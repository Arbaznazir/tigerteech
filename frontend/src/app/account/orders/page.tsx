"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderCard } from "@/components/account/OrderCard";
import { Button } from "@/components/ui/Button";
import {
  fetchCustomerOrders,
  type CustomerOrder,
} from "@/lib/customer-orders";
import { useMoney } from "@/lib/use-money";
import { useStore } from "@/lib/store";

const PAGE = 10;

export default function OrderHistoryPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const user = useStore((s) => s.user);
  const { formatPrice } = useMoney();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const offsetRef = useRef(0);
  const loadingRef = useRef(false);
  const doneRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hydrated && !user) router.replace("/account/login");
  }, [hydrated, user, router]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || doneRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const page = await fetchCustomerOrders(PAGE, offsetRef.current);
      setTotal(page.total);
      setOrders((prev) => {
        const seen = new Set(prev.map((order) => order.id));
        return [...prev, ...page.items.filter((order) => !seen.has(order.id))];
      });
      offsetRef.current += page.items.length;
      if (page.items.length === 0 || offsetRef.current >= page.total) {
        doneRef.current = true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadMore();
  }, [user, loadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !user) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "240px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [user, loadMore, orders.length]);

  if (!hydrated || !user) {
    return (
      <div className="container-site py-20 text-center text-muted">Loading…</div>
    );
  }

  return (
    <div className="container-site max-w-3xl py-10 md:py-14">
      <Link
        href="/account"
        className="text-[12px] font-semibold uppercase tracking-wide text-muted"
      >
        Account
      </Link>
      <div className="mt-3 mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
          My Orders
        </p>
        <h1 className="font-display text-4xl md:text-5xl">Order History</h1>
        <p className="mt-2 text-sm text-muted">
          {total
            ? `${total} order${total === 1 ? "" : "s"} · newest first`
            : "Every order you place shows up here."}
        </p>
      </div>

      {orders.length === 0 && !loading ? (
        <div className="rounded-2xl border border-line bg-paper p-8 text-center">
          <p className="text-muted">No orders yet.</p>
          <Button href="/shop" className="mt-4">
            Start Shopping
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              price={formatPrice(order.totals?.total ?? 0)}
            />
          ))}
        </ul>
      )}

      <div ref={sentinelRef} className="h-8" />
      {loading ? (
        <p className="pb-8 text-center text-sm text-muted">Loading orders…</p>
      ) : null}
      {error ? <p className="pb-8 text-center text-sm text-red-600">{error}</p> : null}
      {!loading && orders.length > 0 && orders.length >= total ? (
        <p className="pb-8 text-center text-[12px] text-muted">
          That’s every order.
        </p>
      ) : null}
    </div>
  );
}
