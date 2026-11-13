"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** yyyy-mm-dd */
export function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, day] = value.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  if (
    d.getFullYear() !== y ||
    d.getMonth() !== m - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

function formatDisplay(value: string) {
  const d = parseISODate(value);
  if (!d) return "";
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

type Props = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  className?: string;
};

export function DatePicker({
  label,
  value,
  onChange,
  min,
  max,
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseISODate(value), [value]);
  const minDate = useMemo(() => (min ? parseISODate(min) : null), [min]);
  const maxDate = useMemo(() => (max ? parseISODate(max) : null), [max]);
  const [view, setView] = useState(() =>
    startOfMonth(selected || new Date())
  );

  useEffect(() => {
    if (selected) setView(startOfMonth(selected));
  }, [selected]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cells = useMemo(() => {
    const first = startOfMonth(view);
    const startPad = first.getDay();
    const daysInMonth = new Date(
      view.getFullYear(),
      view.getMonth() + 1,
      0
    ).getDate();
    const prevDays = new Date(
      view.getFullYear(),
      view.getMonth(),
      0
    ).getDate();
    const out: { date: Date; inMonth: boolean }[] = [];
    for (let i = startPad - 1; i >= 0; i--) {
      out.push({
        date: new Date(view.getFullYear(), view.getMonth() - 1, prevDays - i),
        inMonth: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({
        date: new Date(view.getFullYear(), view.getMonth(), d),
        inMonth: true,
      });
    }
    while (out.length % 7 !== 0) {
      const next = out.length - (startPad + daysInMonth) + 1;
      out.push({
        date: new Date(view.getFullYear(), view.getMonth() + 1, next),
        inMonth: false,
      });
    }
    return out;
  }, [view]);

  const today = new Date();

  function isDisabled(d: Date) {
    if (minDate) {
      const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const b = new Date(
        minDate.getFullYear(),
        minDate.getMonth(),
        minDate.getDate()
      );
      if (a < b) return true;
    }
    if (maxDate) {
      const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const b = new Date(
        maxDate.getFullYear(),
        maxDate.getMonth(),
        maxDate.getDate()
      );
      if (a > b) return true;
    }
    return false;
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "group flex h-10 min-w-[168px] items-center gap-2 rounded-xl border bg-white px-3 text-left shadow-[0_4px_14px_rgba(18,16,14,0.04)] transition",
          open
            ? "border-[var(--orange)] ring-2 ring-[var(--orange)]/20"
            : "border-[var(--line)] hover:border-[var(--orange)]/40"
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--soft)] text-[var(--forest)] transition group-hover:bg-[var(--orange)]/15 group-hover:text-[var(--orange)]">
          <CalendarDays className="size-3.5" strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1">
          {value ? (
            <span className="block truncate text-[13px] font-semibold text-[var(--ink)]">
              {formatDisplay(value)}
            </span>
          ) : (
            <span className="block truncate text-[13px] text-[var(--muted)]">
              Pick a date
            </span>
          )}
        </span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Clear ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
              }
            }}
            className="flex size-6 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--ink)]"
          >
            <X className="size-3.5" strokeWidth={2.25} />
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={`${label} calendar`}
          className="absolute left-0 top-[calc(100%+8px)] z-40 w-[292px] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-[0_22px_50px_rgba(18,16,14,0.18)]"
        >
          <div className="bg-[linear-gradient(135deg,var(--forest)_0%,#2a241c_100%)] px-3.5 py-3 text-[var(--paper)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--orange)]">
              {label}
            </p>
            <p className="mt-1 font-semibold tracking-wide">
              {selected
                ? `${MONTHS[selected.getMonth()]} ${selected.getDate()}, ${selected.getFullYear()}`
                : "Select a date"}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 px-3 pt-3">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setView(
                  new Date(view.getFullYear(), view.getMonth() - 1, 1)
                )
              }
              className="flex size-8 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-[var(--ink)] transition hover:border-[var(--orange)] hover:text-[var(--orange)]"
            >
              <ChevronLeft className="size-4" strokeWidth={2.25} />
            </button>
            <p className="text-[13px] font-bold tracking-wide text-[var(--ink)]">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setView(
                  new Date(view.getFullYear(), view.getMonth() + 1, 1)
                )
              }
              className="flex size-8 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-[var(--ink)] transition hover:border-[var(--orange)] hover:text-[var(--orange)]"
            >
              <ChevronRight className="size-4" strokeWidth={2.25} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 px-3 pt-3">
            {WEEKDAYS.map((d) => (
              <span
                key={d}
                className="pb-1 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 px-3 pb-2">
            {cells.map(({ date, inMonth }) => {
              const iso = toISODate(date);
              const selectedDay = selected ? sameDay(date, selected) : false;
              const isToday = sameDay(date, today);
              const disabled = isDisabled(date);
              return (
                <button
                  key={iso + String(inMonth)}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={cn(
                    "relative mx-auto flex size-9 items-center justify-center rounded-xl text-[12px] font-semibold transition",
                    !inMonth && "text-[var(--muted)]/45",
                    inMonth && !selectedDay && "text-[var(--ink)] hover:bg-[var(--soft)]",
                    selectedDay &&
                      "bg-[var(--orange)] text-[var(--ink)] shadow-[0_8px_18px_rgba(243,129,32,0.35)]",
                    isToday &&
                      !selectedDay &&
                      "ring-1 ring-[var(--forest)]/25",
                    disabled && "cursor-not-allowed opacity-30 hover:bg-transparent"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[var(--line)] bg-[var(--soft)]/50 px-3 py-2.5">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] transition hover:bg-white hover:text-[var(--ink)]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                if (!isDisabled(t)) {
                  onChange(toISODate(t));
                  setOpen(false);
                }
              }}
              className="rounded-lg bg-[var(--forest)] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--paper)] transition hover:bg-[var(--orange)] hover:text-[var(--ink)]"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
