"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
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
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const { formatPriceRange } = useMoney();
  const liked = wishlist.includes(product.id);

  const defaultSize = product.sizes[1] ?? product.sizes[0] ?? "M";
  const defaultColor = product.colors[0] ?? "#111111";

  const qty = useMemo(() => {
    const line = cart.find(
      (c) =>
        c.productId === product.id &&
        c.size === defaultSize &&
        c.color === defaultColor
    );
    return line?.quantity ?? 0;
  }, [cart, product.id, defaultSize, defaultColor]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      size: defaultSize,
      color: defaultColor,
      quantity: 1,
    });
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (qty <= 1) {
      removeFromCart(product.id, defaultSize, defaultColor);
      return;
    }
    updateQuantity(product.id, defaultSize, defaultColor, qty - 1);
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      size: defaultSize,
      color: defaultColor,
      quantity: 1,
    });
  };

  return (
    <article className="group relative flex h-full min-w-0 flex-col">
      <div className="relative overflow-hidden rounded-[1.35rem] bg-[#efece7] shadow-[0_1px_0_rgba(0,0,0,0.04)] transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_22px_48px_rgba(6,35,26,0.14)]">
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

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,35,26,0.08)_0%,transparent_28%,transparent_52%,rgba(6,35,26,0.5)_100%)] opacity-80 transition duration-500 group-hover:opacity-100" />
          <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 group-hover:bg-[radial-gradient(circle_at_30%_20%,rgba(243,129,32,0.18),transparent_45%)]" />

          <span className="pointer-events-none absolute left-1/2 top-[42%] z-[1] hidden -translate-x-1/2 translate-y-2 items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-forest opacity-0 shadow-lg backdrop-blur-sm transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:inline-flex">
            View look
            <ArrowUpRight className="size-3.5" strokeWidth={2.5} />
          </span>
        </Link>

        {product.badge && (
          <span
            className={cn(
              "absolute left-2.5 top-2.5 z-[2] rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_6px_16px_rgba(0,0,0,0.18)] md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-[10px]",
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
            "absolute right-2.5 top-2.5 z-[2] flex size-8 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition duration-300 hover:scale-105 md:right-3 md:top-3 md:size-10",
            liked
              ? "border border-[#e11d48]/25 bg-white text-[#e11d48]"
              : "border border-white/70 bg-white/90 text-ink"
          )}
        >
          <Heart
            className={cn(
              "size-3.5 md:size-[17px]",
              liked && "fill-[#e11d48] text-[#e11d48]"
            )}
            strokeWidth={1.75}
          />
        </button>

        <div className="relative z-[1] -mt-7 mx-2 mb-2 rounded-xl border border-white/70 bg-white/95 p-2.5 shadow-[0_10px_30px_rgba(6,35,26,0.08)] backdrop-blur-md transition duration-500 group-hover:border-orange/25 md:-mt-8 md:mx-3 md:mb-3 md:rounded-2xl md:p-4">
          <Link
            href={`/product/${product.slug}`}
            className="block font-display text-[1.05rem] leading-[1.05] tracking-[0.04em] text-ink transition hover:text-orange md:text-[1.5rem]"
          >
            {product.name}
          </Link>

          <div className="mt-1.5 flex items-center gap-1 md:mt-2 md:gap-1.5">
            <div className="flex items-center gap-0.5 text-orange">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-2.5 md:size-3",
                    i < Math.round(product.rating)
                      ? "fill-orange text-orange"
                      : "fill-transparent text-[#d5d0c8]"
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] font-semibold tabular-nums text-muted md:text-[11px]">
              {product.rating.toFixed(1)}
              <span className="ml-0.5 font-medium text-muted/70 md:ml-1">
                ({product.reviewCount})
              </span>
            </span>
          </div>
          <p className="mt-1 text-[12px] font-extrabold tracking-tight text-ink md:mt-1.5 md:text-sm">
            {formatPriceRange(product.priceMin, product.priceMax)}
          </p>

          <div className="mt-2.5 flex items-center gap-1.5 md:mt-3.5">
            {qty > 0 ? (
              <div
                className="inline-flex h-8 min-w-0 flex-1 items-center justify-between rounded-lg bg-forest px-1 text-white md:h-10 md:rounded-xl md:px-1.5"
                role="group"
                aria-label={`${product.name} quantity`}
              >
                <button
                  type="button"
                  onClick={handleMinus}
                  aria-label="Decrease quantity"
                  className="flex size-7 shrink-0 items-center justify-center rounded-md transition hover:bg-white/10 active:scale-95 md:size-8"
                >
                  <Minus className="size-3.5" strokeWidth={2.5} />
                </button>
                <span className="min-w-[1.5rem] text-center text-[12px] font-bold tabular-nums md:text-sm">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={handlePlus}
                  aria-label="Increase quantity"
                  className="flex size-7 shrink-0 items-center justify-center rounded-md transition hover:bg-white/10 active:scale-95 md:size-8"
                >
                  <Plus className="size-3.5" strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                aria-label={`Add ${product.name} to cart`}
                className={cn(
                  "inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-forest px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#0a3428] active:scale-[0.98] md:h-10 md:gap-2 md:rounded-xl md:px-3 md:text-[11px] md:tracking-[0.14em]",
                  variant === "arrival" && "md:h-9"
                )}
              >
                <ShoppingBag
                  className="size-3.5 shrink-0"
                  strokeWidth={2.25}
                />
                <span className="md:hidden">Add</span>
                <span className="hidden md:inline">Add to Cart</span>
              </button>
            )}

            <Link
              href={`/product/${product.slug}`}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink transition hover:border-orange hover:text-orange md:size-9 md:rounded-xl"
              aria-label={`Open ${product.name}`}
            >
              <ArrowUpRight className="size-3.5" strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
