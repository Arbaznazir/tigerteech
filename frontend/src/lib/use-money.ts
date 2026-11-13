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
 * Live FX rates from Frankfurter bump fxRevision so amounts refresh.
 */
export function useMoney() {
  const currency = useStore((s) => s.currency);
  const hydrated = useStore((s) => s.hydrated);
  const fxRevision = useStore((s) => s.fxRevision);
  const fxDate = useStore((s) => s.fxDate);
  const fxSource = useStore((s) => s.fxSource);
  const code: CurrencyCode = hydrated ? currency : DEFAULT_CURRENCY;

  return {
    currency: code,
    hydrated,
    fxRevision,
    fxDate,
    fxSource,
    formatPrice: (amountUsd: number) => formatMoney(amountUsd, code),
    formatPriceRange: (minUsd: number, maxUsd: number) =>
      formatMoneyRange(minUsd, maxUsd, code),
  };
}
