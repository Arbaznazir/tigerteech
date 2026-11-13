"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  COUNTRIES,
  flagEmoji,
  findCountryByIso,
  findCountryByName,
  formatInternational,
  parseStoredPhone,
  type CountryInfo,
} from "@/lib/countries";
import { cn } from "@/lib/cn";

type Props = {
  /** Stored international phone, e.g. +11234567890 */
  value: string;
  /** Country name — kept in sync both ways with dial picker */
  countryName: string;
  onPhoneChange: (international: string, national: string) => void;
  onCountryChange: (country: CountryInfo) => void;
  label?: string;
  required?: boolean;
  className?: string;
};

export function PhoneCountryInput({
  value,
  countryName,
  onPhoneChange,
  onCountryChange,
  label = "Phone",
  required,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const fromCountry = findCountryByName(countryName);
  const selected =
    fromCountry ||
    findCountryByIso(parseStoredPhone(value).iso2) ||
    COUNTRIES.find((c) => c.iso2 === "US")!;

  const national = (() => {
    const trimmed = value.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (!digits) return "";
    const body = trimmed.startsWith("00") ? digits.replace(/^00/, "") : digits;
    // "+91" / "91" alone is the country code, not a phone number.
    if (body === selected.dial) return "";
    if (
      (trimmed.startsWith("+") || trimmed.startsWith("00")) &&
      body.startsWith(selected.dial)
    ) {
      return body.slice(selected.dial.length).slice(0, 10);
    }
    return body.slice(0, 10);
  })();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.iso2.toLowerCase().includes(term) ||
        (`+${c.dial}`).includes(term) ||
        c.dial.includes(term.replace("+", ""))
    );
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ("");
      window.setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  function pickCountry(c: CountryInfo) {
    onCountryChange(c);
    const nextNational = national.slice(0, 10);
    onPhoneChange(formatInternational(c.dial, nextNational), nextNational);
    setOpen(false);
  }

  function onNational(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    onPhoneChange(formatInternational(selected.dial, digits), digits);
  }

  return (
    <div ref={rootRef} className={cn("relative block text-sm", className)}>
      <span className="mb-1 block font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      <div className="flex overflow-hidden rounded-lg border border-line focus-within:border-orange">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 border-r border-line bg-soft/60 px-2.5 py-2.5 text-left transition hover:bg-soft sm:px-3"
        >
          <span className="text-base leading-none" aria-hidden>
            {flagEmoji(selected.iso2)}
          </span>
          <span className="text-[13px] font-semibold tabular-nums text-ink">
            +{selected.dial}
          </span>
          <ChevronDown
            className={cn("size-3.5 text-muted transition", open && "rotate-180")}
            strokeWidth={2}
          />
        </button>
        <input
          required={required}
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          pattern="[0-9]{7,10}"
          title="Enter up to 10 digits"
          value={national}
          onChange={(e) => onNational(e.target.value)}
          placeholder="10-digit number"
          className="min-w-0 flex-1 bg-paper px-3 py-2.5 text-[13px] outline-none"
        />
      </div>
      <p className="mt-1.5 text-[11px] text-muted">
        Max 10 digits · country code updates the country field
      </p>

      {open ? (
        <div
          id={listId}
          className="absolute z-40 mt-1.5 w-full min-w-[280px] overflow-hidden rounded-xl border border-line bg-paper shadow-[0_16px_40px_rgba(18,16,14,0.18)]"
        >
          <div className="relative border-b border-line p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search country or code…"
              className="w-full rounded-lg border border-line bg-soft/50 py-2 pl-9 pr-3 text-[13px] outline-none focus:border-orange"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-[12px] text-muted">
                No countries match
              </li>
            ) : (
              filtered.map((c) => (
                <li key={`${c.iso2}-${c.dial}`}>
                  <button
                    type="button"
                    onClick={() => pickCountry(c)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition hover:bg-soft",
                      c.iso2 === selected.iso2 && "bg-orange/10"
                    )}
                  >
                    <span className="text-base leading-none" aria-hidden>
                      {flagEmoji(c.iso2)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted">
                      +{c.dial}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
