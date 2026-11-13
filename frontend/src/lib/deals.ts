import type { Product } from "@/data/types";

export type ActiveDeal = {
  id: string;
  title: string;
  discountType: string;
  discountValue: number;
  scope: string;
  productIds?: string[];
  categoryIds?: string[];
  startsAt?: string;
  endsAt?: string;
  phase?: string;
};

export function isDealLive(deal: ActiveDeal, now = Date.now()): boolean {
  const start = deal.startsAt ? new Date(deal.startsAt).getTime() : null;
  const end = deal.endsAt ? new Date(deal.endsAt).getTime() : null;
  if (start && now < start) return false;
  if (end && now >= end) return false;
  return true;
}

export function dealAppliesToProduct(
  deal: ActiveDeal,
  product: Pick<Product, "id" | "categoryIds">
): boolean {
  const scope = deal.scope || "platform";
  if (scope === "platform") return true;
  if (scope === "products") {
    return (deal.productIds || []).includes(product.id);
  }
  if (scope === "category") {
    const ids = product.categoryIds || [];
    return (deal.categoryIds || []).some((cid) => ids.includes(cid));
  }
  return false;
}

export function salePriceUsd(
  priceUsd: number,
  deal: Pick<ActiveDeal, "discountType" | "discountValue">
): number {
  const value = Math.max(0, Number(deal.discountValue) || 0);
  if (deal.discountType === "fixed") {
    return Math.max(0, Math.round((priceUsd - value) * 100) / 100);
  }
  const pct = Math.min(100, value);
  return Math.max(0, Math.round(priceUsd * (1 - pct / 100) * 100) / 100);
}

export function discountBadgeLabel(
  deal: Pick<ActiveDeal, "discountType" | "discountValue">
): string {
  const value = Math.max(0, Number(deal.discountValue) || 0);
  if (deal.discountType === "fixed") {
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)} OFF`;
  }
  return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}% OFF`;
}

export function findBestDealForProduct(
  deals: ActiveDeal[],
  product: Pick<Product, "id" | "categoryIds">,
  now = Date.now()
): ActiveDeal | null {
  const live = deals.filter(
    (d) => isDealLive(d, now) && dealAppliesToProduct(d, product)
  );
  if (!live.length) return null;
  // Prefer deepest percent / largest fixed relative to a $100 reference.
  return live.sort((a, b) => {
    const saveA =
      a.discountType === "fixed"
        ? a.discountValue
        : 100 * (a.discountValue / 100);
    const saveB =
      b.discountType === "fixed"
        ? b.discountValue
        : 100 * (b.discountValue / 100);
    return saveB - saveA;
  })[0];
}
