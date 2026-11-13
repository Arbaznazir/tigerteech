"use client";

import Image from "next/image";
import { useState } from "react";
import { Expand } from "lucide-react";
import { GuideLightbox } from "@/components/checkout/GuideLightbox";

type Props = {
  src: string;
  title: string;
  note?: string;
};

export function MeasurementGuideCard({ src, title, note }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-line bg-soft/40">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative block w-full overflow-hidden text-left"
        >
          <Image
            src={src}
            alt={title}
            width={800}
            height={600}
            className="aspect-[4/3] w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
            unoptimized
          />
          <span className="absolute inset-x-3 bottom-3 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-lg">
            <Expand className="size-3.5" strokeWidth={2} />
            Click to view full screen
          </span>
        </button>
        <div className="space-y-2 p-3">
          <p className="text-[11px] text-muted">
            Tap the image to open a zoomable full-screen view.
          </p>
          {note ? (
            <div className="rounded-xl border border-orange/25 bg-orange/8 px-3 py-2.5 text-[11px] leading-relaxed text-ink">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange">
                Note
              </p>
              {note}
            </div>
          ) : null}
        </div>
      </div>
      <GuideLightbox
        src={src}
        alt={title}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
