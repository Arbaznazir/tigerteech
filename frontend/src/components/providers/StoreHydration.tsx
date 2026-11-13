"use client";

import { useEffect } from "react";
import { getCachedUsdRates, loadUsdRates } from "@/lib/fx";
import { useStore } from "@/lib/store";

export function StoreHydration() {
  const setHydrated = useStore((s) => s.setHydrated);
  const setFxRates = useStore((s) => s.setFxRates);

  useEffect(() => {
    const finish = () => setHydrated(true);

    if (useStore.persist.hasHydrated()) {
      finish();
      return;
    }

    return useStore.persist.onFinishHydration(finish);
  }, [setHydrated]);

  // Live mid-market rates via Frankfurter (free, no API key).
  // https://frankfurter.dev/ — apply cache first, then refresh if stale.
  useEffect(() => {
    const cached = getCachedUsdRates();
    if (cached) {
      setFxRates(cached.rates, {
        date: cached.date,
        source: "cache",
      });
      if (!cached.stale) return;
    }

    const ac = new AbortController();
    void loadUsdRates(ac.signal).then((result) => {
      if (ac.signal.aborted) return;
      setFxRates(result.rates, {
        date: result.date,
        source: result.source,
      });
    });
    return () => ac.abort();
  }, [setFxRates]);

  return null;
}
