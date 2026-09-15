"use client";

import { useRef } from "react";
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
  columns?: 4 | 5;
};

export function ProductCarousel({
  eyebrow,
  title,
  href = "/shop",
  showFlame,
  products,
  variant = "bestseller",
  columns = 4,
}: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = (card?.offsetWidth ?? 280) + 24;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className="container-site py-8 md:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-orange">
            {showFlame && <Flame className="size-3.5 fill-orange text-orange" />}
            {eyebrow}
          </p>
          <h2 className="font-display text-[2.5rem] tracking-wide text-ink md:text-5xl">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={href}
            className="mr-1 hidden rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink transition hover:border-orange hover:text-orange sm:inline-flex"
          >
            View All
          </Link>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollBy(-1)}
            className="flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:border-forest hover:bg-forest hover:text-white"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollBy(1)}
            className="flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:border-forest hover:bg-forest hover:text-white"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className={cn(
          "scrollbar-hide grid auto-cols-[minmax(240px,1fr)] grid-flow-col gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory",
          columns === 5
            ? "md:auto-cols-[calc((100%-6rem)/5)]"
            : "md:auto-cols-[calc((100%-5.25rem)/4)]"
        )}
      >
        {products.map((product) => (
          <div key={product.id} data-card className="snap-start">
            <ProductCard product={product} variant={variant} />
          </div>
        ))}
      </div>
    </section>
  );
}
