import { CategoryCircles } from "@/components/home/CategoryCircles";
import { FeatureBar } from "@/components/home/FeatureBar";
import { Hero } from "@/components/home/Hero";
import { InstagramStrip } from "@/components/home/InstagramStrip";
import { OffersStrip } from "@/components/home/OffersStrip";
import { PromoBanner } from "@/components/home/PromoBanner";
import { ProductCarousel } from "@/components/ui/ProductCarousel";
import {
  fetchBanners,
  fetchBestsellers,
  fetchCategories,
  fetchNewArrivals,
  setCategoryCache,
  setProductCache,
} from "@/lib/catalog";
import { HERO_PRELOAD_IMAGES } from "@/lib/bannerAssets";
import { fetchActivePromotions } from "@/lib/promotions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    categories,
    bestsellers,
    arrivals,
    heroBanners,
    promoBanners,
    promotions,
  ] = await Promise.all([
    fetchCategories().catch(() => []),
    fetchBestsellers().catch(() => []),
    fetchNewArrivals().catch(() => []),
    fetchBanners("hero").catch(() => []),
    fetchBanners("promo_mid").catch(() => []),
    fetchActivePromotions().catch(() => []),
  ]);

  setCategoryCache(categories);
  setProductCache([
    ...bestsellers,
    ...arrivals.filter((a) => !bestsellers.some((b) => b.id === a.id)),
  ]);

  return (
    <>
      {HERO_PRELOAD_IMAGES.map((href) => (
        <link key={href} rel="preload" as="image" href={href} />
      ))}
      <link rel="preload" as="image" href="/images/banners/promo.webp" />
      <Hero apiBanners={heroBanners} />
      <CategoryCircles categories={categories} />
      <FeatureBar />
      <OffersStrip offers={promotions} />
      <ProductCarousel
        eyebrow="Trending Now"
        title="Bestsellers"
        href="/shop"
        showFlame
        products={bestsellers}
        variant="bestseller"
        columns={4}
      />
      <PromoBanner banner={promoBanners[0] ?? null} />
      <ProductCarousel
        eyebrow="Fresh Style"
        title="New Arrivals"
        href="/shop/new-arrivals"
        showFlame
        products={arrivals}
        variant="arrival"
        columns={4}
      />
      <InstagramStrip />
    </>
  );
}
