import type { Metadata } from "next";
import { ShopGrid } from "@/components/shop/ShopGrid";

export const metadata: Metadata = {
  title: "Shop",
};

export default function ShopPage() {
  return <ShopGrid title="Shop All" />;
}
