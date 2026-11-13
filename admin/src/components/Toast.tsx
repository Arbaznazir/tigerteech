"use client";

import { useEffect } from "react";
import { CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "info";

type Props = {
  open: boolean;
  title: string;
  detail?: string;
  tone?: ToastTone;
  onClose: () => void;
  durationMs?: number;
};

export function Toast({
  open,
  title,
  detail,
  tone = "success",
  onClose,
  durationMs = 4200,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(t);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  const Icon = tone === "info" ? Info : CheckCircle2;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex justify-center px-4">
      <div
        role="status"
        className={cn(
          "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_22px_50px_rgba(18,16,14,0.22)]",
          tone === "success"
            ? "border-[var(--orange)]/35 bg-[var(--forest)] text-[var(--paper)]"
            : "border-[var(--line)] bg-white text-[var(--ink)]"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
            tone === "success"
              ? "bg-[var(--orange)]/20 text-[var(--orange)]"
              : "bg-[var(--soft)] text-[var(--forest)]"
          )}
        >
          <Icon className="size-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold tracking-tight">{title}</p>
          {detail ? (
            <p
              className={cn(
                "mt-0.5 text-[12px]",
                tone === "success" ? "text-white/65" : "text-[var(--muted)]"
              )}
            >
              {detail}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          className={cn(
            "mt-0.5 flex size-7 items-center justify-center rounded-lg transition",
            tone === "success"
              ? "text-white/55 hover:bg-white/10 hover:text-white"
              : "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]"
          )}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
