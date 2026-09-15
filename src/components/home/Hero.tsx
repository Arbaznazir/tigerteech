"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/cn";

type Slide =
  | {
      variant: "content";
      image: string;
      /** Desktop / tablet focal point */
      position: string;
      /** Mobile focal point — keep faces out of the copy zone */
      mobilePosition: string;
      eyebrow: string;
      lead: string;
      accent: string;
      trail: string;
      subtitle: string;
      script: string;
      scriptPos: string;
      cta: string;
      secondary: string;
    }
  | {
      variant: "plain";
      image: string;
      alt: string;
      script: string;
      scriptPos: string;
    };

const slides: Slide[] = [
  {
    variant: "content",
    image: "/images/banners/hero-1.png",
    position: "center 30%",
    // Push subject right so left copy sits on fire/atmosphere, not the face
    mobilePosition: "78% 28%",
    eyebrow: "Tigerteeh Clothing",
    lead: "WEAR YOUR",
    accent: "WILD",
    trail: "SIDE",
    subtitle: "Bold Outfits. Fierce Personality. Made for the Unstoppable You.",
    script: "More Than Clothing",
    scriptPos: "right-[5%] top-[13%]",
    cta: "Shop Now",
    secondary: "Watch Video",
  },
  {
    variant: "content",
    image: "/images/banners/hero-2.png",
    position: "center 38%",
    // Jungle slide — keep the model/animals in the right half
    mobilePosition: "82% 32%",
    eyebrow: "Signature Prints",
    lead: "KING OF THE",
    accent: "JUNGLE",
    trail: "",
    subtitle: "Tiger, parrot, leopard. Every print tells your story.",
    script: "Wild By Nature",
    scriptPos: "right-[4%] top-[38%]",
    cta: "Explore Collection",
    secondary: "See Lookbook",
  },
  {
    variant: "plain",
    image: "/images/banners/hero-3.png",
    alt: "Worldwide delivery in 10-12 days. Delivery in India within 7 days.",
    script: "Straight To Your Door",
    scriptPos: "right-[5%] top-[19%]",
  },
];

const stats = [
  { value: "10K+", label: "Happy Customers" },
  { value: "100%", label: "Premium Fabrics" },
  { value: "24/7", label: "Customer Support" },
];

const AUTOPLAY_MS = 6000;

export function Hero() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLight = slide.variant === "plain";
  const touchX = useRef<number | null>(null);

  const go = useCallback((dir: 1 | -1) => {
    setIndex((i) => (i + dir + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const t = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [go]);

  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 48) return;
    go(dx < 0 ? 1 : -1);
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden transition-colors duration-500",
        isLight ? "bg-[#ece4dc]" : "bg-[#0a1a14]"
      )}
    >
      {/*
        Mobile: no forced min-height — especially critical for the delivery banner
        so the full image (copy + model) stays in frame without letterboxing.
        Desktop: taller stage for lifestyle slides.
      */}
      <div
        className="relative aspect-[1584/672] w-full md:max-h-[680px]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {slide.variant === "plain" ? (
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-contain object-center"
              />
            ) : (
              <>
                {/* Mobile crop — subject pushed right so copy clears the face */}
                <Image
                  src={slide.image}
                  alt="Wear your wild side"
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover md:hidden"
                  style={{ objectPosition: slide.mobilePosition }}
                />
                {/* Desktop crop */}
                <Image
                  src={slide.image}
                  alt="Wear your wild side"
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="hidden object-cover md:block"
                  style={{ objectPosition: slide.position }}
                />
                {/* Mobile: lighter bottom veil — smaller type needs less cover */}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,12,8,0.12)_0%,rgba(2,12,8,0.08)_40%,rgba(2,12,8,0.45)_72%,rgba(2,12,8,0.78)_100%)] md:hidden" />
                {/* Desktop: left veil */}
                <div className="absolute inset-0 hidden bg-[linear-gradient(105deg,rgba(2,12,8,0.78)_0%,rgba(2,12,8,0.42)_48%,rgba(2,12,8,0.18)_100%)] md:block" />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Arrows — desktop */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => go(-1)}
          className={cn(
            "absolute left-3 top-[42%] z-20 hidden size-10 -translate-y-1/2 items-center justify-center transition md:left-5 md:flex lg:left-8",
            isLight
              ? "text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
              : "text-white/80 hover:text-white"
          )}
        >
          <ChevronLeft className="size-8" strokeWidth={1.25} />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => go(1)}
          className={cn(
            "absolute right-3 top-[42%] z-20 hidden size-10 -translate-y-1/2 items-center justify-center transition md:right-5 md:flex lg:right-8",
            isLight
              ? "text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
              : "text-white/80 hover:text-white"
          )}
        >
          <ChevronRight className="size-8" strokeWidth={1.25} />
        </button>

        {/* Content copy — bottom on mobile, left-middle on desktop */}
        {slide.variant === "content" && (
          <div className="relative z-10 mx-auto flex h-full max-w-[1400px] items-end px-4 pb-9 pt-4 md:items-center md:px-8 md:pb-12 lg:px-10">
            <motion.div
              key={`copy-${index}`}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="w-full min-w-0 max-w-[280px] text-white md:max-w-[400px]"
            >
              <p className="mb-1 text-[8px] font-bold uppercase tracking-[0.28em] text-[#f49331] md:mb-2.5 md:text-[11px]">
                {slide.eyebrow}
              </p>

              <h1 className="max-w-[200px] font-display text-[clamp(1.35rem,5.8vw,1.75rem)] leading-[0.92] tracking-[0.03em] text-white md:max-w-[340px] md:text-[clamp(2.25rem,4vw,3.4rem)]">
                {slide.lead}{" "}
                <span className="text-wild inline-block align-baseline text-[clamp(1.5rem,6.5vw,1.95rem)] md:text-[clamp(2.5rem,4.5vw,3.9rem)]">
                  {slide.accent}
                </span>
                {slide.trail ? ` ${slide.trail}` : ""}
              </h1>

              <p className="mt-2 hidden max-w-[280px] text-[12px] leading-relaxed text-white/90 sm:block md:mt-4 md:max-w-[300px] md:text-[13px]">
                {slide.subtitle}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-3 md:mt-6 md:gap-5">
                <Link
                  href="/shop"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#f49331] px-4 text-[10px] font-bold uppercase tracking-[0.06em] text-[#111] transition hover:bg-[#ff9f4a] md:h-[44px] md:gap-2 md:px-6 md:text-[13px]"
                >
                  {slide.cta}{" "}
                  <ArrowRight className="size-3 md:size-4" strokeWidth={2.5} />
                </Link>
                <Link
                  href="/about"
                  className="hidden items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-white sm:inline-flex"
                >
                  <span className="flex size-9 items-center justify-center rounded-full border border-white/70">
                    <Play className="size-3 fill-white" />
                  </span>
                  {slide.secondary}
                </Link>
              </div>

              <div className="mt-3 hidden max-w-[340px] grid-cols-3 items-stretch sm:grid md:mt-7">
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className={
                      i === 0
                        ? "pr-3 md:pr-4"
                        : "border-l border-white/25 pl-3 pr-2 md:pl-5 md:pr-3"
                    }
                  >
                    <p className="text-[16px] font-extrabold tracking-tight text-white md:text-[21px]">
                      {s.value}
                    </p>
                    <p className="mt-0.5 text-[9px] font-medium leading-snug text-white/75 md:text-[10px]">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Script accent — desktop only (avoids face collisions on mobile) */}
        <motion.p
          key={`script-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className={cn(
            "pointer-events-none absolute z-10 hidden w-[112px] -rotate-[8deg] text-center font-script text-[26px] leading-[1.05] md:block lg:w-[130px] lg:text-[30px]",
            slide.scriptPos,
            isLight
              ? "text-[#06231A]"
              : "text-[#f49331] drop-shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
          )}
        >
          {slide.script}
        </motion.p>

        {/* Dots */}
        <div
          className={cn(
            "absolute left-1/2 z-20 flex -translate-x-1/2 items-center gap-2",
            "bottom-3 md:bottom-8"
          )}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-[3px] rounded-full transition-all",
                i === index
                  ? "w-7 bg-[#f49331]"
                  : isLight
                    ? "w-3 bg-[#1a1a1a]/30"
                    : "w-3 bg-white/55"
              )}
            />
          ))}
        </div>
      </div>

      {/* White curve into categories */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] leading-[0]">
        <svg
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          className="h-[18px] w-full md:h-[28px] lg:h-[34px]"
          aria-hidden
        >
          <path d="M0,40 L0,22 Q720,-6 1440,22 L1440,40 Z" fill="#ffffff" />
        </svg>
      </div>
    </section>
  );
}
