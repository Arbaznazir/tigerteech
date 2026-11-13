"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shell } from "@/components/Shell";
import { InventoryPanel } from "@/components/InventoryPanel";
import {
  ProductForm,
  productFormFromApi,
  type ProductFormValues,
} from "@/components/ProductForm";
import { api } from "@/lib/api";

type Tag = { id: string; slug: string; label: string; kind: string; accent: string };
type DetailField = { id: string; key: string; label: string };

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [detailFields, setDetailFields] = useState<DetailField[]>([]);
  const [initial, setInitial] = useState<ProductFormValues | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ id: string; name: string }[]>("/api/v1/admin/categories"),
      api<Tag[]>("/api/v1/admin/tags"),
      api<DetailField[]>("/api/v1/admin/detail-fields"),
      api<{
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
      }>(`/api/v1/admin/products/${params.id}`),
    ])
      .then(([c, t, f, p]) => {
        setCategories(c || []);
        setTags(t || []);
        setDetailFields(f || []);
        setInitial(productFormFromApi(p));
      })
      .catch((e) => setError(e.message));
  }, [params.id]);

  return (
    <Shell>
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">Edit product</h2>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!initial ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : (
        <div className="space-y-8">
          <ProductForm
            initial={initial}
            categories={categories}
            tags={tags}
            detailFields={detailFields}
          />
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
            <h3 className="text-[13px] font-semibold text-[var(--ink)]">
              Live inventory
            </h3>
            <p className="mt-1 mb-4 text-[12px] text-[var(--muted)]">
              Add stock or mark a colorway out of stock without rewriting the
              product. Orders subtract from these counts.
            </p>
            <InventoryPanel productId={params.id} />
          </section>
        </div>
      )}
    </Shell>
  );
}
