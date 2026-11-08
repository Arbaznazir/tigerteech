"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Flame } from "lucide-react";
import { categories } from "@/data/products";

export function CategoryCircles() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative z-[3] -mt-1 bg-paper pb-5 pt-3 md:pb-4 md:pt-3">
      <motion.div
        className="mx-auto flex max-w-[1100px] snap-x snap-mandatory justify-start gap-5 overflow-x-auto px-5 pb-3 scrollbar-hide md:justify-center md:gap-10 md:overflow-visible md:px-8 md:pb-2"
        initial={reduceMotion ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.35 }}
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: 0.09, delayChildren: 0.08 },
          },
        }}
      >
        {categories.map((cat, index) => (
          <motion.div
            key={cat.slug}
            variants={{
              hidden: { opacity: 0, y: 28, scale: 0.86 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
              },
            }}
          >
            <Link
              href={`/shop/${cat.slug}`}
              className="group flex w-[82px] shrink-0 snap-start flex-col items-center gap-2.5 sm:w-[100px] sm:gap-3"
            >
              <div className="relative size-[80px] overflow-hidden rounded-full bg-soft shadow-[0_12px_32px_rgba(18,16,14,0.12)] ring-[3px] ring-paper transition duration-400 active:scale-95 group-hover:shadow-[0_14px_36px_rgba(243,129,32,0.22)] group-hover:ring-orange sm:size-[100px]">
                {cat.icon === "flame" ? (
                  <div className="flex size-full items-center justify-center bg-ink text-orange">
                    <motion.span
                      animate={
                        reduceMotion
                          ? undefined
                          : { scale: [1, 1.08, 1], rotate: [0, -4, 0] }
                      }
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Flame className="size-8 fill-orange sm:size-10" />
                    </motion.span>
                  </div>
                ) : (
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-110"
                    sizes="100px"
                  />
                )}
              </div>
              <span
                className={
                  index === 0
                    ? "border-b-2 border-orange pb-0.5 text-center text-[11px] font-semibold text-ink sm:text-[12px]"
                    : "text-center text-[11px] font-medium text-ink transition group-hover:text-orange sm:text-[12px]"
                }
              >
                {cat.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
