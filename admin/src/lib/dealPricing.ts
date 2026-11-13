export type DealDiscount = {
  discountType: "percent" | "fixed" | string;
  discountValue: number;
};

export function salePriceUsd(priceUsd: number, deal: DealDiscount): number {
  const value = Math.max(0, Number(deal.discountValue) || 0);
  if (deal.discountType === "fixed") {
    return Math.max(0, Math.round((priceUsd - value) * 100) / 100);
  }
  const pct = Math.min(100, value);
  return Math.max(0, Math.round(priceUsd * (1 - pct / 100) * 100) / 100);
}

export function discountBadgeLabel(deal: DealDiscount): string {
  const value = Math.max(0, Number(deal.discountValue) || 0);
  if (deal.discountType === "fixed") {
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)} OFF`;
  }
  return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}% OFF`;
}

export function formatUsd(amount: number): string {
  return `$${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}
