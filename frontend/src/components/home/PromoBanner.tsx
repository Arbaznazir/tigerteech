"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ApiBanner } from "@/lib/catalog";
import { isRemoteImage, resolveBannerImage } from "@/lib/bannerAssets";

const DEFAULT_PROMO = {
  image: "/images/banners/promo.webp",
  title: "Limited Collection",
  eyebrow: "Limited Collection",
  lead: "BUILT FOR",
  accent: "THE BOLD",
  subtitle: "Step into a collection that stands out.",
  cta: "Explore Collection",
  href: "/shop",
  align: "left" as const,
  words: ["FASHION", "COURAGE", "FREEDOM", "YOU"],
};

type Props = {
  banner?: ApiBanner | null;
};

export function PromoBanner({ banner = null }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const copy = (banner?.copy || {}) as Record<string, unknown>;
  const image = resolveBannerImage(
    banner?.imageDesktopUrl || banner?.imageMobileUrl,
    DEFAULT_PROMO.image
  );
  const eyebrow = String(copy.eyebrow || DEFAULT_PROMO.eyebrow);
  const lead = String(copy.lead || DEFAULT_PROMO.lead);
  const accent = String(copy.accent || DEFAULT_PROMO.accent);
  const subtitle = String(
    copy.subtitle || banner?.subtitle || DEFAULT_PROMO.subtitle
  );
  const cta = banner?.ctaLabel || String(copy.cta || DEFAULT_PROMO.cta);
  const href = banner?.ctaHref || DEFAULT_PROMO.href;
  const align =
    copy.align === "center" || copy.align === "right" || copy.align === "left"
      ? copy.align
      : DEFAULT_PROMO.align;
  const words = Array.isArray(copy.words)
    ? (copy.words as string[]).filter(Boolean)
    : DEFAULT_PROMO.words;
  const objectPosition =
    banner?.objectPositionDesktop || banner?.objectPositionMobile || "center top";

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="relative min-h-[360px] md:min-h-[460px]">
        <Image
          src={image}
          alt={banner?.title || DEFAULT_PROMO.title}
          fill
          className="object-cover"
          style={{ objectPosition }}
          sizes="100vw"
          unoptimized={isRemoteImage(image)}
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,20,14,0.78)_0%,rgba(4,20,14,0.4)_50%,rgba(4,20,14,0.25)_100%)]" />
        <div
          className={cn(
            "container-site relative z-[1] flex min-h-[360px] items-center py-14 md:min-h-[460px]",
            align === "center" && "justify-center text-center",
            align === "right" && "justify-end text-right",
            align === "left" && "justify-start text-left"
          )}
        >
          <motion.div
            initial={{ opacity: 0, x: align === "right" ? 24 : -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-orange">
              {eyebrow}
            </p>
            <h2 className="font-display text-4xl leading-[0.92] tracking-wide text-white md:text-6xl lg:text-[4.25rem]">
              {lead}{" "}
              <span className="text-wild text-[clamp(2.8rem,7vw,5.5rem)]">
                {accent}
              </span>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/85">
              {subtitle}
            </p>
            <Link
              href={href}
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-paper px-7 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-soft"
            >
              {cta} <ArrowRight className="size-4" />
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
