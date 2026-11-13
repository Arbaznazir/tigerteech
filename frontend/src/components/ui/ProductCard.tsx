"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { type Product } from "@/data/products";
import { useMoney } from "@/lib/use-money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

type Props = {
  product: Product;
  variant?: "bestseller" | "arrival";
};

export function ProductCard({ product }: Props) {
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
    <article className="group flex h-full min-w-0 flex-col">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-[0_8px_28px_rgba(18,16,14,0.06)] transition duration-500 ease-out group-hover:-translate-y-1.5 group-hover:border-orange/30 group-hover:shadow-[0_22px_50px_rgba(18,16,14,0.14)]">
        {/* Media */}
        <div className="relative shrink-0">
          <Link
            href={`/product/${product.slug}`}
            className="relative block aspect-[2/3] overflow-hidden bg-soft"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width:768px) 50vw, 22vw"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,9,8,0.12)_0%,transparent_32%,transparent_68%,rgba(10,9,8,0.28)_100%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 group-hover:bg-[radial-gradient(circle_at_50%_20%,rgba(243,129,32,0.16),transparent_50%)]" />
          </Link>

          {product.badge && (
            <span
              className={cn(
                "absolute left-3 top-3 z-[2] rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] md:text-[10px]",
                product.badge === "NEW"
                  ? "bg-ink"
                  : product.badge === "Sale"
                    ? "bg-[#b42318]"
                    : "bg-orange text-ink"
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
              "absolute right-3 top-3 z-[2] flex size-9 items-center justify-center rounded-full border backdrop-blur-md transition duration-300 hover:scale-105 active:scale-95",
              liked
                ? "border-[#e11d48]/30 bg-paper text-[#e11d48]"
                : "border-white/60 bg-paper/85 text-ink"
            )}
          >
            <Heart
              className={cn(
                "size-4",
                liked && "fill-[#e11d48] text-[#e11d48]"
              )}
              strokeWidth={1.8}
            />
          </button>
        </div>

        {/* Info — fixed structure so every tile aligns */}
        <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-3.5 pt-3.5 md:px-4 md:pb-4 md:pt-4">
          {product.colors.length > 0 && (
            <div className="mb-2.5 flex items-center gap-1.5">
              {product.colors.slice(0, 4).map((color) => (
                <span
                  key={color}
                  className="size-3 rounded-full ring-1 ring-ink/10 ring-offset-1 ring-offset-paper md:size-3.5"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] font-semibold text-muted">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}

          <Link
            href={`/product/${product.slug}`}
            className="line-clamp-2 min-h-[2.4em] font-display text-[1.2rem] leading-[1.15] tracking-[0.02em] text-ink transition hover:text-orange md:min-h-[2.5em] md:text-[1.45rem]"
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
                      : "fill-transparent text-line"
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-muted">
              {product.rating.toFixed(1)}
              <span className="font-medium text-muted/65">
                {" "}
                ({product.reviewCount})
              </span>
            </span>
          </div>

          <p className="mt-2.5 text-[15px] font-extrabold tracking-tight text-ink md:text-[16px]">
            {formatPriceRange(product.priceMin, product.priceMax)}
          </p>

          <div className="mt-auto pt-3.5">
            {qty > 0 ? (
              <div
                className="inline-flex h-11 w-full items-center justify-between rounded-full bg-orange px-1.5 text-ink shadow-[0_10px_24px_rgba(243,129,32,0.28)]"
                role="group"
                aria-label={`${product.name} quantity`}
              >
                <button
                  type="button"
                  onClick={handleMinus}
                  aria-label="Decrease quantity"
                  className="flex size-9 items-center justify-center rounded-full transition hover:bg-ink/10 active:scale-95"
                >
                  <Minus className="size-4" strokeWidth={2.5} />
                </button>
                <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={handlePlus}
                  aria-label="Increase quantity"
                  className="flex size-9 items-center justify-center rounded-full transition hover:bg-ink/10 active:scale-95"
                >
                  <Plus className="size-4" strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                aria-label={`Add ${product.name} to cart`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-orange hover:text-ink active:scale-[0.98]"
              >
                <ShoppingBag className="size-3.5 shrink-0" strokeWidth={2.25} />
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
