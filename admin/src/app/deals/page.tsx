"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { State } from "country-state-city";
import { AmountInput } from "@/components/AmountInput";
import {
  DealStripPreview,
  defaultDealBanner,
  type DealBannerStyle,
} from "@/components/DealStripPreview";
import {
  FlagCountrySelect,
  type FlagCountry,
} from "@/components/FlagCountrySelect";
import { Pagination, paginate } from "@/components/Pagination";
import { Shell } from "@/components/Shell";
import { Toast } from "@/components/Toast";
import { api, unwrapItems } from "@/lib/api";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 8;

type DealGeoRule = {
  countryIso: string;
  countryName: string;
  scope: "country" | "states" | string;
  states: string[];
  stateIsos?: string[];
};

type Deal = {
  id: string;
  title: string;
  slug: string;
  discountType: string;
  discountValue: number;
  scope: string;
  countdownEnabled: boolean;
  isActive: boolean;
  geoEverywhere: boolean;
  geoRules: DealGeoRule[];
  startsAt?: string;
  endsAt?: string;
  productIds: string[];
  categoryIds: string[];
  banner: DealBannerStyle;
  phase?: string;
};

type Product = {
  id: string;
  name: string;
  primaryImage?: string;
  priceMin?: number;
  categoryIds?: string[];
};
type Category = { id: string; name: string };

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const emptyForm = () => ({
  title: "",
  slug: "",
  discountType: "percent",
  discountValue: 20,
  scope: "platform" as "platform" | "category" | "products",
  countdownEnabled: true,
  isActive: true,
  geoEverywhere: true,
  geoRules: [] as DealGeoRule[],
  startsAt: "",
  endsAt: "",
  productIds: [] as string[],
  categoryIds: [] as string[],
  banner: defaultDealBanner(),
});

function flagEmoji(iso2: string): string {
  const code = iso2.toUpperCase();
  if (code.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + code.charCodeAt(0) - 65,
    A + code.charCodeAt(1) - 65
  );
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-[13px] outline-none transition focus:border-[var(--orange)] focus:bg-white";

const BG_PRESETS = [
  { id: "forest", value: "#161412", label: "Charcoal" },
  { id: "orange", value: "#F38120", label: "Tiger" },
  { id: "deep", value: "#0A0908", label: "Deep" },
  { id: "moss", value: "#3A3228", label: "Bark" },
];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"web" | "phone">("web");
  const [previewPhase, setPreviewPhase] = useState<
    "auto" | "upcoming" | "live" | "ended"
  >("auto");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastDetail, setToastDetail] = useState("");
  const [geoCountry, setGeoCountry] = useState<FlagCountry>({
    iso: "US",
    name: "United States",
  });
  const [geoScope, setGeoScope] = useState<"country" | "states">("country");
  const [geoStates, setGeoStates] = useState<string[]>([]);
  const [geoStateIsos, setGeoStateIsos] = useState<string[]>([]);
  const [geoStateQuery, setGeoStateQuery] = useState("");

  const geoStateOptions = useMemo(
    () =>
      State.getStatesOfCountry(geoCountry.iso).map((s) => ({
        name: s.name,
        iso: s.isoCode,
      })),
    [geoCountry.iso]
  );

  const filteredGeoStates = useMemo(() => {
    const q = geoStateQuery.trim().toLowerCase();
    if (!q) return geoStateOptions;
    return geoStateOptions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.iso.toLowerCase().includes(q)
    );
  }, [geoStateOptions, geoStateQuery]);

  async function load() {
    const [d, p, c] = await Promise.all([
      api<Deal[]>("/api/v1/admin/deals"),
      api<Product[] | { items: Product[] }>("/api/v1/admin/products?status=all&limit=48"),
      api<Category[]>("/api/v1/admin/categories"),
    ]);
    setDeals(d || []);
    setProducts(unwrapItems(p));
    setCategories(c || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function patchBanner<K extends keyof DealBannerStyle>(
    key: K,
    value: DealBannerStyle[K]
  ) {
    setForm((f) => ({ ...f, banner: { ...f.banner, [key]: value } }));
  }

  function startEdit(d: Deal) {
    setEditingId(d.id);
    setForm({
      title: d.title || "",
      slug: d.slug || "",
      discountType: d.discountType || "percent",
      discountValue: d.discountValue ?? 20,
      scope: (d.scope as typeof form.scope) || "platform",
      countdownEnabled: d.countdownEnabled !== false,
      isActive: d.isActive !== false,
      geoEverywhere: d.geoEverywhere !== false,
      geoRules: d.geoRules || [],
      startsAt: toLocalInput(d.startsAt),
      endsAt: toLocalInput(d.endsAt),
      productIds: d.productIds || [],
      categoryIds: d.categoryIds || [],
      banner: { ...defaultDealBanner(), ...(d.banner || {}) },
    });
    setGeoStates([]);
    setGeoStateIsos([]);
    setGeoScope("country");
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm());
    setGeoStates([]);
    setGeoStateIsos([]);
    setGeoScope("country");
  }

  function addGeoRule() {
    if (!geoCountry.iso) return;
    const rule: DealGeoRule = {
      countryIso: geoCountry.iso,
      countryName: geoCountry.name,
      scope: geoScope,
      states: geoScope === "states" ? geoStates : [],
      stateIsos: geoScope === "states" ? geoStateIsos : [],
    };
    if (geoScope === "states" && rule.states.length === 0) {
      setError("Pick at least one state, or choose entire country.");
      return;
    }
    setForm((f) => ({
      ...f,
      geoEverywhere: false,
      geoRules: [
        ...f.geoRules.filter((r) => r.countryIso !== rule.countryIso),
        rule,
      ],
    }));
    setError("");
  }

  function removeGeoRule(iso: string) {
    setForm((f) => ({
      ...f,
      geoRules: f.geoRules.filter((r) => r.countryIso !== iso),
    }));
  }

  function toggleGeoState(name: string, iso: string) {
    setGeoStates((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
    setGeoStateIsos((prev) =>
      prev.includes(iso) ? prev.filter((s) => s !== iso) : [...prev, iso]
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        slug: form.slug || slugify(form.title),
        discountType: form.discountType,
        discountValue: form.discountValue,
        scope: form.scope,
        countdownEnabled: form.countdownEnabled,
        isActive: form.isActive,
        geoEverywhere: form.geoEverywhere,
        geoRules: form.geoEverywhere ? [] : form.geoRules,
        startsAt: form.startsAt
          ? new Date(form.startsAt).toISOString()
          : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        productIds: form.scope === "products" ? form.productIds : [],
        categoryIds: form.scope === "category" ? form.categoryIds : [],
        banner: form.banner,
      };
      if (!body.geoEverywhere && body.geoRules.length === 0) {
        setError("Add at least one country/state, or choose Everywhere.");
        setSaving(false);
        return;
      }
      const wasEdit = Boolean(editingId);
      if (editingId) {
        await api(`/api/v1/admin/deals/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/v1/admin/deals", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      await load();
      setToastTitle(
        wasEdit
          ? "Your deal has been updated successfully."
          : "Your deal has been saved successfully."
      );
      setToastDetail(
        form.countdownEnabled
          ? "It will show on the storefront under Free Shipping / Easy Returns when live."
          : "Countdown is off — turn it on to show the deal strip on the store."
      );
      setToastOpen(true);
      if (!wasEdit) startNew();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this deal?")) return;
    try {
      await api(`/api/v1/admin/deals/${id}`, { method: "DELETE" });
      if (editingId === id) startNew();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const previewProducts = useMemo(() => {
    const placeholders = [
      { id: "demo-1", name: "Jungle co-ord", price: 89, onDeal: true },
      { id: "demo-2", name: "Wild set", price: 96, onDeal: true },
      { id: "demo-3", name: "Bold tee set", price: 72, onDeal: true },
    ];

    if (form.scope === "products") {
      const selected = products.filter((p) => form.productIds.includes(p.id));
      if (!selected.length) {
        return placeholders.map((p, i) => ({
          ...p,
          onDeal: i < 2,
          name: i < 2 ? p.name : "Other product",
        }));
      }
      const onDeal = selected.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.primaryImage,
        price: Number(p.priceMin) || 89,
        onDeal: true,
      }));
      // Show one outside-deal product for contrast when possible
      const outsider = products.find((p) => !form.productIds.includes(p.id));
      if (outsider && onDeal.length < 3) {
        onDeal.push({
          id: outsider.id,
          name: outsider.name,
          imageUrl: outsider.primaryImage,
          price: Number(outsider.priceMin) || 72,
          onDeal: false,
        });
      }
      return onDeal;
    }

    if (form.scope === "category") {
      if (!form.categoryIds.length) {
        return placeholders.map((p, i) => ({ ...p, onDeal: i < 2 }));
      }
      const inCat = products.filter((p) =>
        (p.categoryIds || []).some((id) => form.categoryIds.includes(id))
      );
      const outCat = products.filter(
        (p) =>
          !(p.categoryIds || []).some((id) => form.categoryIds.includes(id))
      );
      const cards = (
        inCat.length
          ? inCat
          : placeholders.slice(0, 2).map((p) => ({
              id: p.id,
              name: p.name,
              primaryImage: undefined as string | undefined,
              priceMin: p.price,
            }))
      )
        .slice(0, 2)
        .map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: "primaryImage" in p ? p.primaryImage : undefined,
          price:
            "priceMin" in p
              ? Number(p.priceMin) || 89
              : Number((p as { price?: number }).price) || 89,
          onDeal: true,
        }));
      const extra = outCat[0];
      if (extra) {
        cards.push({
          id: extra.id,
          name: extra.name,
          imageUrl: extra.primaryImage,
          price: Number(extra.priceMin) || 72,
          onDeal: false,
        });
      } else if (cards.length < 3) {
        cards.push({
          id: "demo-out",
          name: "Outside category",
          imageUrl: undefined,
          price: 72,
          onDeal: false,
        });
      }
      return cards.slice(0, 3);
    }

    // platform — all on deal
    if (products.length) {
      return products.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.primaryImage,
        price: Number(p.priceMin) || 89,
        onDeal: true,
      }));
    }
    return placeholders;
  }, [form.scope, form.productIds, form.categoryIds, products]);

  const stripDraft = useMemo(
    () => ({
      title: form.title,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      countdownEnabled: form.countdownEnabled,
      discountType: form.discountType,
      discountValue: form.discountValue,
      scope: form.scope,
      banner: form.banner,
      products: previewProducts,
    }),
    [form, previewProducts]
  );

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Deals</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            Thin countdown strip above the hero — set start/end, scope, and
            clock styles. When the timer hits zero, the strip switches to the
            live message.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="h-10 rounded-full border border-[var(--line)] bg-white px-4 text-[12px] font-semibold"
        >
          + New deal
        </button>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <form onSubmit={onSubmit} className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <header className="border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
              <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
                {editingId ? "Edit deal" : "New deal"}
              </h3>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Discount + who it applies to.
              </p>
            </header>
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Title
                </span>
                <input
                  required
                  className={inputClass}
                  placeholder="Holiday flash sale"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
                      slug: slugify(e.target.value),
                    }))
                  }
                />
              </label>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Discount
                </p>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {(
                    [
                      ["percent", "% off", "e.g. 5% · 10% · 25%"],
                      ["fixed", "Flat off", "e.g. $10 · ₹ off via FX"],
                    ] as const
                  ).map(([id, label, hint]) => {
                    const on = form.discountType === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, discountType: id }))
                        }
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left transition",
                          on
                            ? "border-[var(--orange)] bg-[var(--orange)]/15 text-[var(--ink)]"
                            : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                        )}
                      >
                        <span className="block text-[12px] font-bold">
                          {label}
                        </span>
                        <span className="mt-0.5 block text-[10px] opacity-80">
                          {hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <label className="mt-3 block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {form.discountType === "fixed"
                      ? "Flat amount (USD catalog)"
                      : "Percent value"}
                  </span>
                  <AmountInput
                    className={inputClass}
                    value={form.discountValue}
                    placeholder={form.discountType === "fixed" ? "10" : "20"}
                    onChange={(discountValue) =>
                      setForm((f) => ({ ...f, discountValue }))
                    }
                  />
                  <span className="mt-1 block text-[11px] text-[var(--muted)]">
                    {form.discountType === "fixed"
                      ? `Products show “$${Number(form.discountValue) || 0} OFF” with sale price.`
                      : `Products show “${Number(form.discountValue) || 0}% OFF” with sale price.`}
                  </span>
                </label>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Applies to
                </p>
                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-3">
                  {(
                    [
                      ["platform", "Whole store", "Everyone sees this deal"],
                      ["category", "Categories", "Pick one or more"],
                      ["products", "Products", "Pick specific items"],
                    ] as const
                  ).map(([id, label, hint]) => {
                    const on = form.scope === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, scope: id }))}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left transition",
                          on
                            ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                            : "border-[var(--line)] bg-[var(--paper)] hover:border-[var(--forest)]/35"
                        )}
                      >
                        <span className="block text-[12px] font-bold">
                          {label}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-[10px]",
                            on ? "text-[var(--paper)]/65" : "text-[var(--muted)]"
                          )}
                        >
                          {hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.scope === "category" ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Categories
                  </p>
                  <div className="mt-1.5 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
                    {categories.map((c) => {
                      const on = form.categoryIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              categoryIds: on
                                ? f.categoryIds.filter((id) => id !== c.id)
                                : [...f.categoryIds, c.id],
                            }))
                          }
                          className={cn(
                            "h-8 rounded-lg border px-3 text-[12px] font-semibold",
                            on
                              ? "border-[var(--orange)] bg-[var(--orange)] text-[var(--ink)]"
                              : "border-[var(--line)] bg-[var(--paper)]"
                          )}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                    {categories.length === 0 ? (
                      <p className="text-[12px] text-[var(--muted)]">
                        No categories yet.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {form.scope === "products" ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Products
                  </p>
                  <div className="mt-1.5 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                    {products.map((p) => {
                      const on = form.productIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              productIds: on
                                ? f.productIds.filter((id) => id !== p.id)
                                : [...f.productIds, p.id],
                            }))
                          }
                          className={cn(
                            "h-8 rounded-lg border px-3 text-[12px] font-semibold",
                            on
                              ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                              : "border-[var(--line)] bg-[var(--paper)]"
                          )}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                    {products.length === 0 ? (
                      <p className="text-[12px] text-[var(--muted)]">
                        No products yet.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <header className="border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
              <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
                Where it runs
              </h3>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Whole world, or limit by country / state — same idea as COD.
              </p>
            </header>
            <div className="space-y-3 p-4">
              <div className="grid gap-1.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, geoEverywhere: true }))
                  }
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition",
                    form.geoEverywhere
                      ? "border-[var(--orange)] bg-[var(--orange)]/15"
                      : "border-[var(--line)] bg-[var(--paper)]"
                  )}
                >
                  <span className="block text-[12px] font-bold">Everywhere</span>
                  <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                    All countries see this deal
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, geoEverywhere: false }))
                  }
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition",
                    !form.geoEverywhere
                      ? "border-[var(--orange)] bg-[var(--orange)]/15"
                      : "border-[var(--line)] bg-[var(--paper)]"
                  )}
                >
                  <span className="block text-[12px] font-bold">
                    Selected regions
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                    Country-wide or specific states
                  </span>
                </button>
              </div>

              {!form.geoEverywhere ? (
                <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--soft)]/40 p-3">
                  <FlagCountrySelect
                    value={geoCountry.iso}
                    onChange={(c) => {
                      setGeoCountry(c);
                      setGeoStates([]);
                      setGeoStateIsos([]);
                      setGeoScope("country");
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGeoScope("country");
                        setGeoStates([]);
                        setGeoStateIsos([]);
                      }}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide",
                        geoScope === "country"
                          ? "bg-[var(--ink)] text-white"
                          : "bg-white text-[var(--muted)]"
                      )}
                    >
                      Entire country
                    </button>
                    <button
                      type="button"
                      disabled={geoStateOptions.length === 0}
                      onClick={() => setGeoScope("states")}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide disabled:opacity-40",
                        geoScope === "states"
                          ? "bg-[var(--orange)] text-[var(--ink)]"
                          : "bg-white text-[var(--muted)]"
                      )}
                    >
                      Specific states
                    </button>
                  </div>
                  {geoScope === "states" ? (
                    <div className="space-y-2">
                      <input
                        value={geoStateQuery}
                        onChange={(e) => setGeoStateQuery(e.target.value)}
                        placeholder="Search states…"
                        className="h-9 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-[12px] outline-none focus:border-[var(--orange)]"
                      />
                      <ul className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
                        {filteredGeoStates.map((s) => {
                          const on = geoStates.includes(s.name);
                          return (
                            <li key={s.iso}>
                              <button
                                type="button"
                                onClick={() => toggleGeoState(s.name, s.iso)}
                                className={cn(
                                  "w-full truncate rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium",
                                  on
                                    ? "border-[var(--orange)] bg-[var(--orange)]/15 text-[var(--ink)]"
                                    : "border-[var(--line)] bg-white text-[var(--muted)]"
                                )}
                              >
                                {s.name}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      <p className="text-[11px] text-[var(--muted)]">
                        {geoStates.length} selected
                      </p>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={addGeoRule}
                    className="h-9 w-full rounded-full bg-[var(--ink)] px-4 text-[11px] font-semibold uppercase tracking-wide text-white"
                  >
                    Add region
                  </button>
                  {form.geoRules.length ? (
                    <ul className="space-y-1.5">
                      {form.geoRules.map((rule) => (
                        <li
                          key={rule.countryIso}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold">
                              {flagEmoji(rule.countryIso)}{" "}
                              {rule.countryName || rule.countryIso}
                            </p>
                            <p className="text-[10px] text-[var(--muted)]">
                              {rule.scope === "states"
                                ? rule.states.join(", ")
                                : "Entire country"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeGeoRule(rule.countryIso)}
                            className="shrink-0 text-[11px] font-semibold text-[#b42318]"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[12px] text-[var(--muted)]">
                      No regions yet — add a country above.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <header className="border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
              <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
                Timer
              </h3>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Before start → countdown to open. After start → countdown to
                end. Live message replaces the pre-text when the deal opens.
              </p>
            </header>
            <div className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Starts (date & time)
                  </span>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.startsAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startsAt: e.target.value }))
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Ends (date & time)
                  </span>
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      countdownEnabled: !f.countdownEnabled,
                    }))
                  }
                  className={cn(
                    "h-9 rounded-xl border px-3 text-[12px] font-semibold",
                    form.countdownEnabled
                      ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                      : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                  )}
                >
                  Show countdown strip
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, isActive: !f.isActive }))
                  }
                  className={cn(
                    "h-9 rounded-xl border px-3 text-[12px] font-semibold",
                    form.isActive
                      ? "border-[var(--orange)] bg-[var(--orange)]/20 text-[var(--ink)]"
                      : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                  )}
                >
                  {form.isActive ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <header className="border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
              <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
                Strip copy & style
              </h3>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Professional top bar — background, clock, and before/after
                messages.
              </p>
            </header>
            <div className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Before deal opens
                  </span>
                  <input
                    className={inputClass}
                    value={form.banner.preText}
                    onChange={(e) => patchBanner("preText", e.target.value)}
                    placeholder="Holiday deal starts in"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    When deal is live
                  </span>
                  <input
                    className={inputClass}
                    value={form.banner.liveText}
                    onChange={(e) => patchBanner("liveText", e.target.value)}
                    placeholder="Timer ended — deal is live · ends in"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  After deal ends
                </span>
                <input
                  className={inputClass}
                  value={form.banner.endedText}
                  onChange={(e) => patchBanner("endedText", e.target.value)}
                  placeholder="This deal has ended"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    CTA label
                  </span>
                  <input
                    className={inputClass}
                    value={form.banner.ctaLabel}
                    onChange={(e) => patchBanner("ctaLabel", e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    CTA link
                  </span>
                  <input
                    className={inputClass}
                    value={form.banner.ctaHref}
                    onChange={(e) => patchBanner("ctaHref", e.target.value)}
                  />
                </label>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Background
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {BG_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => patchBanner("background", p.value)}
                      className={cn(
                        "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[12px] font-semibold",
                        form.banner.background === p.value
                          ? "border-[var(--ink)] bg-white shadow-sm"
                          : "border-[var(--line)] bg-[var(--paper)]"
                      )}
                    >
                      <span
                        className="size-3.5 rounded-full border border-black/10"
                        style={{ background: p.value }}
                      />
                      {p.label}
                    </button>
                  ))}
                  <label className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-[12px]">
                    Custom
                    <input
                      type="color"
                      className="size-6 cursor-pointer rounded border-0 bg-transparent"
                      value={form.banner.background || "#161412"}
                      onChange={(e) =>
                        patchBanner("background", e.target.value)
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Text color
                  </span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      className="size-10 cursor-pointer rounded-lg border border-[var(--line)]"
                      value={form.banner.textColor || "#FAF9F7"}
                      onChange={(e) => patchBanner("textColor", e.target.value)}
                    />
                    <input
                      className={cn(inputClass, "mt-0")}
                      value={form.banner.textColor}
                      onChange={(e) => patchBanner("textColor", e.target.value)}
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Accent / clock
                  </span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      className="size-10 cursor-pointer rounded-lg border border-[var(--line)]"
                      value={form.banner.accentColor || "#F38120"}
                      onChange={(e) =>
                        patchBanner("accentColor", e.target.value)
                      }
                    />
                    <input
                      className={cn(inputClass, "mt-0")}
                      value={form.banner.accentColor}
                      onChange={(e) =>
                        patchBanner("accentColor", e.target.value)
                      }
                    />
                  </div>
                </label>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Clock style
                </p>
                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-3">
                  {(
                    [
                      ["blocks", "Blocks", "Boxed digits + labels"],
                      ["inline", "Inline", "00:00:00:00"],
                      ["pills", "Pills", "Rounded chips"],
                    ] as const
                  ).map(([id, label, hint]) => {
                    const on = form.banner.clockStyle === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => patchBanner("clockStyle", id)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left",
                          on
                            ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                            : "border-[var(--line)] bg-[var(--paper)]"
                        )}
                      >
                        <span className="block text-[12px] font-bold">
                          {label}
                        </span>
                        <span
                          className={cn(
                            "text-[10px]",
                            on ? "text-[var(--paper)]/65" : "text-[var(--muted)]"
                          )}
                        >
                          {hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Text style
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(
                    [
                      ["bold", "Bold caps"],
                      ["elegant", "Elegant"],
                      ["compact", "Compact"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => patchBanner("textStyle", id)}
                      className={cn(
                        "h-9 rounded-xl border px-3 text-[12px] font-semibold",
                        form.banner.textStyle === id
                          ? "border-[var(--orange)] bg-[var(--orange)]/20 text-[var(--ink)]"
                          : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      patchBanner("showSeconds", !form.banner.showSeconds)
                    }
                    className={cn(
                      "h-9 rounded-xl border px-3 text-[12px] font-semibold",
                      form.banner.showSeconds
                        ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                        : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                    )}
                  >
                    Show seconds
                  </button>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="sticky bottom-3 z-10 flex justify-end rounded-2xl border border-[var(--line)] bg-[var(--paper)]/95 px-4 py-3 shadow-[0_8px_30px_rgba(18,16,14,0.08)] backdrop-blur">
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-full bg-[var(--orange)] px-5 text-[13px] font-semibold text-[var(--ink)] disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : editingId
                  ? "Update deal"
                  : "Save deal"}
            </button>
          </div>
        </form>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[13px] font-bold text-[var(--ink)]">
                  Strip preview
                </p>
                <p className="text-[11px] text-[var(--muted)]">
                  Top of page, above hero banners
                </p>
              </div>
              <div className="flex rounded-lg border border-[var(--line)] bg-[var(--paper)] p-1">
                {(["web", "phone"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPreviewMode(m)}
                    className={cn(
                      "h-8 rounded-md px-3 text-[11px] font-semibold uppercase",
                      previewMode === m
                        ? "bg-[var(--forest)] text-[var(--paper)]"
                        : "text-[var(--muted)]"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(
                [
                  ["auto", "Live clock"],
                  ["upcoming", "Pre-deal"],
                  ["live", "Deal open"],
                  ["ended", "Ended"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPreviewPhase(id)}
                  className={cn(
                    "h-7 rounded-lg border px-2.5 text-[11px] font-semibold",
                    previewPhase === id
                      ? "border-[var(--orange)] bg-[var(--orange)]/15 text-[var(--ink)]"
                      : "border-[var(--line)] text-[var(--muted)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <DealStripPreview
                draft={stripDraft}
                mode={previewMode}
                forcePhase={
                  previewPhase === "auto" ? undefined : previewPhase
                }
              />
            </div>
          </section>
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <header className="flex items-end justify-between border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
          <div>
            <h3 className="text-[13px] font-bold text-[var(--ink)]">
              Saved deals
            </h3>
            <p className="text-[11px] text-[var(--muted)]">
              Click a row to edit
            </p>
          </div>
          <p className="text-[11px] text-[var(--muted)]">{deals.length}</p>
        </header>
        <ul className="divide-y divide-[var(--line)]">
          {paginate(deals, page, PAGE_SIZE).map((d) => (
            <li
              key={d.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
                editingId === d.id && "bg-[var(--orange)]/5"
              )}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => startEdit(d)}
              >
                <p className="truncate text-[13px] font-semibold text-[var(--ink)]">
                  {d.title}
                </p>
                <p className="text-[11px] text-[var(--muted)]">
                  {d.discountType === "percent"
                    ? `${d.discountValue}%`
                    : `$${d.discountValue}`}{" "}
                  · {d.scope || "platform"}
                  {d.geoEverywhere === false
                    ? ` · ${(d.geoRules || []).length} region${(d.geoRules || []).length === 1 ? "" : "s"}`
                    : " · everywhere"}
                  {d.phase ? ` · ${d.phase}` : ""}
                  {d.endsAt
                    ? ` · ends ${new Date(d.endsAt).toLocaleString()}`
                    : ""}
                </p>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-8 rounded-lg px-2.5 text-[12px] font-semibold text-[var(--orange)]"
                  onClick={() => startEdit(d)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="h-8 rounded-lg px-2.5 text-[12px] font-semibold text-[#b42318] hover:bg-red-50"
                  onClick={() => onDelete(d.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {deals.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-[var(--muted)]">
              No deals yet — create one above.
            </li>
          ) : null}
        </ul>
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={deals.length}
          onPageChange={setPage}
        />
      </section>

      <Toast
        open={toastOpen}
        title={toastTitle}
        detail={toastDetail}
        tone="success"
        onClose={() => setToastOpen(false)}
      />
    </Shell>
  );
}
