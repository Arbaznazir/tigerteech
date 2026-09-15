"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

const COLS = 3;
const ROWS = 3;
const TILES = COLS * ROWS;

const SCATTER: { x: number; y: number; r: number }[] = [
  { x: -130, y: -100, r: -22 },
  { x: 8, y: -145, r: 10 },
  { x: 140, y: -90, r: 24 },
  { x: -160, y: 12, r: -14 },
  { x: 0, y: 18, r: 5 },
  { x: 155, y: 20, r: 18 },
  { x: -120, y: 135, r: -24 },
  { x: 12, y: 155, r: 12 },
  { x: 135, y: 125, r: 20 },
];

/** Spark positions — scattered over the jungle while the logo assembles */
const SPARKS = Array.from({ length: 36 }, (_, i) => {
  const angle = (i / 36) * Math.PI * 2;
  const ring = 0.22 + (i % 5) * 0.09;
  return {
    x: 50 + Math.cos(angle) * ring * 100 + ((i * 17) % 13) - 6,
    y: 48 + Math.sin(angle) * ring * 72 + ((i * 11) % 9) - 4,
    size: 2 + (i % 4),
    delay: 0.35 + (i % 12) * 0.08,
    dur: 1.4 + (i % 5) * 0.25,
    kind: i % 3 === 0 ? "teal" : i % 3 === 1 ? "orange" : "gold",
  };
});

const STREAKS = Array.from({ length: 14 }, (_, i) => ({
  x: 18 + (i * 5.5) % 64,
  y: 20 + (i * 7) % 55,
  rot: -40 + (i * 23) % 80,
  delay: 0.55 + i * 0.09,
  len: 18 + (i % 4) * 8,
}));

type Phase = "play" | "done" | "gone";

export function IntroPreloader() {
  const [phase, setPhase] = useState<Phase>("play");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("gone");
      document.documentElement.classList.remove("intro-loading");
      return;
    }

    document.documentElement.classList.add("intro-loading");
    void document.body.offsetWidth;

    // Logo assemble, then dissolve into the site
    const openAt = window.setTimeout(() => {
      setPhase("done");
    }, 3200);

    const unlockScroll = window.setTimeout(() => {
      document.documentElement.classList.remove("intro-loading");
    }, 3600);

    const hideAt = window.setTimeout(() => {
      setPhase("gone");
    }, 4800);

    return () => {
      window.clearTimeout(openAt);
      window.clearTimeout(unlockScroll);
      window.clearTimeout(hideAt);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={cn("intro-preloader is-playing", phase === "done" && "is-done")}
      aria-hidden="true"
    >
      <div className="intro-stage">
        <div className="intro-bg">
          <Image
            src="/background.jpg"
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="intro-bg-img"
          />
          <div className="intro-bg-shade" />
          <div className="intro-mist intro-mist-a" />
          <div className="intro-mist intro-mist-b" />
        </div>

        {/* Sparks + streaks over the jungle while logo joins */}
        <div className="intro-sparks" aria-hidden>
          {SPARKS.map((s, i) => (
            <span
              key={`p-${i}`}
              className={cn("intro-spark", `intro-spark-${s.kind}`)}
              style={
                {
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  "--size": `${s.size}px`,
                  "--delay": `${s.delay}s`,
                  "--dur": `${s.dur}s`,
                } as CSSProperties
              }
            />
          ))}
          {STREAKS.map((s, i) => (
            <span
              key={`s-${i}`}
              className="intro-streak"
              style={
                {
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  "--rot": `${s.rot}deg`,
                  "--delay": `${s.delay}s`,
                  "--len": `${s.len}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className="intro-vignette" />

        <div className="intro-inner">
          <div className="intro-logo-stage is-playing">
            <div className="intro-logo-shards" aria-hidden>
              {Array.from({ length: TILES }, (_, i) => {
                const col = i % COLS;
                const row = Math.floor(i / COLS);
                const scatter = SCATTER[i] ?? { x: 0, y: 0, r: 0 };
                return (
                  <span
                    key={i}
                    className="intro-shard"
                    style={
                      {
                        "--sx": `${scatter.x}%`,
                        "--sy": `${scatter.y}%`,
                        "--sr": `${scatter.r}deg`,
                        "--delay": `${0.45 + i * 0.06}s`,
                        "--bx": `${(col / (COLS - 1)) * 100}%`,
                        "--by": `${(row / (ROWS - 1)) * 100}%`,
                        gridColumn: col + 1,
                        gridRow: row + 1,
                      } as CSSProperties
                    }
                  />
                );
              })}
            </div>

            <div className="intro-logo-full">
              <Image
                src="/brand-logo.png"
                alt=""
                width={280}
                height={280}
                priority
                unoptimized
                className="h-full w-full object-contain"
              />
            </div>

            {/* Burst ring when logo locks */}
            <span className="intro-logo-burst" />
          </div>

          <p className="intro-word">
            <span className="intro-word-main">TIGERTEEH</span>
            <span className="intro-word-sub">BUILT FOR THE BOLD</span>
          </p>
        </div>
      </div>
    </div>
  );
}
