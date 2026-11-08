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
    const amount = (card?.offsetWidth ?? 280) + 20;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className="container-site py-9 md:py-12">
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
            onClick={() => scrollBy(-1)}
            className="flex size-10 items-center justify-center rounded-full border border-line bg-paper text-ink transition hover:border-orange hover:bg-orange hover:text-ink"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollBy(1)}
            className="flex size-10 items-center justify-center rounded-full border border-line bg-paper text-ink transition hover:border-orange hover:bg-orange hover:text-ink"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className={cn(
          "scrollbar-hide grid auto-cols-[minmax(220px,78vw)] grid-flow-col gap-4 overflow-x-auto scroll-smooth pb-3 snap-x snap-mandatory sm:auto-cols-[minmax(240px,1fr)] sm:gap-5 md:gap-5",
          columns === 5
            ? "md:auto-cols-[calc((100%-5rem)/5)]"
            : "md:auto-cols-[calc((100%-3.75rem)/4)]"
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
