"use client";

import { useEffect, useState } from "react";
import { findCountryByIso, findCountryByName } from "@/lib/countries";
import type { CurrencyCode } from "@/lib/currency";

const STORAGE_KEY = "tt:shopper-location";
const WELCOME_KEY = "tt:welcome-custom-seen";

export type ShopperLocation = {
  countryIso: string;
  countryName: string;
  stateName: string;
  stateIso?: string;
  cityName?: string;
  source: "default" | "geo" | "manual";
  consented: boolean;
  updatedAt: number;
};

/** Default when location is declined / not yet set: US · New York */
export const DEFAULT_LOCATION: ShopperLocation = {
  countryIso: "US",
  countryName: "United States",
  stateName: "New York",
  stateIso: "NY",
  cityName: "New York",
  source: "default",
  consented: false,
  updatedAt: 0,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function readStored(): ShopperLocation {
  if (typeof window === "undefined") return DEFAULT_LOCATION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LOCATION };
    const parsed = JSON.parse(raw) as Partial<ShopperLocation>;
    const stateName =
      parsed.stateName ||
      (parsed.consented || parsed.updatedAt ? "" : "New York");
    return {
      ...DEFAULT_LOCATION,
      ...parsed,
      countryIso: (parsed.countryIso || "US").toUpperCase(),
      countryName: parsed.countryName || "United States",
      stateName: stateName || (parsed.source === "default" ? "New York" : ""),
      stateIso: parsed.stateIso || (stateName === "New York" ? "NY" : ""),
      cityName:
        parsed.cityName ||
        (parsed.source === "default" || !parsed.updatedAt
          ? "New York"
          : ""),
      source: parsed.source || "default",
      consented: Boolean(parsed.consented),
      updatedAt: Number(parsed.updatedAt) || 0,
    };
  } catch {
    return { ...DEFAULT_LOCATION };
  }
}

let memory = DEFAULT_LOCATION;

export function getShopperLocation(): ShopperLocation {
  if (typeof window === "undefined") return DEFAULT_LOCATION;
  if (!memory.updatedAt) memory = readStored();
  return memory;
}

export function setShopperLocation(next: ShopperLocation) {
  memory = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("tt:location"));
  }
  listeners.forEach((fn) => fn());
}

export function subscribeShopperLocation(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useShopperLocation(): ShopperLocation {
  const [loc, setLoc] = useState<ShopperLocation>(() => getShopperLocation());

  useEffect(() => {
    setLoc(getShopperLocation());
    const sync = () => setLoc(getShopperLocation());
    const unsub = subscribeShopperLocation(sync);
    window.addEventListener("tt:location", sync);
    return () => {
      unsub();
      window.removeEventListener("tt:location", sync);
    };
  }, []);

  return loc;
}

export function hasSeenWelcomeCustom(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(WELCOME_KEY) === "1";
}

export function markWelcomeCustomSeen() {
  if (typeof window === "undefined") return;
  localStorage.setItem(WELCOME_KEY, "1");
}

export function defaultUsNewYork(
  overrides: Partial<ShopperLocation> = {}
): ShopperLocation {
  return {
    ...DEFAULT_LOCATION,
    consented: true,
    updatedAt: Date.now(),
    source: "default",
    ...overrides,
  };
}

/** Map country ISO → storefront currency when known. */
export function currencyForCountryIso(iso: string): CurrencyCode | null {
  const code = iso.toUpperCase();
  if (code === "IN") return "INR";
  if (code === "US") return "USD";
  if (code === "GB") return "GBP";
  if (code === "AU") return "AUD";
  if (code === "CA") return "CAD";
  if (code === "JP") return "JPY";
  if (
    ["DE", "FR", "IT", "ES", "NL", "BE", "AT", "IE", "PT", "FI"].includes(code)
  ) {
    return "EUR";
  }
  return null;
}

/** Reverse-geocode lat/lon via OpenStreetMap Nominatim. */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<
  Pick<ShopperLocation, "countryIso" | "countryName" | "stateName" | "cityName">
> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "10");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error("Could not resolve your location");
  }
  const json = (await res.json()) as {
    address?: {
      country_code?: string;
      country?: string;
      state?: string;
      region?: string;
      state_district?: string;
      city?: string;
      town?: string;
      village?: string;
    };
  };
  const iso = (json.address?.country_code || "").toUpperCase();
  const byIso = iso ? findCountryByIso(iso) : undefined;
  const byName = json.address?.country
    ? findCountryByName(json.address.country)
    : undefined;
  const countryIso = byIso?.iso2 || byName?.iso2 || iso || "US";
  const countryName =
    byIso?.name || byName?.name || json.address?.country || "United States";
  const stateName =
    json.address?.state ||
    json.address?.region ||
    json.address?.state_district ||
    "";
  const cityName =
    json.address?.city ||
    json.address?.town ||
    json.address?.village ||
    "";

  return { countryIso, countryName, stateName, cityName };
}

export function requestBrowserLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not supported in this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

export function formatShopperPlace(loc: ShopperLocation): string {
  const parts = [
    loc.cityName && loc.cityName !== loc.stateName ? loc.cityName : "",
    loc.stateName,
    loc.countryName,
  ].filter(Boolean);
  return parts.join(", ") || "United States";
}
