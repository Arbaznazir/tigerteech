"use client";

import { useMoney } from "@/lib/use-money";

/** USD free-shipping threshold, formatted in the shopper's selected currency. */
export function FreeShippingThreshold({ amountUsd = 99 }: { amountUsd?: number }) {
  const { formatPrice } = useMoney();
  return <>{formatPrice(amountUsd)}</>;
}
