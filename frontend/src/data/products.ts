/**
 * Storefront product helpers.
 * Catalog data comes from the Go API (`@/lib/catalog`). Dummy seed removed.
 */

import {
  findProductBySlug,
  getCategoryCache,
  getProductCache,
} from "@/lib/catalog";
import type { CategorySlug, Product } from "@/data/types";

export type {
  CategorySlug,
  Product,
  ProductDetails,
  ProductReview,
} from "@/data/types";

/** Live catalog cache (hydrated from API). Prefer async fetchers in `@/lib/catalog`. */
export const products: Product[] = new Proxy([] as Product[], {
  get(_target, prop, receiver) {
    const list = getProductCache();
    const value = Reflect.get(list, prop, receiver);
    return typeof value === "function" ? value.bind(list) : value;
  },
  ownKeys() {
    return Reflect.ownKeys(getProductCache());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getProductCache(), prop);
  },
});

export const categories = new Proxy(
  [] as {
    slug: CategorySlug;
    label: string;
    image: string;
    icon?: "flame";
  }[],
  {
    get(_target, prop, receiver) {
      const list = getCategoryCache();
      const value = Reflect.get(list, prop, receiver);
      return typeof value === "function" ? value.bind(list) : value;
    },
    ownKeys() {
      return Reflect.ownKeys(getCategoryCache());
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Reflect.getOwnPropertyDescriptor(getCategoryCache(), prop);
    },
  }
);

export function getProductBySlug(slug: string) {
  return findProductBySlug(slug);
}

export function getProductsByCategory(category: CategorySlug) {
  const list = getProductCache();
  if (category === "new-arrivals") {
    return list.filter((p) => p.newArrival);
  }
  return list.filter((p) => p.categories.includes(category));
}

export function getBestsellers() {
  return getProductCache().filter((p) => p.bestseller);
}

export function getNewArrivals() {
  return getProductCache().filter((p) => p.newArrival);
}

export function searchProducts(query: string) {
  const q = query.toLowerCase().trim();
  const list = getProductCache();
  if (!q) return list;

  const tokens = q.split(/\s+/).filter(Boolean);

  const score = (p: Product) => {
    const name = p.name.toLowerCase();
    const hay = [
      name,
      p.description.toLowerCase(),
      p.details.pattern.toLowerCase(),
      p.details.category.toLowerCase(),
      ...p.categories,
    ].join(" ");

    let s = 0;
    if (name.startsWith(q)) s += 40;
    if (name.includes(q)) s += 24;
    for (const t of tokens) {
      if (name.includes(t)) s += 12;
      if (hay.includes(t)) s += 4;
    }
    if (p.bestseller) s += 2;
    if (p.newArrival) s += 1;
    return s;
  };

  return list
    .map((p) => ({ p, s: score(p) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .map(({ p }) => p);
}

export {
  formatMoney as formatPrice,
  formatMoneyRange as formatPriceRange,
} from "@/lib/currency";
