"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const words = ["FASHION", "COURAGE", "FREEDOM", "YOU"];

export function PromoBanner() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="relative min-h-[360px] md:min-h-[460px]">
        <Image
          src="/images/banners/promo.webp"
          alt="Limited collection"
          fill
          className="object-cover object-[center_top]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,20,14,0.78)_0%,rgba(4,20,14,0.4)_50%,rgba(4,20,14,0.25)_100%)]" />
        <div className="container-site relative z-[1] flex min-h-[360px] items-center py-14 md:min-h-[460px]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
              Limited Collection
            </p>
            <h2 className="font-display text-4xl leading-[0.92] tracking-wide text-white md:text-6xl lg:text-[4.25rem]">
              BUILT FOR{" "}
              <span className="text-wild text-[clamp(2.8rem,7vw,5.5rem)]">
                THE BOLD
              </span>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/85">
              Step into a collection that stands out.
            </p>
            <Link
              href="/shop"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-paper px-7 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-soft"
            >
              Explore Collection <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        </div>
        <div className="absolute right-5 top-1/2 z-[1] hidden -translate-y-1/2 flex-col items-center gap-5 lg:flex lg:right-10">
          {words.map((w) => (
            <span
              key={w}
              className="font-display text-xs tracking-[0.35em] text-white/75 [writing-mode:vertical-rl]"
            >
              {w}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
