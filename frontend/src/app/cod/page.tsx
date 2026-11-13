"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, MapPin } from "lucide-react";
import {
  fetchCodSettings,
  isCodAvailable,
  type CodSettings,
} from "@/lib/cod-settings";
import { findCountryByIso, flagEmoji } from "@/lib/countries";
import { cn } from "@/lib/cn";
import { useShopperLocation } from "@/lib/location";

export default function CodAvailabilityPage() {
  const [settings, setSettings] = useState<CodSettings | null>(null);
  const [error, setError] = useState("");
  const location = useShopperLocation();

  useEffect(() => {
    void fetchCodSettings()
      .then(setSettings)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load COD list")
      );
  }, []);

  const youOk = useMemo(
    () =>
      isCodAvailable(
        settings,
        location.countryName || "",
        location.stateName || ""
      ),
    [settings, location.countryName, location.stateName]
  );

  const whereYouAre = [
    location.countryName,
    location.stateName,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-paper">
      <div className="border-b border-line bg-paper">
        <div className="container-site py-8 md:py-12">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition hover:text-orange"
          >
            <ArrowLeft className="size-3.5" />
            Back home
          </Link>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
            Payments
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.92] tracking-wide text-forest">
            COD{" "}
            <span className="text-wild text-[clamp(2.6rem,9vw,4.75rem)]">
              AVAILABILITY
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Places where cash on delivery is offered. Your checkout only shows
            COD when your shipping address matches one of these regions.
          </p>
          {whereYouAre ? (
            <div
              className={cn(
                "mt-5 inline-flex max-w-xl flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 text-[13px]",
                youOk
                  ? "border-orange/40 bg-orange/10 text-ink"
                  : "border-line bg-soft/70 text-muted"
              )}
            >
              <MapPin className="size-4 shrink-0 text-orange" />
              <span>
                Based on your location ({whereYouAre}):{" "}
                <strong className="font-semibold text-ink">
                  {youOk ? "COD available" : "COD not available"}
                </strong>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="container-site py-8 pb-16 md:py-12 md:pb-20">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !settings ? (
          <p className="text-sm text-muted">Loading COD regions…</p>
        ) : !settings.enabled ? (
          <div className="rounded-2xl border border-line bg-soft/60 px-5 py-8 text-center">
            <Banknote className="mx-auto size-8 text-muted" />
            <p className="mt-3 font-display text-2xl tracking-wide text-ink">
              COD is currently off
            </p>
            <p className="mt-2 text-sm text-muted">
              Online payment is available at checkout.
            </p>
          </div>
        ) : settings.everywhere ? (
          <div className="rounded-2xl border border-orange/30 bg-orange/8 px-5 py-8 text-center">
            <MapPin className="mx-auto size-8 text-orange" />
            <p className="mt-3 font-display text-2xl tracking-wide text-ink">
              Available everywhere
            </p>
            <p className="mt-2 text-sm text-muted">
              Cash on delivery works for all shipping countries and states.
            </p>
          </div>
        ) : (settings.rules || []).length === 0 ? (
          <div className="rounded-2xl border border-line bg-soft/60 px-5 py-8 text-center">
            <p className="font-display text-2xl tracking-wide text-ink">
              No COD regions listed yet
            </p>
            <p className="mt-2 text-sm text-muted">
              Check back soon, or use online payment at checkout.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
              COD list · {settings.rules.length} region
              {settings.rules.length === 1 ? "" : "s"}
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {settings.rules.map((rule) => {
                const name =
                  rule.countryName ||
                  findCountryByIso(rule.countryIso)?.name ||
                  rule.countryIso;
                const whole = rule.scope !== "states";
                return (
                  <li
                    key={rule.countryIso}
                    className="rounded-2xl border border-line bg-white p-4 shadow-[0_8px_28px_rgba(18,16,14,0.05)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-[28px] leading-none" aria-hidden>
                        {flagEmoji(rule.countryIso)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-xl tracking-wide text-ink">
                            {name}
                          </h2>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                              whole
                                ? "bg-forest text-white"
                                : "bg-orange/15 text-ink"
                            )}
                          >
                            {whole
                              ? "Entire country"
                              : `${rule.states.length} state${rule.states.length === 1 ? "" : "s"}`}
                          </span>
                        </div>
                        {whole ? (
                          <p className="mt-2 text-[13px] text-muted">
                            COD available for every address in this country.
                          </p>
                        ) : (
                          <ul className="mt-3 flex flex-wrap gap-1.5">
                            {rule.states.map((state) => (
                              <li
                                key={state}
                                className="rounded-full border border-line bg-soft/70 px-2.5 py-1 text-[11px] font-semibold text-ink"
                              >
                                {state}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-full bg-orange px-5 text-[12px] font-bold uppercase tracking-[0.12em] text-ink"
          >
            Shop the drop
          </Link>
          <Link
            href="/checkout"
            className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-white px-5 text-[12px] font-bold uppercase tracking-[0.12em] text-ink"
          >
            Go to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
