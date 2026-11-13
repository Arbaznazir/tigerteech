"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { lineUnitPrice, type CartLine } from "@/lib/cart";
import { isRemoteMedia, resolveMediaUrl } from "@/lib/media";

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
  const unit = lineUnitPrice(item);
  const lineTotal = unit * item.quantity;
  const rawImage =
    item.productImage ||
    item.product.image ||
    item.product.images?.[0] ||
    "";
  const imageSrc = resolveMediaUrl(rawImage);
  // Cart `size` holds the material/variant name (legacy lines may be "Silk / L").
  const variantLabel = (item.size || "")
    .split(/\s*\/\s*/)[0]
    .trim();
  const showVariant =
    Boolean(variantLabel) &&
    variantLabel !== "Standard" &&
    variantLabel !== "OS" &&
    variantLabel !== "M" &&
    variantLabel !== "L" &&
    variantLabel !== "XL" &&
    variantLabel !== "S";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
      className="group relative overflow-hidden rounded-2xl border border-line/80 bg-paper p-3 shadow-[0_1px_0_rgba(22,20,18,0.04)] md:p-4"
    >
      <div className="flex items-stretch gap-3 md:gap-4">
        {/* Square thumb — left */}
        <Link
          href={`/product/${item.product.slug}`}
          className="relative size-[96px] shrink-0 overflow-hidden rounded-xl bg-soft sm:size-[112px] md:size-[128px]"
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={item.product.name}
              fill
              className="object-cover object-top transition duration-500 group-hover:scale-[1.04]"
              sizes="128px"
              unoptimized={isRemoteMedia(imageSrc)}
            />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(145deg,#f0ebe4_0%,#e5e0d8_55%,#d9d2c8_100%)]"
            />
          )}
        </Link>

        {/* Details — right stack */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/product/${item.product.slug}`}
              className="line-clamp-2 font-display text-[1.05rem] leading-tight tracking-[0.02em] text-ink transition hover:text-orange md:text-[1.25rem]"
            >
              {item.product.name}
              {showVariant ? (
                <span className="font-medium text-muted">
                  {" "}
                  ({variantLabel})
                </span>
              ) : null}
            </Link>
            <p className="mt-1 text-[12px] font-semibold tabular-nums text-ink md:text-[13px]">
              {formatPrice(unit)}
              <span className="font-medium text-muted"> each</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex h-9 items-center overflow-hidden rounded-full border border-line bg-soft"
              role="group"
              aria-label="Quantity"
            >
              <button
                type="button"
                aria-label="Decrease quantity"
                className="flex size-9 items-center justify-center text-ink transition hover:bg-forest hover:text-white"
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
              <span className="min-w-8 text-center text-sm font-bold tabular-nums text-ink">
                {item.quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="flex size-9 items-center justify-center text-ink transition hover:bg-forest hover:text-white"
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

            <button
              type="button"
              aria-label={`Remove ${item.product.name}`}
              className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-[#b42318]/35 hover:bg-[#b42318]/5 hover:text-[#b42318]"
              onClick={() => onRemove(item.productId, item.size, item.color)}
            >
              <Trash2 className="size-3.5" strokeWidth={1.75} />
            </button>

            <p className="ml-auto text-[13px] font-extrabold tabular-nums text-ink md:text-[15px]">
              {formatPrice(lineTotal)}
            </p>
          </div>
        </div>
      </div>
    </motion.li>
  );
}
