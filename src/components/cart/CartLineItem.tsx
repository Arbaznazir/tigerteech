"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartLine } from "@/lib/cart";

type Props = {
  item: CartLine;
  formatPrice: (amountUsd: number) => string;
  onUpdateQuantity: (
    productId: string,
    size: string,
    color: string,
    quantity: number
  ) => void;
  onRemove: (productId: string, size: string, color: string) => void;
  index?: number;
};

export function CartLineItem({
  item,
  formatPrice,
  onUpdateQuantity,
  onRemove,
  index = 0,
}: Props) {
  const lineTotal = item.product.priceMin * item.quantity;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3) }}
      className="group relative overflow-hidden rounded-[1.5rem] border border-line/80 bg-white shadow-[0_1px_0_rgba(6,35,26,0.04)] transition duration-500 hover:-translate-y-0.5 hover:border-forest/20 hover:shadow-[0_18px_40px_rgba(6,35,26,0.1)]"
    >
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <Link
          href={`/product/${item.product.slug}`}
          className="relative aspect-[4/5] overflow-hidden bg-[#ece8e2] md:aspect-auto md:min-h-[240px]"
        >
          <Image
            src={item.product.image}
            alt={item.product.name}
            fill
            className="object-cover transition duration-700 group-hover:scale-[1.05]"
            sizes="(max-width: 768px) 100vw, 220px"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(6,35,26,0.28)_100%)] opacity-70" />
          {item.product.badge && (
            <span className="absolute left-3 top-3 rounded-md bg-orange px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white shadow-md">
              {item.product.badge}
            </span>
          )}
        </Link>

        <div className="flex min-w-0 flex-col justify-between p-5 md:p-6 lg:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link
                href={`/product/${item.product.slug}`}
                className="font-display text-[1.75rem] leading-[0.95] tracking-[0.04em] text-ink transition hover:text-orange md:text-[2.1rem]"
              >
                {item.product.name}
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 items-center rounded-full border border-forest/15 bg-soft px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-forest">
                  Size {item.size}
                </span>
                <span className="text-sm text-muted">
                  {formatPrice(item.product.priceMin)} each
                </span>
              </div>
            </div>

            <button
              type="button"
              aria-label={`Remove ${item.product.name}`}
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-muted transition hover:border-[#b42318]/30 hover:bg-[#b42318]/5 hover:text-[#b42318]"
              onClick={() => onRemove(item.productId, item.size, item.color)}
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Quantity
              </p>
              <div
                className="inline-flex items-center overflow-hidden rounded-full border border-forest/20 bg-soft"
                role="group"
                aria-label="Quantity"
              >
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  className="flex size-11 items-center justify-center text-forest transition hover:bg-forest hover:text-white"
                  onClick={() =>
                    onUpdateQuantity(
                      item.productId,
                      item.size,
                      item.color,
                      item.quantity - 1
                    )
                  }
                >
                  <Minus className="size-3.5" strokeWidth={2.25} />
                </button>
                <span className="min-w-12 text-center text-sm font-bold tabular-nums text-ink">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  className="flex size-11 items-center justify-center text-forest transition hover:bg-forest hover:text-white"
                  onClick={() =>
                    onUpdateQuantity(
                      item.productId,
                      item.size,
                      item.color,
                      item.quantity + 1
                    )
                  }
                >
                  <Plus className="size-3.5" strokeWidth={2.25} />
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Line total
              </p>
              <p className="font-display text-[2rem] leading-none tracking-wide text-forest md:text-[2.35rem]">
                {formatPrice(lineTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  );
}
