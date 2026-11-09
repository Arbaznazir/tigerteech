import { CategoryCircles } from "@/components/home/CategoryCircles";
import { FeatureBar } from "@/components/home/FeatureBar";
import { Hero } from "@/components/home/Hero";
import { InstagramStrip } from "@/components/home/InstagramStrip";
import { PromoBanner } from "@/components/home/PromoBanner";
import { ProductCarousel } from "@/components/ui/ProductCarousel";
import { getBestsellers, getNewArrivals } from "@/data/products";

export default function HomePage() {
  const bestsellers = getBestsellers();
  const arrivals = getNewArrivals();

  return (
    <>
      <Hero />
      <CategoryCircles />
      <FeatureBar />
      <ProductCarousel
        eyebrow="Trending Now"
        title="Bestsellers"
        href="/shop"
        showFlame
        products={bestsellers}
        variant="bestseller"
        columns={4}
      />
      <PromoBanner />
      <ProductCarousel
        eyebrow="Fresh Style"
        title="New Arrivals"
        href="/shop/new-arrivals"
        showFlame
        products={arrivals}
        variant="arrival"
        columns={5}
      />
      <InstagramStrip />
    </>
  );
}
