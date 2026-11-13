"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Flame, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import type { CategorySlug, Product } from "@/data/products";
import {
  fetchCategories,
  fetchProductsPage,
  type StoreCategory,
} from "@/lib/catalog";
import { cn } from "@/lib/cn";

type Props = {
  initialCategory?: CategorySlug | "all";
  title?: string;
};

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const PAGE_SIZE = 12;

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
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const categoryParam =
    category === "all" || category === "new-arrivals" ? undefined : category;
  const tagParam = category === "new-arrivals" ? "new_arrival" : undefined;

  const loadPage = useCallback(
    async (nextOffset: number, replace: boolean) => {
      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError("");
      try {
        const page = await fetchProductsPage({
          category: categoryParam,
          tag: tagParam,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setTotal(page.total);
        setOffset(nextOffset + page.items.length);
        setProducts((prev) => {
          if (replace) return page.items;
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...page.items.filter((p) => !seen.has(p.id))];
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load products");
        if (replace) {
          setProducts([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [categoryParam, tagParam]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await fetchCategories();
        if (!cancelled) setCategories(cats);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setProducts([]);
    setOffset(0);
    setTotal(0);
    void loadPage(0, true);
  }, [loadPage]);

  const hasMore = products.length < total;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !loading && !loadingMore) {
          void loadPage(offset, false);
        }
      },
      { rootMargin: "480px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, loading, loadingMore, loadPage, offset]);

  const filtered = useMemo(() => {
    const list = [...products];
    if (sort === "price-asc") list.sort((a, b) => a.priceMin - b.priceMin);
    if (sort === "price-desc") list.sort((a, b) => b.priceMin - a.priceMin);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [sort, products]);

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
    <div className="bg-[linear-gradient(180deg,var(--color-paper)_0%,var(--color-soft)_28%)]">
      <div className="container-site py-8 md:py-12">
        <div className="mb-6 flex flex-col gap-5 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
              Collection
            </p>
            <h1 className="mt-1 font-display text-[clamp(2.4rem,6vw,3.75rem)] leading-none tracking-wide text-forest">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted">
              <span className="font-semibold tabular-nums text-ink">
                {loading ? "…" : total}
              </span>{" "}
              {total === 1 ? "look" : "looks"} in the wild
            </p>
          </div>

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
                "flex h-11 w-full items-center gap-2.5 rounded-xl border bg-paper px-3.5 text-left shadow-[0_6px_20px_rgba(22,20,18,0.05)] transition",
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
                className="absolute right-0 z-30 mt-2 w-full min-w-[240px] overflow-hidden rounded-2xl border border-line bg-paper py-1.5 shadow-[0_18px_40px_rgba(22,20,18,0.14)]"
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
                          active ? "bg-soft" : "hover:bg-soft/70"
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

        <div className="mb-8 md:mb-10">
          <div className="rounded-2xl border border-line/80 bg-paper/80 p-2 shadow-[0_8px_28px_rgba(22,20,18,0.04)] backdrop-blur-sm md:p-2.5">
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
                        ? "bg-orange text-ink shadow-[0_8px_18px_rgba(243,129,32,0.35)]"
                        : "bg-transparent text-ink/75 hover:bg-soft hover:text-orange"
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

        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div ref={sentinelRef} className="h-8 w-full" aria-hidden />

        {loading && (
          <p className="py-16 text-center text-sm text-muted">Loading catalog…</p>
        )}
        {loadingMore && (
          <p className="py-6 text-center text-sm text-muted">Loading more…</p>
        )}
        {!loading && !loadingMore && filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted">
            No looks yet — publish products in the seller panel.
          </p>
        )}
        {!loading && !hasMore && filtered.length > 0 && (
          <p className="py-6 text-center text-xs uppercase tracking-[0.18em] text-muted">
            End of collection
          </p>
        )}
      </div>
    </div>
  );
}
