"use client";

import { useMemo } from "react";
import {
  computeCartCount,
  computeCartSubtotal,
  resolveCartLines,
  shippingForSubtotal,
} from "@/lib/cart";
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

  const items = useMemo(() => resolveCartLines(cart), [cart]);
  const subtotal = useMemo(() => computeCartSubtotal(cart), [cart]);
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
