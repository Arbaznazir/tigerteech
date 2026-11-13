"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, Sparkles, Ticket } from "lucide-react";
import {
  formatUsageLimit,
  promoBadgeLabel,
  type Promotion,
} from "@/lib/promotions";
import {
  normalizePromoCardStyle,
  type PromoCardStyleId,
} from "@/lib/promo-card-styles";
import { isRemoteMedia, resolveMediaUrl } from "@/lib/media";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/cn";

type Props = {
  offers: Promotion[];
};

const lightText: PromoCardStyleId[] = [
  "ember",
  "aurora",
  "stripe",
  "spark",
  "midnight",
];

export function OffersStrip({ offers }: Props) {
  const { formatPrice } = useMoney();
  if (!offers.length) return null;

  return (
    <section className="border-y border-line bg-soft/40">
      <div className="container-site py-5 md:py-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange">
              Live offers
            </p>
            <h2 className="font-display mt-0.5 text-[1.65rem] tracking-wide text-forest md:text-3xl">
              PROMO & GIFTS
            </h2>
            <p className="mt-1 max-w-xl text-[12px] leading-snug text-muted md:text-[13px]">
              Coupons and gifts — apply in your bag or unlock at checkout.
            </p>
          </div>
          <Link
            href="/cart"
            className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest transition hover:text-orange"
          >
            Open bag →
          </Link>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {offers.map((offer, i) => {
            const isGift = offer.discountType === "gift_threshold";
            const giftImg = resolveMediaUrl(offer.giftProductImage);
            const style = normalizePromoCardStyle(offer.cardStyle);
            const onDark = lightText.includes(style);

            return (
              <motion.article
                key={offer.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-24px" }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.2) }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-line/80 p-3.5 shadow-[0_8px_22px_rgba(18,16,14,0.08)]",
                  onDark ? "text-[#FAF9F7]" : "text-ink"
                )}
              >
                <div
                  className={cn("promo-card-bg", `promo-card-bg--${style}`)}
                  aria-hidden
                />
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0",
                    onDark
                      ? "bg-[linear-gradient(180deg,rgba(10,9,8,0.22)_0%,rgba(10,9,8,0.55)_100%)]"
                      : "bg-[linear-gradient(180deg,rgba(250,249,247,0.55)_0%,rgba(250,249,247,0.82)_100%)]"
                  )}
                  aria-hidden
                />

                <div className="relative z-[1]">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]",
                        onDark
                          ? "bg-white/12 text-white"
                          : "bg-ink/8 text-ink"
                      )}
                    >
                      {isGift ? (
                        <Gift className="size-2.5 text-orange" strokeWidth={2.25} />
                      ) : offer.kind === "promo" ? (
                        <Sparkles
                          className="size-2.5 text-orange"
                          strokeWidth={2.25}
                        />
                      ) : (
                        <Ticket
                          className="size-2.5 text-orange"
                          strokeWidth={2.25}
                        />
                      )}
                      {offer.kind}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-orange">
                      {promoBadgeLabel(offer)}
                    </span>
                  </div>

                  <h3
                    className={cn(
                      "mt-2 font-display text-[1.15rem] leading-none tracking-wide md:text-[1.25rem]",
                      onDark ? "text-white" : "text-ink"
                    )}
                  >
                    {offer.title}
                  </h3>
                  {offer.description ? (
                    <p
                      className={cn(
                        "mt-1 line-clamp-1 text-[11px] leading-snug",
                        onDark ? "text-white/70" : "text-muted"
                      )}
                    >
                      {offer.description}
                    </p>
                  ) : null}

                  {isGift && offer.giftProductName ? (
                    <div
                      className={cn(
                        "mt-2 flex items-center gap-2 rounded-xl p-1.5",
                        onDark ? "bg-white/10" : "bg-soft/90"
                      )}
                    >
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-line/30">
                        {giftImg ? (
                          <Image
                            src={giftImg}
                            alt={offer.giftProductName}
                            fill
                            className="object-cover"
                            sizes="36px"
                            unoptimized={isRemoteMedia(giftImg)}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold">
                          {offer.giftProductName}
                        </p>
                        <p
                          className={cn(
                            "text-[10px]",
                            onDark ? "text-white/65" : "text-muted"
                          )}
                        >
                          Free at {formatPrice(offer.minSubtotal || 0)}+
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
                    {offer.code ? (
                      <span className="rounded-full border border-dashed border-orange/60 bg-orange/15 px-2 py-0.5 font-bold tracking-[0.12em] text-orange">
                        {offer.code}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5",
                          onDark
                            ? "border-white/25 text-white/80"
                            : "border-line text-muted"
                        )}
                      >
                        Auto at checkout
                      </span>
                    )}
                    <span
                      className={onDark ? "text-white/60" : "text-muted"}
                    >
                      {formatUsageLimit(offer)}
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
