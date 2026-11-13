"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Gift,
  Lock,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { CartCoupon } from "@/components/cart/CartCoupon";
import { freeShippingRemaining } from "@/lib/cart";
import {
  fetchActivePromotions,
  type PromoValidateResult,
  type Promotion,
} from "@/lib/promotions";
import { isRemoteMedia, resolveMediaUrl } from "@/lib/media";
import { useMoney } from "@/lib/use-money";

type Props = {
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  productIds: string[];
  productTotals?: Record<string, number>;
  formatPrice: (amountUsd: number) => string;
};

export function CartSummary({
  count,
  subtotal,
  shipping,
  total,
  productIds,
  productTotals,
  formatPrice,
}: Props) {
  const remaining = freeShippingRemaining(subtotal);
  const progress = Math.min(100, (subtotal / 99) * 100);
  const [promo, setPromo] = useState<PromoValidateResult | null>(null);
  const [giftOffers, setGiftOffers] = useState<Promotion[]>([]);
  const { formatPrice: fmt } = useMoney();

  useEffect(() => {
    let cancelled = false;
    void fetchActivePromotions().then((list) => {
      if (cancelled) return;
      setGiftOffers(
        list.filter((p) => p.discountType === "gift_threshold" && p.isActive)
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const unlockedGift = useMemo(() => {
    const eligible = giftOffers
      .filter((p) => subtotal >= (p.minSubtotal || 0))
      .sort((a, b) => (b.minSubtotal || 0) - (a.minSubtotal || 0));
    return eligible[0] || null;
  }, [giftOffers, subtotal]);

  const nextGift = useMemo(() => {
    const upcoming = giftOffers
      .filter((p) => subtotal < (p.minSubtotal || 0))
      .sort((a, b) => (a.minSubtotal || 0) - (b.minSubtotal || 0));
    return upcoming[0] || null;
  }, [giftOffers, subtotal]);

  const giftFromPromo =
    promo?.giftProductName || promo?.discountType === "gift_threshold"
      ? promo
      : null;
  const showGift = giftFromPromo || unlockedGift;
  const discount = promo?.discount || 0;
  const payable = Math.max(0, total - discount);

  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
      className="lg:sticky lg:top-28"
    >
      <div className="overflow-hidden rounded-[1.75rem] bg-forest text-white shadow-[0_24px_60px_rgba(22,20,18,0.28)]">
        <div className="relative overflow-hidden px-6 pb-5 pt-7 md:px-8 md:pt-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-8 font-display text-[7rem] leading-none text-white/[0.04]"
          >
            BAG
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
            Order summary
          </p>
          <h2 className="mt-2 font-display text-4xl tracking-wide md:text-5xl">
            {count} {count === 1 ? "LOOK" : "LOOKS"}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Built for the bold — ready when you are.
          </p>
        </div>

        <div className="space-y-5 border-t border-white/10 px-6 py-6 md:px-8">
          <CartCoupon
            subtotal={subtotal}
            productIds={productIds}
            productTotals={productTotals}
            formatPrice={formatPrice}
            onApplied={setPromo}
          />

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Subtotal</span>
              <span className="font-semibold tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-orange">
                <span>
                  Discount
                  {promo?.code ? ` (${promo.code})` : ""}
                </span>
                <span className="font-semibold tabular-nums">
                  −{formatPrice(discount)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-white/60">Shipping</span>
              <span className="font-semibold tabular-nums">
                {shipping === 0 ? (
                  <span className="text-orange">Free</span>
                ) : (
                  formatPrice(shipping)
                )}
              </span>
            </div>
          </div>

          {showGift ? (
            <div className="rounded-2xl bg-white/6 px-3.5 py-3 ring-1 ring-orange/30">
              <div className="mb-2.5 flex items-center gap-2 text-orange">
                <Gift className="size-3.5" strokeWidth={2} />
                <p className="text-[11px] font-bold uppercase tracking-[0.16em]">
                  Offer gift unlocked
                </p>
              </div>
              <div className="flex items-center gap-3">
                {(() => {
                  const name =
                    giftFromPromo?.giftProductName ||
                    unlockedGift?.giftProductName ||
                    "Gift";
                  const img = resolveMediaUrl(
                    unlockedGift?.giftProductImage || ""
                  );
                  return (
                    <>
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                        {img ? (
                          <Image
                            src={img}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized={isRemoteMedia(img)}
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-orange">
                            <Gift className="size-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">
                          {name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-orange">
                          <Check className="size-3" strokeWidth={2.5} />
                          Offer applied · Free
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : nextGift ? (
            <div className="rounded-2xl bg-white/6 px-4 py-3.5 ring-1 ring-white/10">
              <div className="mb-2 flex items-center gap-2 text-orange">
                <Gift className="size-3.5" strokeWidth={2} />
                <p className="text-[11px] font-bold uppercase tracking-[0.16em]">
                  Unlock gift
                </p>
              </div>
              <p className="text-xs leading-relaxed text-white/75">
                Add{" "}
                <span className="font-semibold text-orange">
                  {fmt(
                    Math.max(0, (nextGift.minSubtotal || 0) - subtotal)
                  )}
                </span>{" "}
                more for a free {nextGift.giftProductName || "gift"}.
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-orange transition-[width] duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (subtotal / Math.max(1, nextGift.minSubtotal || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {remaining > 0 ? (
            <div className="rounded-2xl bg-white/6 px-4 py-3.5 ring-1 ring-white/10">
              <div className="mb-2.5 flex items-center gap-2 text-orange">
                <Truck className="size-3.5" strokeWidth={2} />
                <p className="text-[11px] font-bold uppercase tracking-[0.16em]">
                  Free shipping
                </p>
              </div>
              <p className="text-xs leading-relaxed text-white/75">
                Add{" "}
                <span className="font-semibold text-orange">
                  {formatPrice(remaining)}
                </span>{" "}
                more to unlock free delivery.
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-orange transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-orange/15 px-4 py-3 text-xs font-semibold text-orange ring-1 ring-orange/25">
              Free shipping unlocked.
            </div>
          )}

          <div className="flex items-end justify-between border-t border-white/10 pt-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Total
            </span>
            <span className="font-display text-4xl tracking-wide tabular-nums md:text-5xl">
              {formatPrice(payable)}
            </span>
          </div>

          <Link
            href="/checkout"
            className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-orange px-6 text-[13px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-orange-hot"
          >
            Checkout <ArrowRight className="size-4" strokeWidth={2.5} />
          </Link>
          <Link
            href="/shop"
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/25 px-6 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition hover:border-white/50 hover:bg-white/5"
          >
            Continue shopping
          </Link>
          <Link
            href="/account/orders"
            className="inline-flex h-11 w-full items-center justify-center rounded-full px-6 text-[12px] font-bold uppercase tracking-[0.14em] text-orange transition hover:text-orange-hot"
          >
            My orders
          </Link>

          <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
            {[
              { icon: Lock, label: "Secure" },
              { icon: ShieldCheck, label: "Easy returns" },
              { icon: Truck, label: "Fast ship" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <Icon className="size-3.5 text-orange" strokeWidth={1.75} />
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/55">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] leading-relaxed text-white/40">
            Demo checkout — no real payment is processed.
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
