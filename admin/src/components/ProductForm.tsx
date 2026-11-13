"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, uploadFile } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  clearProductDraft,
  loadProductDraft,
  saveProductDraft,
} from "@/lib/productDraft";
import {
  emptyProductForm,
  type ProductFormValues,
} from "@/lib/productFormTypes";
import { ProductAttributesEditor } from "@/components/ProductAttributesEditor";
import { VariantGraphEditor } from "@/components/VariantGraphEditor";
import { ProductShelfPreview } from "@/components/ProductShelfPreview";
import { Toast } from "@/components/Toast";
import { buildSwatchCss } from "@/lib/colorSwatch";
import {
  expandGraphToVariants,
  graphFromVariants,
  type VariantGraph,
} from "@/lib/variantGraph";

export type { ProductFormValues } from "@/lib/productFormTypes";

type Category = { id: string; name: string };
type Tag = { id?: string; slug: string; label: string; kind?: string; accent?: string };
type DetailField = { id: string; key: string; label: string };

type Props = {
  initial?: ProductFormValues;
  categories: Category[];
  tags: Tag[];
  detailFields: DetailField[];
};

export function productFormFromApi(p: {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  genderFit: string;
  requiresShirtMeas: boolean;
  requiresTrouserMeas: boolean;
  categoryIds: string[];
  tags: { slug: string; kind?: string }[];
  images: { url: string; sortOrder: number; alt: string }[];
  variants: {
    materialName?: string;
    colorName: string;
    colorHex: string;
    price: number;
    stock?: number | null;
    maxPerOrder?: number | null;
  }[];
  details?: Record<string, unknown> | null;
}): ProductFormValues {
  const details = (p.details || {}) as {
    variantGraph?: VariantGraph;
    attributes?: { key: string; label: string; value: string }[];
  };
  let graph =
    details.variantGraph?.colors?.length || details.variantGraph?.materials?.length
      ? details.variantGraph!
      : graphFromVariants(p.variants || []);

  // Backfill stock / maxPerOrder if an older graph is missing them.
  graph = {
    colors: graph.colors?.length ? graph.colors : [],
    materials: (graph.materials || []).map((m) => ({
      ...m,
      stock: typeof m.stock === "number" ? m.stock : 0,
      maxPerOrder:
        typeof m.maxPerOrder === "number" ? Math.max(0, m.maxPerOrder) : 0,
    })),
  };

  const highlightTagSlugs = (p.tags || [])
    .filter((t) => t.kind === "highlight")
    .map((t) => t.slug);
  const tagSlugs = (p.tags || [])
    .filter((t) => t.kind !== "highlight")
    .map((t) => t.slug);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    status: p.status,
    genderFit: p.genderFit,
    requiresShirtMeas: p.requiresShirtMeas,
    requiresTrouserMeas: p.requiresTrouserMeas,
    categoryIds: p.categoryIds || [],
    tagSlugs,
    highlightTagSlugs,
    attributes: details.attributes || [],
    images: p.images || [],
    graph,
  };
}

function resolveInitial(initial?: ProductFormValues): ProductFormValues {
  const draft = loadProductDraft(initial?.id);
  if (draft) {
    // Prefer local draft so refresh / upload errors never wipe work.
    return { ...draft, id: initial?.id || draft.id, status: "draft" };
  }
  return initial || emptyProductForm();
}

function fingerprintProductForm(form: ProductFormValues) {
  return JSON.stringify({
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description,
    status: form.status || "draft",
    genderFit: form.genderFit,
    requiresShirtMeas: form.requiresShirtMeas,
    requiresTrouserMeas: form.requiresTrouserMeas,
    categoryIds: [...form.categoryIds].filter(Boolean).sort(),
    tagSlugs: [...form.tagSlugs].filter(Boolean).sort(),
    highlightTagSlugs: [...form.highlightTagSlugs].filter(Boolean).sort(),
    attributes: form.attributes
      .filter((a) => a.key.toLowerCase() !== "category")
      .map((a) => ({
        key: a.key,
        label: a.label,
        value: a.value,
      })),
    images: form.images.map((im) => ({
      url: im.url,
      sortOrder: im.sortOrder,
      alt: im.alt || "",
    })),
    graph: form.graph,
  });
}

function buildProductSaveBody(
  form: ProductFormValues,
  expanded: ReturnType<typeof expandGraphToVariants>
) {
  const categoryIds = form.categoryIds.filter((id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    )
  );
  const tagSlugs = Array.from(
    new Set(
      [...form.tagSlugs, ...form.highlightTagSlugs]
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description || "",
    status: form.status || "draft",
    genderFit: form.genderFit || "unisex",
    requiresShirtMeas: Boolean(form.requiresShirtMeas),
    requiresTrouserMeas: Boolean(form.requiresTrouserMeas),
    categoryIds,
    tagSlugs,
    images: (form.images || []).map((im, i) => ({
      url: im.url,
      sortOrder: typeof im.sortOrder === "number" ? im.sortOrder : i,
      alt: im.alt || "",
    })),
    variants: expanded.map((v) => ({
      sku: v.sku || "",
      materialName: v.materialName || "",
      colorName: v.colorName || "",
      colorHex: v.colorHex || "#161412",
      sizeLabel: v.sizeLabel || "",
      price: Number(v.price) || 0,
      stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
      maxPerOrder: Math.max(0, Math.floor(Number(v.maxPerOrder) || 0)),
      isActive: true,
    })),
    details: {
      variantGraph: form.graph,
      attributes: (form.attributes || []).filter(
        (a) =>
          a.label.trim() &&
          a.key.toLowerCase() !== "category" &&
          a.key.toLowerCase() !== "categories"
      ),
    },
  };
}

export function ProductForm({
  initial,
  categories,
  tags,
  detailFields,
}: Props) {
  const collectionTags = tags.filter((t) => t.kind !== "highlight");
  const highlightTags = tags.filter((t) => t.kind === "highlight");
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<"web" | "phone">("web");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [toast, setToast] = useState<{
    title: string;
    detail?: string;
    tone?: "success" | "info";
  } | null>(null);
  const [draftNote, setDraftNote] = useState(
    () => Boolean(loadProductDraft(initial?.id))
  );
  const [form, setForm] = useState<ProductFormValues>(() =>
    resolveInitial(initial)
  );
  // Compare against the last server-backed snapshot (not a local draft),
  // so a pending draft still triggers a real save.
  const lastSavedFingerprint = useRef(
    fingerprintProductForm(initial || emptyProductForm())
  );
  const skipNextDraftSave = useRef(false);

  // Toast carried across create → edit soft navigation.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("tt_product_save_toast");
      if (!raw) return;
      sessionStorage.removeItem("tt_product_save_toast");
      const parsed = JSON.parse(raw) as {
        title: string;
        detail?: string;
        tone?: "success" | "info";
      };
      if (parsed?.title) setToast(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  // Keep auto-draft in sync (always as draft until published via Save).
  useEffect(() => {
    if (skipNextDraftSave.current) {
      skipNextDraftSave.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      saveProductDraft({ ...form, status: "draft" });
      setDraftNote(true);
    }, 350);
    return () => window.clearTimeout(t);
  }, [form]);

  const priceLabel = useMemo(() => {
    const prices = form.graph.materials.map((m) => Number(m.price) || 0);
    if (!prices.length) return "$0";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `$${min}` : `$${min} – $${max}`;
  }, [form.graph.materials]);

  const primaryImage = form.images[0]?.url || "";
  const badge = form.tagSlugs.includes("new_arrival")
    ? "NEW"
    : form.tagSlugs.includes("bestseller")
      ? "#1 Bestseller"
      : form.tagSlugs.includes("sale")
        ? "Sale"
        : undefined;

  const previewVariants = form.graph.colors.map((c) => ({
    colorName: c.name,
    colorStyle: c.colorStyle,
    colorHex: c.colorHex,
    colorHex2: c.colorHex2,
  }));

  async function onUpload(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const { url } = await uploadFile(file, "products");
      setForm((f) => ({
        ...f,
        status: "draft",
        images: [...f.images, { url, sortOrder: f.images.length, alt: f.name }],
      }));
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  function discardDraft() {
    if (
      !window.confirm(
        "Delete this local draft? Your unsaved product edits will be cleared."
      )
    ) {
      return;
    }
    clearProductDraft(form.id);
    skipNextDraftSave.current = true;
    setDraftNote(false);
    setForm(initial || emptyProductForm());
    setUploadError("");
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setUploadError("");
    try {
      if (!form.name.trim()) {
        throw new Error("Add a product name before saving.");
      }
      if (!form.graph.materials.length) {
        throw new Error("Add at least one material variant with a price.");
      }
      const expanded = expandGraphToVariants(form.graph);
      if (!expanded.length) {
        throw new Error(
          "Connect at least one color to a material, or keep a material row."
        );
      }

      const status = (form.status || "draft").toLowerCase();
      const statusLabel =
        status === "active"
          ? "Active"
          : status === "archived"
            ? "Archived"
            : "Draft";
      const fp = fingerprintProductForm(form);
      if (form.id && fp === lastSavedFingerprint.current) {
        setToast({
          title: "Everything is already up to date",
          detail: `No changes to save · Status: ${statusLabel}`,
          tone: "info",
        });
        return;
      }

      const body = buildProductSaveBody(form, expanded);

      if (form.id) {
        await api(`/api/v1/admin/products/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        skipNextDraftSave.current = true;
        clearProductDraft(form.id);
        setDraftNote(false);
        lastSavedFingerprint.current = fp;
        setToast({
          title: "Congratulations, your product has been saved successfully",
          detail: `Product uploaded successfully · Status: ${statusLabel}`,
          tone: "success",
        });
      } else {
        const created = await api<{ id: string }>("/api/v1/admin/products", {
          method: "POST",
          body: JSON.stringify(body),
        });
        skipNextDraftSave.current = true;
        clearProductDraft("new");
        clearProductDraft(undefined);
        clearProductDraft(created.id);
        setDraftNote(false);
        lastSavedFingerprint.current = fp;
        try {
          sessionStorage.setItem(
            "tt_product_save_toast",
            JSON.stringify({
              title:
                "Congratulations, your product has been saved successfully",
              detail: `Product uploaded successfully · Status: ${statusLabel}`,
              tone: "success",
            })
          );
        } catch {
          /* ignore */
        }
        // Soft navigate into the editor so Live inventory appears (no hard reload).
        setForm((f) => ({ ...f, id: created.id }));
        router.replace(`/products/${created.id}`);
      }
    } catch (err) {
      // Keep every field — only surface the save error.
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <Toast
        open={Boolean(toast)}
        title={toast?.title || ""}
        detail={toast?.detail}
        tone={toast?.tone || "success"}
        onClose={() => setToast(null)}
      />
      <div className="space-y-4">
        {draftNote ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2">
            <p className="text-[12px] text-[var(--ink)]">
              Auto-saved as <span className="font-semibold">draft</span> on this
              device. Errors won’t wipe your work.
            </p>
            <button
              type="button"
              className="text-[12px] font-semibold text-[#b42318] hover:underline"
              onClick={discardDraft}
            >
              Delete draft
            </button>
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <header className="border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
            <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
              Basics
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              Name, copy, publish state, and fit.
            </p>
          </header>

          <div className="space-y-4 p-4">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Name
              </span>
              <input
                required
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-3 text-[15px] font-semibold tracking-tight text-[var(--ink)] outline-none transition placeholder:font-normal placeholder:text-[var(--muted)]/70 focus:border-[var(--orange)] focus:bg-white"
                placeholder="Product name"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "");
                  setForm((f) => ({ ...f, name, slug }));
                }}
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Description
              </span>
              <textarea
                rows={4}
                className="mt-1.5 w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)]/70 focus:border-[var(--orange)] focus:bg-white"
                placeholder="What makes this piece worth wearing…"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Status
                </p>
                <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-1">
                  {(
                    [
                      ["draft", "Draft"],
                      ["active", "Active"],
                      ["archived", "Archived"],
                    ] as const
                  ).map(([value, label]) => {
                    const on = form.status === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, status: value }))}
                        className={cn(
                          "h-8 rounded-lg text-[12px] font-semibold transition",
                          on
                            ? "bg-[var(--forest)] text-[var(--paper)] shadow-sm"
                            : "text-[var(--muted)] hover:text-[var(--ink)]"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Fit
                </p>
                <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-1">
                  {(
                    [
                      ["unisex", "Unisex"],
                      ["men", "Men"],
                      ["women", "Women"],
                    ] as const
                  ).map(([value, label]) => {
                    const on = form.genderFit === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, genderFit: value }))
                        }
                        className={cn(
                          "h-8 rounded-lg text-[12px] font-semibold transition",
                          on
                            ? "bg-[var(--orange)] text-[var(--ink)] shadow-sm"
                            : "text-[var(--muted)] hover:text-[var(--ink)]"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Checkout measurements
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {(
                  [
                    [
                      "requiresShirtMeas",
                      "Shirt measurements",
                      form.requiresShirtMeas,
                    ],
                    [
                      "requiresTrouserMeas",
                      "Trouser measurements",
                      form.requiresTrouserMeas,
                    ],
                  ] as const
                ).map(([key, label, on]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, [key]: !f[key] }))
                    }
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[12px] font-semibold transition",
                      on
                        ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                        : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:border-[var(--ink)]/30 hover:text-[var(--ink)]"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-4 place-items-center rounded border text-[10px] leading-none",
                        on
                          ? "border-white/40 bg-white/15"
                          : "border-[var(--line)] bg-white"
                      )}
                    >
                      {on ? "✓" : ""}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <header className="border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
            <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
              Shop placement
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              Where it shows up — categories, collections, and PDP feature tags.
            </p>
          </header>

          <div className="divide-y divide-[var(--line)]">
            <div className="px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Categories
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.length === 0 ? (
                  <p className="text-[12px] text-[var(--muted)]">
                    No categories yet — add some under Categories.
                  </p>
                ) : (
                  categories.map((c) => {
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
                          "h-8 rounded-lg border px-3 text-[12px] font-semibold transition",
                          on
                            ? "border-[var(--orange)] bg-[var(--orange)] text-[var(--ink)]"
                            : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--orange)]/50"
                        )}
                      >
                        {c.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Collection tags
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Shelf badges — Bestseller, New Arrival, Sale…
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {collectionTags.map((t) => {
                  const on = form.tagSlugs.includes(t.slug);
                  return (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          tagSlugs: on
                            ? f.tagSlugs.filter((s) => s !== t.slug)
                            : [...f.tagSlugs, t.slug],
                        }))
                      }
                      className={cn(
                        "h-8 rounded-lg border px-3 text-[12px] font-semibold transition",
                        on
                          ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                          : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--forest)]/40"
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Feature tags
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                Pills on the product page — fabric claims, ethics, etc.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {highlightTags.length === 0 ? (
                  <p className="text-[12px] text-[var(--muted)]">
                    Add feature tags under Product details → Tags.
                  </p>
                ) : (
                  highlightTags.map((t) => {
                    const on = form.highlightTagSlugs.includes(t.slug);
                    return (
                      <button
                        key={t.slug}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            highlightTagSlugs: on
                              ? f.highlightTagSlugs.filter((s) => s !== t.slug)
                              : [...f.highlightTagSlugs, t.slug],
                          }))
                        }
                        className={cn(
                          "h-8 rounded-lg border px-3 text-[12px] font-semibold transition",
                          on
                            ? "border-[var(--orange)] bg-[var(--orange)]/20 text-[var(--ink)]"
                            : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--orange)]/50"
                        )}
                      >
                        {t.label}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>

        <ProductAttributesEditor
          fields={detailFields}
          value={form.attributes}
          categoryLabels={categories
            .filter((c) => form.categoryIds.includes(c.id))
            .map((c) => c.name)}
          onChange={(attributes) => setForm((f) => ({ ...f, attributes }))}
        />

        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <header className="border-b border-[var(--line)] bg-[var(--soft)]/60 px-4 py-3">
            <h3 className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
              Images
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              Auto-converted to WebP on upload. First image is the cover.
            </p>
          </header>
          <div className="p-4">
            <input
              ref={imageInputRef}
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
              onClick={() => {
                setUploadError("");
                imageInputRef.current?.click();
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-[var(--paper)] px-4 py-6 text-center transition hover:border-[var(--orange)] hover:bg-[var(--orange)]/5 disabled:opacity-60",
                uploadError
                  ? "border-[#b42318]/50"
                  : "border-[var(--line)]",
                form.images.length === 0 && "min-h-[120px]"
              )}
            >
              <span className="inline-flex h-9 items-center rounded-full bg-[var(--orange)] px-4 text-[12px] font-semibold text-[var(--ink)]">
                {uploading ? "Uploading…" : "Upload image"}
              </span>
              <span className="text-[11px] text-[var(--muted)]">
                JPG, PNG, or WebP
              </span>
            </button>
            {uploadError ? (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {uploadError}
              </p>
            ) : null}
            {form.images.length > 0 ? (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {form.images.map((im, idx) => (
                  <div
                    key={im.url}
                    className="relative aspect-square overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--soft)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={im.url}
                      alt=""
                      className="size-full object-cover object-top"
                    />
                    {idx === 0 ? (
                      <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                        Cover
                      </span>
                    ) : null}
                    <button
                      type="button"
                      aria-label="Remove image"
                      className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/70 text-[14px] leading-none text-white hover:bg-[#b42318]"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          images: f.images.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <VariantGraphEditor
          value={form.graph}
          onChange={(graph) =>
            setForm((f) => ({
              ...f,
              graph: {
                colors: graph.colors,
                materials: graph.materials,
              },
            }))
          }
          photoUrls={form.images.map((im) => im.url)}
        />

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="sticky bottom-3 z-10 flex justify-end rounded-2xl border border-[var(--line)] bg-[var(--paper)]/95 px-4 py-3 shadow-[0_8px_30px_rgba(18,16,14,0.08)] backdrop-blur">
          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-full bg-[var(--orange)] px-5 text-[13px] font-semibold text-[var(--ink)] transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save product"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Storefront preview
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Shop grid → click your product for the full page preview
            </p>
          </div>
          <div className="flex rounded-full border border-[var(--line)] p-1">
            {(["web", "phone"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPreview(mode)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                  preview === mode
                    ? "bg-[var(--forest)] text-[var(--paper)]"
                    : "text-[var(--muted)]"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <ProductShelfPreview
            mode={preview}
            name={form.name}
            priceLabel={priceLabel}
            description={form.description}
            imageUrl={primaryImage}
            imageUrls={form.images.map((im) => im.url)}
            badge={badge}
            genderFit={form.genderFit}
            variants={
              previewVariants.length
                ? previewVariants
                : [
                    {
                      colorName: "Default",
                      colorStyle: "solid" as const,
                      colorHex: "#161412",
                      colorHex2: "#F38120",
                    },
                  ]
            }
            attributes={form.attributes.map((a) => ({
              label: a.label,
              value: a.value,
            }))}
            highlightTags={tags
              .filter(
                (t) =>
                  t.kind === "highlight" &&
                  form.highlightTagSlugs.includes(t.slug)
              )
              .map((t) => ({ label: t.label, accent: t.accent }))}
            materials={form.graph.materials.map((m) => ({
              name: m.name || "Material",
              price: Number(m.price) || 0,
              colors: m.colorIds
                .map((id) => {
                  const c = form.graph.colors.find((x) => x.id === id);
                  return c
                    ? buildSwatchCss({
                        colorStyle: c.colorStyle,
                        colorHex: c.colorHex,
                        colorHex2: c.colorHex2,
                      })
                    : "";
                })
                .filter(Boolean),
            }))}
          />
        </div>
        <p className="mt-3 text-center text-[11px] text-[var(--muted)]">
          Click your orange-bordered product to open the inside product page
          preview (details, tags, materials).
        </p>
      </div>
    </form>
  );
}
