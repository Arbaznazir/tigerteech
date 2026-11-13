import {
  emptyProductForm,
  type ProductFormValues,
} from "@/lib/productFormTypes";

const PREFIX = "tt_product_draft:";

export function draftKey(productId?: string | null) {
  return `${PREFIX}${productId || "new"}`;
}

export function loadProductDraft(
  productId?: string | null
): ProductFormValues | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(draftKey(productId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProductFormValues;
    if (!parsed || typeof parsed !== "object") return null;
    const base = emptyProductForm();
    return {
      ...base,
      ...parsed,
      status: "draft",
      graph: {
        colors: parsed.graph?.colors || [],
        materials: parsed.graph?.materials || [],
      },
      images: parsed.images || [],
      categoryIds: parsed.categoryIds || [],
      tagSlugs: parsed.tagSlugs || [],
      highlightTagSlugs: parsed.highlightTagSlugs || [],
      attributes: parsed.attributes || [],
    };
  } catch {
    return null;
  }
}

export function saveProductDraft(form: ProductFormValues) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      draftKey(form.id),
      JSON.stringify({ ...form, status: "draft" })
    );
  } catch {
    // quota / private mode — ignore
  }
}

export function clearProductDraft(productId?: string | null) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(draftKey(productId));
}

export function hasProductDraft(productId?: string | null) {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(draftKey(productId)));
}

export type LocalDraftSummary = {
  key: string;
  productId: string | null;
  name: string;
  imageUrl: string;
  updatedHint: string;
};

/** Unsaved drafts left in this browser (before Save product). */
export function listLocalProductDrafts(): LocalDraftSummary[] {
  if (typeof window === "undefined") return [];
  const out: LocalDraftSummary[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as ProductFormValues;
      const idPart = key.slice(PREFIX.length);
      const productId = idPart === "new" ? null : idPart || null;
      const name = (parsed.name || "").trim() || "Untitled product";
      const imageUrl = parsed.images?.[0]?.url || "";
      out.push({
        key,
        productId,
        name,
        imageUrl,
        updatedHint: productId ? "Editing saved product" : "Never saved to catalog",
      });
    } catch {
      // skip corrupt
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
