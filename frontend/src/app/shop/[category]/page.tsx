import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopGrid } from "@/components/shop/ShopGrid";
import type { CategorySlug } from "@/data/products";
import { fetchCategories } from "@/lib/catalog";

type Props = { params: Promise<{ category: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cats = await fetchCategories().catch(() => []);
  const cat = cats.find((c) => c.slug === category);
  return { title: cat?.label ?? "Shop" };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (category === "new-arrivals") {
    return (
      <ShopGrid initialCategory={"new-arrivals" as CategorySlug} title="New Arrivals" />
    );
  }
  const cats = await fetchCategories().catch(() => []);
  const cat = cats.find((c) => c.slug === category);
  if (!cat) notFound();

  return (
    <ShopGrid initialCategory={cat.slug as CategorySlug} title={cat.label} />
  );
}
