"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pagination, paginate } from "@/components/Pagination";
import { api } from "@/lib/api";

const PAGE_SIZE = 12;

type DetailField = {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
  isSystem: boolean;
};

export default function ProductDetailFieldsPage() {
  const [fields, setFields] = useState<DetailField[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");

  async function load() {
    const list = await api<DetailField[]>("/api/v1/admin/detail-fields");
    setFields(list || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    setError("");
    setSaving(true);
    try {
      await api("/api/v1/admin/detail-fields", {
        method: "POST",
        body: JSON.stringify({
          label: trimmed,
          sortOrder: (fields[fields.length - 1]?.sortOrder || 0) + 10,
          isSystem: false,
        }),
      });
      setLabel("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add field");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`Delete detail field “${name}”?`)) return;
    setError("");
    try {
      await api(`/api/v1/admin/detail-fields/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={onCreate}
        className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white"
      >
        <header className="border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
          <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
            Add detail input
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            These show up as “+ Style / Fit / Neck…” when editing a product.
          </p>
        </header>

        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Field name
            </span>
            <input
              required
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-[14px] font-semibold outline-none transition focus:border-[var(--orange)] focus:bg-white"
              placeholder="e.g. Sleeve length, Neck type"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={saving || !label.trim()}
            className="h-11 shrink-0 rounded-full bg-[var(--orange)] px-5 text-[13px] font-semibold text-[var(--ink)] transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add field"}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <header className="flex items-end justify-between gap-2 border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
          <div>
            <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
              Saved fields
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              System fields stay for every product; custom ones you can delete.
            </p>
          </div>
          <p className="text-[11px] text-[var(--muted)]">{fields.length}</p>
        </header>

        {fields.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">
            No detail fields yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {paginate(fields, page, PAGE_SIZE).map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[var(--ink)]">
                    {f.label}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {f.isSystem ? "Built-in field" : "Custom field"}
                  </p>
                </div>
                {f.isSystem ? (
                  <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                    System
                  </span>
                ) : (
                  <button
                    type="button"
                    className="h-8 shrink-0 rounded-lg px-2.5 text-[12px] font-semibold text-[#b42318] hover:bg-red-50"
                    onClick={() => onDelete(f.id, f.label)}
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={fields.length}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}
