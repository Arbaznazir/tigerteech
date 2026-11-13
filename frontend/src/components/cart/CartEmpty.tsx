"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CartEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden bg-soft"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-8 font-display text-[clamp(8rem,28vw,16rem)] leading-none text-forest/[0.06]"
      >
        BAG
      </div>
      <div className="container-site relative flex min-h-[58vh] flex-col items-center justify-center py-20 text-center md:py-28">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-forest/15 bg-paper text-forest">
          <ShoppingBag className="size-6" strokeWidth={1.5} />
        </div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.32em] text-orange">
          Your bag
        </p>
        <h1 className="font-display text-5xl leading-none tracking-wide text-forest md:text-7xl">
          CURRENTLY{" "}
          <span className="text-wild text-[clamp(2.75rem,8vw,4.5rem)]">EMPTY</span>
        </h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
          Nothing in the bag yet. Find something built for the bold and fill it
          up.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/shop" size="lg">
            Shop the drop
          </Button>
          <Link
            href="/account/orders"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-paper px-5 text-sm font-semibold uppercase tracking-wide text-forest transition hover:border-orange/50 hover:text-orange"
          >
            My orders
          </Link>
          <Link
            href="/shop/new-arrivals"
            className="inline-flex h-12 items-center gap-2 px-4 text-sm font-semibold uppercase tracking-wide text-forest transition hover:text-orange"
          >
            New arrivals <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
