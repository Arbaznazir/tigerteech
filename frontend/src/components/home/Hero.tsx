"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/cn";

type Slide = {
  desktop: string;
  mobile: string;
  position: string;
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
  /** Lighter left overlay — studio slide has open negative space for type */
  lightVeil?: boolean;
  /** Desktop copy side — slide 3 keeps the tiger clear on the left */
  align?: "left" | "right";
};

const slides: Slide[] = [
  {
    desktop: "/images/banners/hero_desktop_1.webp",
    mobile: "/images/banners/hero_mobile_1.webp",
    position: "right center",
    mobilePosition: "center 35%",
    eyebrow: "Tigerteeh Clothing",
    lead: "WEAR YOUR",
    accent: "WILD",
    trail: "SIDE",
    subtitle: "Bold Outfits. Fierce Personality. Made for the Unstoppable You.",
    script: "More Than Clothing",
    scriptPos: "right-[5%] top-[13%]",
    cta: "Shop Now",
    secondary: "Watch Video",
    lightVeil: true,
  },
  {
    desktop: "/images/banners/hero_desktop_2.webp",
    mobile: "/images/banners/hero_mobile_2.webp",
    position: "center 40%",
    mobilePosition: "center 28%",
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
    desktop: "/images/banners/hero_desktop_3.webp",
    mobile: "/images/banners/hero_mobile_3.webp",
    position: "center 45%",
    mobilePosition: "center 32%",
    eyebrow: "Worldwide Delivery",
    lead: "STRAIGHT TO",
    accent: "YOUR",
    trail: "DOOR",
    subtitle: "Worldwide in 10–12 days. India within 7 days.",
    script: "Fast & Fierce",
    scriptPos: "left-[5%] top-[16%]",
    cta: "Shop Now",
    secondary: "Track Order",
    align: "right",
  },
];

const stats = [
  { value: "10K+", label: "Happy Customers" },
  { value: "100%", label: "Premium Fabrics" },
  { value: "24/7", label: "Customer Support" },
];

const AUTOPLAY_MS = 8000;
const easeOut = [0.16, 1, 0.3, 1] as const;
const slideEase = [0.22, 1, 0.36, 1] as const;

const mediaVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir === 0 ? 0 : dir > 0 ? "14%" : "-14%",
    scale: 1.06,
  }),
  center: {
    opacity: 1,
    x: "0%",
    scale: 1,
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir === 0 ? 0 : dir > 0 ? "-10%" : "10%",
    scale: 1.02,
  }),
};

function SplitText({
  text,
  className,
  delay = 0,
  by = "chars",
  animKey,
}: {
  text: string;
  className?: string;
  delay?: number;
  by?: "chars" | "words";
  /** Remount key so CSS animation always restarts */
  animKey: string | number;
}) {
  const parts = by === "words" ? text.split(" ") : Array.from(text);
  const step = by === "words" ? 0.09 : 0.045;

  return (
    <span className={cn("inline", className)} aria-label={text}>
      {parts.map((part, i) => (
        <span
          key={`${animKey}-${part}-${i}`}
          className="inline-block overflow-hidden align-bottom pb-[0.12em]"
        >
          <span
            aria-hidden
            className={by === "words" ? "hero-word" : "hero-char"}
            style={{ animationDelay: `${delay + i * step}s` }}
          >
            {part === " " ? "\u00A0" : part}
            {by === "words" && i < parts.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  const [[index, direction], setPage] = useState([0, 0]);
  const [hint, setHint] = useState(true);
  const slide = slides[index];
  const touchX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion() === true;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", reduceMotion ? "0%" : "22%"]
  );
  const imageScale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, reduceMotion ? 1 : 1.08]
  );
  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", reduceMotion ? "0%" : "14%"]
  );
  const curveOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.4]);

  const go = useCallback((dir: 1 | -1) => {
    setPage(([i]) => [(i + dir + slides.length) % slides.length, dir]);
    setHint(false);
  }, []);

  const jumpTo = useCallback((next: number) => {
    setPage(([i]) => {
      if (next === i) return [i, 0];
      const forward = (next - i + slides.length) % slides.length;
      const backward = (i - next + slides.length) % slides.length;
      return [next, forward <= backward ? 1 : -1];
    });
    setHint(false);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const t = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [go, reduceMotion, index]);

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 4200);
    return () => clearTimeout(t);
  }, []);

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
      ref={sectionRef}
      className="relative overflow-hidden bg-forest-deep transition-colors duration-700"
    >
      <div
        className={cn(
          "relative w-full",
          /* Phone: nearly full screen cinematic stage */
          "min-h-[min(92svh,820px)]",
          /* Desktop: wide lifestyle banner */
          "md:min-h-0 md:aspect-[1584/672] md:max-h-[720px]"
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Scroll parallax lives outside slide enter/exit so scales don't fight */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{ y: imageY, scale: imageScale }}
        >
          <AnimatePresence initial={false} custom={direction} mode="sync">
            <motion.div
              key={index}
              custom={direction}
              variants={mediaVariants}
              initial={reduceMotion ? { opacity: 0 } : "enter"}
              animate="center"
              exit={reduceMotion ? { opacity: 0 } : "exit"}
              transition={{
                opacity: { duration: 0.85, ease: slideEase },
                x: { duration: 0.95, ease: slideEase },
                scale: { duration: 1.05, ease: slideEase },
              }}
              className="absolute inset-0 will-change-transform"
            >
              {/* Ken Burns — starts after settle so slide change doesn't jump */}
              <motion.div
                className="absolute inset-0 origin-center md:hidden"
                initial={{ scale: 1 }}
                animate={{ scale: reduceMotion ? 1 : 1.1 }}
                transition={{
                  duration: AUTOPLAY_MS / 1000,
                  ease: "linear",
                  delay: 0.35,
                }}
              >
                <Image
                  src={slide.mobile}
                  alt={`${slide.lead} ${slide.accent} ${slide.trail}`.trim()}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 767px) 100vw, 1px"
                  className="object-cover"
                  style={{ objectPosition: slide.mobilePosition }}
                />
              </motion.div>

              <motion.div
                className="absolute inset-0 origin-center hidden md:block"
                initial={{ scale: 1 }}
                animate={{ scale: reduceMotion ? 1 : 1.06 }}
                transition={{
                  duration: AUTOPLAY_MS / 1000,
                  ease: "linear",
                  delay: 0.35,
                }}
              >
                <Image
                  src={slide.desktop}
                  alt={`${slide.lead} ${slide.accent} ${slide.trail}`.trim()}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 767px) 1px, 100vw"
                  className="object-cover"
                  style={{ objectPosition: slide.position }}
                />
              </motion.div>

              {/* Mobile atmosphere veil */}
              <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_20%,transparent_0%,rgba(10,9,8,0.15)_45%,rgba(10,9,8,0.55)_78%,rgba(10,9,8,0.92)_100%),linear-gradient(180deg,rgba(10,9,8,0.35)_0%,transparent_22%,transparent_48%,rgba(10,9,8,0.78)_100%)] md:hidden" />
              {/* Desktop veil */}
              <div
                className={cn(
                  "absolute inset-0 hidden md:block",
                  slide.lightVeil
                    ? "bg-[linear-gradient(105deg,rgba(250,249,247,0.55)_0%,rgba(250,249,247,0.18)_38%,transparent_68%)]"
                    : slide.align === "right"
                      ? "bg-[linear-gradient(255deg,rgba(10,9,8,0.82)_0%,rgba(10,9,8,0.48)_42%,rgba(10,9,8,0.12)_72%,rgba(10,9,8,0.28)_100%)]"
                      : "bg-[linear-gradient(105deg,rgba(10,9,8,0.82)_0%,rgba(10,9,8,0.48)_42%,rgba(10,9,8,0.12)_72%,rgba(10,9,8,0.35)_100%)]"
                )}
              />
              {!slide.lightVeil && (
                <div className="pointer-events-none absolute inset-0 hidden shadow-[inset_0_0_120px_rgba(10,9,8,0.45)] md:block" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Ambient orange wash for depth */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_20%_80%,rgba(243,129,32,0.14),transparent_50%)] mix-blend-screen md:bg-[radial-gradient(ellipse_at_18%_70%,rgba(243,129,32,0.12),transparent_45%)]" />

        {/* Slide index — desktop */}
        <motion.div
          key={`idx-${index}`}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn(
            "absolute left-6 top-6 z-20 hidden items-center gap-2 font-display text-[13px] tracking-[0.2em] md:left-8 md:flex lg:left-10",
            slide.lightVeil ? "text-ink/55" : "text-white/55"
          )}
        >
          <span className="text-orange">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="h-px w-6 bg-current opacity-40" />
          <span>{String(slides.length).padStart(2, "0")}</span>
        </motion.div>

        {/* Desktop arrows */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => go(-1)}
          className={cn(
            "absolute left-3 top-1/2 z-20 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 backdrop-blur-md transition hover:scale-105 hover:bg-black/45 md:left-5 md:flex lg:left-8",
            slide.lightVeil && "border-ink/10 bg-white/50 text-ink hover:bg-white/80"
          )}
        >
          <ChevronLeft
            className={cn("size-7", slide.lightVeil ? "text-ink" : "text-white")}
            strokeWidth={1.25}
          />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => go(1)}
          className={cn(
            "absolute right-3 top-1/2 z-20 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 backdrop-blur-md transition hover:scale-105 hover:bg-black/45 md:right-5 md:flex lg:right-8",
            slide.lightVeil && "border-ink/10 bg-white/50 text-ink hover:bg-white/80"
          )}
        >
          <ChevronRight
            className={cn("size-7", slide.lightVeil ? "text-ink" : "text-white")}
            strokeWidth={1.25}
          />
        </button>

        {/* Content — scroll parallax on wrapper; text entrance lives inside AnimatePresence */}
        <motion.div
          style={{ y: contentY }}
          className={cn(
            "relative z-10 mx-auto flex h-full max-w-[1400px] items-end px-5 pb-[4.5rem] pt-8 sm:px-6 md:items-center md:px-8 md:pb-14 lg:px-10",
            slide.align === "right" && "md:justify-end"
          )}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`copy-${index}`}
              custom={direction}
              initial={
                reduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 22,
                      x: direction > 0 ? 18 : direction < 0 ? -18 : 0,
                    }
              }
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={
                reduceMotion
                  ? undefined
                  : {
                      opacity: 0,
                      y: -14,
                      x: direction > 0 ? -12 : direction < 0 ? 12 : 0,
                      filter: "blur(4px)",
                    }
              }
              transition={{ duration: 0.45, ease: slideEase }}
              className={cn(
                "relative w-full min-w-0 max-w-[380px] text-white md:max-w-[480px]",
                slide.lightVeil && "md:text-ink",
                slide.align === "right" && "md:ml-auto md:text-right"
              )}
            >
              {/* Soft dark shade under copy for readability */}
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -inset-x-6 -inset-y-4 z-0 rounded-[2rem] md:-inset-x-10 md:-inset-y-6",
                  slide.lightVeil
                    ? "bg-[radial-gradient(ellipse_at_center,rgba(250,249,247,0.72)_0%,rgba(250,249,247,0.35)_55%,transparent_75%)] max-md:bg-[radial-gradient(ellipse_at_center,rgba(10,9,8,0.62)_0%,rgba(10,9,8,0.28)_55%,transparent_78%)]"
                    : "bg-[radial-gradient(ellipse_at_center,rgba(10,9,8,0.72)_0%,rgba(10,9,8,0.38)_52%,transparent_78%)]"
                )}
              />
              <div className="relative z-[1]">
              <div
                className={cn(
                  "mb-3.5 flex items-center gap-3 md:mb-4",
                  slide.align === "right" && "md:justify-end"
                )}
              >
                <span
                  className={cn(
                    "hero-line-anim h-[2px] w-9 rounded-full bg-orange",
                    slide.align === "right" && "is-right md:order-2"
                  )}
                  style={{ animationDelay: "0.05s" }}
                />
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange md:text-[12px]">
                  {reduceMotion ? (
                    slide.eyebrow
                  ) : (
                    <SplitText
                      text={slide.eyebrow}
                      delay={0.15}
                      by="chars"
                      animKey={index}
                    />
                  )}
                </p>
              </div>

              <h1
                className={cn(
                  "max-w-[14ch] font-display text-[clamp(2.85rem,12vw,3.5rem)] leading-[0.92] tracking-[0.01em] text-white md:max-w-[420px] md:text-[clamp(3rem,4.6vw,4rem)]",
                  slide.lightVeil && "md:text-ink",
                  slide.align === "right" && "md:ml-auto"
                )}
              >
                <span className="block">
                  {reduceMotion ? (
                    slide.lead
                  ) : (
                    <SplitText
                      text={slide.lead}
                      delay={0.28}
                      by="chars"
                      animKey={index}
                    />
                  )}
                </span>
                <span className="mt-1 block">
                  <span
                    className="hero-accent-anim text-wild align-baseline text-[clamp(3.1rem,13vw,3.9rem)] md:text-[clamp(3.4rem,5.2vw,4.6rem)]"
                    style={{ animationDelay: "0.62s" }}
                  >
                    {slide.accent}
                  </span>
                  {slide.trail ? (
                    <>
                      {" "}
                      {reduceMotion ? (
                        slide.trail
                      ) : (
                        <SplitText
                          text={slide.trail}
                          delay={0.85}
                          by="chars"
                          animKey={index}
                        />
                      )}
                    </>
                  ) : null}
                </span>
              </h1>

              <p
                className={cn(
                  "mt-4 max-w-[34ch] text-[14px] font-medium leading-[1.55] tracking-[-0.01em] text-white/88 md:mt-5 md:max-w-[340px] md:text-[15px]",
                  slide.lightVeil && "md:text-ink/70",
                  slide.align === "right" && "md:ml-auto"
                )}
              >
                {reduceMotion ? (
                  slide.subtitle
                ) : (
                  <SplitText
                    text={slide.subtitle}
                    delay={0.95}
                    by="words"
                    animKey={index}
                  />
                )}
              </p>

              <div
                className={cn(
                  "mt-6 flex flex-wrap items-center gap-3.5 md:mt-7 md:gap-5",
                  slide.align === "right" && "md:justify-end"
                )}
              >
                <div
                  className="hero-fade-anim"
                  style={{ animationDelay: "1.2s" }}
                >
                  <Link
                    href="/shop"
                    className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full bg-orange px-7 text-[12px] font-bold uppercase tracking-[0.12em] text-ink shadow-[0_14px_36px_rgba(243,129,32,0.45)] transition hover:bg-orange-hot active:scale-[0.97] md:h-[48px] md:px-8 md:text-[13px]"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition duration-700 group-hover:translate-x-full" />
                    <span className="relative">{slide.cta}</span>
                    <ArrowRight
                      className="relative size-3.5 transition group-hover:translate-x-0.5 md:size-4"
                      strokeWidth={2.5}
                    />
                  </Link>
                </div>
                <div
                  className="hero-fade-anim"
                  style={{ animationDelay: "1.35s" }}
                >
                  <Link
                    href="/about"
                    className={cn(
                      "inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/95 md:gap-3 md:text-[13px]",
                      slide.lightVeil && "md:text-ink/90"
                    )}
                  >
                    <span
                      className={cn(
                        "relative flex size-10 items-center justify-center rounded-full border border-white/55 bg-white/8 backdrop-blur-sm",
                        slide.lightVeil && "md:border-ink/25 md:bg-white/60"
                      )}
                    >
                      <span className="absolute inset-0 animate-ping rounded-full border border-white/30 opacity-40 [animation-duration:2.4s]" />
                      <Play
                        className={cn(
                          "relative size-3 fill-white",
                          slide.lightVeil && "md:fill-ink"
                        )}
                      />
                    </span>
                    {slide.secondary}
                  </Link>
                </div>
              </div>

              <div
                className={cn(
                  "mt-7 grid max-w-[360px] grid-cols-3 items-stretch border-t border-white/25 pt-4 md:mt-8 md:max-w-[400px] md:border-white/20",
                  slide.lightVeil && "md:border-ink/15",
                  slide.align === "right" && "md:ml-auto"
                )}
              >
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className={cn(
                      "hero-fade-anim",
                      i === 0
                        ? "pr-3 md:pr-5"
                        : "border-l border-white/25 pl-3 pr-1 md:pl-5 md:pr-3",
                      slide.lightVeil && i > 0 && "md:border-ink/15"
                    )}
                    style={{ animationDelay: `${1.45 + i * 0.12}s` }}
                  >
                    <p
                      className={cn(
                        "font-display text-[22px] tracking-[0.04em] text-white md:text-[28px]",
                        slide.lightVeil && "md:text-ink"
                      )}
                    >
                      {s.value}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[9px] font-medium leading-snug tracking-[0.02em] text-white/65 md:text-[10px]",
                        slide.lightVeil && "md:text-ink/55"
                      )}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Script accent */}
        <motion.p
          key={`script-${index}`}
          initial={{ opacity: 0, rotate: -14, y: 18, scale: 0.92 }}
          animate={
            reduceMotion
              ? { opacity: 1, rotate: -8, y: 0, scale: 1 }
              : {
                  opacity: 1,
                  rotate: -8,
                  y: [0, -6, 0],
                  scale: 1,
                }
          }
          transition={{
            opacity: { duration: 0.7, delay: 0.4, ease: easeOut },
            rotate: { duration: 0.7, delay: 0.4, ease: easeOut },
            scale: { duration: 0.7, delay: 0.4, ease: easeOut },
            y: {
              duration: 4.5,
              delay: 1.1,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className={cn(
            "pointer-events-none absolute z-10 hidden w-[120px] text-center font-script text-[28px] leading-[1.05] md:block lg:w-[140px] lg:text-[32px]",
            slide.scriptPos,
            "text-orange drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
          )}
        >
          {slide.script}
        </motion.p>

        {/* Mobile swipe hint */}
        <AnimatePresence>
          {hint && !reduceMotion && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute bottom-14 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur-md md:hidden"
            >
              <motion.span
                animate={{ x: [-3, 3, -3] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                ←
              </motion.span>
              Swipe
              <motion.span
                animate={{ x: [3, -3, 3] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                →
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicators */}
        <div
          className={cn(
            "absolute left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5",
            "bottom-5 md:bottom-9"
          )}
        >
          {slides.map((_, i) => {
            const active = i === index;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => jumpTo(i)}
                className="group relative h-[3px] overflow-hidden rounded-full"
              >
                <span
                  className={cn(
                    "block h-full rounded-full transition-all duration-300",
                    active
                      ? "w-11 bg-white/20 md:w-14"
                      : slide.lightVeil
                        ? "w-3.5 bg-ink/25 group-hover:bg-ink/40"
                        : "w-3.5 bg-white/35 group-hover:bg-white/55"
                  )}
                />
                {active && !reduceMotion && (
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-orange shadow-[0_0_12px_rgba(243,129,32,0.8)]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: AUTOPLAY_MS / 1000,
                      ease: "linear",
                    }}
                  />
                )}
                {active && reduceMotion && (
                  <span className="absolute inset-y-0 left-0 w-full rounded-full bg-orange" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Curve into categories */}
      <motion.div
        style={{ opacity: curveOpacity }}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] leading-[0]"
      >
        <svg
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          className="h-[22px] w-full md:h-[30px] lg:h-[36px]"
          aria-hidden
        >
          <path d="M0,40 L0,22 Q720,-6 1440,22 L1440,40 Z" fill="#FAF9F7" />
        </svg>
      </motion.div>
    </section>
  );
}
