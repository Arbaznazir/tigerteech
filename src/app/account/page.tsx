"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { products } from "@/data/products";
import { useMoney } from "@/lib/use-money";
import { useStore } from "@/lib/store";

export default function AccountPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const user = useStore((s) => s.user);
  const orders = useStore((s) => s.orders);
  const logout = useStore((s) => s.logout);
  const { formatPrice } = useMoney();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/account/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="container-site py-20 text-center text-muted">Loading…</div>
    );
  }

  const myOrders = orders.filter(
    (o) => o.shippingAddress.email.toLowerCase() === user.email.toLowerCase()
  );

  return (
    <div className="container-site py-10 md:py-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
            My Account
          </p>
          <h1 className="font-display text-4xl md:text-5xl">Hey, {user.name}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="border border-line"
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          Logout
        </Button>
      </div>

      <section>
        <h2 className="font-display mb-4 text-3xl">Order History</h2>
        {myOrders.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center">
            <p className="text-muted">No orders yet.</p>
            <Button href="/shop" className="mt-4">
              Start Shopping
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {myOrders.map((order) => (
              <li
                key={order.id}
                className="rounded-2xl border border-line bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{order.id}</p>
                    <p className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleString()} ·{" "}
                      <span className="capitalize">{order.status}</span>
                    </p>
                  </div>
                  <p className="font-bold">{formatPrice(order.total)}</p>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted">
                  {order.items.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <li key={`${item.productId}-${item.size}-${item.color}`}>
                        {product ? (
                          <Link
                            href={`/product/${product.slug}`}
                            className="hover:text-orange"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          "Product"
                        )}{" "}
                        × {item.quantity} ({item.size})
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
