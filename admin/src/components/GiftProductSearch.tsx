"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { api, unwrapItems } from "@/lib/api";
import { cn } from "@/lib/cn";

type ProductRow = {
  id: string;
  name: string;
  priceMin?: number;
};

type Props = {
  value: string;
  onChange: (id: string, name?: string) => void;
  selectedName?: string;
};

export function GiftProductSearch({ value, onChange, selectedName }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState(selectedName || "");

  useEffect(() => {
    if (selectedName) setLabel(selectedName);
  }, [selectedName]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      setLoading(true);
      api<{ items?: ProductRow[] }>(
        `/api/v1/admin/products?status=all&q=${encodeURIComponent(term)}&limit=20&offset=0`
      )
        .then((data) => {
          if (!cancelled) setResults(unwrapItems(data));
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q]);

  return (
    <div className="space-y-2">
      <p className="text-[12px] font-semibold text-[var(--ink)]">
        Gift product (hidden from normal shop listing)
      </p>
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--orange)]/40 bg-[var(--orange)]/8 px-3.5 py-2.5 text-[13px]">
          <span className="truncate font-semibold">
            {label || selectedName || "Selected gift"}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setLabel("");
              setQ("");
            }}
            className="shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product by name…"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] py-2.5 pl-9 pr-3.5 text-[13px] outline-none transition focus:border-[var(--orange)] focus:bg-white"
            />
            {loading ? (
              <Loader2 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-[var(--muted)]" />
            ) : null}
          </div>
          {q.trim().length >= 2 ? (
            <ul className="max-h-44 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] p-1">
              {results.length === 0 && !loading ? (
                <li className="px-3 py-3 text-center text-[12px] text-[var(--muted)]">
                  No matches
                </li>
              ) : null}
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(p.id, p.name);
                      setLabel(p.name);
                      setQ("");
                      setResults([]);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition hover:bg-[var(--soft)]"
                    )}
                  >
                    <span className="truncate font-medium">{p.name}</span>
                    {typeof p.priceMin === "number" ? (
                      <span className="shrink-0 text-[11px] text-[var(--muted)]">
                        ${p.priceMin}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-[var(--muted)]">
              Type at least 2 characters — gifts are not loaded in bulk.
            </p>
          )}
        </>
      )}
    </div>
  );
}
