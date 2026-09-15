"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  CURRENCIES,
  currencyLabel,
  type CurrencyCode,
} from "@/lib/currency";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Align dropdown to the trigger edge (header uses right). */
  align?: "left" | "right";
  /** Light sits on white header; dark sits on forest drawer. */
  tone?: "light" | "dark";
};

export function CurrencySwitcher({
  className,
  align = "right",
  tone = "light",
}: Props) {
  const currency = useStore((s) => s.currency);
  const setCurrency = useStore((s) => s.setCurrency);
  const hydrated = useStore((s) => s.hydrated);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const displayCode: CurrencyCode = hydrated ? currency : "USD";

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

  const select = (code: CurrencyCode) => {
    setCurrency(code);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex h-9 items-center gap-0.5 rounded-full px-1.5 text-[12px] font-semibold tabular-nums tracking-wide transition sm:px-2 md:text-[13px]",
          tone === "dark"
            ? "text-white hover:text-[#f49331]"
            : "text-[#1a1a1a] hover:text-[#f49331]",
          open && "text-[#f49331]"
        )}
        aria-label="Select currency"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="whitespace-nowrap">{currencyLabel(displayCode)}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 opacity-70 transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={2}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Currencies"
          className={cn(
            "absolute top-[calc(100%+6px)] z-[70] min-w-[152px] overflow-hidden rounded-xl border border-white/10 bg-[#121212]/96 py-1.5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-md",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {CURRENCIES.map((c) => {
            const selected = c.code === displayCode;
            return (
              <li key={c.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={cn(
                    "mx-1.5 flex w-[calc(100%-12px)] items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] font-medium tracking-wide transition",
                    "hover:bg-[#f49331] hover:text-[#0a0a0a]",
                    selected && "bg-[#06231A]"
                  )}
                  onClick={() => select(c.code)}
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {selected ? (
                      <Check className="size-3.5" strokeWidth={2.5} />
                    ) : null}
                  </span>
                  <span>{currencyLabel(c.code)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
