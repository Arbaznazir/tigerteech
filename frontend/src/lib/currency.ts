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
  /** Fixed mock FX rate from USD */
  rate: number;
  decimals: number;
};

/** Catalog prices are stored in USD. Rates are mock / illustrative. */
export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", rate: 1, decimals: 2 },
  { code: "AUD", symbol: "$", rate: 1.52, decimals: 2 },
  { code: "CAD", symbol: "$", rate: 1.37, decimals: 2 },
  { code: "EUR", symbol: "€", rate: 0.92, decimals: 2 },
  { code: "INR", symbol: "₹", rate: 83.5, decimals: 2 },
  { code: "JPY", symbol: "¥", rate: 150, decimals: 0 },
  { code: "GBP", symbol: "£", rate: 0.79, decimals: 2 },
];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function getCurrency(code: CurrencyCode): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function convertFromUsd(amountUsd: number, code: CurrencyCode): number {
  return amountUsd * getCurrency(code).rate;
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
    typeof value === "string" &&
    CURRENCIES.some((c) => c.code === value)
  );
}
