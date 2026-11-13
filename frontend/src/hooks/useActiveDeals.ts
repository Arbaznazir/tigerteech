"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import type { ActiveDeal } from "@/lib/deals";
import { useShopperLocation } from "@/lib/location";

export function useActiveDeals() {
  const [deals, setDeals] = useState<ActiveDeal[]>([]);
  const location = useShopperLocation();

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (location?.countryIso) params.set("country", location.countryIso);
    if (location?.countryName) params.set("countryName", location.countryName);
    if (location?.stateName) params.set("state", location.stateName);
    const qs = params.toString();
    const url = `${API_URL}/api/v1/deals/active${qs ? `?${qs}` : ""}`;

    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return [];
        const json = (await res.json()) as {
          data?: ActiveDeal[] | null;
          error?: string | null;
        };
        if (json.error) return [];
        return Array.isArray(json.data) ? json.data : [];
      })
      .then((list) => {
        if (!cancelled) setDeals(list);
      })
      .catch(() => {
        if (!cancelled) setDeals([]);
      });
    return () => {
      cancelled = true;
    };
  }, [location?.countryIso, location?.stateName, location?.updatedAt]);

  return deals;
}
