"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Search, Sparkles, X } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import type { Product } from "@/data/products";
import { fetchProducts, fetchProductsPage } from "@/lib/catalog";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/cn";

const quickChips = [
  "parrot",
  "tiger",
  "men",
  "women",
  "co-ord",
  "full sleeve",
  "new",
];

const PAGE_SIZE = 12;

function SuggestionRow({
  product,
  active,
  onSelect,
  formatPriceRange,
}: {
  product: Product;
  active: boolean;
  onSelect: () => void;
  formatPriceRange: (min: number, max: number) => string;
}) {
  return (
    <Link
      href={`/product/${product.slug}`}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-xl px-2.5 py-2 transition",
        active ? "bg-orange text-ink" : "hover:bg-soft"
      )}
    >
      <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-soft">
        <Image
          src={product.image}
          alt=""
          fill
          className="object-cover"
          sizes="56px"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm font-semibold",
            active ? "text-white" : "text-ink"
          )}
        >
          {product.name}
        </span>
        <span
          className={cn(
            "mt-0.5 block text-xs",
            active ? "text-white/75" : "text-muted"
          )}
        >
          {formatPriceRange(product.priceMin, product.priceMax)}
          {product.badge ? ` · ${product.badge}` : ""}
        </span>
      </span>
      <ArrowRight
        className={cn("size-4 shrink-0", active ? "text-white" : "text-muted")}
        strokeWidth={2}
      />
    </Link>
  );
}

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("q") ?? "";
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const { formatPriceRange } = useMoney();

  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [gridResults, setGridResults] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [trending, setTrending] = useState<Product[]>([]);

  const liveQuery = value.trim();
  const committedQuery = initial.trim();

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  useEffect(() => {
    setActiveIndex(0);
  }, [liveQuery]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [best, neu] = await Promise.all([
          fetchProducts({ tag: "bestseller", limit: 4 }),
          fetchProducts({ tag: "new_arrival", limit: 4 }),
        ]);
        if (cancelled) return;
        const seen = new Set<string>();
        const mix: Product[] = [];
        for (const p of [...best.slice(0, 2), ...neu.slice(0, 2)]) {
          if (seen.has(p.id)) continue;
          seen.add(p.id);
          mix.push(p);
        }
        setTrending(mix);
      } catch {
        if (!cancelled) setTrending([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced typeahead suggestions (API FTS + trigram)
  useEffect(() => {
    if (!liveQuery) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const page = await fetchProductsPage({
          q: liveQuery,
          limit: 6,
          offset: 0,
        });
        if (!cancelled) setSuggestions(page.items);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [liveQuery]);

  const loadGrid = useCallback(
    async (q: string, nextOffset: number, replace: boolean) => {
      if (!q) {
        setGridResults([]);
        setTotal(0);
        setOffset(0);
        return;
      }
      if (replace) setLoading(true);
      else setLoadingMore(true);
      try {
        const page = await fetchProductsPage({
          q,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setTotal(page.total);
        setOffset(nextOffset + page.items.length);
        setGridResults((prev) => {
          if (replace) return page.items;
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...page.items.filter((p) => !seen.has(p.id))];
        });
      } catch {
        if (replace) {
          setGridResults([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadGrid(committedQuery, 0, true);
  }, [committedQuery, loadGrid]);

  const hasMore = gridResults.length < total;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !committedQuery || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !loading && !loadingMore) {
          void loadGrid(committedQuery, offset, false);
        }
      },
      { rootMargin: "480px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [committedQuery, hasMore, loading, loadingMore, loadGrid, offset]);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  const commitSearch = (q: string) => {
    const next = q.trim();
    setOpen(false);
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) =>
        suggestions.length ? (i + 1) % suggestions.length : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        suggestions.length
          ? (i - 1 + suggestions.length) % suggestions.length
          : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = suggestions[activeIndex];
      if (open && pick) {
        router.push(`/product/${pick.slug}`);
        setOpen(false);
      } else {
        commitSearch(value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showPanel = open;

  return (
    <div className="bg-paper">
      <div className="border-b border-line bg-paper">
        <div className="container-site py-8 md:py-12">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
            Smart search
          </p>
          <h1 className="font-display text-5xl tracking-wide text-forest md:text-6xl">
            FIND YOUR{" "}
            <span className="text-wild text-[clamp(2.5rem,7vw,3.75rem)]">
              LOOK
            </span>
          </h1>

          <div ref={rootRef} className="relative mt-6 max-w-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commitSearch(value);
              }}
              className="flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-3 shadow-[0_10px_30px_rgba(22,20,18,0.06)] focus-within:border-forest/30 focus-within:ring-2 focus-within:ring-orange/25"
            >
              <Search className="size-5 shrink-0 text-muted" strokeWidth={1.75} />
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                placeholder="Try parrot, tiger, co-ord, women…"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted/70"
                aria-autocomplete="list"
                aria-controls={listId}
                aria-expanded={open}
                role="combobox"
                autoComplete="off"
              />
              {value && (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-soft hover:text-ink"
                  onClick={() => {
                    setValue("");
                    setOpen(true);
                    inputRef.current?.focus();
                    router.push("/search");
                  }}
                >
                  <X className="size-4" />
                </button>
              )}
            </form>

            {showPanel && (
              <div
                id={listId}
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_20px_50px_rgba(22,20,18,0.14)]"
              >
                {liveQuery ? (
                  <div className="p-2">
                    <p className="px-2.5 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                      {suggestions.length
                        ? `Matches for “${liveQuery}”`
                        : `No matches for “${liveQuery}”`}
                    </p>
                    {suggestions.map((product, i) => (
                      <SuggestionRow
                        key={product.id}
                        product={product}
                        active={i === activeIndex}
                        formatPriceRange={formatPriceRange}
                        onSelect={() => setOpen(false)}
                      />
                    ))}
                    {suggestions.length > 0 && (
                      <button
                        type="button"
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-soft px-3 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-forest transition hover:bg-forest hover:text-white"
                        onClick={() => commitSearch(value)}
                      >
                        See all results
                        <ArrowRight className="size-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3">
                    <p className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                      <Sparkles className="size-3 text-orange" />
                      Trending looks
                    </p>
                    <div className="space-y-1">
                      {trending.map((product, i) => (
                        <SuggestionRow
                          key={product.id}
                          product={product}
                          active={i === activeIndex}
                          formatPriceRange={formatPriceRange}
                          onSelect={() => setOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setValue(chip);
                  setOpen(false);
                  commitSearch(chip);
                }}
                className="rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink transition hover:border-orange hover:text-orange"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-site py-8 md:py-12">
        {committedQuery ? (
          <>
            <p className="mb-6 text-sm text-muted">
              <span className="font-semibold text-ink">
                {loading ? "…" : total}
              </span>{" "}
              {total === 1 ? "look" : "looks"} for “{committedQuery}”
            </p>
            {loading && gridResults.length === 0 ? (
              <p className="py-14 text-center text-sm text-muted">Searching…</p>
            ) : gridResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-paper px-6 py-14 text-center">
                <p className="font-display text-3xl text-forest">No matches</p>
                <p className="mt-2 text-sm text-muted">
                  Try a print name, category, or one of the chips above.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
                  {gridResults.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
                {loadingMore ? (
                  <p className="py-6 text-center text-sm text-muted">
                    Loading more…
                  </p>
                ) : null}
              </>
            )}
          </>
        ) : (
          <>
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
              Browse with images
            </p>
            <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
              {trending.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container-site py-20 text-center text-muted">
          Loading…
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
