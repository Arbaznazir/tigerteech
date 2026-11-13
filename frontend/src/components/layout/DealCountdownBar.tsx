"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { discountBadgeLabel } from "@/lib/deals";
import { useShopperLocation } from "@/lib/location";
import { cn } from "@/lib/cn";

type Banner = {
  preText?: string;
  liveText?: string;
  endedText?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: string;
  textColor?: string;
  accentColor?: string;
  clockStyle?: "blocks" | "inline" | "pills" | string;
  textStyle?: "bold" | "elegant" | "compact" | string;
  showSeconds?: boolean;
};

type DealBanner = {
  id: string;
  title: string;
  discountType?: string;
  discountValue?: number;
  startsAt?: string;
  endsAt?: string;
  countdownEnabled: boolean;
  banner: Banner;
  phase?: string;
  targetAt?: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function partsFromMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function resolvePhase(deal: DealBanner, now: number) {
  const start = deal.startsAt ? new Date(deal.startsAt).getTime() : null;
  const end = deal.endsAt ? new Date(deal.endsAt).getTime() : null;
  if (start && now < start) {
    return { phase: "upcoming" as const, target: start };
  }
  if (end && now >= end) {
    return { phase: "ended" as const, target: null };
  }
  return { phase: "live" as const, target: end };
}

export function DealCountdownBar() {
  const [deal, setDeal] = useState<DealBanner | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const location = useShopperLocation();

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const params = new URLSearchParams();
      if (location?.countryIso) params.set("country", location.countryIso);
      if (location?.countryName) params.set("countryName", location.countryName);
      if (location?.stateName) params.set("state", location.stateName);
      const qs = params.toString();
      void fetch(
        `${API_URL}/api/v1/deals/banner${qs ? `?${qs}` : ""}`,
        { cache: "no-store" }
      )
        .then(async (res) => {
          if (!res.ok) return null;
          const json = (await res.json()) as {
            data?: DealBanner | null;
            error?: string | null;
          };
          if (json.error || json.data == null) return null;
          return json.data;
        })
        .then((d) => {
          if (!cancelled) setDeal(d);
        })
        .catch(() => {
          if (!cancelled) setDeal(null);
        });
    };
    load();
    const poll = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [location?.countryIso, location?.stateName, location?.updatedAt]);

  useEffect(() => {
    if (!deal?.countdownEnabled) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [deal?.countdownEnabled, deal?.id]);

  const resolved = useMemo(
    () => (deal ? resolvePhase(deal, now) : null),
    [deal, now]
  );

  if (!deal || !deal.countdownEnabled || !resolved || resolved.phase === "ended") {
    return null;
  }

  const b = deal.banner || {};
  const remaining = resolved.target
    ? partsFromMs(resolved.target - now)
    : null;
  const showSeconds = b.showSeconds !== false;
  const units = remaining
    ? [
        { label: "Days", value: remaining.days },
        { label: "Hrs", value: remaining.hours },
        { label: "Min", value: remaining.minutes },
        ...(showSeconds
          ? [{ label: "Sec", value: remaining.seconds }]
          : []),
      ]
    : [];

  const offLabel =
    deal.discountType && deal.discountValue != null
      ? discountBadgeLabel({
          discountType: deal.discountType,
          discountValue: deal.discountValue,
        })
      : "";

  const message =
    resolved.phase === "upcoming"
      ? b.preText || "Deal starts in"
      : b.liveText || "Deal is live — ends in";

  const textClass =
    b.textStyle === "elegant"
      ? "text-[11px] font-medium tracking-[0.04em] md:text-[12px]"
      : b.textStyle === "compact"
        ? "text-[10px] font-semibold tracking-wide md:text-[11px]"
        : "text-[10px] font-bold uppercase tracking-[0.14em] md:text-[11px]";

  const accent = b.accentColor || "#F38120";
  const href = b.ctaHref || "/shop";

  return (
    <div
      className="w-full border-t border-white/10"
      style={{
        background: b.background || "#161412",
        color: b.textColor || "#FAF9F7",
      }}
      role="region"
      aria-label="Deal countdown"
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-4 gap-y-2 px-3 py-2 sm:justify-between md:px-8 lg:px-10">
        <p className={cn("min-w-0 text-center sm:text-left", textClass)}>
          <span>{message}</span>
          {deal.title ? (
            <span className="ml-1.5 opacity-70">· {deal.title}</span>
          ) : null}
          {offLabel ? (
            <span
              className="ml-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink"
              style={{ background: accent }}
            >
              {offLabel}
            </span>
          ) : null}
        </p>

        {units.length > 0 ? (
          b.clockStyle === "inline" ? (
            <p
              className="font-mono text-[13px] font-bold tabular-nums tracking-wide md:text-[15px]"
              style={{ color: accent }}
              aria-hidden
            >
              {units.map((u) => pad(u.value)).join(":")}
            </p>
          ) : (
            <div className="flex items-center gap-1.5" aria-hidden>
              {units.map((u) =>
                b.clockStyle === "pills" ? (
                  <span
                    key={u.label}
                    className="inline-flex h-7 items-center justify-center rounded-full px-2 font-mono text-[11px] font-bold tabular-nums"
                    style={{
                      background: `${accent}22`,
                      color: accent,
                    }}
                  >
                    {pad(u.value)}
                    <span className="ml-1 text-[8px] uppercase opacity-70">
                      {u.label}
                    </span>
                  </span>
                ) : (
                  <div key={u.label} className="flex flex-col items-center">
                    <span
                      className="inline-flex h-7 min-w-8 items-center justify-center rounded-md px-1 font-mono text-[12px] font-bold tabular-nums md:h-8 md:min-w-9 md:text-[13px]"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: accent,
                        border: `1px solid ${accent}55`,
                      }}
                    >
                      {pad(u.value)}
                    </span>
                    <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-wide opacity-55 md:text-[8px]">
                      {u.label}
                    </span>
                  </div>
                )
              )}
            </div>
          )
        ) : null}

        {b.ctaLabel ? (
          <Link
            href={href}
            className="inline-flex h-7 items-center rounded-full px-3 text-[10px] font-bold uppercase tracking-wide text-ink transition hover:opacity-90"
            style={{ background: accent }}
          >
            {b.ctaLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
