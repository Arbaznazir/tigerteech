"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { type Product } from "@/data/products";
import { GenderFitMark } from "@/components/ui/GenderFitMark";
import { useStaggeredImageIndex } from "@/hooks/useStaggeredImageIndex";
import { useActiveDeals } from "@/hooks/useActiveDeals";
import {
  discountBadgeLabel,
  findBestDealForProduct,
  salePriceUsd,
} from "@/lib/deals";
import { isRemoteMedia, resolveMediaUrl } from "@/lib/media";
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
  const { formatPrice, formatPriceRange } = useMoney();
  const deals = useActiveDeals();
  const deal = useMemo(
    () => findBestDealForProduct(deals, product),
    [deals, product]
  );
  const liked = wishlist.includes(product.id);

  const gallery = useMemo(() => {
    const list = (product.images?.length ? product.images : [product.image])
      .map(resolveMediaUrl)
      .filter(Boolean);
    return list.length ? list : ["/brand-logo.png"];
  }, [product.images, product.image]);
  const imageIndex = useStaggeredImageIndex(gallery.length, gallery.length > 1);
  const activeImage = gallery[imageIndex] || gallery[0];

  const defaultMat = product.materials?.[0];
  const defaultColorOpt = defaultMat?.colors?.[0];
  const defaultColor =
    defaultColorOpt?.swatch || product.colors[0] || "#111111";
  // Size UI removed — cart key is material only (no S/M/L).
  const cartSize = defaultMat?.name || "Standard";
  const baseUnit = defaultMat?.price ?? product.priceMin;
  const unitPrice = deal ? salePriceUsd(baseUnit, deal) : baseUnit;

  const qty = useMemo(() => {
    const line = cart.find(
      (c) =>
        c.productId === product.id &&
        c.size === cartSize &&
        c.color === defaultColor
    );
    return line?.quantity ?? 0;
  }, [cart, product.id, cartSize, defaultColor]);

  const cartSnapshot = {
    productName: product.name,
    productSlug: product.slug,
    productImage:
      product.image || product.images?.[0] || "",
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((defaultColorOpt?.stock ?? 0) < 1) return;
    addToCart({
      productId: product.id,
      variantId: defaultColorOpt?.variantId,
      size: cartSize,
      color: defaultColor,
      quantity: 1,
      unitPrice,
      stock: defaultColorOpt?.stock,
      maxPerOrder: defaultColorOpt?.maxPerOrder,
      ...cartSnapshot,
    });
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (qty <= 1) {
      removeFromCart(product.id, cartSize, defaultColor);
      return;
    }
    updateQuantity(product.id, cartSize, defaultColor, qty - 1);
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((defaultColorOpt?.stock ?? 0) < 1) return;
    addToCart({
      productId: product.id,
      variantId: defaultColorOpt?.variantId,
      size: cartSize,
      color: defaultColor,
      quantity: 1,
      unitPrice,
      stock: defaultColorOpt?.stock,
      maxPerOrder: defaultColorOpt?.maxPerOrder,
      ...cartSnapshot,
    });
  };

  return (
    <article className="group flex h-full min-w-0 flex-col">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-[0_8px_28px_rgba(18,16,14,0.06)] transition duration-500 ease-out group-hover:-translate-y-1.5 group-hover:border-orange/30 group-hover:shadow-[0_22px_50px_rgba(18,16,14,0.14)]">
        {/* Media — portrait on phone; fixed height from md up so wide columns stay compact */}
        <div className="relative shrink-0">
          <Link
            href={`/product/${product.slug}`}
            className="relative block aspect-[4/5] overflow-hidden bg-soft md:aspect-auto md:h-[220px] lg:h-[232px]"
          >
            {gallery.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={product.name}
                fill
                sizes="(max-width:768px) 50vw, 22vw"
                className={cn(
                  "object-cover object-top transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.03]",
                  i === imageIndex ? "opacity-100" : "opacity-0"
                )}
                unoptimized={isRemoteMedia(src)}
                priority={i === 0}
              />
            ))}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,9,8,0.12)_0%,transparent_32%,transparent_68%,rgba(10,9,8,0.28)_100%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 group-hover:bg-[radial-gradient(circle_at_50%_20%,rgba(243,129,32,0.16),transparent_50%)]" />
          </Link>

          {deal ? (
            <span className="absolute left-2.5 top-2.5 z-[2] rounded-full bg-[#b42318] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-[10px]">
              {discountBadgeLabel(deal)}
            </span>
          ) : product.badge ? (
            <span
              className={cn(
                "absolute left-2.5 top-2.5 z-[2] rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-[10px]",
                product.badge === "NEW"
                  ? "bg-ink"
                  : product.badge === "Sale"
                    ? "bg-[#b42318]"
                    : "bg-orange text-ink"
              )}
            >
              {product.badge}
            </span>
          ) : null}

          <button
            type="button"
            aria-label="Toggle wishlist"
            onClick={() => toggleWishlist(product.id)}
            className={cn(
              "absolute right-2.5 top-2.5 z-[2] flex size-8 items-center justify-center rounded-full border backdrop-blur-md transition duration-300 hover:scale-105 active:scale-95 md:right-3 md:top-3 md:size-9",
              liked
                ? "border-[#e11d48]/30 bg-paper text-[#e11d48]"
                : "border-white/60 bg-paper/85 text-ink"
            )}
          >
            <Heart
              className={cn(
                "size-3.5 md:size-4",
                liked && "fill-[#e11d48] text-[#e11d48]"
              )}
              strokeWidth={1.8}
            />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col px-2 pb-2 pt-1.5 md:px-3 md:pb-3 md:pt-2.5">
          <div className="mb-0.5 flex items-center justify-between gap-2 md:mb-1">
            {product.colors.length > 0 ? (
              <div className="flex items-center gap-1">
                {product.colors.slice(0, 4).map((color) => (
                  <span
                    key={color}
                    className="size-2 rounded-full ring-1 ring-ink/10 ring-offset-1 ring-offset-paper md:size-3"
                    style={{ background: color }}
                    aria-hidden
                  />
                ))}
                {product.colors.length > 4 ? (
                  <span className="text-[9px] font-semibold text-muted">
                    +{product.colors.length - 4}
                  </span>
                ) : null}
              </div>
            ) : (
              <span />
            )}
            <GenderFitMark fit={product.genderFit || "unisex"} size="sm" />
          </div>

          <Link
            href={`/product/${product.slug}`}
            className="line-clamp-1 font-display text-[0.82rem] leading-tight tracking-[0.02em] text-ink transition hover:text-orange md:text-[1.05rem]"
          >
            {product.name}
          </Link>

          <div className="mt-0.5 flex items-center gap-1 md:mt-1">
            <div className="flex items-center gap-0.5 text-orange">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-2 md:size-2.5",
                    i < Math.round(product.rating)
                      ? "fill-orange text-orange"
                      : "fill-transparent text-line"
                  )}
                />
              ))}
            </div>
            <span className="text-[9px] font-semibold tabular-nums text-muted md:text-[10px]">
              {product.rating.toFixed(1)}
              <span className="font-medium text-muted/65">
                {" "}
                ({product.reviewCount})
              </span>
            </span>
          </div>

          {deal ? (
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 md:mt-1">
              <p className="text-[12px] font-extrabold tracking-tight text-ink md:text-[14px]">
                {product.priceMin === product.priceMax
                  ? formatPrice(salePriceUsd(product.priceMin, deal))
                  : `${formatPrice(salePriceUsd(product.priceMin, deal))} – ${formatPrice(salePriceUsd(product.priceMax, deal))}`}
              </p>
              <p className="text-[9px] font-semibold tabular-nums text-muted line-through md:text-[11px]">
                {formatPriceRange(product.priceMin, product.priceMax)}
              </p>
            </div>
          ) : (
            <p className="mt-0.5 text-[12px] font-extrabold tracking-tight text-ink md:mt-1 md:text-[14px]">
              {formatPriceRange(product.priceMin, product.priceMax)}
            </p>
          )}

          <div className="mt-1.5 md:mt-2">
            {qty > 0 ? (
              <div
                className="inline-flex h-8 w-full items-center justify-between rounded-full bg-orange px-1 text-ink shadow-[0_10px_24px_rgba(243,129,32,0.28)] md:h-9"
                role="group"
                aria-label={`${product.name} quantity`}
              >
                <button
                  type="button"
                  onClick={handleMinus}
                  aria-label="Decrease quantity"
                  className="flex size-6 items-center justify-center rounded-full transition hover:bg-ink/10 active:scale-95 md:size-7"
                >
                  <Minus className="size-3.5" strokeWidth={2.5} />
                </button>
                <span className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={handlePlus}
                  aria-label="Increase quantity"
                  className="flex size-6 items-center justify-center rounded-full transition hover:bg-ink/10 active:scale-95 md:size-7"
                >
                  <Plus className="size-3.5" strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                aria-label={`Add ${product.name} to cart`}
                className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-ink px-2.5 text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-white whitespace-nowrap transition hover:bg-orange hover:text-ink active:scale-[0.98] md:h-9 md:text-[11px]"
              >
                <ShoppingBag className="size-3 shrink-0 md:size-3.5" strokeWidth={2.25} />
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
