"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { CartEmpty } from "@/components/cart/CartEmpty";
import { lineUnitPrice } from "@/lib/cart";
import { useCart } from "@/lib/use-cart";
import { useMoney } from "@/lib/use-money";

export default function CartPage() {
  const {
    hydrated,
    items,
    count,
    subtotal,
    shipping,
    total,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const { formatPrice } = useMoney();
  const productTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const item of items) {
      totals[item.productId] =
        (totals[item.productId] || 0) + lineUnitPrice(item) * item.quantity;
    }
    return totals;
  }, [items]);

  if (!hydrated) {
    return (
      <div className="container-site py-24 text-center text-sm text-muted">
        Loading bag…
      </div>
    );
  }

  if (items.length === 0) {
    return <CartEmpty />;
  }

  return (
    <div className="relative overflow-hidden bg-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[220px] bg-[radial-gradient(ellipse_at_top,rgba(243,129,32,0.1),transparent_55%)]"
      />

      <div className="relative border-b border-line/70 bg-white/70 backdrop-blur-sm">
        <div className="container-site py-5 md:py-7">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.28em] text-orange">
              Tigerteeh bag
            </p>
            <h1 className="font-display text-[2.35rem] leading-none tracking-wide text-forest md:text-5xl">
              YOUR{" "}
              <span className="text-wild text-[clamp(2.2rem,5.5vw,3.35rem)]">
                BAG
              </span>
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
              {count} {count === 1 ? "look" : "looks"} staged and ready.
              Review sizes, then check out when the vibe is locked.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-site relative py-7 md:py-9">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
                Bag contents
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/account/orders"
                  className="text-[11px] font-bold uppercase tracking-[0.14em] text-forest transition hover:text-orange"
                >
                  My orders
                </Link>
                <Link
                  href="/shop"
                  className="text-[11px] font-bold uppercase tracking-[0.14em] text-forest transition hover:text-orange"
                >
                  + Add more
                </Link>
              </div>
            </div>
            <ul className="space-y-5">
              {items.map((item, index) => (
                <CartLineItem
                  key={`${item.productId}-${item.size}-${item.color}`}
                  item={item}
                  index={index}
                  formatPrice={formatPrice}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </ul>
          </div>

          <CartSummary
            count={count}
            subtotal={subtotal}
            shipping={shipping}
            total={total}
            productIds={items.map((i) => i.productId)}
            productTotals={productTotals}
            formatPrice={formatPrice}
          />
        </div>
      </div>
    </div>
  );
}
