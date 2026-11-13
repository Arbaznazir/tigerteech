import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductCard } from "@/components/ui/ProductCard";
import {
  fetchProductBySlug,
  fetchProducts,
} from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  return {
    title: product?.name ?? "Product",
    description: product?.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();

  const all = await fetchProducts({ limit: 40 }).catch(() => []);
  const related = all
    .filter(
      (p) =>
        p.id !== product.id &&
        p.categories.some((c) => product.categories.includes(c))
    )
    .slice(0, 4);

  return (
    <>
      <ProductDetail product={product} />
      {related.length > 0 && (
        <section className="border-t border-line bg-white">
          <div className="container-site py-14 md:py-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
              Keep exploring
            </p>
            <h2 className="font-display mt-2 mb-8 text-4xl tracking-[0.04em] text-ink md:text-5xl">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
      <ProductReviews product={product} />
    </>
  );
}
