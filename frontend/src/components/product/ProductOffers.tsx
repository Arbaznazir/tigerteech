"use client";

import { useEffect, useState } from "react";
import { Check, Ticket } from "lucide-react";
import {
  fetchProductPromotions,
  promoBadgeLabel,
  type Promotion,
} from "@/lib/promotions";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

type Props = {
  slug: string;
  productId: string;
};

export function ProductOffers({ slug }: Props) {
  const [offers, setOffers] = useState<Promotion[]>([]);
  const couponCode = useStore((s) => s.couponCode);
  const setCouponCode = useStore((s) => s.setCouponCode);
  const userId = useStore((s) => s.user?.id || "");

  useEffect(() => {
    let cancelled = false;
    void fetchProductPromotions(slug).then((list) => {
      if (!cancelled) setOffers(list);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, userId]);

  if (!offers.length) return null;

  return (
    <div className="mt-7 rounded-2xl border border-line bg-soft/60 p-4 md:p-5">
      <div className="flex items-center gap-2">
        <Ticket className="size-4 text-orange" strokeWidth={2} />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
          Offers for this piece
        </p>
      </div>
      <ul className="mt-3 space-y-2.5">
        {offers.map((offer) => {
          const active = Boolean(
            offer.code && couponCode === offer.code.toUpperCase()
          );
          return (
            <li
              key={offer.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/80 bg-paper px-3.5 py-3"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink">
                  {offer.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {promoBadgeLabel(offer)}
                  {offer.code ? ` · Code ${offer.code}` : ""}
                  {offer.minSubtotal > 0
                    ? ` · Min $${offer.minSubtotal}`
                    : ""}
                </p>
              </div>
              {offer.code ? (
                <button
                  type="button"
                  onClick={() => setCouponCode(offer.code)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition",
                    active
                      ? "bg-orange text-ink"
                      : "border border-line text-ink hover:border-orange hover:text-orange"
                  )}
                >
                  {active ? (
                    <>
                      <Check className="size-3" strokeWidth={2.5} /> Applied
                    </>
                  ) : (
                    "Apply"
                  )}
                </button>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-orange">
                  Auto offer
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-muted">
        Codes are verified in your bag and again when you place the order.
      </p>
    </div>
  );
}
