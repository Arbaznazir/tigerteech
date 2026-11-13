"use client";

import { useCallback, useEffect, useState } from "react";
import { AmountInput } from "@/components/AmountInput";
import { Pagination, paginate } from "@/components/Pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 10;

type Row = {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  materialName: string;
  colorName: string;
  colorHex: string;
  stock: number | null;
  maxPerOrder: number;
  price: number;
};

type Props = {
  /** When set, only show variants for this product. */
  productId?: string;
};

export function InventoryPanel({ productId }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [addById, setAddById] = useState<Record<string, number>>({});

  const load = useCallback(() => {
    setError("");
    api<Row[]>("/api/v1/admin/inventory")
      .then((list) => {
        const all = list || [];
        setRows(
          productId ? all.filter((r) => r.productId === productId) : all
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  async function adjust(
    variantId: string,
    body: { set?: number; add?: number; outOfStock?: boolean }
  ) {
    setBusy(variantId);
    setError("");
    try {
      await api(`/api/v1/admin/variants/${variantId}/inventory`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  if (!rows.length && !error) {
    return (
      <p className="text-[12px] text-[var(--muted)]">
        {productId
          ? "Save the product with linked colors to manage live stock here."
          : "No active variants yet."}
      </p>
    );
  }

  const pageRows = productId ? rows : paginate(rows, page, PAGE_SIZE);

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)] bg-white">
        {pageRows.map((r) => {
          const stock = r.stock ?? 0;
          const oos = stock <= 0;
          return (
            <li
              key={r.variantId}
              className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                {!productId ? (
                  <p className="truncate text-[12px] font-semibold text-[var(--ink)]">
                    {r.productName}
                  </p>
                ) : null}
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className="size-3.5 shrink-0 rounded-full border border-[var(--line)]"
                    style={{ background: r.colorHex || "#161412" }}
                  />
                  <p className="truncate text-[13px] text-[var(--ink)]">
                    {r.materialName || "Material"} · {r.colorName || "Color"}
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {r.maxPerOrder > 0
                    ? `Max ${r.maxPerOrder} / order`
                    : "No per-order limit"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-7 min-w-16 items-center justify-center rounded-full px-2.5 text-[12px] font-semibold",
                    oos
                      ? "bg-red-50 text-[#b42318]"
                      : "bg-[var(--soft)] text-[var(--ink)]"
                  )}
                >
                  {oos ? "Out of stock" : `${stock} in stock`}
                </span>

                <button
                  type="button"
                  disabled={busy === r.variantId || oos}
                  className="h-8 rounded-md border border-[var(--line)] px-2.5 text-[12px] font-medium text-[var(--ink)] transition hover:border-[#b42318] hover:text-[#b42318] disabled:opacity-40"
                  onClick={() =>
                    adjust(r.variantId, { outOfStock: true })
                  }
                >
                  Mark OOS
                </button>

                <div className="flex items-center gap-1">
                  <AmountInput
                    className="h-8 w-16 rounded-md border border-[var(--line)] px-2 text-[12px] outline-none focus:border-[var(--orange)]"
                    value={addById[r.variantId] ?? 1}
                    emptyZero={false}
                    min={1}
                    placeholder="+qty"
                    onChange={(n) =>
                      setAddById((s) => ({
                        ...s,
                        [r.variantId]: Math.max(1, Math.floor(n)),
                      }))
                    }
                  />
                  <button
                    type="button"
                    disabled={busy === r.variantId}
                    className="h-8 rounded-full bg-[var(--orange)] px-3 text-[12px] font-semibold text-[var(--ink)] disabled:opacity-40"
                    onClick={() =>
                      adjust(r.variantId, {
                        add: addById[r.variantId] ?? 1,
                      })
                    }
                  >
                    Add stock
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {!productId ? (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={rows.length}
            onPageChange={setPage}
          />
        ) : null}
      </ul>
    </div>
  );
}
