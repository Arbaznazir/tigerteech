"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { countryHasStates, statesForCountryName } from "@/lib/states";
import { cn } from "@/lib/cn";

type Props = {
  countryName: string;
  value: string;
  onChange: (stateName: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
};

export function StateSelect({
  countryName,
  value,
  onChange,
  label = "State",
  required,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const states = useMemo(
    () => statesForCountryName(countryName),
    [countryName]
  );
  const hasList = states.length > 0;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return states;
    return states.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.isoCode.toLowerCase().includes(term)
    );
  }, [q, states]);

  // Drop invalid state when country changes.
  useEffect(() => {
    if (!hasList) return;
    if (!value) return;
    const ok = states.some(
      (s) => s.name.toLowerCase() === value.trim().toLowerCase()
    );
    if (!ok) onChange("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when country/states change
  }, [countryName, hasList]);

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

  if (!hasList) {
    return (
      <label className={cn("block text-sm", className)}>
        <span className="mb-1 block font-medium">
          {label}
          {required ? " *" : ""}
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            countryHasStates(countryName)
              ? "Select state"
              : "State / province (optional)"
          }
          className="w-full rounded-lg border border-line px-3 py-2.5 outline-none transition focus:border-orange"
        />
        <p className="mt-1.5 text-[11px] text-muted">
          No state list for this country — type if needed.
        </p>
      </label>
    );
  }

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
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            value ? "font-medium text-ink" : "text-muted"
          )}
        >
          {value || "Select state / province"}
        </span>
        <ChevronDown
          className={cn("size-4 text-muted transition", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>
      <p className="mt-1.5 text-[11px] text-muted">
        {states.length} regions for {countryName || "this country"}
      </p>

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
              placeholder="Search state…"
              className="w-full rounded-lg border border-line bg-soft/50 py-2 pl-9 pr-3 text-[13px] outline-none focus:border-orange"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-[12px] text-muted">
                No states match
              </li>
            ) : (
              filtered.map((s) => (
                <li key={`${s.countryCode}-${s.isoCode}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(s.name);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition hover:bg-soft",
                      s.name === value && "bg-orange/10"
                    )}
                  >
                    <span className="min-w-0 truncate">{s.name}</span>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                      {s.isoCode}
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
