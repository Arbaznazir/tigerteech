"use client";

import { cn } from "@/lib/cn";

export type BannerDraft = {
  slotKey: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageDesktopUrl: string;
  imageMobileUrl: string;
  objectPositionDesktop: string;
  objectPositionMobile: string;
  copy: {
    eyebrow: string;
    lead: string;
    accent: string;
    trail: string;
    subtitle: string;
    script: string;
    scriptPos: string;
    secondary: string;
    align: "left" | "right" | "center";
    lightVeil: boolean;
    words: string;
  };
};

type Props = {
  draft: BannerDraft;
  mode: "web" | "phone";
};

export function BannerPreview({ draft, mode }: Props) {
  const isPromo = draft.slotKey === "promo_mid";
  const img =
    mode === "web"
      ? draft.imageDesktopUrl || draft.imageMobileUrl
      : draft.imageMobileUrl || draft.imageDesktopUrl;
  const objectPosition =
    mode === "web" ? draft.objectPositionDesktop : draft.objectPositionMobile;
  const c = draft.copy;
  const words = (c.words || "FASHION,COURAGE,FREEDOM,YOU")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);

  if (isPromo) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-[var(--forest-deep)] text-white shadow-xl",
          mode === "web"
            ? "aspect-[3/1] w-full rounded-2xl"
            : "aspect-[16/9] w-full max-w-[320px] rounded-[1.5rem] border-[5px] border-black"
        )}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition }}
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--forest)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,20,14,0.78)_0%,rgba(4,20,14,0.4)_50%,rgba(4,20,14,0.25)_100%)]" />
        <div
          className={cn(
            "relative z-[1] flex h-full flex-col justify-center px-5 py-6 md:px-8",
            c.align === "center" && "items-center text-center",
            c.align === "right" && "items-end text-right",
            c.align === "left" && "items-start text-left"
          )}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[var(--orange)]">
            {c.eyebrow || "Limited Collection"}
          </p>
          <h3
            className="mt-2 text-[clamp(1.6rem,4vw,2.6rem)] leading-[0.92] tracking-wide uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {c.lead || "BUILT FOR"}{" "}
            <span
              className="inline-block text-[clamp(1.8rem,5vw,2.8rem)] normal-case text-[var(--orange)]"
              style={{ fontFamily: "var(--font-brush)" }}
            >
              {c.accent || "THE BOLD"}
            </span>
          </h3>
          <p className="mt-3 max-w-sm text-xs text-white/85">
            {c.subtitle || draft.subtitle || "Step into a collection that stands out."}
          </p>
          <span className="mt-4 inline-flex h-9 items-center rounded-full bg-[var(--paper)] px-4 text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]">
            {draft.ctaLabel || "Explore Collection"} →
          </span>
        </div>
        {mode === "web" && words.length > 0 && (
          <div className="absolute right-3 top-1/2 z-[1] hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex">
            {words.map((w) => (
              <span
                key={w}
                className="text-[8px] font-bold tracking-[0.28em] text-white/75 [writing-mode:vertical-rl]"
              >
                {w}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Hero preview
  const alignRight = c.align === "right";
  const light = c.lightVeil && mode === "web";

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[var(--forest-deep)] shadow-xl",
        mode === "web"
          ? "aspect-[21/9] w-full rounded-2xl"
          : "aspect-[9/16] w-[240px] rounded-[2rem] border-[6px] border-black"
      )}
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition }}
        />
      ) : (
        <div className="absolute inset-0 bg-[var(--forest)]" />
      )}
      <div
        className={cn(
          "absolute inset-0",
          light
            ? "bg-gradient-to-r from-white/55 via-white/15 to-transparent"
            : alignRight
              ? "bg-gradient-to-l from-black/70 via-black/25 to-transparent"
              : "bg-gradient-to-r from-black/70 via-black/30 to-transparent"
        )}
      />
      <div
        className={cn(
          "relative z-[1] flex h-full flex-col justify-end p-5 md:justify-center md:p-8",
          alignRight ? "items-end text-right md:pr-10" : "items-start text-left md:pl-10",
          light ? "text-[var(--ink)]" : "text-white"
        )}
      >
        <p
          className={cn(
            "text-[9px] font-bold uppercase tracking-[0.28em]",
            light ? "text-[var(--orange)]" : "text-[var(--orange)]"
          )}
        >
          {c.eyebrow || draft.title || "Tigerteeh"}
        </p>
        <div className="mt-2 max-w-[16ch]">
          <p
            className="text-[clamp(1.7rem,3.5vw,2.8rem)] leading-[0.92] tracking-wide uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {c.lead || "WEAR YOUR"}{" "}
            <span
              className="inline-block text-[clamp(1.9rem,4vw,3rem)] normal-case text-[var(--orange)]"
              style={{ fontFamily: "var(--font-brush)" }}
            >
              {c.accent || "WILD"}
            </span>{" "}
            {c.trail}
          </p>
        </div>
        <p
          className={cn(
            "mt-3 max-w-[32ch] text-[11px] leading-relaxed",
            light ? "text-[var(--ink)]/70" : "text-white/85"
          )}
        >
          {c.subtitle || draft.subtitle || "Supporting line"}
        </p>
        <span className="mt-4 inline-flex h-9 items-center rounded-full bg-[var(--orange)] px-4 text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]">
          {draft.ctaLabel || "Shop Now"}
        </span>
      </div>
      {c.script ? (
          <span
          className={cn(
            "pointer-events-none absolute z-[2] hidden text-center text-[22px] leading-tight md:block",
            light ? "text-[var(--ink)]/70" : "text-white/80",
            c.scriptPos || "right-[5%] top-[13%]"
          )}
          style={{ fontFamily: "var(--font-script)" }}
        >
          {c.script}
        </span>
      ) : null}
    </div>
  );
}
