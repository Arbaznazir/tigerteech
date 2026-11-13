"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

export type DetailFieldOption = {
  id: string;
  key: string;
  label: string;
};

export type ProductAttribute = {
  key: string;
  label: string;
  value: string;
};

type Props = {
  fields: DetailFieldOption[];
  value: ProductAttribute[];
  onChange: (next: ProductAttribute[]) => void;
  /** Always shown from Shop placement — not editable here. */
  categoryLabels?: string[];
};

const CATEGORY_KEYS = new Set(["category", "categories"]);

export function ProductAttributesEditor({
  fields,
  value,
  onChange,
  categoryLabels = [],
}: Props) {
  const [customLabel, setCustomLabel] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const editableValue = useMemo(
    () => value.filter((v) => !CATEGORY_KEYS.has(v.key.toLowerCase())),
    [value]
  );

  const usedKeys = useMemo(
    () => new Set(editableValue.map((v) => v.key)),
    [editableValue]
  );

  const available = fields.filter(
    (f) => !CATEGORY_KEYS.has(f.key.toLowerCase()) && !usedKeys.has(f.key)
  );

  function emit(nextEditable: ProductAttribute[]) {
    // Drop any leftover category attribute — shop placement owns it.
    onChange(nextEditable.filter((v) => !CATEGORY_KEYS.has(v.key.toLowerCase())));
  }

  function addField(field: DetailFieldOption) {
    if (CATEGORY_KEYS.has(field.key.toLowerCase())) return;
    emit([...editableValue, { key: field.key, label: field.label, value: "" }]);
  }

  function addCustom() {
    const label = customLabel.trim();
    if (!label) return;
    const key = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!key || CATEGORY_KEYS.has(key) || usedKeys.has(key)) return;
    emit([...editableValue, { key, label, value: "" }]);
    setCustomLabel("");
    setShowCustom(false);
  }

  function patch(key: string, nextValue: string) {
    emit(
      editableValue.map((row) =>
        row.key === key ? { ...row, value: nextValue } : row
      )
    );
  }

  function remove(key: string) {
    emit(editableValue.filter((row) => row.key !== key));
  }

  const categoryDisplay =
    categoryLabels.length > 0 ? categoryLabels.join(", ") : "None selected";

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
        <div>
          <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
            Product details
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
            Specs shown on the product page — style, fit, fabric notes, etc.
          </p>
        </div>
      </header>

      <ul className="divide-y divide-[var(--line)]">
        <li className="grid grid-cols-[minmax(7rem,9rem)_1fr] items-center gap-3 bg-[var(--soft)]/35 px-4 py-2.5">
          <span className="truncate text-[12px] font-semibold text-[var(--ink)]">
            Category
          </span>
          <div className="flex min-h-9 flex-wrap items-center gap-1.5">
            {categoryLabels.length === 0 ? (
              <span className="text-[12px] text-[var(--muted)]">
                Pick categories under Shop placement — always shown here.
              </span>
            ) : (
              categoryLabels.map((name) => (
                <span
                  key={name}
                  className="inline-flex h-7 items-center rounded-lg border border-[var(--orange)]/40 bg-[var(--orange)]/15 px-2.5 text-[12px] font-semibold text-[var(--ink)]"
                >
                  {name}
                </span>
              ))
            )}
            <span className="sr-only">{categoryDisplay}</span>
          </div>
        </li>

        {editableValue.map((row) => (
          <li
            key={row.key}
            className="grid grid-cols-[minmax(7rem,9rem)_1fr_auto] items-center gap-3 px-4 py-2.5"
          >
            <span className="truncate text-[12px] font-semibold text-[var(--ink)]">
              {row.label}
            </span>
            <input
              className="h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 text-[13px] outline-none transition placeholder:text-[var(--muted)]/70 focus:border-[var(--orange)] focus:bg-white"
              placeholder={`Enter ${row.label.toLowerCase()}`}
              value={row.value}
              onChange={(e) => patch(row.key, e.target.value)}
            />
            <button
              type="button"
              aria-label={`Remove ${row.label}`}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-red-50 hover:text-[#b42318]"
              onClick={() => remove(row.key)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {editableValue.length === 0 ? (
        <div className="border-t border-[var(--line)] px-4 py-4 text-center">
          <p className="text-[13px] font-medium text-[var(--ink)]">
            Add more specs below
          </p>
          <p className="mt-1 text-[12px] text-[var(--muted)]">
            Category comes from Shop placement. Style, fit, and other fields are
            optional.
          </p>
        </div>
      ) : null}

      <div className="border-t border-[var(--line)] bg-[var(--paper)] px-4 py-3">
        {available.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {available.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => addField(f)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-2.5 text-[12px] font-medium text-[var(--ink)] transition hover:border-[var(--orange)] hover:bg-[var(--orange)]/10"
              >
                <span className="text-[var(--orange)]">+</span>
                {f.label}
              </button>
            ))}
          </div>
        ) : editableValue.length > 0 ? (
          <p className="text-[11px] text-[var(--muted)]">
            All saved fields are on this product.
          </p>
        ) : null}

        {showCustom ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              autoFocus
              className="h-9 min-w-[160px] flex-1 rounded-lg border border-[var(--line)] bg-white px-3 text-[13px] outline-none focus:border-[var(--orange)]"
              placeholder="Custom field name"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
                if (e.key === "Escape") {
                  setShowCustom(false);
                  setCustomLabel("");
                }
              }}
            />
            <button
              type="button"
              className="h-9 rounded-lg bg-[var(--forest)] px-3 text-[12px] font-semibold text-[var(--paper)]"
              onClick={addCustom}
            >
              Add
            </button>
            <button
              type="button"
              className="h-9 px-2 text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink)]"
              onClick={() => {
                setShowCustom(false);
                setCustomLabel("");
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={cn(
              "text-[12px] font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]",
              available.length > 0 ? "mt-2.5" : ""
            )}
            onClick={() => setShowCustom(true)}
          >
            + Custom field
          </button>
        )}
      </div>
    </section>
  );
}
