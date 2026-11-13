"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import jungleImg from "../../../public/images/instagram/jungle.webp";
import savannahImg from "../../../public/images/instagram/savannah.webp";

function SocialIg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const faces: {
  src: StaticImageData;
  alt: string;
  label: string;
}[] = [
  {
    src: jungleImg,
    alt: "Tigerteeh crew in the jungle — tigers, macaws, owl, and python",
    label: "Jungle",
  },
  {
    src: savannahImg,
    alt: "Tigerteeh on the savannah — crew with tigers and lions at sunset",
    label: "Savannah",
  },
];

export function InstagramStrip() {
  const [flipped, setFlipped] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setFlipped((f) => !f), 4200);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section className="overflow-hidden bg-soft py-12 md:py-16">
      <div className="container-site mb-8 flex flex-col items-center text-center md:mb-10">
        <h2 className="flex flex-wrap items-center justify-center gap-3 font-display text-3xl tracking-wide text-ink md:text-4xl">
          <span className="flex size-9 items-center justify-center rounded-full bg-ink text-orange">
            <SocialIg className="size-4" />
          </span>
          <span>
            <span className="text-orange">@TIGERTEEH</span>{" "}
            <span className="text-ink/80">Tag us to get featured</span>
          </span>
        </h2>
        <p className="mt-2 text-sm text-muted">
          Tap or hover the card to flip between looks
        </p>
      </div>

      <div
        className="relative mx-auto flex w-full max-w-[920px] justify-center px-5 md:px-8"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Depth stack — bottom card peeking under */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-8 top-6 -z-0 aspect-[16/10] rounded-2xl bg-line shadow-md transition-transform duration-700 md:inset-x-16",
            flipped ? "translate-y-3 rotate-[-2deg]" : "translate-y-4 rotate-[2.5deg]"
          )}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-5 top-3 -z-0 aspect-[16/10] rounded-2xl bg-soft shadow-lg transition-transform duration-700 md:inset-x-10",
            flipped ? "translate-y-1.5 rotate-[1.5deg]" : "translate-y-2 rotate-[-1.5deg]"
          )}
        />

        {/* Flip card */}
        <button
          type="button"
          aria-label={
            flipped
              ? "Show jungle look"
              : "Show savannah look"
          }
          onClick={() => setFlipped((f) => !f)}
          className="group relative z-[1] w-full max-w-[820px] cursor-pointer border-0 bg-transparent p-0 text-left [perspective:1400px]"
        >
          <div
            className={cn(
              "relative aspect-[16/10] w-full transition-transform duration-700 ease-[cubic-bezier(0.4,0.2,0.2,1)] [transform-style:preserve-3d]",
              flipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
            )}
          >
            {/* Front — jungle */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.22)] [backface-visibility:hidden]">
              <Image
                src={faces[0].src}
                alt={faces[0].alt}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 920px) 100vw, 820px"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent px-5 pb-4 pt-14">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                  <span className="size-1.5 rounded-full bg-orange" />
                  {faces[0].label}
                </span>
              </div>
            </div>

            {/* Back — savannah */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.22)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <Image
                src={faces[1].src}
                alt={faces[1].alt}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 920px) 100vw, 820px"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent px-5 pb-4 pt-14">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                  <span className="size-1.5 rounded-full bg-orange" />
                  {faces[1].label}
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Face indicators */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {faces.map((face, i) => (
          <button
            key={face.label}
            type="button"
            aria-label={`Show ${face.label}`}
            onClick={() => {
              setFlipped(i === 1);
              setPaused(true);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all",
              (i === 1) === flipped
                ? "w-7 bg-orange"
                : "w-3 bg-ink/20 hover:bg-ink/35"
            )}
          />
        ))}
      </div>
    </section>
  );
}
