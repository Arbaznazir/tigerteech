export type CurrencyCode =
  | "USD"
  | "AUD"
  | "CAD"
  | "EUR"
  | "INR"
  | "JPY"
  | "GBP";

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  /** FX rate from USD (1 USD = rate units of this currency) */
  rate: number;
  decimals: number;
};

/** Catalog prices are stored in USD. Used until live Frankfurter rates load. */
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  AUD: 1.52,
  CAD: 1.37,
  EUR: 0.92,
  INR: 83.5,
  JPY: 150,
  GBP: 0.79,
};

const META: Omit<Currency, "rate">[] = [
  { code: "USD", symbol: "$", decimals: 2 },
  { code: "AUD", symbol: "$", decimals: 2 },
  { code: "CAD", symbol: "$", decimals: 2 },
  { code: "EUR", symbol: "€", decimals: 2 },
  { code: "INR", symbol: "₹", decimals: 2 },
  { code: "JPY", symbol: "¥", decimals: 0 },
  { code: "GBP", symbol: "£", decimals: 2 },
];

let liveRates: Record<CurrencyCode, number> | null = null;

export function setLiveFxRates(rates: Record<CurrencyCode, number> | null) {
  liveRates = rates;
}

export function getLiveFxRates(): Record<CurrencyCode, number> | null {
  return liveRates;
}

export function getRate(code: CurrencyCode): number {
  if (code === "USD") return 1;
  const live = liveRates?.[code];
  if (typeof live === "number" && live > 0) return live;
  return FALLBACK_RATES[code] ?? 1;
}

/** Switcher list (rate field is fallback; live conversion uses getRate). */
export const CURRENCIES: Currency[] = META.map((m) => ({
  ...m,
  rate: FALLBACK_RATES[m.code],
}));

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function getCurrency(code: CurrencyCode): Currency {
  const meta = META.find((c) => c.code === code) ?? META[0];
  return {
    code: meta.code,
    symbol: meta.symbol,
    decimals: meta.decimals,
    rate: getRate(meta.code),
  };
}

export function convertFromUsd(amountUsd: number, code: CurrencyCode): number {
  return amountUsd * getRate(code);
}

/** Format a USD catalog amount in the selected currency. */
export function formatMoney(
  amountUsd: number,
  code: CurrencyCode = DEFAULT_CURRENCY
): string {
  const currency = getCurrency(code);
  const value = convertFromUsd(amountUsd, code);
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });
  return `${currency.symbol}${formatted}`;
}

export function formatMoneyRange(
  minUsd: number,
  maxUsd: number,
  code: CurrencyCode = DEFAULT_CURRENCY
): string {
  if (minUsd === maxUsd) return formatMoney(minUsd, code);
  return `${formatMoney(minUsd, code)} – ${formatMoney(maxUsd, code)}`;
}

export function currencyLabel(code: CurrencyCode): string {
  const { symbol } = getCurrency(code);
  return `${symbol} ${code}`;
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return (
    typeof value === "string" && META.some((c) => c.code === value)
  );
}

/** Primary country (ISO2) implied by the storefront currency. */
export const CURRENCY_TO_COUNTRY_ISO: Record<CurrencyCode, string> = {
  USD: "US",
  INR: "IN",
  AUD: "AU",
  CAD: "CA",
  EUR: "DE",
  JPY: "JP",
  GBP: "GB",
};

export function countryIsoForCurrency(code: CurrencyCode): string {
  return CURRENCY_TO_COUNTRY_ISO[code] || "US";
}
