"use client";

import { useEffect, useState } from "react";

/** Cycles gallery images ~every 5s with a random phase per mount. */
export function useStaggeredImageIndex(imageCount: number, enabled = true) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (!enabled || imageCount < 2) return;

    let cancelled = false;
    let timer = 0;

    const schedule = (ms: number) => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setIndex((i) => (i + 1) % imageCount);
        schedule(4500 + Math.floor(Math.random() * 1700));
      }, ms);
    };

    schedule(400 + Math.floor(Math.random() * 4600));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [imageCount, enabled]);

  return imageCount < 1 ? 0 : index % imageCount;
}
