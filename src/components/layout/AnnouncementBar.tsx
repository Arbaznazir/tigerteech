"use client";

import { Headphones, PawPrint, RefreshCcw, Truck } from "lucide-react";
import { useMoney } from "@/lib/use-money";

const messages = [
  { icon: Truck, text: (p: string) => `Free Shipping on Orders Above ${p}` },
  { icon: PawPrint, text: () => "Wear the Wild. Live the Bold." },
  { icon: RefreshCcw, text: () => "Easy Returns" },
  { icon: Headphones, text: () => "24/7 Support" },
] as const;

export function AnnouncementBar() {
  const { formatPrice } = useMoney();
  const freeShip = formatPrice(99);

  const items = messages.map(({ icon: Icon, text }) => ({
    Icon,
    label: text(freeShip),
  }));

  return (
    <div className="bg-[#06261f] text-white">
      {/* Desktop / tablet static row */}
      <div className="mx-auto hidden h-9 max-w-[1400px] items-center justify-between gap-3 px-4 text-[10px] font-medium sm:flex md:px-8 md:text-[11px] lg:px-10">
        <div className="flex min-w-0 items-center gap-2">
          <Truck className="size-3.5 shrink-0 text-[#f49331]" strokeWidth={2.25} />
          <span className="truncate">
            Free Shipping on Orders Above {freeShip}
          </span>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <PawPrint className="size-3.5 shrink-0 text-[#f49331]" strokeWidth={2.25} />
          <span>Wear the Wild. Live the Bold.</span>
        </div>
        <div className="hidden items-center gap-3 md:flex lg:gap-4">
          <span className="inline-flex items-center gap-1.5">
            <RefreshCcw className="size-3.5 text-[#f49331]" strokeWidth={2.25} />
            Easy Returns
          </span>
          <span className="text-white/35">|</span>
          <span className="inline-flex items-center gap-1.5">
            <Headphones className="size-3.5 text-[#f49331]" strokeWidth={2.25} />
            24/7 Support
          </span>
        </div>
      </div>

      {/* Mobile marquee */}
      <div className="relative flex h-8 items-center overflow-hidden sm:hidden">
        <div className="announce-marquee flex w-max items-center gap-8 whitespace-nowrap px-4 text-[10px] font-medium tracking-wide">
          {[...items, ...items].map(({ Icon, label }, i) => (
            <span key={`${label}-${i}`} className="inline-flex items-center gap-2">
              <Icon className="size-3 text-[#f49331]" strokeWidth={2.25} />
              {label}
              <span className="text-white/25">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
