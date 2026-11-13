"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  computeCartCount,
  computeCartSubtotal,
  resolveCartLines,
  shippingForSubtotal,
} from "@/lib/cart";
import {
  ensureProductsByIds,
  getCatalogRevision,
  subscribeCatalog,
} from "@/lib/catalog";
import { useStore } from "@/lib/store";

/**
 * Select raw `cart` (stable reference) and derive lines/totals outside the
 * Zustand selector — calling getCartProducts() inside useStore allocates a new
 * array every snapshot and triggers React's infinite-loop guard.
 */
export function useCart() {
  const cart = useStore((s) => s.cart);
  const hydrated = useStore((s) => s.hydrated);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);
  const enrichCartFromCatalog = useStore((s) => s.enrichCartFromCatalog);
  const catalogRevision = useSyncExternalStore(
    subscribeCatalog,
    getCatalogRevision,
    () => 0
  );

  // Pull any cart products missing from the in-memory catalog cache, then
  // backfill name/image snapshots onto persisted cart lines.
  useEffect(() => {
    if (!hydrated || !cart.length) return;
    const ids = cart.map((c) => c.productId);
    let cancelled = false;
    void ensureProductsByIds(ids)
      .then(() => {
        if (!cancelled) enrichCartFromCatalog();
      })
      .catch(() => {
        if (!cancelled) enrichCartFromCatalog();
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, cart, enrichCartFromCatalog]);

  useEffect(() => {
    if (!hydrated || !cart.length) return;
    enrichCartFromCatalog();
  }, [hydrated, cart, catalogRevision, enrichCartFromCatalog]);

  const items = useMemo(
    () => resolveCartLines(cart),
    [cart, catalogRevision]
  );
  const subtotal = useMemo(
    () => computeCartSubtotal(cart),
    [cart, catalogRevision]
  );
  const count = useMemo(() => computeCartCount(cart), [cart]);
  const shipping = useMemo(() => shippingForSubtotal(subtotal), [subtotal]);

  return {
    cart,
    items,
    subtotal,
    count,
    shipping,
    total: subtotal + shipping,
    hydrated,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}
