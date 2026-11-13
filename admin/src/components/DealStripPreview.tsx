"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  discountBadgeLabel,
  formatUsd,
  salePriceUsd,
} from "@/lib/dealPricing";

export type DealBannerStyle = {
  preText: string;
  liveText: string;
  endedText: string;
  ctaLabel: string;
  ctaHref: string;
  background: string;
  textColor: string;
  accentColor: string;
  clockStyle: "blocks" | "inline" | "pills";
  textStyle: "bold" | "elegant" | "compact";
  showSeconds: boolean;
};

export type DealPreviewProduct = {
  id: string;
  name: string;
  imageUrl?: string;
  price: number;
  onDeal: boolean;
};

export type DealStripDraft = {
  title: string;
  startsAt: string; // datetime-local or ISO
  endsAt: string;
  countdownEnabled: boolean;
  discountType: string;
  discountValue: number;
  scope: string;
  banner: DealBannerStyle;
  products: DealPreviewProduct[];
};

function parseWhen(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function dealPhase(startsAt: string, endsAt: string, now = Date.now()) {
  const start = parseWhen(startsAt);
  const end = parseWhen(endsAt);
  if (start && now < start.getTime()) {
    return { phase: "upcoming" as const, target: start };
  }
  if (end && now >= end.getTime()) {
    return { phase: "ended" as const, target: null };
  }
  return { phase: "live" as const, target: end };
}

function partsFromMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

type Props = {
  draft: DealStripDraft;
  mode: "web" | "phone";
  /** Force phase for style QA */
  forcePhase?: "upcoming" | "live" | "ended";
};

export function DealStripPreview({ draft, mode, forcePhase }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!draft.countdownEnabled) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [draft.countdownEnabled]);

  const computed = useMemo(
    () => dealPhase(draft.startsAt, draft.endsAt, now),
    [draft.startsAt, draft.endsAt, now]
  );
  const phase = forcePhase || computed.phase;
  const target =
    forcePhase === "upcoming"
      ? parseWhen(draft.startsAt)
      : forcePhase === "live"
        ? parseWhen(draft.endsAt)
        : forcePhase === "ended"
          ? null
          : computed.target;

  const remaining = target ? partsFromMs(target.getTime() - now) : null;
  const b = draft.banner;
  const message =
    phase === "upcoming"
      ? b.preText || "Deal starts in"
      : phase === "live"
        ? b.liveText || "Deal is live — ends in"
        : b.endedText || "This deal has ended";

  const units = remaining
    ? (
        [
          { label: "Days", value: remaining.days },
          { label: "Hrs", value: remaining.hours },
          { label: "Min", value: remaining.minutes },
          ...(b.showSeconds
            ? [{ label: "Sec", value: remaining.seconds }]
            : []),
        ] as { label: string; value: number }[]
      )
    : [];

  const textClass =
    b.textStyle === "elegant"
      ? "font-medium tracking-[0.04em]"
      : b.textStyle === "compact"
        ? "text-[10px] font-semibold tracking-wide sm:text-[11px]"
        : "text-[11px] font-bold uppercase tracking-[0.12em] sm:text-[12px]";

  return (
    <div
      className={cn(
        "overflow-hidden border border-[var(--line)] bg-[var(--soft)] shadow-lg",
        mode === "web"
          ? "w-full rounded-2xl"
          : "w-[300px] rounded-[2rem] border-[6px] border-[var(--forest)]"
      )}
    >
      <div className="border-b border-[var(--line)] bg-[var(--paper)] px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-[8px] font-bold uppercase tracking-wide text-[var(--muted)]">
            <span className="text-[var(--orange)]">Home</span>
            <span>Shop</span>
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

      {/* Deal strip — top of page, above header chrome in preview */}
      <div
        className={cn(
          "flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 px-3 py-2.5 sm:justify-between sm:px-4",
          mode === "phone" && "flex-col text-center"
        )}
        style={{ background: b.background || "#161412", color: b.textColor || "#FAF9F7" }}
      >
        <div className={cn("min-w-0", textClass)}>
          <span className="opacity-90">{message}</span>
          {draft.title ? (
            <span className="ml-1.5 opacity-70">· {draft.title}</span>
          ) : null}
        </div>

        {phase !== "ended" && draft.countdownEnabled && units.length > 0 ? (
          b.clockStyle === "inline" ? (
            <p
              className="font-mono text-[14px] font-bold tabular-nums tracking-wide"
              style={{ color: b.accentColor || "#F38120" }}
            >
              {units.map((u) => pad(u.value)).join(":")}
            </p>
          ) : (
            <div className="flex items-center gap-1.5">
              {units.map((u) =>
                b.clockStyle === "pills" ? (
                  <span
                    key={u.label}
                    className="inline-flex h-7 min-w-10 items-center justify-center rounded-full px-2 font-mono text-[12px] font-bold tabular-nums"
                    style={{
                      background: `${b.accentColor || "#F38120"}22`,
                      color: b.accentColor || "#F38120",
                    }}
                  >
                    {pad(u.value)}
                    <span className="ml-1 text-[8px] font-semibold uppercase opacity-70">
                      {u.label}
                    </span>
                  </span>
                ) : (
                  <div key={u.label} className="flex flex-col items-center">
                    <span
                      className="inline-flex h-8 min-w-9 items-center justify-center rounded-md px-1.5 font-mono text-[13px] font-bold tabular-nums"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: b.accentColor || "#F38120",
                        border: `1px solid ${b.accentColor || "#F38120"}55`,
                      }}
                    >
                      {pad(u.value)}
                    </span>
                    <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide opacity-55">
                      {u.label}
                    </span>
                  </div>
                )
              )}
            </div>
          )
        ) : null}

        {b.ctaLabel ? (
          <span
            className="inline-flex h-7 items-center rounded-full px-3 text-[10px] font-bold uppercase tracking-wide"
            style={{
              background: b.accentColor || "#F38120",
              color: "#12100E",
            }}
          >
            {b.ctaLabel}
          </span>
        ) : null}
      </div>

      <div className="bg-[var(--paper)] px-3 py-3">
        <div className="flex h-8 items-center justify-between text-[9px] text-[var(--muted)]">
          <span>Header</span>
          <span className="font-bold tracking-[0.16em] text-[var(--ink)]">
            TIGERTEEH
          </span>
          <span>Cart</span>
        </div>
        <div className="mt-2 aspect-[21/9] rounded-xl bg-[var(--forest)]/90" />
        <p className="mt-2 text-center text-[9px] text-[var(--muted)]">
          Hero banners sit below this strip
        </p>

        <div className="mt-3 border-t border-[var(--line)] pt-3">
          <div className="mb-2 flex items-end justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
              Products
            </p>
            <p className="text-[9px] text-[var(--muted)]">
              {phase === "live"
                ? draft.discountType === "fixed"
                  ? `Flat ${discountBadgeLabel(draft)}`
                  : discountBadgeLabel(draft)
                : phase === "upcoming"
                  ? "Discount applies when deal opens"
                  : "Deal ended — full price"}
            </p>
          </div>
          <div
            className={cn(
              "grid gap-2",
              mode === "phone" ? "grid-cols-2" : "grid-cols-3"
            )}
          >
            {(draft.products.length
              ? draft.products
              : [
                  {
                    id: "demo-1",
                    name: "Sample set A",
                    price: 89,
                    onDeal: true,
                  },
                  {
                    id: "demo-2",
                    name: "Sample set B",
                    price: 96,
                    onDeal: true,
                  },
                  {
                    id: "demo-3",
                    name: "Sample set C",
                    price: 72,
                    onDeal: draft.scope === "platform",
                  },
                ]
            )
              .slice(0, mode === "phone" ? 2 : 3)
              .map((p) => {
                const liveDeal = phase === "live" && p.onDeal;
                const sale = liveDeal
                  ? salePriceUsd(p.price, draft)
                  : p.price;
                return (
                  <div
                    key={p.id}
                    className="overflow-hidden rounded-xl border border-[var(--line)] bg-white"
                  >
                    <div className="relative aspect-[2/3] bg-[var(--soft)]">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="size-full object-cover object-top"
                        />
                      ) : (
                        <div className="grid size-full place-items-center bg-gradient-to-br from-[#3A3228] to-[#161412] text-[10px] font-bold text-[#C4A574]">
                          {p.name.slice(0, 1)}
                        </div>
                      )}
                      {liveDeal ? (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-[#b42318] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                          {discountBadgeLabel(draft)}
                        </span>
                      ) : null}
                      {!p.onDeal && draft.scope !== "platform" ? (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white/90">
                          Not in deal
                        </span>
                      ) : null}
                    </div>
                    <div className="px-1.5 py-1.5">
                      <p className="truncate text-[9px] font-semibold text-[var(--ink)]">
                        {p.name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-baseline gap-1">
                        <span className="text-[10px] font-extrabold text-[var(--ink)]">
                          {formatUsd(sale)}
                        </span>
                        {liveDeal ? (
                          <span className="text-[8px] font-semibold text-[var(--muted)] line-through">
                            {formatUsd(p.price)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export const defaultDealBanner = (): DealBannerStyle => ({
  preText: "Deal starts in",
  liveText: "Deal is live — ends in",
  endedText: "This deal has ended",
  ctaLabel: "Shop now",
  ctaHref: "/shop",
  background: "#161412",
  textColor: "#FAF9F7",
  accentColor: "#F38120",
  clockStyle: "blocks",
  textStyle: "bold",
  showSeconds: true,
});
