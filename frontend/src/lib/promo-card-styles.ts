export const PROMO_CARD_STYLES = [
  {
    id: "ember",
    label: "Ember",
    hint: "Warm orange pulse",
  },
  {
    id: "aurora",
    label: "Aurora",
    hint: "Shifting charcoal → gold",
  },
  {
    id: "stripe",
    label: "Tiger stripe",
    hint: "Diagonal moving stripes",
  },
  {
    id: "spark",
    label: "Spark",
    hint: "Light sweep shimmer",
  },
  {
    id: "midnight",
    label: "Midnight",
    hint: "Deep charcoal glow",
  },
  {
    id: "gold",
    label: "Sand gold",
    hint: "Soft gold wash",
  },
] as const;

export type PromoCardStyleId = (typeof PROMO_CARD_STYLES)[number]["id"];

export function normalizePromoCardStyle(
  value?: string | null
): PromoCardStyleId {
  const v = (value || "").toLowerCase();
  if (PROMO_CARD_STYLES.some((s) => s.id === v)) {
    return v as PromoCardStyleId;
  }
  return "ember";
}
