"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  COUNTRIES,
  flagEmoji,
  findCountryByName,
  type CountryInfo,
} from "@/lib/countries";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (country: CountryInfo) => void;
  label?: string;
  required?: boolean;
  className?: string;
};

export function CountrySelect({
  value,
  onChange,
  label = "Country",
  required,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected =
    findCountryByName(value) ||
    COUNTRIES.find((c) => c.name === "United States")!;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.iso2.toLowerCase().includes(term) ||
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

  return (
    <div ref={rootRef} className={cn("relative block text-sm", className)}>
      <span className="mb-1 block font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2.5 text-left outline-none transition focus:border-orange"
      >
        <span className="text-lg leading-none" aria-hidden>
          {flagEmoji(selected.iso2)}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium text-ink">
          {selected.name}
        </span>
        <ChevronDown
          className={cn("size-4 text-muted transition", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>

      {open ? (
        <div
          id={listId}
          className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-paper shadow-[0_16px_40px_rgba(18,16,14,0.18)]"
        >
          <div className="relative border-b border-line p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search country…"
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
                <li key={c.iso2}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition hover:bg-soft",
                      c.iso2 === selected.iso2 && "bg-orange/10"
                    )}
                  >
                    <span className="text-base leading-none" aria-hidden>
                      {flagEmoji(c.iso2)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="shrink-0 text-[11px] font-semibold text-muted">
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
