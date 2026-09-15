"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Heart, ShoppingBag, Star } from "lucide-react";
import { type Product } from "@/data/products";
import { useMoney } from "@/lib/use-money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

type Props = {
  product: Product;
  variant?: "bestseller" | "arrival";
};

export function ProductCard({ product, variant = "bestseller" }: Props) {
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const wishlist = useStore((s) => s.wishlist);
  const addToCart = useStore((s) => s.addToCart);
  const { formatPriceRange } = useMoney();
  const liked = wishlist.includes(product.id);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      size: product.sizes[1] ?? product.sizes[0] ?? "M",
      color: product.colors[0] ?? "#111111",
      quantity: 1,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="group relative flex h-full min-w-0 flex-col">
      <div className="relative overflow-hidden rounded-[1.35rem] bg-[#efece7] shadow-[0_1px_0_rgba(0,0,0,0.04)] transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_22px_48px_rgba(6,35,26,0.14)]">
        {/* Media */}
        <Link
          href={`/product/${product.slug}`}
          className="relative block aspect-[4/5] overflow-hidden"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 22vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
          />

          {/* Atmosphere overlays */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,35,26,0.08)_0%,transparent_28%,transparent_52%,rgba(6,35,26,0.5)_100%)] opacity-80 transition duration-500 group-hover:opacity-100" />
          <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 group-hover:bg-[radial-gradient(circle_at_30%_20%,rgba(243,129,32,0.18),transparent_45%)]" />

          {/* Quick peek — centered so it never sits under the info panel */}
          <span className="pointer-events-none absolute left-1/2 top-[42%] z-[1] inline-flex -translate-x-1/2 translate-y-2 items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-forest opacity-0 shadow-lg backdrop-blur-sm transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            View look
            <ArrowUpRight className="size-3.5" strokeWidth={2.5} />
          </span>
        </Link>

        {product.badge && (
          <span
            className={cn(
              "absolute left-3 top-3 z-[2] rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_6px_16px_rgba(0,0,0,0.18)]",
              product.badge === "NEW"
                ? "bg-ink"
                : product.badge === "Sale"
                  ? "bg-[#b42318]"
                  : "bg-orange"
            )}
          >
            {product.badge}
          </span>
        )}

        <button
          type="button"
          aria-label="Toggle wishlist"
          onClick={() => toggleWishlist(product.id)}
          className={cn(
            "absolute right-3 top-3 z-[2] flex size-10 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition duration-300 hover:scale-105",
            liked
              ? "border border-[#e11d48]/25 bg-white text-[#e11d48]"
              : "border border-white/70 bg-white/90 text-ink"
          )}
        >
          <Heart
            className={cn(
              "size-[17px]",
              liked && "fill-[#e11d48] text-[#e11d48]"
            )}
            strokeWidth={1.75}
          />
        </button>

        {/* Info panel sitting on the card */}
        <div className="relative z-[1] -mt-8 mx-2.5 mb-2.5 rounded-2xl border border-white/70 bg-white/95 p-3.5 shadow-[0_10px_30px_rgba(6,35,26,0.08)] backdrop-blur-md transition duration-500 group-hover:border-orange/25 md:mx-3 md:mb-3 md:p-4">
          <Link
            href={`/product/${product.slug}`}
            className="block font-display text-[1.35rem] leading-[1.05] tracking-[0.04em] text-ink transition hover:text-orange md:text-[1.5rem]"
          >
            {product.name}
          </Link>

          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 text-orange">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-3",
                    i < Math.round(product.rating)
                      ? "fill-orange text-orange"
                      : "fill-transparent text-[#d5d0c8]"
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-muted">
              {product.rating.toFixed(1)}
              <span className="ml-1 font-medium text-muted/70">
                ({product.reviewCount})
              </span>
            </span>
          </div>
          <p className="mt-1.5 text-[13px] font-extrabold tracking-tight text-ink md:text-sm">
            {formatPriceRange(product.priceMin, product.priceMax)}
          </p>

          <div className="mt-3.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Add ${product.name} to cart`}
              className={cn(
                "inline-flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-forest px-3 font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#0a3428] active:scale-[0.98]",
                variant === "arrival" ? "h-9 text-[10px]" : "h-11 text-[11px]",
                added && "bg-orange hover:bg-orange"
              )}
            >
              {added ? (
                <Check className="size-3.5 shrink-0" strokeWidth={2.5} />
              ) : (
                <ShoppingBag className="size-3.5 shrink-0" strokeWidth={2.25} />
              )}
              {added ? "Added" : "Add to Cart"}
            </button>
            {variant === "arrival" && (
              <Link
                href={`/product/${product.slug}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-ink transition hover:border-orange hover:text-orange"
                aria-label={`Open ${product.name}`}
              >
                <ArrowUpRight className="size-3.5" strokeWidth={2.25} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
