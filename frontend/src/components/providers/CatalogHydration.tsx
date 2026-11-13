"use client";

import { useEffect } from "react";
import { fetchCategories, fetchProducts } from "@/lib/catalog";

/** Prefetch categories + a small first page for cart/wishlist lookups. */
export function CatalogHydration() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchCategories();
        if (cancelled) return;
        await fetchProducts({ limit: 48, offset: 0 });
      } catch {
        // API offline — pages that fetch on demand will show empty states
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
