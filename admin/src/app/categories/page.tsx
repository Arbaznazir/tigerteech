"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Shell } from "@/components/Shell";
import { Pagination, paginate } from "@/components/Pagination";
import { api, uploadFile } from "@/lib/api";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
};

type CategoryProduct = {
  id: string;
  name: string;
  slug: string;
  status: string;
  primaryImage?: string;
  priceMin?: number;
  priceMax?: number;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function previewUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("/images/")) return `http://localhost:3000${url}`;
  return url;
}

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailProducts, setDetailProducts] = useState<CategoryProduct[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [moveToByProduct, setMoveToByProduct] = useState<Record<string, string>>(
    {}
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const pageItems = paginate(items, page, PAGE_SIZE);

  const selected = useMemo(
    () => items.find((c) => c.id === selectedId) || null,
    [items, selectedId]
  );

  const otherCategories = useMemo(
    () => items.filter((c) => c.id !== selectedId),
    [items, selectedId]
  );

  async function load() {
    const list = await api<Category[]>("/api/v1/admin/categories");
    setItems(list || []);
  }

  async function loadDetail(categoryId: string) {
    setDetailLoading(true);
    setError("");
    try {
      const list = await api<CategoryProduct[]>(
        `/api/v1/admin/categories/${categoryId}/products`
      );
      setDetailProducts(list || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
      setDetailProducts([]);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetailProducts([]);
      return;
    }
    loadDetail(selectedId).catch(() => undefined);
  }, [selectedId]);

  async function onUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const { url } = await uploadFile(file, "categories");
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError("");
    setSaving(true);
    try {
      await api("/api/v1/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: trimmed,
          slug: slugify(trimmed),
          imageUrl,
          sortOrder: items.length,
          isActive: true,
        }),
      });
      setName("");
      setImageUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteCategory(c: Category) {
    const count = c.productCount ?? 0;
    if (count > 0) {
      setError(
        `“${c.name}” still has ${count} product${count === 1 ? "" : "s"}. Remove or reassign them before deleting.`
      );
      setSelectedId(c.id);
      return;
    }
    if (!window.confirm(`Delete category “${c.name}”?`)) return;
    setError("");
    try {
      await api(`/api/v1/admin/categories/${c.id}`, { method: "DELETE" });
      if (selectedId === c.id) setSelectedId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function removeProduct(productId: string) {
    if (!selectedId) return;
    if (
      !window.confirm(
        "Remove this product from the category? It will have no category until you assign another."
      )
    ) {
      return;
    }
    setBusyProductId(productId);
    setError("");
    try {
      await api(
        `/api/v1/admin/categories/${selectedId}/products/${productId}`,
        { method: "DELETE" }
      );
      await Promise.all([load(), loadDetail(selectedId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setBusyProductId(null);
    }
  }

  async function moveProduct(productId: string) {
    if (!selectedId) return;
    const target = moveToByProduct[productId];
    if (!target) {
      setError("Pick a category to move into.");
      return;
    }
    setBusyProductId(productId);
    setError("");
    try {
      await api(
        `/api/v1/admin/categories/${selectedId}/products/${productId}/move`,
        {
          method: "POST",
          body: JSON.stringify({ categoryId: target }),
        }
      );
      setMoveToByProduct((s) => {
        const next = { ...s };
        delete next[productId];
        return next;
      });
      await Promise.all([load(), loadDetail(selectedId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move");
    } finally {
      setBusyProductId(null);
    }
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Categories</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            Homepage circles and shop filters. Open a category to manage its
            products — delete only when it’s empty.
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-white"
      >
        <header className="border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
          <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
            Add category
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            Name is required. Profile image is optional.
          </p>
        </header>

        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                await onUpload(file);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="relative grid size-20 place-items-center overflow-hidden rounded-full border border-dashed border-[var(--line)] bg-[var(--paper)] transition hover:border-[var(--orange)] disabled:opacity-60"
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl(imageUrl)}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {uploading ? "…" : "Add photo"}
                </span>
              )}
            </button>
            {imageUrl ? (
              <button
                type="button"
                className="mt-1.5 block w-full text-center text-[11px] font-medium text-[var(--muted)] hover:text-[#b42318]"
                onClick={() => setImageUrl("")}
              >
                Remove
              </button>
            ) : (
              <p className="mt-1.5 text-center text-[10px] text-[var(--muted)]">
                Optional
              </p>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Name
              </span>
              <input
                required
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-[14px] font-semibold outline-none transition focus:border-[var(--orange)] focus:bg-white"
                placeholder="e.g. Co-ords, Tees, Outerwear"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="h-10 rounded-full bg-[var(--orange)] px-5 text-[13px] font-semibold text-[var(--ink)] transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Adding…" : "Add category"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {error ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <header className="flex items-end justify-between gap-2 border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
            <div>
              <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
                Your categories
              </h3>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Click a card to see its products
              </p>
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              {items.length}{" "}
              {items.length === 1 ? "category" : "categories"}
            </p>
          </header>

          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[13px] font-medium text-[var(--ink)]">
                No categories yet
              </p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">
                Add one above — it’ll show on the homepage circles and shop.
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-[var(--line)]">
                {pageItems.map((c) => {
                  const count = c.productCount ?? 0;
                  const on = selectedId === c.id;
                  return (
                    <li key={c.id}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 transition",
                          on ? "bg-[var(--orange)]/10" : "hover:bg-[var(--soft)]/50"
                        )}
                      >
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          onClick={() =>
                            setSelectedId((id) => (id === c.id ? null : c.id))
                          }
                        >
                          <span className="size-12 shrink-0 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--soft)]">
                            {c.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewUrl(c.imageUrl)}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              <span className="grid size-full place-items-center text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                                {c.name.slice(0, 2)}
                              </span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-[var(--ink)]">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-[var(--muted)]">
                              {count} product{count === 1 ? "" : "s"}
                              {c.isActive ? " · Active" : " · Hidden"}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "h-8 shrink-0 rounded-lg px-2.5 text-[12px] font-semibold",
                            count > 0
                              ? "cursor-not-allowed text-[var(--muted)] opacity-50"
                              : "text-[#b42318] hover:bg-red-50"
                          )}
                          title={
                            count > 0
                              ? "Remove products first"
                              : "Delete category"
                          }
                          disabled={count > 0}
                          onClick={() => onDeleteCategory(c)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={items.length}
                onPageChange={setPage}
              />
            </>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          {!selected ? (
            <div className="grid min-h-[280px] place-items-center px-6 py-12 text-center">
              <div>
                <p className="text-[14px] font-semibold text-[var(--ink)]">
                  Select a category
                </p>
                <p className="mt-1 max-w-sm text-[12px] text-[var(--muted)]">
                  See every product in it, move them to another category, or
                  remove the link so you can delete an empty category.
                </p>
              </div>
            </div>
          ) : (
            <>
              <header className="border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="size-12 shrink-0 overflow-hidden rounded-full border border-[var(--line)] bg-white">
                      {selected.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl(selected.imageUrl)}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-[11px] font-bold text-[var(--muted)]">
                          {selected.name.slice(0, 2)}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-bold text-[var(--ink)]">
                        {selected.name}
                      </h3>
                      <p className="text-[11px] text-[var(--muted)]">
                        {selected.productCount ?? detailProducts.length} product
                        {(selected.productCount ?? detailProducts.length) === 1
                          ? ""
                          : "s"}{" "}
                        in this category
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={cn(
                      "h-9 rounded-full px-4 text-[12px] font-semibold",
                      (selected.productCount ?? 0) > 0
                        ? "cursor-not-allowed border border-[var(--line)] text-[var(--muted)]"
                        : "bg-[#b42318] text-white hover:opacity-90"
                    )}
                    disabled={(selected.productCount ?? 0) > 0}
                    onClick={() => onDeleteCategory(selected)}
                  >
                    {(selected.productCount ?? 0) > 0
                      ? "Clear products to delete"
                      : "Delete category"}
                  </button>
                </div>
                {(selected.productCount ?? 0) > 0 ? (
                  <p className="mt-2 rounded-lg border border-[var(--orange)]/30 bg-[var(--orange)]/10 px-3 py-2 text-[11px] text-[var(--ink)]">
                    This category can’t be deleted while products are assigned.
                    Remove them (no category) or move them to another category
                    below.
                  </p>
                ) : null}
              </header>

              <div className="p-3">
                {detailLoading ? (
                  <p className="px-2 py-8 text-center text-[12px] text-[var(--muted)]">
                    Loading products…
                  </p>
                ) : detailProducts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--line)] px-4 py-10 text-center">
                    <p className="text-[13px] font-medium text-[var(--ink)]">
                      No products here
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--muted)]">
                      Assign products from the product editor, or delete this
                      empty category.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {detailProducts.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            href={`/products/${p.id}`}
                            className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-90"
                          >
                            <span className="size-12 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-white">
                              {p.primaryImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={previewUrl(p.primaryImage)}
                                  alt=""
                                  className="size-full object-cover object-top"
                                />
                              ) : null}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-semibold text-[var(--ink)]">
                                {p.name}
                              </span>
                              <span className="text-[11px] capitalize text-[var(--muted)]">
                                {p.status}
                                {typeof p.priceMin === "number"
                                  ? ` · $${p.priceMin.toFixed(0)}`
                                  : ""}
                              </span>
                            </span>
                          </Link>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-2.5">
                          <select
                            className="h-8 min-w-[140px] flex-1 rounded-lg border border-[var(--line)] bg-white px-2 text-[12px] outline-none focus:border-[var(--orange)]"
                            value={moveToByProduct[p.id] || ""}
                            onChange={(e) =>
                              setMoveToByProduct((s) => ({
                                ...s,
                                [p.id]: e.target.value,
                              }))
                            }
                          >
                            <option value="">Move to…</option>
                            {otherCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={
                              busyProductId === p.id || !moveToByProduct[p.id]
                            }
                            className="h-8 rounded-lg border border-[var(--line)] bg-white px-3 text-[12px] font-semibold text-[var(--ink)] disabled:opacity-40"
                            onClick={() => moveProduct(p.id)}
                          >
                            Move
                          </button>
                          <button
                            type="button"
                            disabled={busyProductId === p.id}
                            className="h-8 rounded-lg px-3 text-[12px] font-semibold text-[#b42318] hover:bg-red-50 disabled:opacity-40"
                            onClick={() => removeProduct(p.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}
