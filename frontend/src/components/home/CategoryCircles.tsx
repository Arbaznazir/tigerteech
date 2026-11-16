"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Flame } from "lucide-react";
import type { StoreCategory } from "@/lib/catalog";

/** Built-in circles — used until admin publishes categories. */
const DEFAULT_CATEGORIES: StoreCategory[] = [
  { slug: "men", label: "Men", image: "/images/products/parrot.jpg" },
  { slug: "women", label: "Women", image: "/images/categories/women.png" },
  {
    slug: "co-ord-sets",
    label: "Co-ord Sets",
    image: "/images/products/serval.png",
  },
  {
    slug: "full-sleeve",
    label: "Full Sleeve",
    image: "/images/products/donkey.png",
  },
  {
    slug: "new-arrivals",
    label: "New Arrivals",
    image: "/images/products/goat.png",
    icon: "flame",
  },
];

type Props = {
  categories?: StoreCategory[];
};

export function CategoryCircles({ categories = [] }: Props) {
  const reduceMotion = useReducedMotion();
  const items = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <section className="relative z-[3] -mt-[22px] pb-5 pt-3 md:-mt-[30px] md:pb-4 md:pt-3 lg:-mt-[36px]">
      {/* Center of each grass sits on the bottom edge of the slides, in front of the white seam. */}
      <div className="pointer-events-none absolute inset-x-0 top-[22px] z-[30] md:top-[30px] lg:top-[36px]" aria-hidden>
        <Image
          src="/images/jungle/foliage-left.webp"
          alt=""
          width={1999}
          height={787}
          className="absolute -left-16 top-1/2 h-auto w-[min(56vw,760px)] max-w-none -translate-y-[34%]"
          sizes="56vw"
        />
        <Image
          src="/images/jungle/foliage-right.webp"
          alt=""
          width={1844}
          height={853}
          className="absolute -right-20 top-1/2 h-auto w-[min(56vw,780px)] max-w-none -translate-y-[34%]"
          sizes="56vw"
        />
      </div>

      <motion.div
        className="relative z-[40] mx-auto flex max-w-[1100px] snap-x snap-mandatory justify-start gap-6 overflow-x-auto px-5 pb-3 pt-7 scrollbar-hide md:justify-center md:gap-12 md:overflow-visible md:px-8 md:pb-2 md:pt-9"
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
        {items.map((cat, index) => (
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
              <div className="relative aspect-square size-[80px] shrink-0 sm:size-[100px]">
                <Image
                  src="/images/jungle/wreath.webp"
                  alt=""
                  width={1274}
                  height={1234}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 z-[2] h-auto w-[110%] max-w-none -translate-x-1/2 -translate-y-[47%] select-none"
                  sizes="132px"
                />
                <div className="absolute left-1/2 top-1/2 z-[1] aspect-square size-[78%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-soft shadow-[0_12px_32px_rgba(18,16,14,0.12)] transition duration-400 group-active:scale-95">
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
                      unoptimized={cat.image.startsWith("http")}
                    />
                  )}
                </div>
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
