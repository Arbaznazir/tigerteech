"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, MapPin, Search } from "lucide-react";
import { COUNTRIES, flagEmoji, findCountryByIso } from "@/lib/countries";
import { cn } from "@/lib/cn";
import {
  currencyForCountryIso,
  formatShopperPlace,
  setShopperLocation,
  useShopperLocation,
} from "@/lib/location";
import { statesForCountryIso } from "@/lib/states";
import { useStore } from "@/lib/store";

export function ShopperLocationPicker({ className }: { className?: string }) {
  const loc = useShopperLocation();
  const setCurrency = useStore((s) => s.setCurrency);
  const [nationQ, setNationQ] = useState("");
  const [stateQ, setStateQ] = useState("");
  const [pickedIso, setPickedIso] = useState(loc.countryIso || "US");
  const nationSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPickedIso(loc.countryIso || "US");
  }, [loc.countryIso]);

  const pickedCountry =
    findCountryByIso(pickedIso) ||
    COUNTRIES.find((c) => c.iso2 === "US")!;

  const nations = useMemo(() => {
    const term = nationQ.trim().toLowerCase();
    if (!term) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.iso2.toLowerCase().includes(term)
    );
  }, [nationQ]);

  const stateOptions = useMemo(
    () => statesForCountryIso(pickedIso),
    [pickedIso]
  );

  const states = useMemo(() => {
    const term = stateQ.trim().toLowerCase();
    if (!term) return stateOptions;
    return stateOptions.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.isoCode.toLowerCase().includes(term)
    );
  }, [stateOptions, stateQ]);

  const apply = (next: {
    countryIso: string;
    countryName: string;
    stateName: string;
    stateIso?: string;
    cityName?: string;
  }) => {
    setShopperLocation({
      countryIso: next.countryIso,
      countryName: next.countryName,
      stateName: next.stateName,
      stateIso: next.stateIso || "",
      cityName: next.cityName || "",
      source: "manual",
      consented: true,
      updatedAt: Date.now(),
    });
    const cur = currencyForCountryIso(next.countryIso);
    if (cur) setCurrency(cur);
  };

  const pickNation = (iso: string, name: string) => {
    setPickedIso(iso);
    setStateQ("");
    apply({
      countryIso: iso,
      countryName: name,
      stateName: "",
      cityName: "",
    });
  };

  const pickState = (stateName: string, stateIso: string) => {
    apply({
      countryIso: pickedCountry.iso2,
      countryName: pickedCountry.name,
      stateName,
      stateIso,
      cityName: stateName,
    });
  };

  const clearState = () => {
    apply({
      countryIso: pickedCountry.iso2,
      countryName: pickedCountry.name,
      stateName: "",
      cityName: "",
    });
  };

  const place = formatShopperPlace(loc);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_8px_28px_rgba(18,16,14,0.05)]",
        className
      )}
    >
      <div className="flex items-start gap-3 border-b border-line px-5 py-4">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange/15 text-ink">
          <MapPin className="size-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            Shopping location
          </p>
          <p className="mt-1 text-[15px] font-semibold text-ink">{place}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            Pick a nation, then optionally a state on the right — deals, offers,
            and COD update for that region.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 md:divide-x md:divide-line">
        {/* LEFT — nations */}
        <section className="flex min-h-[280px] flex-col border-b border-line md:border-b-0">
          <div className="shrink-0 border-b border-line px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              1 · Nation
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-soft/60 px-3 py-2 focus-within:border-orange">
              <Search className="size-3.5 shrink-0 text-muted" />
              <input
                ref={nationSearchRef}
                value={nationQ}
                onChange={(e) => setNationQ(e.target.value)}
                placeholder="Search nation…"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted/70"
              />
            </div>
          </div>
          <ul className="max-h-[320px] flex-1 overflow-y-auto overscroll-contain p-2">
            {nations.map((c) => {
              const on = pickedIso === c.iso2;
              return (
                <li key={c.iso2}>
                  <button
                    type="button"
                    onClick={() => pickNation(c.iso2, c.name)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition",
                      on
                        ? "bg-orange/15 text-ink"
                        : "text-ink hover:bg-soft/80"
                    )}
                  >
                    <span className="text-lg leading-none" aria-hidden>
                      {flagEmoji(c.iso2)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                      {c.name}
                    </span>
                    {on ? (
                      <Check className="size-4 shrink-0 text-orange" />
                    ) : null}
                  </button>
                </li>
              );
            })}
            {nations.length === 0 ? (
              <li className="px-3 py-8 text-center text-[12px] text-muted">
                No nations match.
              </li>
            ) : null}
          </ul>
        </section>

        {/* RIGHT — states of selected nation */}
        <section className="flex min-h-[280px] flex-col bg-soft/25">
          <div className="shrink-0 border-b border-line px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              2 · States of {pickedCountry.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold text-ink">
                {flagEmoji(pickedCountry.iso2)} {pickedCountry.name}
              </h3>
              {stateOptions.length > 0 ? (
                <button
                  type="button"
                  onClick={clearState}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                    !loc.stateName || loc.countryIso !== pickedIso
                      ? "bg-forest text-white"
                      : "border border-line bg-white text-muted"
                  )}
                >
                  Entire nation
                </button>
              ) : null}
            </div>
            {stateOptions.length > 0 ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 focus-within:border-orange">
                <Search className="size-3.5 shrink-0 text-muted" />
                <input
                  value={stateQ}
                  onChange={(e) => setStateQ(e.target.value)}
                  placeholder="Search state…"
                  className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted/70"
                />
              </div>
            ) : null}
          </div>

          {stateOptions.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <MapPin className="size-7 text-orange" />
              <p className="text-[14px] font-semibold text-ink">
                No state list for this nation
              </p>
              <p className="max-w-xs text-[12px] text-muted">
                Offers apply to the whole country.
              </p>
            </div>
          ) : (
            <ul className="grid max-h-[320px] flex-1 auto-rows-min grid-cols-1 content-start gap-1 overflow-y-auto overscroll-contain p-2 sm:grid-cols-2">
              {states.map((s) => {
                const on =
                  loc.countryIso === pickedIso && loc.stateName === s.name;
                return (
                  <li key={s.isoCode}>
                    <button
                      type="button"
                      onClick={() => pickState(s.name, s.isoCode)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition",
                        on
                          ? "border-orange bg-orange/15 text-ink"
                          : "border-transparent bg-white text-ink hover:border-line"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                        {s.name}
                      </span>
                      {on ? (
                        <Check className="size-3.5 shrink-0 text-orange" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
              {states.length === 0 ? (
                <li className="col-span-full px-3 py-8 text-center text-[12px] text-muted">
                  No states match.
                </li>
              ) : null}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
