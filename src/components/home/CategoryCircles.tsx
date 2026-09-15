import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";
import { categories } from "@/data/products";

export function CategoryCircles() {
  return (
    <section className="relative z-[3] -mt-2 bg-white pb-3 pt-3 md:pb-3 md:pt-2">
      <div className="mx-auto flex max-w-[1100px] snap-x snap-mandatory justify-start gap-5 overflow-x-auto px-5 pb-3 scrollbar-hide md:justify-center md:gap-10 md:overflow-visible md:px-8 md:pb-2">
        {categories.map((cat, index) => (
          <Link
            key={cat.slug}
            href={`/shop/${cat.slug}`}
            className="group flex w-[76px] shrink-0 snap-start flex-col items-center gap-2.5 sm:w-[100px] sm:gap-3"
          >
            <div className="relative size-[72px] overflow-hidden rounded-full bg-[#f4f4f4] shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-[3px] ring-white transition active:scale-95 group-hover:ring-[#f49331] sm:size-[100px]">
              {cat.icon === "flame" ? (
                <div className="flex size-full items-center justify-center bg-[#111] text-[#f49331]">
                  <Flame className="size-8 fill-[#f49331] sm:size-10" />
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
                  ? "border-b-2 border-[#f49331] pb-0.5 text-center text-[11px] font-semibold text-[#1a1a1a] sm:text-[12px]"
                  : "text-center text-[11px] font-medium text-[#1a1a1a] transition group-hover:text-[#f49331] sm:text-[12px]"
              }
            >
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
