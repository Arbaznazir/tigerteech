"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function StoreHydration() {
  const setHydrated = useStore((s) => s.setHydrated);

  useEffect(() => {
    const finish = () => setHydrated(true);

    if (useStore.persist.hasHydrated()) {
      finish();
      return;
    }

    return useStore.persist.onFinishHydration(finish);
  }, [setHydrated]);

  return null;
}
