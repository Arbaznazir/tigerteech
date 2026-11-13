"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pagination, paginate } from "@/components/Pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 10;

type Tag = {
  id: string;
  slug: string;
  label: string;
  kind: string;
  accent: string;
};

const KINDS = [
  {
    id: "highlight",
    label: "Feature",
    hint: "Pills on the product page",
  },
  {
    id: "collection",
    label: "Collection",
    hint: "Bestseller, New Arrival…",
  },
  {
    id: "badge",
    label: "Badge",
    hint: "Card corner badges",
  },
  {
    id: "deal_flag",
    label: "Deal",
    hint: "Sale / promo flags",
  },
] as const;

const ACCENTS = [
  { id: "green", label: "Green", swatch: "#2F6B4F" },
  { id: "gold", label: "Gold", swatch: "#C4A574" },
  { id: "rose", label: "Rose", swatch: "#C46B6B" },
  { id: "ink", label: "Ink", swatch: "#161412" },
] as const;

function kindLabel(kind: string) {
  return KINDS.find((k) => k.id === kind)?.label || kind;
}

function accentSwatch(accent: string) {
  return ACCENTS.find((a) => a.id === accent)?.swatch || "#6B6560";
}

export default function ProductDetailTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [highlightPage, setHighlightPage] = useState(1);
  const [otherPage, setOtherPage] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<string>("highlight");
  const [accent, setAccent] = useState("gold");

  async function load() {
    const list = await api<Tag[]>("/api/v1/admin/tags");
    setTags(list || []);
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
      await api("/api/v1/admin/tags", {
        method: "POST",
        body: JSON.stringify({
          label: trimmed,
          kind,
          accent: kind === "highlight" ? accent : "",
        }),
      });
      setLabel("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add tag");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`Delete tag “${name}”?`)) return;
    setError("");
    try {
      await api(`/api/v1/admin/tags/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const highlights = tags.filter((t) => t.kind === "highlight");
  const others = tags.filter((t) => t.kind !== "highlight");

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
            Add tag
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            Feature tags appear on the product page. Collection / badge tags
            power the shop shelf.
          </p>
        </header>

        <div className="space-y-4 p-4">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Label
            </span>
            <input
              required
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-[14px] font-semibold outline-none transition focus:border-[var(--orange)] focus:bg-white"
              placeholder="e.g. 100% natural fabrics"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Type
            </p>
            <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
              {KINDS.map((k) => {
                const on = kind === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition",
                      on
                        ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                        : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--forest)]/35"
                    )}
                  >
                    <span className="block text-[12px] font-bold">{k.label}</span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[10px] leading-snug",
                        on ? "text-[var(--paper)]/65" : "text-[var(--muted)]"
                      )}
                    >
                      {k.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {kind === "highlight" ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Accent color
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {ACCENTS.map((a) => {
                  const on = accent === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAccent(a.id)}
                      className={cn(
                        "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[12px] font-semibold transition",
                        on
                          ? "border-[var(--ink)] bg-white shadow-sm"
                          : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]"
                      )}
                    >
                      <span
                        className="size-3.5 rounded-full border border-black/10"
                        style={{ background: a.swatch }}
                      />
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--muted)]">Preview</span>
              <span
                className={cn(
                  "inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold",
                  kind === "highlight"
                    ? "border-transparent text-[var(--ink)]"
                    : "border-[var(--line)] bg-[var(--soft)] text-[var(--ink)]"
                )}
                style={
                  kind === "highlight"
                    ? {
                        background: `${accentSwatch(accent)}22`,
                        borderColor: `${accentSwatch(accent)}55`,
                      }
                    : undefined
                }
              >
                {label.trim() || "Your tag"}
              </span>
            </div>
            <button
              type="submit"
              disabled={saving || !label.trim()}
              className="h-10 rounded-full bg-[var(--orange)] px-5 text-[13px] font-semibold text-[var(--ink)] transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Adding…" : "Add tag"}
            </button>
          </div>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <header className="flex items-end justify-between gap-2 border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
          <div>
            <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
              Feature tags
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              Shown as pills on the product page.
            </p>
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            {highlights.length}
          </p>
        </header>

        {highlights.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">
            No feature tags yet — add one above.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {paginate(highlights, highlightPage, PAGE_SIZE).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="size-3 shrink-0 rounded-full border border-black/10"
                    style={{ background: accentSwatch(t.accent) }}
                    title={t.accent || "default"}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[var(--ink)]">
                      {t.label}
                    </p>
                    <p className="text-[11px] capitalize text-[var(--muted)]">
                      {t.accent || "default"} accent
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="h-8 shrink-0 rounded-lg px-2.5 text-[12px] font-semibold text-[#b42318] hover:bg-red-50"
                  onClick={() => onDelete(t.id, t.label)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pagination
          page={highlightPage}
          pageSize={PAGE_SIZE}
          total={highlights.length}
          onPageChange={setHighlightPage}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <header className="flex items-end justify-between gap-2 border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
          <div>
            <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
              Collection & badges
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              Used on product cards and shop filters.
            </p>
          </div>
          <p className="text-[11px] text-[var(--muted)]">{others.length}</p>
        </header>

        {others.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">
            No collection or badge tags yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {paginate(others, otherPage, PAGE_SIZE).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[var(--ink)]">
                    {t.label}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {kindLabel(t.kind)}
                  </p>
                </div>
                <button
                  type="button"
                  className="h-8 shrink-0 rounded-lg px-2.5 text-[12px] font-semibold text-[#b42318] hover:bg-red-50"
                  onClick={() => onDelete(t.id, t.label)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pagination
          page={otherPage}
          pageSize={PAGE_SIZE}
          total={others.length}
          onPageChange={setOtherPage}
        />
      </section>
    </div>
  );
}
