"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Heart,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductOffers } from "@/components/product/ProductOffers";
import { type Product } from "@/data/products";
import type { ProductColorOption, ProductMaterialOption } from "@/data/types";
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

export function ProductDetail({ product }: { product: Product }) {
  const materials: ProductMaterialOption[] = product.materials?.length
    ? product.materials
    : [
        {
          name: product.details.material || "Standard",
          price: product.priceMin,
          colors: (product.colors || []).map(
            (swatch): ProductColorOption => ({
              name: "Color",
              swatch,
              stock: 99,
              maxPerOrder: 0,
            })
          ),
        },
      ];
  const [materialName, setMaterialName] = useState(materials[0]?.name || "");
  const [materialOpen, setMaterialOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const materialRef = useRef<HTMLDivElement>(null);
  const materialListId = useId();

  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const wishlist = useStore((s) => s.wishlist);
  const { formatPrice, formatPriceRange } = useMoney();
  const deals = useActiveDeals();
  const deal = useMemo(
    () => findBestDealForProduct(deals, product),
    [deals, product]
  );
  const liked = wishlist.includes(product.id);
  const activeMaterial =
    materials.find((m) => m.name === materialName) || materials[0];
  const materialColors: ProductColorOption[] = activeMaterial?.colors?.length
    ? activeMaterial.colors
    : [
        {
          name: "Default",
          swatch: product.colors[0] || "#111111",
          stock: 0,
          maxPerOrder: 0,
        },
      ];
  const [colorSwatch, setColorSwatch] = useState(
    materialColors[0]?.swatch || "#111111"
  );
  const activeColor =
    materialColors.find((c) => c.swatch === colorSwatch) || materialColors[0];
  const stock = activeColor?.stock ?? 0;
  const maxPerOrder = Math.max(0, activeColor?.maxPerOrder ?? 0);
  const maxBuy = Math.max(
    0,
    maxPerOrder > 0 ? Math.min(stock, maxPerOrder) : stock
  );
  const outOfStock = maxBuy < 1;
  const gallery = (
    product.images.length > 0 ? product.images : [product.image]
  )
    .map(resolveMediaUrl)
    .filter(Boolean);
  const activeSrc = gallery[activeImage] ?? resolveMediaUrl(product.image);
  const showThumbs = gallery.length > 1;
  const unitPrice = activeMaterial?.price ?? product.priceMin;
  const dealUnitPrice = deal ? salePriceUsd(unitPrice, deal) : unitPrice;

  useEffect(() => {
    setActiveImage(0);
    setQty(1);
    setMaterialOpen(false);
    const first = materials[0];
    setMaterialName(first?.name || "");
    setColorSwatch(first?.colors[0]?.swatch || product.colors[0] || "#111111");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  useEffect(() => {
    const mat = materials.find((m) => m.name === materialName) || materials[0];
    if (!mat) return;
    if (!mat.colors.some((c) => c.swatch === colorSwatch)) {
      setColorSwatch(mat.colors[0]?.swatch || "#111111");
    }
  }, [materialName, materials, colorSwatch]);

  useEffect(() => {
    if (!materialOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!materialRef.current?.contains(e.target as Node)) {
        setMaterialOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMaterialOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [materialOpen]);

  useEffect(() => {
    setQty((q) => {
      if (outOfStock) return 1;
      return Math.min(Math.max(1, q), maxBuy);
    });
  }, [colorSwatch, materialName, maxBuy, outOfStock]);

  const handleAdd = () => {
    if (outOfStock) return;
    const buyQty = Math.min(qty, maxBuy);
    // Size UI removed — cart key is material only (no S/M/L).
    addToCart({
      productId: product.id,
      variantId: activeColor?.variantId,
      size: materialName || "Standard",
      color: colorSwatch,
      quantity: buyQty,
      unitPrice: dealUnitPrice,
      maxPerOrder,
      stock,
      productName: product.name,
      productSlug: product.slug,
      productImage: activeSrc || product.image || product.images?.[0] || "",
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  // Shop placement only — never surface Category in PDP details.
  const detailRows: { label: string; value: string }[] =
    product.attributes && product.attributes.length > 0
      ? product.attributes
          .filter(
            (a) =>
              a.value?.trim() &&
              a.key.toLowerCase() !== "category" &&
              a.key.toLowerCase() !== "categories"
          )
          .map((a) => ({ label: a.label, value: a.value }))
      : [
          { label: "Style", value: product.details.style },
          { label: "Pattern", value: product.details.pattern },
          { label: "Type", value: product.details.type },
          { label: "Fit", value: product.details.fit },
          { label: "Neck", value: product.details.neck },
          { label: "Bottom", value: product.details.bottom },
        ].filter((row) => row.value?.trim());

  const highlightTags = product.highlightTags || [];
  const accentClass = (accent?: string) => {
    switch (accent) {
      case "green":
        return "bg-emerald-100 text-emerald-900";
      case "gold":
        return "bg-amber-100 text-amber-950";
      case "rose":
        return "bg-rose-100 text-rose-900";
      case "ink":
        return "bg-ink/10 text-ink";
      default:
        return "bg-soft text-ink";
    }
  };

  return (
    <div className="bg-[linear-gradient(180deg,var(--color-paper)_0%,var(--color-soft)_42%,var(--color-paper)_100%)]">
      <div className="container-site grid gap-10 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-16">
        {/* Gallery */}
        <div className="relative">
          <div
            className={cn(
              "relative aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-soft md:aspect-[2/3]",
              "shadow-[0_28px_70px_rgba(22,20,18,0.14)]",
              "ring-1 ring-black/[0.04]"
            )}
          >
            {/* Soft studio atmosphere */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(255,255,255,0.55),transparent_52%),linear-gradient(180deg,rgba(22,20,18,0.04)_0%,transparent_30%,rgba(22,20,18,0.18)_100%)]"
            />

            <Image
              src={activeSrc || "/brand-logo.png"}
              alt={product.name}
              fill
              className="object-cover object-top"
              sizes="(max-width:1024px) 100vw, 52vw"
              priority
              unoptimized={isRemoteMedia(activeSrc)}
            />

            {showThumbs ? (
              <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap gap-2 p-3 md:p-4">
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                    aria-pressed={activeImage === i}
                    className={cn(
                      "relative size-[3.35rem] overflow-hidden rounded-xl bg-paper/90 shadow-[0_10px_24px_rgba(22,20,18,0.22)] backdrop-blur-sm transition duration-300 md:size-16",
                      "ring-2 ring-offset-2 ring-offset-transparent",
                      activeImage === i
                        ? "scale-105 ring-orange"
                        : "ring-white/80 hover:ring-orange/70"
                    )}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized={isRemoteMedia(src)}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {highlightTags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {highlightTags.map((t) => (
                <span
                  key={t.slug}
                  className={cn(
                    "inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold",
                    accentClass(t.accent)
                  )}
                >
                  {t.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Buy box */}
        <div className="flex flex-col lg:pt-2">
          {product.badge && (
            <span
              className={cn(
                "mb-4 inline-flex w-fit items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
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

          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
            Tigerteeh Clothing
          </p>
          <h1 className="font-display mt-2 text-[2.75rem] leading-[0.92] tracking-[0.04em] text-ink md:text-6xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-0.5 text-orange">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-3.5",
                    i < Math.round(product.rating)
                      ? "fill-orange text-orange"
                      : "fill-transparent text-line"
                  )}
                />
              ))}
            </div>
            <a
              href="#reviews"
              className="text-sm font-semibold text-muted transition hover:text-orange"
            >
              {product.rating.toFixed(1)} ({product.reviewCount} reviews)
            </a>
          </div>

          {deal ? (
            <div className="mt-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-3xl font-extrabold tracking-tight text-ink">
                  {formatPrice(dealUnitPrice)}
                </p>
                <p className="text-lg font-semibold tabular-nums text-muted line-through">
                  {formatPrice(unitPrice)}
                </p>
                <span className="rounded-full bg-[#b42318] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  {discountBadgeLabel(deal)}
                </span>
              </div>
              <p className="mt-1.5 text-[12px] font-medium text-orange">
                Deal price · {deal.title || "Live offer"}
              </p>
              {product.priceMin !== product.priceMax ? (
                <p className="mt-1 text-sm font-semibold text-muted">
                  Was {formatPriceRange(product.priceMin, product.priceMax)}{" "}
                  range
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 text-3xl font-extrabold tracking-tight text-ink">
              {formatPrice(unitPrice)}
              {product.priceMin !== product.priceMax ? (
                <span className="ml-2 text-sm font-semibold text-muted">
                  ({formatPriceRange(product.priceMin, product.priceMax)} range)
                </span>
              ) : null}
            </p>
          )}

          {materials.length > 0 ? (
            <div className="mt-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-ink">
                Material
              </p>
              <div ref={materialRef} className="relative">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={materialOpen}
                  aria-controls={materialListId}
                  onClick={() => setMaterialOpen((v) => !v)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border bg-paper px-4 py-3.5 text-left shadow-[0_6px_20px_rgba(22,20,18,0.04)] transition",
                    materialOpen
                      ? "border-orange ring-2 ring-orange/15"
                      : "border-line hover:border-orange/40"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {activeMaterial?.name || "Choose material"}
                    </span>
                    <span className="mt-0.5 block text-[12px] font-medium tabular-nums text-muted">
                      {formatPrice(activeMaterial?.price ?? product.priceMin)}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted transition duration-200",
                      materialOpen && "rotate-180 text-orange"
                    )}
                    strokeWidth={2}
                  />
                </button>

                {materialOpen ? (
                  <ul
                    id={materialListId}
                    role="listbox"
                    aria-label="Materials"
                    className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-2xl border border-line bg-paper py-1.5 shadow-[0_22px_50px_rgba(22,20,18,0.16)]"
                  >
                    {materials.map((m) => {
                      const selected = m.name === materialName;
                      return (
                        <li
                          key={m.name}
                          role="option"
                          aria-selected={selected}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setMaterialName(m.name);
                              setMaterialOpen(false);
                            }}
                            className={cn(
                              "mx-1.5 flex w-[calc(100%-12px)] items-center gap-3 rounded-xl px-3 py-3 text-left transition",
                              selected
                                ? "bg-soft"
                                : "hover:bg-soft/80"
                            )}
                          >
                            <span className="flex size-5 shrink-0 items-center justify-center">
                              {selected ? (
                                <Check
                                  className="size-4 text-orange"
                                  strokeWidth={2.5}
                                />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink">
                                {m.name}
                              </span>
                              <span className="mt-0.5 block text-[12px] font-medium tabular-nums text-muted">
                                {formatPrice(m.price)}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}

          {materialColors.length > 0 ? (
            <div className="mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-ink">
                Color
              </p>
              <div className="flex flex-wrap gap-2.5">
                {materialColors.map((c) => (
                  <button
                    key={`${c.name}-${c.swatch}`}
                    type="button"
                    title={c.name}
                    onClick={() => setColorSwatch(c.swatch)}
                    className={cn(
                      "size-9 rounded-full border-2 transition",
                      colorSwatch === c.swatch
                        ? "border-orange scale-110 shadow-[0_8px_18px_rgba(243,129,32,0.35)]"
                        : "border-line hover:border-orange/50"
                    )}
                    style={{ background: c.swatch }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold text-muted">
                {materialColors.find((c) => c.swatch === colorSwatch)?.name ||
                  "Color"}
              </p>
            </div>
          ) : null}

          {detailRows.length > 0 ? (
            <div className="mt-7">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-ink">
                Details
              </p>
              <dl className="divide-y divide-line border-y border-line">
                {detailRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[6.5rem_1fr] items-baseline gap-3 py-2.5 text-sm sm:grid-cols-[7.5rem_1fr]"
                  >
                    <dt className="font-bold text-ink">{row.label}</dt>
                    <dd className="text-muted">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center overflow-hidden rounded-full border border-line bg-paper">
              <button
                type="button"
                className="px-4 py-2.5 text-lg leading-none text-ink transition hover:bg-soft disabled:opacity-40"
                disabled={outOfStock || qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-10 text-center text-sm font-bold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                className="px-4 py-2.5 text-lg leading-none text-ink transition hover:bg-soft disabled:opacity-40"
                disabled={outOfStock || qty >= maxBuy}
                onClick={() => setQty((q) => Math.min(maxBuy, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <p className="text-[12px] font-medium text-muted">
              {outOfStock
                ? "Out of stock"
                : maxPerOrder > 0
                  ? `Max ${maxPerOrder} / order · ${stock} left`
                  : `${stock} left`}
            </p>
          </div>

          <ProductOffers slug={product.slug} productId={product.id} />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="forest"
              size="lg"
              onClick={handleAdd}
              disabled={outOfStock}
              className="min-h-13 flex-1 rounded-2xl tracking-[0.14em] shadow-[0_16px_36px_rgba(18,16,14,0.28)] disabled:opacity-50"
            >
              <ShoppingBag className="size-4" strokeWidth={2.25} />
              {outOfStock
                ? "Out of Stock"
                : added
                  ? "Added to Cart"
                  : "Add to Cart"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="rounded-2xl border border-line bg-paper"
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart
                className={cn("size-4", liked && "fill-orange text-orange")}
                strokeWidth={1.75}
              />
              Wishlist
            </Button>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Truck,
                text: `Free shipping above ${formatPrice(99)}`,
              },
              {
                icon: Sparkles,
                text: "Premium natural fabrics",
              },
              {
                icon: Undo2,
                text: "Easy returns in 30 days",
              },
            ].map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-start gap-2.5 rounded-2xl border border-line/80 bg-paper/70 px-3.5 py-3 text-[12px] font-semibold leading-snug text-muted"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-orange" strokeWidth={2} />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Story / description only — attribute details live in the buy column */}
      {product.description?.trim() ? (
        <section
          id="details"
          className="border-t border-line/80 bg-paper"
          aria-labelledby="details-heading"
        >
          <div className="container-site py-12 md:py-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
              The story
            </p>
            <h2
              id="details-heading"
              className="font-display mt-2 text-4xl tracking-[0.04em] text-ink md:text-5xl"
            >
              About this piece
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted md:text-base">
              {product.description}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
