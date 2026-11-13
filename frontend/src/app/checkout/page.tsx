"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/use-cart";
import { useMoney } from "@/lib/use-money";
import { useStore } from "@/lib/store";

export default function CheckoutPage() {
  const router = useRouter();
  const { hydrated, items, subtotal, shipping } = useCart();
  const placeOrder = useStore((s) => s.placeOrder);
  const user = useStore((s) => s.user);
  const { formatPrice } = useMoney();

  const [form, setForm] = useState({
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const [error, setError] = useState("");

  if (!hydrated) {
    return (
      <div className="container-site py-20 text-center text-muted">Loading…</div>
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (
      !form.fullName ||
      !form.email ||
      !form.address ||
      !form.city ||
      !form.zip ||
      !form.cardNumber ||
      !form.expiry ||
      !form.cvc
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    const id = placeOrder({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      country: form.country,
    });
    router.push(`/checkout/success?order=${id}`);
  };

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="container-site py-10 md:py-14">
      <h1 className="font-display mb-2 text-4xl md:text-5xl">Checkout</h1>
      <p className="mb-8 text-sm text-muted">
        Demo checkout — no real payment is processed.
      </p>

      <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
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
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Phone</span>
                <input
                  value={form.phone}
                  onChange={set("phone")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
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
              <label className="block text-sm">
                <span className="mb-1 block font-medium">State</span>
                <input
                  value={form.state}
                  onChange={set("state")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">ZIP *</span>
                <input
                  required
                  value={form.zip}
                  onChange={set("zip")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Country</span>
                <input
                  value={form.country}
                  onChange={set("country")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">Payment</h2>
            <p className="mt-1 text-xs text-muted">Mock card form for demo only.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Name on card *</span>
                <input
                  required
                  value={form.cardName}
                  onChange={set("cardName")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Card number *</span>
                <input
                  required
                  placeholder="4242 4242 4242 4242"
                  value={form.cardNumber}
                  onChange={set("cardNumber")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Expiry *</span>
                <input
                  required
                  placeholder="MM/YY"
                  value={form.expiry}
                  onChange={set("expiry")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">CVC *</span>
                <input
                  required
                  placeholder="123"
                  value={form.cvc}
                  onChange={set("cvc")}
                  className="w-full rounded-lg border border-line px-3 py-2.5"
                />
              </label>
            </div>
          </section>
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
                  {formatPrice(item.product.priceMin * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd>{formatPrice(subtotal + shipping)}</dd>
            </div>
          </dl>
          <Button type="submit" variant="forest" className="mt-6 w-full rounded-md">
            Place Order
          </Button>
        </aside>
      </form>
    </div>
  );
}
