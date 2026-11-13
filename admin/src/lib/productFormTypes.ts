import type { ProductAttribute } from "@/components/ProductAttributesEditor";
import type { VariantGraph } from "@/lib/variantGraph";

export type ImageDraft = { url: string; sortOrder: number; alt: string };

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  genderFit: string;
  requiresShirtMeas: boolean;
  requiresTrouserMeas: boolean;
  categoryIds: string[];
  /** Collection / badge / deal tags */
  tagSlugs: string[];
  /** Feature pills on PDP */
  highlightTagSlugs: string[];
  attributes: ProductAttribute[];
  images: ImageDraft[];
  graph: VariantGraph;
};

export const emptyProductForm = (): ProductFormValues => ({
  name: "",
  slug: "",
  description: "",
  status: "draft",
  genderFit: "unisex",
  requiresShirtMeas: true,
  requiresTrouserMeas: true,
  categoryIds: [],
  tagSlugs: [],
  highlightTagSlugs: [],
  attributes: [],
  images: [],
  graph: { colors: [], materials: [] },
});
