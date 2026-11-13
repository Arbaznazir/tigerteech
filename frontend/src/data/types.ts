export type CategorySlug = string;

export type ProductDetails = {
  category: string;
  style: string;
  pattern: string;
  type: string;
  fit: string;
  neck: string;
  bottom: string;
  material: string;
};

export type ProductAttribute = {
  key: string;
  label: string;
  value: string;
};

export type ProductHighlightTag = {
  slug: string;
  label: string;
  accent?: string;
};

export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified?: boolean;
};

export type ProductColorOption = {
  name: string;
  swatch: string;
  variantId?: string;
  stock: number;
  /** 0 = no per-order limit */
  maxPerOrder: number;
};

export type ProductMaterialOption = {
  name: string;
  price: number;
  colors: ProductColorOption[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  priceMin: number;
  priceMax: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  colors: string[];
  sizes: string[];
  materials: ProductMaterialOption[];
  categories: CategorySlug[];
  /** Raw category UUIDs for deal matching */
  categoryIds?: string[];
  /** unisex | men | women */
  genderFit?: string;
  requiresShirtMeas?: boolean;
  requiresTrouserMeas?: boolean;
  badge?: "#1 Bestseller" | "NEW" | "Sale";
  description: string;
  details: ProductDetails;
  /** Selected product detail rows for PDP */
  attributes?: ProductAttribute[];
  /** Feature pills under gallery */
  highlightTags?: ProductHighlightTag[];
  reviews: ProductReview[];
  bestseller?: boolean;
  newArrival?: boolean;
};
