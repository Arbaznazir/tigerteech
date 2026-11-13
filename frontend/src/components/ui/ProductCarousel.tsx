"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/data/products";
import { cn } from "@/lib/cn";

type Props = {
  eyebrow: string;
  title: string;
  href?: string;
  showFlame?: boolean;
  products: Product[];
  variant?: "bestseller" | "arrival";
  /** Desktop visible columns — kept at 4 so Add to Cart never truncates */
  columns?: 4;
  /** Mobile auto-advance (default on) */
  autoScroll?: boolean;
};

const AUTOPLAY_MS = 2800;
const RESUME_MS = 5000;

export function ProductCarousel({
  eyebrow,
  title,
  href = "/shop",
  showFlame,
  products,
  variant = "bestseller",
  columns = 4,
  autoScroll = true,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const pauseUntil = useRef(0);
  const inView = useRef(false);

  const cardStep = useCallback(() => {
    const el = scroller.current;
    if (!el) return 280;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const styles = window.getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || styles.gap || "16") || 16;
    return (card?.offsetWidth ?? 280) + gap;
  }, []);

  const scrollBy = useCallback(
    (dir: -1 | 1) => {
      const el = scroller.current;
      if (!el) return;
      el.scrollBy({ left: dir * cardStep(), behavior: "smooth" });
    },
    [cardStep]
  );

  const pauseAutoplay = useCallback(() => {
    pauseUntil.current = Date.now() + RESUME_MS;
  }, []);

  useEffect(() => {
    if (!autoScroll || products.length < 2) return;

    const el = scroller.current;
    const section = sectionRef.current;
    if (!el || !section) return;

    const mobileMq = window.matchMedia("(max-width: 767px)");
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onIntersect: IntersectionObserverCallback = ([entry]) => {
      inView.current = Boolean(entry?.isIntersecting);
    };
    const observer = new IntersectionObserver(onIntersect, {
      root: null,
      threshold: 0.2,
      rootMargin: "0px 0px -8% 0px",
    });
    observer.observe(section);

    const advance = () => {
      if (!mobileMq.matches || reduceMq.matches) return;
      if (!inView.current) return;
      if (Date.now() < pauseUntil.current) return;

      const max = el.scrollWidth - el.clientWidth;
      if (max <= 8) return;

      const atEnd = el.scrollLeft >= max - 16;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }
      el.scrollBy({ left: cardStep(), behavior: "smooth" });
    };

    // Kick once shortly after mount/in-view so it feels alive
    const kick = window.setTimeout(advance, 900);
    const timer = window.setInterval(advance, AUTOPLAY_MS);

    const onPointer = () => pauseAutoplay();
    el.addEventListener("pointerdown", onPointer, { passive: true });
    el.addEventListener("touchstart", onPointer, { passive: true });
    el.addEventListener("wheel", onPointer, { passive: true });

    return () => {
      window.clearTimeout(kick);
      window.clearInterval(timer);
      observer.disconnect();
      el.removeEventListener("pointerdown", onPointer);
      el.removeEventListener("touchstart", onPointer);
      el.removeEventListener("wheel", onPointer);
    };
  }, [autoScroll, cardStep, pauseAutoplay, products.length]);

  return (
    <section ref={sectionRef} className="container-site py-9 md:py-12">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 md:mb-8">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.26em] text-orange">
            {showFlame && <Flame className="size-3.5 fill-orange text-orange" />}
            {eyebrow}
          </p>
          <h2 className="font-display text-[2.4rem] tracking-[0.02em] text-ink md:text-[3.25rem]">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={href}
            className="mr-1 hidden h-10 items-center rounded-full border border-line px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-orange hover:text-orange sm:inline-flex"
          >
            View All
          </Link>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => {
              pauseAutoplay();
              scrollBy(-1);
            }}
            className="flex size-10 items-center justify-center rounded-full border border-line bg-paper text-ink transition hover:border-orange hover:bg-orange hover:text-ink"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => {
              pauseAutoplay();
              scrollBy(1);
            }}
            className="flex size-10 items-center justify-center rounded-full border border-line bg-paper text-ink transition hover:border-orange hover:bg-orange hover:text-ink"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className={cn(
          // Cap desktop card width — equal-fraction columns on wide screens made tiles huge
          "scrollbar-hide grid grid-flow-col gap-3 overflow-x-auto scroll-smooth pb-3 snap-x snap-mandatory",
          // Phone: ~2 cards visible so tiles stay compact
          "auto-cols-[minmax(148px,42vw)]",
          "sm:auto-cols-[minmax(160px,34vw)] sm:gap-4",
          // Same tile width as Bestsellers everywhere (4-up on md+)
          "md:gap-4 md:auto-cols-[minmax(0,calc((100%-3rem)/4))] lg:auto-cols-[minmax(0,calc((100%-4rem)/5))]"
        )}
      >
        {products.map((product) => (
          <div key={product.id} data-card className="h-full snap-start">
            <ProductCard product={product} variant={variant} />
          </div>
        ))}
      </div>
    </section>
  );
}
