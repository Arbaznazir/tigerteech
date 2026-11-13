import {
  type CurrencyCode,
  FALLBACK_RATES,
} from "@/lib/currency";

const CACHE_KEY = "tt_fx_usd_rates_v1";
/** Frankfurter updates about once a day — refresh a few times daily is enough. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const QUOTES: Exclude<CurrencyCode, "USD">[] = [
  "AUD",
  "CAD",
  "EUR",
  "INR",
  "JPY",
  "GBP",
];

type FrankfurterRow = {
  date?: string;
  base?: string;
  quote?: string;
  rate?: number;
};

type CachePayload = {
  fetchedAt: number;
  date: string;
  rates: Record<string, number>;
};

export type UsdFxRates = Record<CurrencyCode, number>;

function fallbackRates(): UsdFxRates {
  return { ...FALLBACK_RATES };
}

function readCache(): CachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    if (
      !parsed ||
      typeof parsed.fetchedAt !== "number" ||
      !parsed.rates ||
      typeof parsed.rates !== "object"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(payload: CachePayload) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function normalizeRates(partial: Record<string, number>): UsdFxRates {
  const next = fallbackRates();
  for (const code of QUOTES) {
    const value = partial[code] ?? partial[code.toLowerCase()];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      next[code] = value;
    }
  }
  next.USD = 1;
  return next;
}

/** Cached rates if still fresh; otherwise null (caller should fetch). */
export function getCachedUsdRates(): {
  rates: UsdFxRates;
  date: string;
  stale: boolean;
} | null {
  const cached = readCache();
  if (!cached) return null;
  const rates = normalizeRates(cached.rates);
  const age = Date.now() - cached.fetchedAt;
  return {
    rates,
    date: cached.date || "",
    stale: age > CACHE_TTL_MS,
  };
}

/**
 * Live mid-market reference rates from Frankfurter (free, no API key).
 * @see https://frankfurter.dev/
 */
export async function fetchUsdRates(
  signal?: AbortSignal
): Promise<{ rates: UsdFxRates; date: string } | null> {
  const quotes = QUOTES.map((c) => c.toLowerCase()).join(",");
  const url = `https://api.frankfurter.dev/v2/rates?base=usd&quotes=${quotes}`;

  try {
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
      // Browser cache is fine; we also keep our own TTL cache.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as FrankfurterRow[];
    if (!Array.isArray(data) || data.length === 0) return null;

    const partial: Record<string, number> = {};
    let date = "";
    for (const row of data) {
      const quote = String(row.quote || "").toUpperCase();
      const rate = Number(row.rate);
      if (!quote || !Number.isFinite(rate) || rate <= 0) continue;
      partial[quote] = rate;
      if (row.date) date = row.date;
    }

    const rates = normalizeRates(partial);
    writeCache({
      fetchedAt: Date.now(),
      date: date || new Date().toISOString().slice(0, 10),
      rates,
    });
    return { rates, date: date || "" };
  } catch {
    return null;
  }
}

/** Prefer fresh network rates; fall back to cache, then hardcoded defaults. */
export async function loadUsdRates(
  signal?: AbortSignal
): Promise<{ rates: UsdFxRates; date: string; source: "live" | "cache" | "fallback" }> {
  const cached = getCachedUsdRates();
  if (cached && !cached.stale) {
    return { rates: cached.rates, date: cached.date, source: "cache" };
  }

  const live = await fetchUsdRates(signal);
  if (live) {
    return { rates: live.rates, date: live.date, source: "live" };
  }

  if (cached) {
    return { rates: cached.rates, date: cached.date, source: "cache" };
  }

  return { rates: fallbackRates(), date: "", source: "fallback" };
}
