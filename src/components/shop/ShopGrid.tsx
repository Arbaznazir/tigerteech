"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Flame, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { categories, products, type CategorySlug } from "@/data/products";
import { cn } from "@/lib/cn";

type Props = {
  initialCategory?: CategorySlug | "all";
  title?: string;
};

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const SORT_OPTIONS: { value: SortKey; label: string; hint: string }[] = [
  { value: "featured", label: "Featured", hint: "Editor picks first" },
  { value: "price-asc", label: "Price: Low to High", hint: "Budget first" },
  { value: "price-desc", label: "Price: High to Low", hint: "Premium first" },
  { value: "rating", label: "Top Rated", hint: "Best reviews" },
];

export function ShopGrid({ initialCategory = "all", title = "Shop All" }: Props) {
  const [category, setCategory] = useState<CategorySlug | "all">(initialCategory);
  const [sort, setSort] = useState<SortKey>("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let list =
      category === "all"
        ? [...products]
        : category === "new-arrivals"
          ? products.filter((p) => p.newArrival)
          : products.filter((p) => p.categories.includes(category));

    if (sort === "price-asc") list.sort((a, b) => a.priceMin - b.priceMin);
    if (sort === "price-desc") list.sort((a, b) => b.priceMin - a.priceMin);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [category, sort]);

  const activeSort = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSortOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const filters: { key: CategorySlug | "all"; label: string; icon?: "grid" | "flame" }[] = [
    { key: "all", label: "All", icon: "grid" },
    ...categories.map((c) => ({
      key: c.slug as CategorySlug | "all",
      label: c.label,
      icon: c.icon === "flame" ? ("flame" as const) : undefined,
    })),
  ];

  return (
    <div className="bg-[linear-gradient(180deg,#f7f5f2_0%,#ffffff_28%)]">
      <div className="container-site py-8 md:py-12">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-5 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
              Collection
            </p>
            <h1 className="mt-1 font-display text-[clamp(2.4rem,6vw,3.75rem)] leading-none tracking-wide text-forest">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted">
              <span className="font-semibold tabular-nums text-ink">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "look" : "looks"} in the wild
            </p>
          </div>

          {/* Sort dropdown */}
          <div ref={sortRef} className="relative w-full sm:w-auto sm:min-w-[220px]">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Sort by
            </p>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((v) => !v)}
              className={cn(
                "flex h-11 w-full items-center gap-2.5 rounded-xl border bg-white px-3.5 text-left shadow-[0_6px_20px_rgba(6,35,26,0.05)] transition",
                sortOpen
                  ? "border-forest ring-2 ring-forest/10"
                  : "border-line hover:border-forest/30"
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-soft text-forest">
                <SlidersHorizontal className="size-3.5" strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {activeSort.label}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted transition duration-200",
                  sortOpen && "rotate-180 text-forest"
                )}
                strokeWidth={2}
              />
            </button>

            {sortOpen && (
              <ul
                role="listbox"
                className="absolute right-0 z-30 mt-2 w-full min-w-[240px] overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-[0_18px_40px_rgba(6,35,26,0.14)]"
              >
                {SORT_OPTIONS.map((opt) => {
                  const active = opt.value === sort;
                  return (
                    <li key={opt.value} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onClick={() => {
                          setSort(opt.value);
                          setSortOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition",
                          active ? "bg-soft" : "hover:bg-[#faf9f7]"
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block text-sm font-semibold",
                              active ? "text-forest" : "text-ink"
                            )}
                          >
                            {opt.label}
                          </span>
                          <span className="block text-[11px] text-muted">{opt.hint}</span>
                        </span>
                        {active ? (
                          <Check className="size-4 shrink-0 text-orange" strokeWidth={2.5} />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Category filters */}
        <div className="mb-8 md:mb-10">
          <div className="rounded-2xl border border-line/80 bg-white/80 p-2 shadow-[0_8px_28px_rgba(6,35,26,0.04)] backdrop-blur-sm md:p-2.5">
            <div className="scrollbar-hide -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 md:flex-wrap md:overflow-visible">
              {filters.map((f) => {
                const active = category === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setCategory(f.key)}
                    className={cn(
                      "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[11px] font-bold uppercase tracking-[0.12em] transition duration-200",
                      active
                        ? "bg-forest text-white shadow-[0_8px_18px_rgba(6,38,31,0.28)]"
                        : "bg-transparent text-ink/75 hover:bg-soft hover:text-forest"
                    )}
                  >
                    {f.icon === "grid" && (
                      <LayoutGrid
                        className={cn("size-3.5", active ? "text-orange" : "text-muted")}
                        strokeWidth={2.25}
                      />
                    )}
                    {f.icon === "flame" && (
                      <Flame
                        className={cn(
                          "size-3.5",
                          active ? "fill-orange text-orange" : "text-orange"
                        )}
                        strokeWidth={2.25}
                      />
                    )}
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted">
            No looks in this filter yet — try another category.
          </p>
        )}
      </div>
    </div>
  );
}
