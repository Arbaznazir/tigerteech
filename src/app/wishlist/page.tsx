"use client";

import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/Button";
import { products } from "@/data/products";
import { useStore } from "@/lib/store";

export default function WishlistPage() {
  const hydrated = useStore((s) => s.hydrated);
  const wishlist = useStore((s) => s.wishlist);
  const items = products.filter((p) => wishlist.includes(p.id));

  if (!hydrated) {
    return (
      <div className="container-site py-20 text-center text-muted">Loading…</div>
    );
  }

  return (
    <div className="container-site py-10 md:py-14">
      <h1 className="font-display mb-2 text-4xl md:text-5xl">Wishlist</h1>
      <p className="mb-8 text-sm text-muted">{items.length} saved items</p>
      {items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted">No favorites yet. Go find your wild side.</p>
          <Button href="/shop" className="mt-6">
            Browse Shop
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
