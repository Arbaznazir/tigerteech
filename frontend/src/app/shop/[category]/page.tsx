import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopGrid } from "@/components/shop/ShopGrid";
import { categories, type CategorySlug } from "@/data/products";

type Props = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = categories.find((c) => c.slug === category);
  return { title: cat?.label ?? "Shop" };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = categories.find((c) => c.slug === category);
  if (!cat) notFound();

  return (
    <ShopGrid
      initialCategory={cat.slug as CategorySlug}
      title={cat.label}
    />
  );
}
