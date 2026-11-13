"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Loader2, X } from "lucide-react";
import { api, unwrapItems, unwrapTotal } from "@/lib/api";
import { cn } from "@/lib/cn";

type Category = {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
};

type ProductRow = {
  id: string;
  name: string;
  priceMin?: number;
  status?: string;
};

const PAGE = 40;

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Known labels for already-selected products (edit mode). */
  knownNames?: Record<string, string>;
};

export function CategoryProductPicker({
  selectedIds,
  onChange,
  knownNames = {},
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [byCategory, setByCategory] = useState<
    Record<
      string,
      { items: ProductRow[]; total: number; loading: boolean; error?: string }
    >
  >({});
  const [names, setNames] = useState<Record<string, string>>(knownNames);
  const [catError, setCatError] = useState("");

  useEffect(() => {
    setNames((prev) => ({ ...knownNames, ...prev }));
  }, [knownNames]);

  useEffect(() => {
    let cancelled = false;
    api<Category[]>("/api/v1/admin/categories")
      .then((list) => {
        if (!cancelled) setCategories(list || []);
      })
      .catch((e) => {
        if (!cancelled) {
          setCatError(e instanceof Error ? e.message : "Failed to load categories");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Resolve names for selected IDs that we don't know yet (edit mode).
  useEffect(() => {
    const missing = selectedIds.filter((id) => !names[id]);
    if (!missing.length) return;
    let cancelled = false;
    void Promise.all(
      missing.slice(0, 24).map(async (id) => {
        try {
          const p = await api<{ id: string; name: string }>(
            `/api/v1/admin/products/${id}`
          );
          return [id, p.name] as const;
        } catch {
          return [id, id.slice(0, 8) + "…"] as const;
        }
      })
    ).then((pairs) => {
      if (cancelled) return;
      setNames((prev) => {
        const next = { ...prev };
        for (const [id, name] of pairs) next[id] = name;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [selectedIds, names]);

  const loadCategory = useCallback(
    async (slug: string, offset = 0, append = false) => {
      setByCategory((prev) => ({
        ...prev,
        [slug]: {
          items: append ? prev[slug]?.items || [] : [],
          total: append ? prev[slug]?.total || 0 : 0,
          loading: true,
          error: undefined,
        },
      }));
      try {
        const data = await api<{ items?: ProductRow[]; total?: number }>(
          `/api/v1/admin/products?status=all&category=${encodeURIComponent(slug)}&limit=${PAGE}&offset=${offset}`
        );
        const items = unwrapItems(data);
        const total = unwrapTotal(data);
        const namePatch: Record<string, string> = {};
        for (const p of items) namePatch[p.id] = p.name;
        setNames((n) => ({ ...n, ...namePatch }));
        setByCategory((prev) => {
          const existing = append ? prev[slug]?.items || [] : [];
          const merged = append ? [...existing, ...items] : items;
          return {
            ...prev,
            [slug]: { items: merged, total, loading: false },
          };
        });
      } catch (e) {
        setByCategory((prev) => ({
          ...prev,
          [slug]: {
            items: prev[slug]?.items || [],
            total: prev[slug]?.total || 0,
            loading: false,
            error: e instanceof Error ? e.message : "Failed to load products",
          },
        }));
      }
    },
    []
  );

  function toggleCategory(slug: string) {
    if (openSlug === slug) {
      setOpenSlug(null);
      return;
    }
    setOpenSlug(slug);
    if (!byCategory[slug]?.items?.length) {
      void loadCategory(slug, 0, false);
    }
  }

  function toggleProduct(id: string, name: string) {
    setNames((n) => ({ ...n, [id]: name }));
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function selectAllVisible(slug: string) {
    const items = byCategory[slug]?.items || [];
    const next = new Set(selectedIds);
    for (const p of items) {
      next.add(p.id);
      setNames((n) => ({ ...n, [p.id]: p.name }));
    }
    onChange([...next]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-semibold text-[var(--ink)]">
          Products by category
        </p>
        <p className="text-[11px] text-[var(--muted)]">
          {selectedIds.length} selected · open a category to load its products
        </p>
      </div>

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--soft)]/50 p-2">
          {selectedIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange(selectedIds.filter((x) => x !== id))}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--paper)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink)] transition hover:border-[#b42318]/40 hover:text-[#b42318]"
              title="Remove"
            >
              <span className="truncate">{names[id] || "…"}</span>
              <X className="size-3 shrink-0" strokeWidth={2} />
            </button>
          ))}
        </div>
      ) : null}

      {catError ? (
        <p className="text-[12px] text-red-700">{catError}</p>
      ) : null}

      <div className="max-h-[340px] space-y-1.5 overflow-y-auto rounded-xl border border-[var(--line)] p-1.5">
        {categories.length === 0 && !catError ? (
          <p className="px-3 py-6 text-center text-[12px] text-[var(--muted)]">
            Loading categories…
          </p>
        ) : null}
        {categories.map((c) => {
          const open = openSlug === c.slug;
          const bucket = byCategory[c.slug];
          return (
            <div
              key={c.id}
              className="overflow-hidden rounded-lg border border-[var(--line)]/80"
            >
              <button
                type="button"
                onClick={() => toggleCategory(c.slug)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[13px] font-semibold transition",
                  open
                    ? "bg-[var(--orange)]/10 text-[var(--ink)]"
                    : "bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--soft)]"
                )}
              >
                <span className="truncate">{c.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-[11px] font-medium text-[var(--muted)]">
                  {typeof c.productCount === "number"
                    ? `${c.productCount}`
                    : null}
                  <ChevronDown
                    className={cn(
                      "size-4 transition",
                      open && "rotate-180 text-[var(--orange)]"
                    )}
                    strokeWidth={2}
                  />
                </span>
              </button>

              {open ? (
                <div className="border-t border-[var(--line)] bg-[var(--soft)]/40 px-2 py-2">
                  {bucket?.loading && !bucket.items.length ? (
                    <p className="flex items-center justify-center gap-2 py-4 text-[12px] text-[var(--muted)]">
                      <Loader2 className="size-3.5 animate-spin" />
                      Loading products…
                    </p>
                  ) : null}
                  {bucket?.error ? (
                    <p className="px-2 py-2 text-[12px] text-red-700">
                      {bucket.error}
                    </p>
                  ) : null}
                  {bucket && !bucket.loading && bucket.items.length === 0 ? (
                    <p className="px-2 py-3 text-center text-[12px] text-[var(--muted)]">
                      No products in this category.
                    </p>
                  ) : null}
                  {bucket?.items?.length ? (
                    <>
                      <div className="mb-1.5 flex justify-end px-1">
                        <button
                          type="button"
                          onClick={() => selectAllVisible(c.slug)}
                          className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--orange)]"
                        >
                          Select loaded
                        </button>
                      </div>
                      <ul className="space-y-0.5">
                        {bucket.items.map((p) => {
                          const on = selectedIds.includes(p.id);
                          return (
                            <li key={p.id}>
                              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-[var(--paper)]">
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => toggleProduct(p.id, p.name)}
                                />
                                <span className="min-w-0 flex-1 truncate">
                                  {p.name}
                                </span>
                                {typeof p.priceMin === "number" ? (
                                  <span className="shrink-0 text-[11px] text-[var(--muted)]">
                                    ${p.priceMin}
                                  </span>
                                ) : null}
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                      {bucket.items.length < bucket.total ? (
                        <button
                          type="button"
                          disabled={bucket.loading}
                          onClick={() =>
                            void loadCategory(c.slug, bucket.items.length, true)
                          }
                          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink)] disabled:opacity-60"
                        >
                          {bucket.loading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : null}
                          Load more ({bucket.items.length}/{bucket.total})
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
