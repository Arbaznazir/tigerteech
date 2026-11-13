"use client";

import { BannerPreview, type BannerDraft } from "@/components/BannerPreview";
import { cn } from "@/lib/cn";

type Props = {
  draft: BannerDraft;
  mode: "web" | "phone";
};

export function BannerPagePreview({ draft, mode }: Props) {
  const isPromo = draft.slotKey === "promo_mid";

  return (
    <div
      className={cn(
        "overflow-hidden border border-[var(--line)] bg-[var(--soft)] shadow-xl",
        mode === "web"
          ? "w-full rounded-2xl"
          : "w-[300px] rounded-[2rem] border-[6px] border-[var(--forest)]"
      )}
    >
      <div className="border-b border-[var(--line)] bg-[var(--paper)] px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-[8px] font-bold uppercase tracking-wide text-[var(--muted)]">
            <span className="text-[var(--orange)]">Home</span>
            <span>Men</span>
            <span>Women</span>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em]">
            Tigerteeh
          </p>
          <div className="flex gap-1">
            <span className="size-3 rounded-full bg-[var(--soft)]" />
            <span className="size-3 rounded-full bg-[var(--soft)]" />
          </div>
        </div>
      </div>

      {!isPromo ? (
        <div className="bg-[var(--forest-deep)]">
          <BannerPreview draft={draft} mode={mode} />
          <div className="flex justify-center gap-3 bg-[var(--paper)] px-3 py-3">
            {["Men", "Women", "Sets"].map((label) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="size-9 rounded-full bg-[var(--soft)] ring-1 ring-[var(--line)]" />
                <span className="text-[8px] font-semibold text-[var(--muted)]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[var(--paper)]">
          <div className="flex items-end justify-between px-3 pb-2 pt-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--orange)]">
                Trending now
              </p>
              <p className="text-xs font-bold uppercase tracking-wide">
                Bestsellers
              </p>
            </div>
            <span className="text-[8px] font-bold uppercase text-[var(--muted)]">
              View all
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 px-3 pb-3">
            {["ABC", "DEF", "GHI"].map((label) => (
              <div
                key={label}
                className="aspect-[2/3] rounded-xl bg-[var(--soft)] grid place-items-center text-[10px] font-bold text-[var(--muted)]"
              >
                {label}
              </div>
            ))}
          </div>
          <BannerPreview draft={draft} mode={mode} />
          <div className="flex items-end justify-between px-3 pb-2 pt-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--orange)]">
                Fresh style
              </p>
              <p className="text-xs font-bold uppercase tracking-wide">
                New Arrivals
              </p>
            </div>
            <span className="text-[8px] font-bold uppercase text-[var(--muted)]">
              View all
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 px-3 pb-3">
            {["XYZ", "QRS", "TUV"].map((label) => (
              <div
                key={label}
                className="aspect-[2/3] rounded-xl bg-[var(--soft)] grid place-items-center text-[10px] font-bold text-[var(--muted)]"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="border-t border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-center text-[10px] text-[var(--muted)]">
        {isPromo
          ? "Promo sits between Bestsellers and New Arrivals"
          : "Hero at the top of the homepage"}
      </p>
    </div>
  );
}
