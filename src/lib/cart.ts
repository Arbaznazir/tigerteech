import { products, type Product } from "@/data/products";
import type { CartItem } from "@/lib/store";

export type CartLine = CartItem & { product: Product };

export function resolveCartLines(cart: CartItem[]): CartLine[] {
  return cart
    .map((c) => {
      const product = products.find((p) => p.id === c.productId);
      if (!product) return null;
      return { ...c, product };
    })
    .filter(Boolean) as CartLine[];
}

export function computeCartSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, c) => {
    const product = products.find((p) => p.id === c.productId);
    return sum + (product?.priceMin ?? 0) * c.quantity;
  }, 0);
}

export function computeCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.quantity, 0);
}

export function freeShippingRemaining(subtotal: number, threshold = 99): number {
  if (subtotal <= 0 || subtotal >= threshold) return 0;
  return threshold - subtotal;
}

export function shippingForSubtotal(subtotal: number, threshold = 99): number {
  if (subtotal === 0 || subtotal >= threshold) return 0;
  return 9.99;
}
