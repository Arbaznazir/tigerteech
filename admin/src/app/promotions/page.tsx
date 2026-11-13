"use client";

import { FormEvent, useEffect, useState } from "react";
import { CategoryProductPicker } from "@/components/CategoryProductPicker";
import { GiftProductSearch } from "@/components/GiftProductSearch";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const CARD_STYLES = [
  { id: "ember", label: "Ember", hint: "Warm orange pulse" },
  { id: "aurora", label: "Aurora", hint: "Charcoal → gold shift" },
  { id: "stripe", label: "Tiger stripe", hint: "Moving stripes" },
  { id: "spark", label: "Spark", hint: "Light sweep" },
  { id: "midnight", label: "Midnight", hint: "Deep glow" },
  { id: "gold", label: "Sand gold", hint: "Soft gold wash" },
] as const;

type Promotion = {
  id: string;
  kind: string;
  code: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  scope: string;
  minSubtotal: number;
  giftProductId?: string | null;
  usageLimitType: string;
  usageLimitCount: number;
  redemptionCount: number;
  cardStyle?: string;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  productIds: string[];
  giftProductName?: string;
};

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = () => ({
  kind: "coupon",
  code: "",
  title: "",
  description: "",
  discountType: "percent",
  discountValue: 10,
  scope: "cart",
  minSubtotal: 0,
  giftProductId: "",
  usageLimitType: "unlimited",
  usageLimitCount: 100,
  startsAt: "",
  endsAt: "",
  isActive: true,
  cardStyle: "ember",
  productIds: [] as string[],
});

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-[13px] outline-none transition focus:border-[var(--orange)] focus:bg-white";

export default function PromotionsPage() {
  const [list, setList] = useState<Promotion[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [giftName, setGiftName] = useState("");
  const [knownProductNames, setKnownProductNames] = useState<
    Record<string, string>
  >({});

  async function load() {
    const promos = await api<Promotion[]>("/api/v1/admin/promotions");
    setList(promos || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (
        form.discountType === "gift_threshold" &&
        !form.giftProductId.trim()
      ) {
        throw new Error("Select a gift product");
      }
      if (
        form.scope === "product" &&
        form.discountType !== "gift_threshold" &&
        form.productIds.length === 0
      ) {
        throw new Error("Select at least one product");
      }
      const body = {
        kind: form.kind,
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        scope: form.scope,
        minSubtotal: Number(form.minSubtotal) || 0,
        giftProductId:
          form.discountType === "gift_threshold" && form.giftProductId
            ? form.giftProductId
            : null,
        usageLimitType: form.usageLimitType,
        usageLimitCount:
          form.usageLimitType === "first_n"
            ? Math.max(1, Math.floor(Number(form.usageLimitCount) || 1))
            : 0,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        isActive: form.isActive,
        cardStyle: form.cardStyle,
        productIds: form.scope === "product" ? form.productIds : [],
      };
      if (editingId) {
        await api(`/api/v1/admin/promotions/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/v1/admin/promotions", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setForm(emptyForm());
      setEditingId(null);
      setGiftName("");
      setKnownProductNames({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function edit(p: Promotion) {
    setEditingId(p.id);
    setGiftName(p.giftProductName || "");
    setKnownProductNames({});
    setForm({
      kind: p.kind || "coupon",
      code: p.code || "",
      title: p.title || "",
      description: p.description || "",
      discountType: p.discountType || "percent",
      discountValue: p.discountValue || 0,
      scope: p.scope || "cart",
      minSubtotal: p.minSubtotal || 0,
      giftProductId: p.giftProductId || "",
      usageLimitType: p.usageLimitType || "unlimited",
      usageLimitCount: p.usageLimitCount || 100,
      startsAt: toLocalInput(p.startsAt),
      endsAt: toLocalInput(p.endsAt),
      isActive: p.isActive,
      cardStyle: p.cardStyle || "ember",
      productIds: p.productIds || [],
    });
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this promotion?")) return;
    await api(`/api/v1/admin/promotions/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--orange)]">
            Marketing
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Promos & offers
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Coupons, promo codes, and spend-threshold gifts — separate from
            Deals.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["coupon", "Coupon"],
                ["promo", "Promo"],
                ["offer", "Offer"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, kind: value }))}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] transition",
                  form.kind === value
                    ? "border-[var(--orange)] bg-[var(--orange)]/10 text-[var(--ink)]"
                    : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--orange)]/40"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="block text-[12px] font-semibold text-[var(--ink)]">
            Title
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              placeholder="First 100 — 15% off"
            />
          </label>

          <label className="block text-[12px] font-semibold text-[var(--ink)]">
            Code {form.discountType === "gift_threshold" ? "(optional)" : ""}
            <input
              className={inputClass}
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              placeholder="WILD15"
            />
          </label>

          <label className="block text-[12px] font-semibold text-[var(--ink)]">
            Description
            <textarea
              className={cn(inputClass, "min-h-[72px] resize-y")}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Shown on home / product / cart"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-semibold text-[var(--ink)]">
              Discount type
              <select
                className={inputClass}
                value={form.discountType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountType: e.target.value }))
                }
              >
                <option value="percent">Percentage</option>
                <option value="fixed">Flat amount (USD)</option>
                <option value="gift_threshold">
                  Gift at spend threshold
                </option>
              </select>
            </label>
            {form.discountType !== "gift_threshold" ? (
              <label className="block text-[12px] font-semibold text-[var(--ink)]">
                Value
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discountValue: Number(e.target.value),
                    }))
                  }
                />
              </label>
            ) : (
              <label className="block text-[12px] font-semibold text-[var(--ink)]">
                Min cart (USD)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  value={form.minSubtotal}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      minSubtotal: Number(e.target.value),
                    }))
                  }
                />
              </label>
            )}
          </div>

          {form.discountType === "gift_threshold" ? (
            <GiftProductSearch
              value={form.giftProductId}
              selectedName={giftName}
              onChange={(id, name) => {
                setForm((f) => ({ ...f, giftProductId: id }));
                setGiftName(name || "");
              }}
            />
          ) : (
            <label className="block text-[12px] font-semibold text-[var(--ink)]">
              Min cart (USD, optional)
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={form.minSubtotal}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    minSubtotal: Number(e.target.value),
                  }))
                }
              />
            </label>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-semibold text-[var(--ink)]">
              Applies to
              <select
                className={inputClass}
                value={form.scope}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scope: e.target.value }))
                }
                disabled={form.discountType === "gift_threshold"}
              >
                <option value="cart">Whole cart</option>
                <option value="product">Selected products only</option>
              </select>
            </label>
            <label className="block text-[12px] font-semibold text-[var(--ink)]">
              Usage limit
              <select
                className={inputClass}
                value={
                  form.usageLimitType === "all_users"
                    ? "unlimited"
                    : form.usageLimitType
                }
                onChange={(e) =>
                  setForm((f) => ({ ...f, usageLimitType: e.target.value }))
                }
              >
                <option value="unlimited">
                  Every qualifying order (reuse)
                </option>
                <option value="once_per_user">Once per customer</option>
                <option value="first_n">First N customers (once each)</option>
              </select>
            </label>
          </div>

          <p className="text-[11px] leading-relaxed text-[var(--muted)]">
            {form.usageLimitType === "once_per_user"
              ? "Each logged-in customer can redeem this once. After that it disappears for them."
              : form.usageLimitType === "first_n"
                ? "Only the first N customers can redeem — once each. After that the offer closes."
                : "Customers can reuse this on every order as long as they enter a valid code and still meet the rules (min spend, products, dates)."}
          </p>

          {form.usageLimitType === "first_n" ? (
            <label className="block text-[12px] font-semibold text-[var(--ink)]">
              First N customers
              <input
                type="number"
                min={1}
                className={inputClass}
                value={form.usageLimitCount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    usageLimitCount: Number(e.target.value),
                  }))
                }
              />
            </label>
          ) : null}

          {form.scope === "product" &&
          form.discountType !== "gift_threshold" ? (
            <CategoryProductPicker
              selectedIds={form.productIds}
              knownNames={knownProductNames}
              onChange={(ids) => setForm((f) => ({ ...f, productIds: ids }))}
            />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-semibold text-[var(--ink)]">
              Starts
              <input
                type="datetime-local"
                className={inputClass}
                value={form.startsAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startsAt: e.target.value }))
                }
              />
            </label>
            <label className="block text-[12px] font-semibold text-[var(--ink)]">
              Ends
              <input
                type="datetime-local"
                className={inputClass}
                value={form.endsAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endsAt: e.target.value }))
                }
              />
            </label>
          </div>

          <div>
            <p className="text-[12px] font-semibold text-[var(--ink)]">
              Card animation
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              Storefront promo tile background — pick when you create the code.
            </p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {CARD_STYLES.map((style) => {
                const on = form.cardStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, cardStyle: style.id }))
                    }
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition",
                      on
                        ? "border-[var(--orange)] bg-[var(--orange)]/12"
                        : "border-[var(--line)] bg-white hover:border-[var(--ink)]/25"
                    )}
                  >
                    <span className="block text-[12px] font-bold text-[var(--ink)]">
                      {style.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                      {style.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-[13px] font-semibold text-[var(--ink)]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
            />
            Active
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--orange)] px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--ink)] disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : editingId
                  ? "Update promotion"
                  : "Create promotion"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm());
                  setGiftName("");
                  setKnownProductNames({});
                }}
                className="rounded-full border border-[var(--line)] px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em]"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3">
          {list.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center text-sm text-[var(--muted)]">
              No promotions yet — create a coupon, promo, or gift offer.
            </p>
          ) : (
            list.map((p) => (
              <article
                key={p.id}
                className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--orange)]">
                      {p.kind}
                      {p.code ? ` · ${p.code}` : ""}
                      {p.cardStyle ? ` · ${p.cardStyle}` : ""}
                    </p>
                    <h3 className="mt-1 text-[15px] font-semibold text-[var(--ink)]">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-[12px] text-[var(--muted)]">
                      {p.discountType === "gift_threshold"
                        ? `Gift at $${p.minSubtotal}+${
                            p.giftProductName
                              ? ` → ${p.giftProductName}`
                              : ""
                          }`
                        : p.discountType === "percent"
                          ? `${p.discountValue}% off · ${p.scope}`
                          : `$${p.discountValue} off · ${p.scope}`}
                      {" · "}
                      {p.usageLimitType === "first_n"
                        ? `First ${p.usageLimitCount} customers (${p.redemptionCount} used)`
                        : p.usageLimitType === "once_per_user"
                          ? "Once per customer"
                          : "Every qualifying order"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
                      p.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-[var(--soft)] text-[var(--muted)]"
                    )}
                  >
                    {p.isActive ? "Active" : "Off"}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => edit(p)}
                    className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </Shell>
  );
}
