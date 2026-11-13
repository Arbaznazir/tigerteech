"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shell } from "@/components/Shell";
import { cn } from "@/lib/cn";

const tabs = [
  {
    href: "/product-details/tags",
    label: "Tags",
    hint: "Shelf badges & PDP feature pills",
  },
  {
    href: "/product-details/fields",
    label: "Detail inputs",
    hint: "Reusable fields like Style, Fit, Neck",
  },
];

export default function ProductDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Shell>
      <div className="mb-5">
        <h2 className="text-3xl font-semibold tracking-tight">Product details</h2>
        <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
          Define the tags and attribute fields sellers pick when editing a
          product — they show on the storefront product page.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-2xl border px-4 py-3 transition",
                  active
                    ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                    : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--forest)]/30"
                )}
              >
                <p className="text-[13px] font-bold tracking-wide">{t.label}</p>
                <p
                  className={cn(
                    "mt-0.5 text-[11px]",
                    active ? "text-[var(--paper)]/70" : "text-[var(--muted)]"
                  )}
                >
                  {t.hint}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </Shell>
  );
}
