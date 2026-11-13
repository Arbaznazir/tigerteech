"use client";

import {
  DEFAULT_CURRENCY,
  formatMoney,
  formatMoneyRange,
  type CurrencyCode,
} from "@/lib/currency";
import { useStore } from "@/lib/store";

/**
 * Currency-aware money formatters. Until the store hydrates from localStorage,
 * formats as USD to match SSR / first paint (same hydrated gate as cart).
 */
export function useMoney() {
  const currency = useStore((s) => s.currency);
  const hydrated = useStore((s) => s.hydrated);
  const code: CurrencyCode = hydrated ? currency : DEFAULT_CURRENCY;

  return {
    currency: code,
    hydrated,
    formatPrice: (amountUsd: number) => formatMoney(amountUsd, code),
    formatPriceRange: (minUsd: number, maxUsd: number) =>
      formatMoneyRange(minUsd, maxUsd, code),
  };
}
