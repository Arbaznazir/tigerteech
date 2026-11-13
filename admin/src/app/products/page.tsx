"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Pagination, paginate } from "@/components/Pagination";
import { api, unwrapItems } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  clearProductDraft,
  listLocalProductDrafts,
  type LocalDraftSummary,
} from "@/lib/productDraft";

type Product = {
  id: string;
  name: string;
  slug: string;
  status: string;
  primaryImage: string;
  priceMin: number;
  priceMax: number;
  tags: { slug: string; label: string }[];
};

const PAGE_SIZE = 10;
type StatusFilter = "all" | "draft" | "active" | "archived";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [localDrafts, setLocalDrafts] = useState<LocalDraftSummary[]>([]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  function refreshLocalDrafts() {
    setLocalDrafts(listLocalProductDrafts());
  }

  useEffect(() => {
    refreshLocalDrafts();
    api<Product[] | { items: Product[] }>("/api/v1/admin/products?status=all&limit=48")
      .then((data) => setProducts(unwrapItems(data)))
      .catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (status === "all") return products;
    return products.filter((p) => p.status === status);
  }, [products, status]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const pageItems = paginate(filtered, page, PAGE_SIZE);

  const counts = useMemo(() => {
    const c = { all: products.length, draft: 0, active: 0, archived: 0 };
    for (const p of products) {
      if (p.status === "draft") c.draft++;
      else if (p.status === "active") c.active++;
      else if (p.status === "archived") c.archived++;
    }
    return c;
  }, [products]);

  function discardLocal(d: LocalDraftSummary) {
    if (
      !window.confirm(
        `Discard unfinished draft “${d.name}”? This only clears the local copy on this device.`
      )
    ) {
      return;
    }
    clearProductDraft(d.productId);
    refreshLocalDrafts();
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Products</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Variants map colors/shades to prices. Previews update before save.
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--orange)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--ink)]"
        >
          <Plus className="size-4" /> New product
        </Link>
      </div>

      {localDrafts.length > 0 ? (
        <section className="mt-5 overflow-hidden rounded-2xl border border-[var(--orange)]/40 bg-[var(--orange)]/10">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--orange)]/25 px-4 py-3">
            <div>
              <h3 className="text-[13px] font-bold text-[var(--ink)]">
                Unfinished drafts on this device
              </h3>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                You left the editor before Save — pick up where you stopped.
              </p>
            </div>
          </header>
          <ul className="divide-y divide-[var(--orange)]/20">
            {localDrafts.map((d) => (
              <li
                key={d.key}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-11 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-white">
                    {d.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.imageUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : null}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--ink)]">
                      {d.name}
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {d.updatedHint}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-8 rounded-lg px-2.5 text-[12px] font-medium text-[var(--muted)] hover:text-[#b42318]"
                    onClick={() => discardLocal(d)}
                  >
                    Discard
                  </button>
                  <Link
                    href={
                      d.productId
                        ? `/products/${d.productId}`
                        : "/products/new"
                    }
                    className="inline-flex h-8 items-center rounded-full bg-[var(--forest)] px-3.5 text-[12px] font-semibold text-[var(--paper)]"
                  >
                    Resume
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-1.5">
        {(
          [
            ["all", "All"],
            ["draft", "Drafts"],
            ["active", "Active"],
            ["archived", "Archived"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStatus(id)}
            className={cn(
              "h-8 rounded-lg border px-3 text-[12px] font-semibold transition",
              status === id
                ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--forest)]/40"
            )}
          >
            {label}
            <span className="ml-1.5 text-[11px] opacity-70">
              {counts[id]}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--soft)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Tags</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((p) => (
              <tr
                key={p.id}
                className="border-b border-[var(--line)] last:border-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/products/${p.id}`}
                    className="flex items-center gap-3 hover:text-[var(--orange)]"
                  >
                    <span className="size-12 overflow-hidden rounded-lg bg-[var(--soft)]">
                      {p.primaryImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.primaryImage}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : null}
                    </span>
                    <span>
                      <span className="block font-semibold">{p.name}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {p.slug}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold capitalize",
                      p.status === "active"
                        ? "bg-emerald-50 text-emerald-800"
                        : p.status === "draft"
                          ? "bg-[var(--orange)]/15 text-[var(--ink)]"
                          : "bg-[var(--soft)] text-[var(--muted)]"
                    )}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  ${p.priceMin.toFixed(0)}
                  {p.priceMax !== p.priceMin
                    ? ` – $${p.priceMax.toFixed(0)}`
                    : ""}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.tags?.map((t) => (
                      <span
                        key={t.slug}
                        className="rounded-full bg-[var(--soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !error && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-[var(--muted)]"
                >
                  {status === "draft"
                    ? localDrafts.length > 0
                      ? "No saved drafts in the catalog yet — resume an unfinished draft above."
                      : "No draft products. Unfinished work also appears above if you left the editor."
                    : status === "all"
                      ? "No products yet. Create your first set."
                      : `No ${status} products.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>
    </Shell>
  );
}
