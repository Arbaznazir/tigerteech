"use client";

import Image from "next/image";
import { useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
};

export function GuideLightbox({ src, alt, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/85 p-3 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-[81] flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-lg"
        aria-label="Close"
      >
        <X className="size-5" strokeWidth={2} />
      </button>
      <div
        className="relative max-h-[92vh] w-full max-w-5xl overflow-auto rounded-2xl bg-paper p-2 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={1200}
          className="h-auto w-full rounded-xl object-contain"
          unoptimized
          priority
        />
      </div>
    </div>
  );
}
