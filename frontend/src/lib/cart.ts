import { type Product } from "@/data/products";
import { findProductById } from "@/lib/catalog";
import type { CartItem } from "@/lib/store";

export type CartLine = CartItem & { product: Product };

function stubProductFromCart(c: CartItem): Product | null {
  const image = (c.productImage || "").trim();
  const hasIdentity = Boolean(c.productName || c.productSlug || image);
  // Price-only lines are allowed as a temporary shell while catalog hydrates —
  // never use the brand logo as a fake product photo.
  if (!hasIdentity && c.unitPrice == null && !c.productId) return null;
  if (!c.productId) return null;
  const price = c.unitPrice ?? 0;
  return {
    id: c.productId,
    slug: c.productSlug || c.productId,
    name: c.productName || "Loading…",
    priceMin: price,
    priceMax: price,
    rating: 0,
    reviewCount: 0,
    image: image || "",
    images: image ? [image] : [],
    colors: c.color ? [c.color] : [],
    sizes: [],
    materials: [],
    categories: [],
    description: "",
    details: {
      category: "",
      style: "",
      pattern: "",
      type: "",
      fit: "",
      neck: "",
      bottom: "",
      material: "",
    },
    reviews: [],
  };
}

export function resolveCartLines(cart: CartItem[]): CartLine[] {
  return cart
    .map((c) => {
      const cached = findProductById(c.productId);
      if (cached) {
        const image =
          c.productImage ||
          cached.image ||
          cached.images?.[0] ||
          "/brand-logo.png";
        return {
          ...c,
          product: {
            ...cached,
            name: c.productName || cached.name,
            slug: c.productSlug || cached.slug,
            image,
            images: cached.images?.length ? cached.images : [image],
          },
        };
      }
      const product = stubProductFromCart(c);
      if (!product) return null;
      return { ...c, product };
    })
    .filter(Boolean) as CartLine[];
}

export function lineUnitPrice(item: CartLine): number {
  return item.unitPrice ?? item.product.priceMin ?? 0;
}

export function computeCartSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, c) => {
    const product = findProductById(c.productId);
    const unit = c.unitPrice ?? product?.priceMin ?? 0;
    return sum + unit * c.quantity;
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
