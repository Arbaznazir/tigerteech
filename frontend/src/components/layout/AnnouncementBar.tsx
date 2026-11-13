"use client";

import { Headphones, PawPrint, Percent, RefreshCcw, Truck } from "lucide-react";
import { useActiveDeals } from "@/hooks/useActiveDeals";
import { discountBadgeLabel, isDealLive } from "@/lib/deals";
import { useMoney } from "@/lib/use-money";

export function AnnouncementBar() {
  const { formatPrice } = useMoney();
  const freeShip = formatPrice(99);
  const deals = useActiveDeals();
  const liveDeal = deals.find((d) => isDealLive(d));
  const dealLabel = liveDeal ? discountBadgeLabel(liveDeal) : "";

  const items = [
    {
      Icon: Truck,
      label: `Free Shipping on Orders Above ${freeShip}`,
    },
    {
      Icon: PawPrint,
      label: "Wear the Wild. Live the Bold.",
    },
    ...(dealLabel
      ? [
          {
            Icon: Percent,
            label: `Deal live · ${dealLabel}`,
          },
        ]
      : []),
    { Icon: RefreshCcw, label: "Easy Returns" },
    { Icon: Headphones, label: "24/7 Support" },
  ];

  return (
    <div className="bg-forest text-white">
      {/* Desktop / tablet static row */}
      <div className="mx-auto hidden h-9 max-w-[1400px] items-center justify-between gap-3 px-4 text-[10px] font-medium sm:flex md:px-8 md:text-[11px] lg:px-10">
        <div className="flex min-w-0 items-center gap-2">
          <Truck className="size-3.5 shrink-0 text-orange" strokeWidth={2.25} />
          <span className="truncate">
            Free Shipping on Orders Above {freeShip}
          </span>
          {dealLabel ? (
            <>
              <span className="text-white/35">·</span>
              <span className="inline-flex items-center gap-1 truncate font-semibold text-orange">
                <Percent className="size-3 shrink-0" strokeWidth={2.5} />
                {dealLabel}
              </span>
            </>
          ) : null}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <PawPrint className="size-3.5 shrink-0 text-orange" strokeWidth={2.25} />
          <span>Wear the Wild. Live the Bold.</span>
        </div>
        <div className="hidden items-center gap-3 md:flex lg:gap-4">
          <span className="inline-flex items-center gap-1.5">
            <RefreshCcw className="size-3.5 text-orange" strokeWidth={2.25} />
            Easy Returns
            {dealLabel ? (
              <span className="ml-1 rounded-full bg-orange/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange">
                {dealLabel}
              </span>
            ) : null}
          </span>
          <span className="text-white/35">|</span>
          <span className="inline-flex items-center gap-1.5">
            <Headphones className="size-3.5 text-orange" strokeWidth={2.25} />
            24/7 Support
          </span>
        </div>
      </div>

      {/* Mobile marquee */}
      <div className="relative flex h-8 items-center overflow-hidden sm:hidden">
        <div className="announce-marquee flex w-max items-center gap-8 whitespace-nowrap px-4 text-[10px] font-medium tracking-wide">
          {[...items, ...items].map(({ Icon, label }, i) => (
            <span key={`${label}-${i}`} className="inline-flex items-center gap-2">
              <Icon className="size-3 text-orange" strokeWidth={2.25} />
              {label}
              <span className="text-white/25">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
