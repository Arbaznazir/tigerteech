"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Ticket, X } from "lucide-react";
import { validatePromoCode, type PromoValidateResult } from "@/lib/promotions";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

type Props = {
  subtotal: number;
  productIds: string[];
  productTotals?: Record<string, number>;
  formatPrice: (amountUsd: number) => string;
  onApplied?: (result: PromoValidateResult | null) => void;
  className?: string;
};

export function CartCoupon({
  subtotal,
  productIds,
  productTotals,
  formatPrice,
  onApplied,
  className,
}: Props) {
  const couponCode = useStore((s) => s.couponCode);
  const setCouponCode = useStore((s) => s.setCouponCode);
  const clearCoupon = useStore((s) => s.clearCoupon);
  const [draft, setDraft] = useState(couponCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState<PromoValidateResult | null>(null);

  useEffect(() => {
    setDraft(couponCode);
  }, [couponCode]);

  useEffect(() => {
    if (!couponCode || subtotal <= 0) {
      setApplied(null);
      onApplied?.(null);
      return;
    }
    let cancelled = false;
    setBusy(true);
    setError("");
    void validatePromoCode({
      code: couponCode,
      subtotal,
      productIds,
      productTotals,
    })
      .then((res) => {
        if (cancelled) return;
        setApplied(res);
        onApplied?.(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setApplied(null);
        onApplied?.(null);
        setError(err instanceof Error ? err.message : "Invalid code");
        clearCoupon();
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- productIds fingerprint
  }, [couponCode, subtotal, productIds.join("|"), JSON.stringify(productTotals || {})]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const code = draft.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    setError("");
    try {
      const res = await validatePromoCode({
        code,
        subtotal,
        productIds,
        productTotals,
      });
      setCouponCode(code);
      setApplied(res);
      onApplied?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
      setApplied(null);
      onApplied?.(null);
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    clearCoupon();
    setDraft("");
    setApplied(null);
    setError("");
    onApplied?.(null);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-orange">
        <Ticket className="size-3.5" strokeWidth={2} />
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]">
          Promo / coupon
        </p>
      </div>

      {applied ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl bg-orange/15 px-4 py-3 ring-1 ring-orange/30">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[12px] font-bold text-orange">
              <Check className="size-3.5 shrink-0" strokeWidth={2.5} />
              {applied.code || applied.title}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/70">
              {applied.discountLabel || applied.title}
              {applied.discount > 0
                ? ` · −${formatPrice(applied.discount)}`
                : ""}
              {applied.giftProductName
                ? ` · Free ${applied.giftProductName}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={remove}
            aria-label="Remove promo"
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white/40 hover:text-white"
          >
            <X className="size-3.5" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.toUpperCase())}
            placeholder="Enter code"
            autoCapitalize="characters"
            className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/8 px-4 py-2.5 text-[13px] font-semibold tracking-[0.08em] text-white outline-none placeholder:text-white/35 focus:border-orange/60"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="shrink-0 rounded-full bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-orange disabled:opacity-50"
          >
            {busy ? "…" : "Apply"}
          </button>
        </form>
      )}

      {error ? (
        <p className="text-[11px] font-medium text-[#ffb4a8]">{error}</p>
      ) : null}
    </div>
  );
}
