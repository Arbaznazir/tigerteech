"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "default" | "danger" | "success";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  busy,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  const Icon = tone === "danger" ? AlertTriangle : CheckCircle2;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[var(--ink)]/45 backdrop-blur-[2px]"
        onClick={() => {
          if (!busy) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[0_28px_80px_rgba(18,16,14,0.28)]"
      >
        <div className="flex items-start gap-3 border-b border-[var(--line)] px-5 py-4">
          <span
            className={cn(
              "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl",
              tone === "danger"
                ? "bg-red-50 text-[#b42318]"
                : tone === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-[var(--orange)]/15 text-[var(--ink)]"
            )}
          >
            <Icon className="size-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <h3
              id="confirm-title"
              className="text-[17px] font-semibold tracking-tight text-[var(--ink)]"
            >
              {title}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted)]">
              {message}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-full p-1.5 text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--ink)] disabled:opacity-40"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </div>
        <div className="flex flex-wrap justify-end gap-2 bg-[var(--soft)]/40 px-5 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-10 rounded-full border border-[var(--line)] bg-white px-4 text-[12px] font-semibold uppercase tracking-wide text-[var(--ink)] transition hover:border-[var(--ink)]/30 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={cn(
              "h-10 rounded-full px-5 text-[12px] font-semibold uppercase tracking-wide transition disabled:opacity-50",
              tone === "danger"
                ? "border border-[#b42318] bg-[#b42318] text-white hover:bg-[#912018]"
                : "bg-[var(--orange)] text-[var(--ink)] hover:brightness-105"
            )}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
