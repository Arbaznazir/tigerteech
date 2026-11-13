"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Gift } from "lucide-react";
import { MeasurementStep } from "@/components/checkout/MeasurementStep";
import { Button } from "@/components/ui/Button";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { PhoneCountryInput } from "@/components/ui/PhoneCountryInput";
import { StateSelect } from "@/components/ui/StateSelect";
import { API_URL } from "@/lib/api";
import {
  fetchCodSettings,
  formatCodAvailability,
  isCodAvailable,
  type CodSettings,
} from "@/lib/cod-settings";
import {
  findCountryByIso,
  formatInternational,
  parseStoredPhone,
} from "@/lib/countries";
import { countryIsoForCurrency } from "@/lib/currency";
import { getCustomerToken } from "@/lib/customer-auth";
import { useShopperLocation } from "@/lib/location";
import {
  type LineMeasurementAssignment,
  type MeasurementSet,
} from "@/lib/measurements";
import { isRemoteMedia, resolveMediaUrl } from "@/lib/media";
import { useCart } from "@/lib/use-cart";
import { useMoney } from "@/lib/use-money";
import { useStore } from "@/lib/store";

type CheckoutStep = "shipping" | "measurements" | "payment";

type QuoteGift = {
  giftProductId?: string;
  giftProductName?: string;
  giftProductImage?: string;
  giftOfferTitle?: string;
  discount?: number;
  discountLabel?: string;
  couponCode?: string;
  total?: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { hydrated, items, subtotal, shipping } = useCart();
  const placeOrder = useStore((s) => s.placeOrder);
  const cart = useStore((s) => s.cart);
  const couponCode = useStore((s) => s.couponCode);
  const updateCartUnitPrices = useStore((s) => s.updateCartUnitPrices);
  const user = useStore((s) => s.user);
  const refreshProfile = useStore((s) => s.refreshProfile);
  const updateProfile = useStore((s) => s.updateProfile);
  const currency = useStore((s) => s.currency);
  const { formatPrice } = useMoney();
  const shopperLoc = useShopperLocation();

  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });
  const [error, setError] = useState("");
  const [priceNotice, setPriceNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [liveTotal, setLiveTotal] = useState<number | null>(null);
  const [quoteExtra, setQuoteExtra] = useState<QuoteGift>({});
  const [measSets, setMeasSets] = useState<MeasurementSet[]>([]);
  const [measByLine, setMeasByLine] = useState<Record<
    string,
    LineMeasurementAssignment
  > | null>(null);
  const [codSettings, setCodSettings] = useState<CodSettings | null>(null);

  const codOk = isCodAvailable(codSettings, form.country, form.state);
  const codRegions = useMemo(
    () => (codSettings ? formatCodAvailability(codSettings) : []),
    [codSettings]
  );

  useEffect(() => {
    void fetchCodSettings()
      .then(setCodSettings)
      .catch(() =>
        setCodSettings({ enabled: true, everywhere: true, rules: [] })
      );
  }, []);

  useEffect(() => {
    if (!codOk && paymentMethod === "cod") {
      setPaymentMethod("online");
    }
  }, [codOk, paymentMethod]);

  const measLines = useMemo(
    () =>
      items
        .map((i) => ({
          ...i,
          needTop: Boolean(i.product.requiresShirtMeas),
          needBottom: Boolean(i.product.requiresTrouserMeas),
        }))
        .filter((i) => i.needTop || i.needBottom),
    [items]
  );
  const needsMeasurements = measLines.length > 0;

  useEffect(() => {
    if (hydrated && user) {
      void refreshProfile();
    }
  }, [hydrated, user, refreshProfile]);

  useEffect(() => {
    if (!user) return;
    setMeasSets(user.measurementSets || []);
  }, [user?.id, user?.measurementSets]);

  const cartFingerprint = cart
    .map((c) => `${c.variantId}:${c.quantity}`)
    .join("|");

  // Pull live backend prices before pay — never trust a stale cart alone.
  useEffect(() => {
    if (!hydrated || !user || cart.length === 0) return;
    const token = getCustomerToken();
    if (!token) return;
    const snapshot = cart;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/orders/quote`, {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            couponCode: couponCode || "",
            items: snapshot
              .filter((c) => c.variantId)
              .map((c) => ({
                variantId: c.variantId,
                qty: c.quantity,
                expectedUnitPrice: c.unitPrice,
              })),
          }),
        });
        const json = (await res.json()) as {
          data?: {
            total: number;
            discount?: number;
            discountLabel?: string;
            couponCode?: string;
            giftProductId?: string;
            giftProductName?: string;
            giftProductImage?: string;
            giftOfferTitle?: string;
            items: { variantId: string; unitPrice: number }[];
          };
          error?: string | null;
        };
        if (cancelled || !res.ok || !json.data) return;
        const byVariant: Record<string, number> = {};
        let changed = false;
        for (const line of json.data.items || []) {
          byVariant[line.variantId] = line.unitPrice;
          const cartLine = snapshot.find((c) => c.variantId === line.variantId);
          if (
            cartLine &&
            typeof cartLine.unitPrice === "number" &&
            Math.abs(cartLine.unitPrice - line.unitPrice) >= 0.005
          ) {
            changed = true;
          } else if (cartLine && typeof cartLine.unitPrice !== "number") {
            changed = true;
          }
        }
        updateCartUnitPrices(byVariant);
        setLiveTotal(json.data.total);
        setQuoteExtra({
          discount: json.data.discount,
          discountLabel: json.data.discountLabel,
          couponCode: json.data.couponCode,
          giftProductId: json.data.giftProductId,
          giftProductName: json.data.giftProductName,
          giftProductImage: json.data.giftProductImage,
          giftOfferTitle: json.data.giftOfferTitle,
          total: json.data.total,
        });
        if (changed) {
          setPriceNotice(
            `Prices were updated from the server. You must pay $${json.data.total.toFixed(2)}.`
          );
        } else {
          setPriceNotice("");
        }
      } catch {
        // Quote failure is non-blocking — placeOrder still validates.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fingerprint avoids quote→price update loops
  }, [hydrated, user, cartFingerprint, couponCode, updateCartUnitPrices]);

  useEffect(() => {
    if (!user || prefilled) return;
    const addr = user.address || {};
    setForm((f) => ({
      ...f,
      fullName: (addr.fullName as string) || user.name || f.fullName,
      email: user.email || f.email,
      phone: user.phone || f.phone,
      address: (addr.address as string) || f.address,
      city: (addr.city as string) || f.city,
      state: (addr.state as string) || f.state,
      zip: (addr.zip as string) || f.zip,
      country: (addr.country as string) || f.country,
    }));
    setPrefilled(true);
  }, [user, prefilled]);

  // Prefer detected shopper location; else currency→country (USD→US).
  useEffect(() => {
    if (!hydrated) return;
    if (shopperLoc?.source === "geo" && shopperLoc.countryName) {
      setForm((f) => {
        if (
          f.country === shopperLoc.countryName &&
          (!shopperLoc.stateName || f.state === shopperLoc.stateName)
        ) {
          return f;
        }
        const c = findCountryByIso(shopperLoc.countryIso);
        return {
          ...f,
          country: shopperLoc.countryName,
          state: shopperLoc.stateName || f.state,
          phone: c
            ? formatInternational(c.dial, parseStoredPhone(f.phone).national)
            : f.phone,
        };
      });
      return;
    }
    const c = findCountryByIso(countryIsoForCurrency(currency));
    if (!c) return;
    setForm((f) => {
      if (f.country === c.name) return f;
      return {
        ...f,
        country: c.name,
        state: "",
        phone: formatInternational(c.dial, parseStoredPhone(f.phone).national),
      };
    });
  }, [
    hydrated,
    currency,
    shopperLoc?.countryIso,
    shopperLoc?.countryName,
    shopperLoc?.stateName,
    shopperLoc?.source,
  ]);

  if (!hydrated) {
    return (
      <div className="container-site py-20 text-center text-muted">Loading…</div>
    );
  }

  if (!user) {
    return (
      <div className="container-site py-20 text-center">
        <h1 className="font-display text-4xl">Checkout</h1>
        <p className="mt-3 text-muted">
          Log in to place your order. Your cart will stay with you.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button href="/account/login?next=/checkout">Login to continue</Button>
          <Button
            href="/account/register?next=/checkout"
            variant="ghost"
            className="border border-line"
          >
            Create account
          </Button>
        </div>
        {items.length > 0 && (
          <p className="mt-4 text-sm text-muted">
            {items.length} item{items.length === 1 ? "" : "s"} waiting in your
            cart.
          </p>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-site py-20 text-center">
        <h1 className="font-display text-4xl">Checkout</h1>
        <p className="mt-3 text-muted">Your cart is empty.</p>
        <Button href="/shop" className="mt-6">
          Shop Now
        </Button>
      </div>
    );
  }

  function validateShipping(): string | null {
    if (
      !form.fullName ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.city ||
      !form.zip
    ) {
      return "Please fill in all required shipping fields, including phone.";
    }
    const phoneDigits = parseStoredPhone(form.phone).national;
    if (phoneDigits.length !== 10) {
      return "Phone number must be exactly 10 digits.";
    }
    return null;
  }

  function goFromShipping() {
    const err = validateShipping();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    if (needsMeasurements) setStep("measurements");
    else setStep("payment");
  }

  async function persistMeasurementSets(next: MeasurementSet[]) {
    setMeasSets(next);
    await updateProfile({ measurementSets: next });
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step !== "payment") return;
    const shipErr = validateShipping();
    if (shipErr) {
      setError(shipErr);
      setStep("shipping");
      return;
    }
    if (needsMeasurements && !measByLine) {
      setError("Please complete measurements before placing the order.");
      setStep("measurements");
      return;
    }
    setError("");
    setBusy(true);
    try {
      if (measSets.length) {
        await updateProfile({ measurementSets: measSets });
      }
      const id = await placeOrder(
        {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        },
        {
          paymentMethod,
          measurementSnapshot: measByLine
            ? {
                byLine: measByLine,
                lines: Object.values(measByLine),
              }
            : {},
          lineMeasurements: measByLine || undefined,
          couponCode: couponCode || "",
          expectedPaidAmount:
            liveTotal != null ? liveTotal : subtotal + shipping,
        }
      );
      router.push(`/checkout/success?order=${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  };

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="container-site py-10 md:py-14">
      <h1 className="font-display mb-2 text-4xl md:text-5xl">Checkout</h1>
      <p className="mb-8 text-sm text-muted">
        Signed in as {user.email}.{" "}
        <Link href="/account" className="font-semibold text-orange">
          Account
        </Link>
      </p>

      <div className="mb-6 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
        {(
          needsMeasurements
            ? ([
                ["shipping", "1 · Details"],
                ["measurements", "2 · Fit"],
                ["payment", "3 · Pay"],
              ] as const)
            : ([
                ["shipping", "1 · Details"],
                ["payment", "2 · Pay"],
              ] as const)
        ).map(([key, label]) => (
          <span
            key={key}
            className={`rounded-full px-3 py-1.5 ${
              step === key ? "bg-orange text-ink" : "bg-soft text-muted"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {step === "shipping" ? (
          <section className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">Shipping</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Full name *</span>
                <input
                  required
                  value={form.fullName}
                  onChange={set("fullName")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Email *</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
              <PhoneCountryInput
                className="sm:col-span-1"
                required
                value={form.phone}
                countryName={form.country}
                onPhoneChange={(international) =>
                  setForm((f) => ({ ...f, phone: international }))
                }
                onCountryChange={(c) =>
                  setForm((f) => ({
                    ...f,
                    country: c.name,
                    state: f.country === c.name ? f.state : "",
                    phone: formatInternational(
                      c.dial,
                      parseStoredPhone(f.phone).national
                    ),
                  }))
                }
              />
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Address *</span>
                <input
                  required
                  value={form.address}
                  onChange={set("address")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">City *</span>
                <input
                  required
                  value={form.city}
                  onChange={set("city")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
              <StateSelect
                countryName={form.country}
                value={form.state}
                onChange={(state) => setForm((f) => ({ ...f, state }))}
              />
              <label className="block text-sm">
                <span className="mb-1 block font-medium">ZIP *</span>
                <input
                  required
                  value={form.zip}
                  onChange={set("zip")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
              <CountrySelect
                value={form.country}
                required
                onChange={(c) =>
                  setForm((f) => ({
                    ...f,
                    country: c.name,
                    state: f.country === c.name ? f.state : "",
                    phone: formatInternational(
                      c.dial,
                      parseStoredPhone(f.phone).national
                    ),
                  }))
                }
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={goFromShipping}
                className="rounded-full bg-orange px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-ink"
              >
                Continue
              </button>
            </div>
          </section>
          ) : null}

          {step === "measurements" && needsMeasurements ? (
            <MeasurementStep
              lines={measLines}
              sets={measSets}
              onSetsChange={(next) => void persistMeasurementSets(next)}
              userGender={user.gender}
              onBack={() => setStep("shipping")}
              onContinue={({ byLine }) => {
                setMeasByLine(byLine);
                setStep("payment");
              }}
            />
          ) : null}

          {step === "payment" ? (
          <section className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">Payment</h2>
            <p className="mt-1 text-xs text-muted">
              Demo payments — online is marked paid immediately; COD stays unpaid
              until delivery.
            </p>
            {needsMeasurements && measByLine ? (
              <div className="mt-3 rounded-xl border border-orange/25 bg-orange/8 px-3 py-2 text-[12px] text-ink">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">
                    Measurements · {Object.keys(measByLine).length} item
                    {Object.keys(measByLine).length === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    className="font-semibold text-orange underline"
                    onClick={() => setStep("measurements")}
                  >
                    Edit
                  </button>
                </div>
                <ul className="mt-2 space-y-1 text-muted">
                  {Object.values(measByLine).map((a) => (
                    <li key={a.lineKey}>
                      {a.productName}: {a.setName} ({a.gender})
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={!codOk}
                onClick={() => setPaymentMethod("cod")}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${
                  paymentMethod === "cod" && codOk
                    ? "border-orange bg-soft"
                    : "border-line bg-paper"
                }`}
              >
                <span className="block font-semibold">Cash on delivery</span>
                <span className="text-muted">
                  {codOk
                    ? "Pay when your order arrives"
                    : "Not available for this shipping address"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("online")}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                  paymentMethod === "online"
                    ? "border-orange bg-soft"
                    : "border-line bg-paper"
                }`}
              >
                <span className="block font-semibold">Online payment</span>
                <span className="text-muted">Mock pay now (marked paid)</span>
              </button>
            </div>
            {codSettings ? (
              <div className="mt-3 rounded-xl border border-line bg-soft/60 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    COD availability
                  </p>
                  <Link
                    href="/cod"
                    className="text-[11px] font-semibold text-orange underline-offset-2 hover:underline"
                  >
                    Full COD list
                  </Link>
                </div>
                <ul className="mt-1.5 space-y-0.5 text-[12px] text-ink">
                  {codRegions.map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
                {!codOk ? (
                  <p className="mt-1.5 text-[12px] text-muted">
                    Your address ({form.country}
                    {form.state ? `, ${form.state}` : ""}) is outside the COD
                    zones — use online payment, or update shipping.
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  setStep(needsMeasurements ? "measurements" : "shipping")
                }
                className="rounded-full border border-line px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em]"
              >
                Back
              </button>
            </div>
          </section>
          ) : null}
          {priceNotice && (
            <p className="rounded-xl border border-orange/40 bg-orange/10 px-3 py-2 text-sm text-ink">
              {priceNotice}
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-paper p-6">
          <h2 className="font-display text-2xl">Your Order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.size}-${item.color}`}
                className="flex justify-between gap-2"
              >
                <span className="text-muted">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="font-semibold">
                  {formatPrice(
                    (item.unitPrice ?? item.product.priceMin) * item.quantity
                  )}
                </span>
              </li>
            ))}
          </ul>

          {quoteExtra.giftProductName ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-orange/30 bg-orange/8 p-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-soft">
                {quoteExtra.giftProductImage ? (
                  <Image
                    src={resolveMediaUrl(quoteExtra.giftProductImage)}
                    alt={quoteExtra.giftProductName}
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized={isRemoteMedia(quoteExtra.giftProductImage)}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-orange">
                    <Gift className="size-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">
                  {quoteExtra.giftProductName}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-orange">
                  <Check className="size-3" strokeWidth={2.5} />
                  Offer applied · Free
                </p>
              </div>
            </div>
          ) : null}

          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            {(quoteExtra.discount || 0) > 0 ? (
              <div className="flex justify-between text-orange">
                <dt>
                  Discount
                  {quoteExtra.couponCode || couponCode
                    ? ` (${quoteExtra.couponCode || couponCode})`
                    : ""}
                </dt>
                <dd>−{formatPrice(quoteExtra.discount || 0)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd>
                {formatPrice(
                  liveTotal != null ? liveTotal : subtotal + shipping
                )}
              </dd>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <dt>Method</dt>
              <dd className="uppercase">
                {paymentMethod === "cod" ? "COD" : "Online"}
              </dd>
            </div>
            <p className="pt-1 text-[11px] text-muted">
              Promo codes and gift offers are re-verified by the server before
              the order is placed.
            </p>
          </dl>
          {step === "payment" ? (
            <Button
              type="submit"
              variant="forest"
              className="mt-6 w-full rounded-md"
              disabled={busy}
            >
              {busy
                ? "Placing…"
                : paymentMethod === "cod"
                  ? "Place COD Order"
                  : "Pay & Place Order"}
            </Button>
          ) : step === "shipping" ? (
            <Button
              type="button"
              variant="forest"
              className="mt-6 w-full rounded-md"
              onClick={goFromShipping}
            >
              Continue
            </Button>
          ) : (
            <p className="mt-6 text-center text-[12px] text-muted">
              Save measurements on the left to continue to payment.
            </p>
          )}
        </aside>
      </form>
    </div>
  );
}
