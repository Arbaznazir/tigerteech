import { apiGet } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media";
import type {
  CategorySlug,
  Product,
  ProductDetails,
  ProductReview,
} from "@/data/types";

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export type ApiBanner = {
  id: string;
  slotKey: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageDesktopUrl: string;
  imageMobileUrl: string;
  objectPositionDesktop: string;
  objectPositionMobile: string;
  copy: Record<string, unknown> | null;
  sortOrder: number;
  isActive: boolean;
};

export type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: Partial<ProductDetails> | Record<string, unknown> | null;
  status: string;
  genderFit: string;
  requiresShirtMeas: boolean;
  requiresTrouserMeas: boolean;
  ratingAvg: number;
  ratingCount: number;
  images: { url: string; alt?: string }[];
  variants: {
    id?: string;
    materialName?: string;
    colorName: string;
    colorHex: string;
    sizeLabel: string;
    price: number;
    stock?: number | null;
    maxPerOrder?: number | null;
    isActive?: boolean;
  }[];
  tags: { slug: string; label: string; kind?: string; accent?: string }[];
  categoryIds: string[];
  priceMin: number;
  priceMax: number;
  primaryImage: string;
};

export type StoreCategory = {
  slug: CategorySlug;
  label: string;
  image: string;
  icon?: "flame";
};

let productCache: Product[] = [];
let categoryCache: StoreCategory[] = [];
let catalogRevision = 0;
const catalogListeners = new Set<() => void>();

function bumpCatalog() {
  catalogRevision += 1;
  catalogListeners.forEach((listener) => listener());
}

export function getCatalogRevision() {
  return catalogRevision;
}

export function subscribeCatalog(listener: () => void) {
  catalogListeners.add(listener);
  return () => {
    catalogListeners.delete(listener);
  };
}

export function setProductCache(list: Product[]) {
  productCache = list;
  bumpCatalog();
}

export function getProductCache() {
  return productCache;
}

export function findProductById(id: string) {
  return productCache.find((p) => p.id === id);
}

/** Merge products into cache (used by cart hydration). */
export function mergeProductCache(list: Product[]) {
  if (!list.length) return;
  const byId = new Map(productCache.map((p) => [p.id, p]));
  for (const p of list) byId.set(p.id, p);
  setProductCache(Array.from(byId.values()));
}

/** Load catalog pages until every id is present (or catalog is exhausted). */
export async function ensureProductsByIds(ids: string[]): Promise<void> {
  const missing = () =>
    Array.from(new Set(ids.filter(Boolean))).filter((id) => !findProductById(id));
  if (!missing().length) return;

  // Prefer tagged shelves first — cart items often come from home carousels.
  await Promise.all([
    fetchProducts({ tag: "bestseller", limit: 40 }).catch(() => []),
    fetchProducts({ tag: "new_arrival", limit: 40 }).catch(() => []),
  ]);
  if (!missing().length) return;

  const pageSize = 48;
  let offset = 0;
  let guard = 0;
  while (missing().length && guard < 8) {
    guard += 1;
    const page = await fetchProductsPage({ limit: pageSize, offset });
    if (!page.items.length) break;
    offset += page.items.length;
    if (offset >= page.total) break;
  }
}

export function findProductBySlug(slug: string) {
  return productCache.find((p) => p.slug === slug);
}

export function setCategoryCache(list: StoreCategory[]) {
  categoryCache = list;
}

export function getCategoryCache() {
  return categoryCache;
}

function mapDetails(raw: ApiProduct["details"]): ProductDetails {
  const d = (raw || {}) as Partial<ProductDetails> & {
    attributes?: { key: string; label: string; value: string }[];
  };
  const attrs = d.attributes || [];
  const pick = (key: string, fallback: string) => {
    const fromAttr = attrs.find((a) => a.key === key)?.value;
    if (fromAttr) return fromAttr;
    const fromObj = (d as Record<string, string>)[key];
    if (fromObj) return fromObj;
    return fallback;
  };
  return {
    // Category always comes from Shop placement on the product, not detail fields.
    category: "",
    style: pick("style", "Casual / Fashion / Resort Wear"),
    pattern: pick("pattern", "Signature Print"),
    type: pick("type", "Full Sleeve"),
    fit: pick("fit", "Relaxed Fit"),
    neck: pick("neck", "Cuban Collar"),
    bottom: pick("bottom", "Straight Fit Trousers"),
    material: pick("material", "Premium artificial silk blend"),
  };
}

function mapAttributes(raw: ApiProduct["details"]) {
  const d = (raw || {}) as {
    attributes?: { key: string; label: string; value: string }[];
  };
  return (d.attributes || []).filter(
    (a) =>
      a.label &&
      a.value?.trim() &&
      a.key.toLowerCase() !== "category" &&
      a.key.toLowerCase() !== "categories"
  );
}

export function mapApiProduct(
  p: ApiProduct,
  idToSlug: Map<string, string>
): Product {
  const tagSlugs = (p.tags || []).map((t) => t.slug);
  const bestseller = tagSlugs.includes("bestseller");
  const newArrival = tagSlugs.includes("new_arrival");
  let badge: Product["badge"];
  if (bestseller) badge = "#1 Bestseller";
  else if (newArrival) badge = "NEW";
  else if (tagSlugs.includes("sale")) badge = "Sale";

  const highlightTags = (p.tags || [])
    .filter((t) => t.kind === "highlight")
    .map((t) => ({
      slug: t.slug,
      label: t.label,
      accent: t.accent || "",
    }));
  const attributes = mapAttributes(p.details);

  const colors = Array.from(
    new Set((p.variants || []).map((v) => v.colorHex).filter(Boolean))
  );
  const sizes = Array.from(
    new Set((p.variants || []).map((v) => v.sizeLabel).filter(Boolean))
  );
  if (sizes.length === 0) sizes.push("M", "L", "XL");

  const materialMap = new Map<
    string,
    {
      name: string;
      price: number;
      colors: {
        name: string;
        swatch: string;
        variantId?: string;
        stock: number;
        maxPerOrder: number;
      }[];
    }
  >();
  for (const v of p.variants || []) {
    if (v.isActive === false) continue;
    const name = (v.materialName || "").trim() || "Standard";
    let row = materialMap.get(name);
    if (!row) {
      row = { name, price: Number(v.price) || 0, colors: [] };
      materialMap.set(name, row);
    }
    row.price = Number(v.price) || row.price;
    if (v.colorHex && !row.colors.some((c) => c.swatch === v.colorHex)) {
      row.colors.push({
        name: v.colorName || "Color",
        swatch: v.colorHex,
        variantId: v.id,
        stock: typeof v.stock === "number" ? v.stock : 0,
        maxPerOrder:
          typeof v.maxPerOrder === "number" && v.maxPerOrder > 0
            ? v.maxPerOrder
            : 0,
      });
    }
  }
  const materials = [...materialMap.values()];

  const categories = (p.categoryIds || [])
    .map((id) => idToSlug.get(id))
    .filter(Boolean) as CategorySlug[];

  const images = (p.images || [])
    .map((i) => resolveMediaUrl(i.url))
    .filter(Boolean);
  const image = resolveMediaUrl(p.primaryImage) || images[0] || "";
  const details = mapDetails(p.details);
  if (materials[0]?.name && details.material === "Premium artificial silk blend") {
    details.material = materials.map((m) => m.name).join(" / ");
  }

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    priceMin: Number(p.priceMin) || 0,
    priceMax: Number(p.priceMax) || Number(p.priceMin) || 0,
    rating: Number(p.ratingAvg) || 0,
    reviewCount: Number(p.ratingCount) || 0,
    image,
    images: images.length ? images : image ? [image] : [],
    colors: colors.length ? colors : ["#161412"],
    sizes,
    materials,
    categories,
    categoryIds: p.categoryIds || [],
    genderFit: p.genderFit || "unisex",
    requiresShirtMeas: Boolean(p.requiresShirtMeas),
    requiresTrouserMeas: Boolean(p.requiresTrouserMeas),
    badge,
    description: p.description || "",
    details,
    attributes,
    highlightTags,
    reviews: [] as ProductReview[],
    bestseller,
    newArrival,
  };
}

export async function fetchCategories(): Promise<StoreCategory[]> {
  const raw = await apiGet<ApiCategory[]>("/api/v1/categories", {
    cache: "no-store",
  });
  const list = (raw || []).map((c) => ({
    slug: c.slug as CategorySlug,
    label: c.name,
    image: resolveMediaUrl(c.imageUrl) || "/brand-logo.png",
    icon: c.slug === "new-arrivals" ? ("flame" as const) : undefined,
  }));
  setCategoryCache(list);
  return list;
}

export type ProductPage = {
  items: Product[];
  total: number;
};

export async function fetchProductsPage(params?: {
  tag?: string;
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<ProductPage> {
  const sp = new URLSearchParams();
  if (params?.tag) sp.set("tag", params.tag);
  if (params?.category) sp.set("category", params.category);
  if (params?.q) sp.set("q", params.q);
  sp.set("limit", String(params?.limit ?? 12));
  sp.set("offset", String(params?.offset ?? 0));

  const [raw, cats] = await Promise.all([
    apiGet<{ items: ApiProduct[]; total: number } | ApiProduct[]>(
      `/api/v1/products?${sp.toString()}`,
      { cache: "no-store" }
    ),
    categoryCache.length
      ? Promise.resolve(
          categoryCache.map((c, i) => ({
            id: String(i),
            slug: c.slug,
            name: c.label,
            imageUrl: c.image,
            sortOrder: i,
            isActive: true,
          }))
        )
      : apiGet<ApiCategory[]>("/api/v1/categories", { cache: "no-store" }),
  ]);

  const apiCats =
    cats && Array.isArray(cats) && "id" in (cats[0] || {})
      ? (cats as ApiCategory[])
      : await apiGet<ApiCategory[]>("/api/v1/categories", { cache: "no-store" });

  const idToSlug = new Map(apiCats.map((c) => [c.id, c.slug]));
  if (!categoryCache.length) {
    setCategoryCache(
      apiCats.map((c) => ({
        slug: c.slug as CategorySlug,
        label: c.name,
        image: resolveMediaUrl(c.imageUrl) || "/brand-logo.png",
        icon: c.slug === "new-arrivals" ? ("flame" as const) : undefined,
      }))
    );
  }

  const page = Array.isArray(raw)
    ? { items: raw, total: raw.length }
    : { items: raw?.items || [], total: raw?.total ?? 0 };

  const list = page.items.map((p) => mapApiProduct(p, idToSlug));
  const byId = new Map(productCache.map((p) => [p.id, p]));
  for (const p of list) byId.set(p.id, p);
  setProductCache(Array.from(byId.values()));
  return { items: list, total: page.total };
}

export async function fetchProducts(params?: {
  tag?: string;
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  const page = await fetchProductsPage(params);
  return page.items;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const raw = await apiGet<ApiProduct>(`/api/v1/products/${slug}`, {
      cache: "no-store",
    });
    if (!raw || !(raw as ApiProduct).id) return null;
    const cats = await apiGet<ApiCategory[]>("/api/v1/categories", {
      cache: "no-store",
    });
    const idToSlug = new Map(cats.map((c) => [c.id, c.slug]));
    const mapped = mapApiProduct(raw, idToSlug);
    const byId = new Map(productCache.map((p) => [p.id, p]));
    byId.set(mapped.id, mapped);
    setProductCache(Array.from(byId.values()));
    return mapped;
  } catch {
    return findProductBySlug(slug) || null;
  }
}

export async function fetchBanners(slot: string): Promise<ApiBanner[]> {
  const raw = await apiGet<ApiBanner[]>(
    `/api/v1/banners?slot=${encodeURIComponent(slot)}`,
    { cache: "no-store" }
  );
  return raw || [];
}

export async function fetchBestsellers() {
  return fetchProducts({ tag: "bestseller", limit: 40 });
}

export async function fetchNewArrivals() {
  return fetchProducts({ tag: "new_arrival", limit: 40 });
}
