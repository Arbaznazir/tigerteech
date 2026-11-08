"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ChevronDown,
  Heart,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { type Product } from "@/data/products";
import { useMoney } from "@/lib/use-money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

/** Magnification relative to the rendered gallery box (not the loupe). */
const ZOOM = 3;

type LensState = {
  x: number;
  y: number;
  galleryW: number;
  galleryH: number;
};

function ZoomClone({
  src,
  galleryW,
  galleryH,
  cursorX,
  cursorY,
  viewW,
  viewH,
}: {
  src: string;
  galleryW: number;
  galleryH: number;
  cursorX: number;
  cursorY: number;
  viewW: number;
  viewH: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0"
      style={{
        width: galleryW,
        height: galleryH,
        transform: `translate(${viewW / 2 - cursorX * ZOOM}px, ${viewH / 2 - cursorY * ZOOM}px) scale(${ZOOM})`,
        transformOrigin: "0 0",
        willChange: "transform",
      }}
    >
      {/* Same box + object-cover as the main gallery so zoom matches what you see */}
      <div className="relative h-full w-full">
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width:1024px) 100vw, 52vw"
        />
      </div>
    </div>
  );
}

export function ProductDetail({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [canHoverZoom, setCanHoverZoom] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [lens, setLens] = useState<LensState>({
    x: 0,
    y: 0,
    galleryW: 0,
    galleryH: 0,
  });
  const [loupePx, setLoupePx] = useState(152);
  const galleryRef = useRef<HTMLDivElement>(null);

  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const wishlist = useStore((s) => s.wishlist);
  const { formatPrice, formatPriceRange } = useMoney();
  const liked = wishlist.includes(product.id);
  const defaultColor = product.colors[0] ?? "#111111";
  const gallery = product.images.length > 0 ? product.images : [product.image];
  const activeSrc = gallery[activeImage] ?? product.image;
  const showThumbs = gallery.length > 1;

  useEffect(() => {
    setActiveImage(0);
    setSize(product.sizes[1] ?? product.sizes[0]);
    setQty(1);
    setSpecsOpen(false);
  }, [product.id, product.sizes]);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanHoverZoom(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setLoupePx(mq.matches ? 184 : 152);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const updateLens = useCallback((clientX: number, clientY: number) => {
    const el = galleryRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    setLens({
      x,
      y,
      galleryW: rect.width,
      galleryH: rect.height,
    });
  }, []);

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!canHoverZoom) return;
    updateLens(e.clientX, e.clientY);
  };

  const handleAdd = () => {
    addToCart({
      productId: product.id,
      size,
      color: defaultColor,
      quantity: qty,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const detailRows: { label: string; value: string }[] = [
    { label: "Category", value: product.details.category },
    { label: "Style", value: product.details.style },
    { label: "Pattern", value: product.details.pattern },
    { label: "Type", value: product.details.type },
    { label: "Fit", value: product.details.fit },
    { label: "Neck", value: product.details.neck },
    { label: "Bottom", value: product.details.bottom },
    { label: "Material", value: product.details.material },
  ];

  const zoomReady =
    zooming && canHoverZoom && lens.galleryW > 0 && lens.galleryH > 0;

  return (
    <div className="bg-[linear-gradient(180deg,var(--color-paper)_0%,var(--color-soft)_42%,var(--color-paper)_100%)]">
      <div className="container-site grid gap-10 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-16">
        {/* Gallery */}
        <div className="relative">
          <div
            ref={galleryRef}
            className={cn(
              "relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-soft",
              "shadow-[0_28px_70px_rgba(22,20,18,0.14)]",
              "ring-1 ring-black/[0.04]",
              canHoverZoom && "cursor-crosshair"
            )}
            onPointerEnter={(e) => {
              if (!canHoverZoom) return;
              setZooming(true);
              updateLens(e.clientX, e.clientY);
            }}
            onPointerLeave={() => setZooming(false)}
            onPointerMove={onPointerMove}
          >
            {/* Soft studio atmosphere */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(255,255,255,0.55),transparent_52%),linear-gradient(180deg,rgba(22,20,18,0.04)_0%,transparent_30%,rgba(22,20,18,0.18)_100%)]"
            />

            <Image
              src={activeSrc}
              alt={product.name}
              fill
              className={cn(
                "object-cover transition duration-500",
                zoomReady && "opacity-95"
              )}
              sizes="(max-width:1024px) 100vw, 52vw"
              priority
            />

            {/* Hover loupe — magnified region under cursor */}
            {zoomReady && (
              <div
                aria-hidden
                className="pointer-events-none absolute z-20 size-[9.5rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[3px] border-orange shadow-[0_18px_40px_rgba(22,20,18,0.35)] ring-4 ring-white/80 md:size-[11.5rem]"
                style={{
                  left: lens.x,
                  top: lens.y,
                }}
              >
                <ZoomClone
                  src={activeSrc}
                  galleryW={lens.galleryW}
                  galleryH={lens.galleryH}
                  cursorX={lens.x}
                  cursorY={lens.y}
                  viewW={loupePx}
                  viewH={loupePx}
                />
              </div>
            )}

            {/* In-image variant thumbs */}
            {showThumbs && (
              <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-3 p-3 md:p-4">
                <div className="flex flex-wrap gap-2">
                  {gallery.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImage(i);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
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
                      />
                    </button>
                  ))}
                </div>
                {canHoverZoom && (
                  <p className="mb-1 hidden rounded-full bg-paper/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-forest shadow-sm backdrop-blur-sm sm:block">
                    Hover to zoom
                  </p>
                )}
              </div>
            )}
          </div>
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

          <p className="mt-5 text-3xl font-extrabold tracking-tight text-ink">
            {formatPriceRange(product.priceMin, product.priceMax)}
          </p>

          <div className="mt-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-ink">
              Size
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={cn(
                    "min-w-12 rounded-xl border px-3.5 py-2.5 text-sm font-bold transition",
                    size === s
                      ? "border-orange bg-orange text-ink shadow-[0_10px_24px_rgba(243,129,32,0.35)]"
                      : "border-line bg-paper text-ink hover:border-orange/50"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center overflow-hidden rounded-full border border-line bg-paper">
              <button
                type="button"
                className="px-4 py-2.5 text-lg leading-none text-ink transition hover:bg-soft"
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
                className="px-4 py-2.5 text-lg leading-none text-ink transition hover:bg-soft"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="forest"
              size="lg"
              onClick={handleAdd}
              className="min-h-13 flex-1 rounded-2xl tracking-[0.14em] shadow-[0_16px_36px_rgba(18,16,14,0.28)]"
            >
              <ShoppingBag className="size-4" strokeWidth={2.25} />
              {added ? "Added to Cart" : "Add to Cart"}
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

      {/* Details: description + specs — before reviews */}
      <section
        id="details"
        className="border-t border-line/80 bg-paper"
        aria-labelledby="details-heading"
      >
        <div className="container-site py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-14 lg:items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
                The story
              </p>
              <h2
                id="details-heading"
                className="font-display mt-2 text-4xl tracking-[0.04em] text-ink md:text-5xl"
              >
                Details
              </h2>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted md:text-base">
                {product.description}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-soft/60">
              <button
                type="button"
                onClick={() => setSpecsOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-soft/60"
                aria-expanded={specsOpen}
              >
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink">
                  Additional Information
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted transition duration-300",
                    specsOpen && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-out",
                  specsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <dl className="divide-y divide-line border-t border-line px-5 pb-2">
                    {detailRows.map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-[7.5rem_1fr] gap-3 py-3 text-sm md:grid-cols-[9rem_1fr]"
                      >
                        <dt className="font-bold text-ink">{row.label}</dt>
                        <dd className="text-muted">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
