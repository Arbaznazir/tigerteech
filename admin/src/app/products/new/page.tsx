"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { ProductForm } from "@/components/ProductForm";
import { api } from "@/lib/api";

type Tag = { id: string; slug: string; label: string; kind: string; accent: string };
type DetailField = { id: string; key: string; label: string };

export default function NewProductPage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [detailFields, setDetailFields] = useState<DetailField[]>([]);

  useEffect(() => {
    Promise.all([
      api<{ id: string; name: string }[]>("/api/v1/admin/categories"),
      api<Tag[]>("/api/v1/admin/tags"),
      api<DetailField[]>("/api/v1/admin/detail-fields"),
    ]).then(([c, t, f]) => {
      setCategories(c || []);
      setTags(t || []);
      setDetailFields(f || []);
    });
  }, []);

  return (
    <Shell>
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">New product</h2>
      <ProductForm
        categories={categories}
        tags={tags}
        detailFields={detailFields}
      />
    </Shell>
  );
}
