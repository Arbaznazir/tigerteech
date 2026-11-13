"use client";

import { cn } from "@/lib/cn";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: Props) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const safePage = Math.min(Math.max(1, page), pageCount);
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-3",
        className
      )}
    >
      <p className="text-[12px] text-[var(--muted)]">
        Showing{" "}
        <span className="font-semibold text-[var(--ink)]">
          {from}–{to}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-[var(--ink)]">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="h-8 rounded-lg border border-[var(--line)] bg-white px-3 text-[12px] font-semibold text-[var(--ink)] transition hover:border-[var(--orange)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        <span className="min-w-16 text-center text-[12px] font-medium text-[var(--muted)]">
          {safePage} / {pageCount}
        </span>
        <button
          type="button"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
          className="h-8 rounded-lg border border-[var(--line)] bg-white px-3 text-[12px] font-semibold text-[var(--ink)] transition hover:border-[var(--orange)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (Math.max(1, page) - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
