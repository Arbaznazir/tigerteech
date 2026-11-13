"use client";

import { cn } from "@/lib/cn";

type Props = {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  /** When false, zero shows as "0" (useful for stock). Default true for prices. */
  emptyZero?: boolean;
};

/** Text-like amount field — no spinner arrows, no sticky leading zero. */
export function AmountInput({
  value,
  onChange,
  className,
  placeholder = "0",
  min = 0,
  emptyZero = true,
}: Props) {
  const display =
    value === "" || value === null || value === undefined
      ? ""
      : Number(value) === 0
        ? emptyZero
          ? ""
          : "0"
        : String(value);

  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      className={cn(className)}
      value={display}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.]/g, "");
        if (raw === "" || raw === ".") {
          onChange(min);
          return;
        }
        // Strip leading zeros: "0100" → "100"
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const n = Number(cleaned);
        onChange(Number.isFinite(n) ? n : min);
      }}
      onFocus={(e) => e.currentTarget.select()}
    />
  );
}
