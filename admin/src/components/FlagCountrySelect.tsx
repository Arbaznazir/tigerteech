"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Country } from "country-state-city";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export type FlagCountry = {
  iso: string;
  name: string;
};

function flagEmoji(iso2: string): string {
  const code = iso2.toUpperCase();
  if (code.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + code.charCodeAt(0) - 65,
    A + code.charCodeAt(1) - 65
  );
}

type Props = {
  value: string;
  onChange: (country: FlagCountry) => void;
  label?: string;
  className?: string;
};

export function FlagCountrySelect({
  value,
  onChange,
  label = "Country",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const countries = useMemo(
    () =>
      Country.getAllCountries().map((c) => ({
        iso: c.isoCode,
        name: c.name,
      })),
    []
  );

  const selected =
    countries.find((c) => c.iso === value) ||
    countries.find((c) => c.iso === "US") ||
    countries[0];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.iso.toLowerCase().includes(term)
    );
  }, [countries, q]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative block", className)}>
      {label ? (
        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
          {label}
        </span>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-full items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-3.5 text-left shadow-[0_1px_0_rgba(18,16,14,0.04)] outline-none transition hover:border-[var(--ink)]/25 focus:border-[var(--orange)]"
      >
        <span className="text-[22px] leading-none" aria-hidden>
          {flagEmoji(selected.iso)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-[var(--ink)]">
            {selected.name}
          </span>
          <span className="text-[11px] text-[var(--muted)]">{selected.iso}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-[var(--muted)] transition",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div
          id={listId}
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(18,16,14,0.22)]"
        >
          <div className="relative border-b border-[var(--line)] bg-[var(--soft)]/60 p-2.5">
            <Search className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search country or code…"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-[var(--orange)]"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto overscroll-contain py-1.5">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-[12px] text-[var(--muted)]">
                No countries match
              </li>
            ) : (
              filtered.map((c) => {
                const active = c.iso === selected.iso;
                return (
                  <li key={c.iso}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(c);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition",
                        active
                          ? "bg-[var(--orange)]/12"
                          : "hover:bg-[var(--soft)]"
                      )}
                    >
                      <span className="text-[20px] leading-none" aria-hidden>
                        {flagEmoji(c.iso)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[var(--ink)]">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">
                          {c.iso}
                        </span>
                      </span>
                      {active ? (
                        <Check className="size-4 text-[var(--ink)]" />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export { flagEmoji };
