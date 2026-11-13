"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  LifeBuoy,
  Mail,
  MapPin,
  Phone,
  Ruler,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  fetchCustomerOrder,
  measurementRows,
  orderTitle,
  type CustomerOrder,
  type CustomerOrderItem,
  type MeasAdminEdit,
} from "@/lib/customer-orders";
import { cancelOrder, openTicket } from "@/lib/support";
import { resolveMediaUrl } from "@/lib/media";
import { orderStatusLabel, orderStatusTone } from "@/lib/order-status";
import { useMoney } from "@/lib/use-money";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const user = useStore((s) => s.user);
  const { formatPrice } = useMoney();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState<"help" | "cancel" | "">("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [focusMeasurements, setFocusMeasurements] = useState(false);
  const [focusAddress, setFocusAddress] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const focus = q.get("focus");
    setFocusMeasurements(focus === "measurements");
    setFocusAddress(focus === "address");
    if (focus === "address") {
      window.requestAnimationFrame(() => {
        document.getElementById("order-delivery")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }, []);

  useEffect(() => {
    if (hydrated && !user) router.replace("/account/login");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!user || !params.id) return;
    let cancelled = false;
    void fetchCustomerOrder(params.id)
      .then((next) => {
        if (!cancelled) setOrder(next);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Order not found");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, params.id]);

  if (!hydrated || !user) {
    return (
      <div className="container-site py-16 text-center text-muted">Loading…</div>
    );
  }

  if (error) {
    return (
      <div className="container-site py-16 text-center">
        <p className="text-muted">{error}</p>
        <Link href="/account/orders" className="mt-3 inline-block text-orange">
          Back to orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-site py-16 text-center text-muted">Loading…</div>
    );
  }

  const ship = order.shipping || {};
  const addressLines = [
    ship.address,
    [ship.city, ship.state].filter(Boolean).join(", "),
    [ship.zip, ship.country].filter(Boolean).join(" · "),
  ].filter(Boolean);
  const label = order.statusLabel || orderStatusLabel(order.status);
  const when = new Date(order.createdAt).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const canCancel = order.status === "pending";
  const itemCount = (order.items || []).reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="container-site max-w-5xl py-6 md:py-10">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2.25} />
        Orders
      </Link>

      <header className="mt-3 rounded-2xl border border-line bg-paper px-4 py-4 md:px-5 md:py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">
              Order · {itemCount} piece{itemCount === 1 ? "" : "s"}
            </p>
            <h1 className="font-display mt-1 text-2xl leading-tight tracking-wide text-ink md:text-3xl">
              {orderTitle(order)}
            </h1>
            <p className="mt-1 text-[12px] text-muted">{when}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                orderStatusTone(order.status)
              )}
            >
              {label}
            </span>
            <span className="inline-flex rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">
              {order.paymentMethod === "online" ? "Online" : "COD"}
            </span>
          </div>
        </div>
        {order.totals?.cancelledFromQuery ? (
          <p className="mt-3 rounded-xl bg-soft px-3 py-2 text-[12px] leading-relaxed text-ink">
            Your order is cancelled from the admin side as you requested.
            {order.totals?.refundAmount != null &&
            Number(order.totals.refundAmount) > 0 ? (
              <>
                {" "}
                Refund {formatPrice(Number(order.totals.refundAmount))}
                {order.totals.cancellationFee != null &&
                Number(order.totals.cancellationFee) > 0
                  ? ` (cancellation charge ${formatPrice(Number(order.totals.cancellationFee))})`
                  : ""}
                .
              </>
            ) : null}
          </p>
        ) : null}
      </header>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.75fr)] lg:items-start lg:gap-4">
        <div className="space-y-2.5">
          {(order.items || []).map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              price={formatPrice(item.lineTotal)}
              expandChanges={focusMeasurements}
            />
          ))}
        </div>

        <aside className="space-y-2.5 lg:sticky lg:top-20">
          <section
            id="order-delivery"
            className={cn(
              "rounded-2xl border bg-paper px-4 py-3.5 transition",
              focusAddress || ship.addressChangedAsRequested
                ? "border-orange/50 ring-2 ring-orange/25"
                : "border-line"
            )}
          >
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              Delivery
            </h2>
            {ship.addressChangedAsRequested ? (
              <p className="mt-2 rounded-xl bg-orange/10 px-3 py-2 text-[12px] leading-relaxed text-ink">
                As you requested, the address for this order was changed by
                admin. Your order will ship to the location below.
              </p>
            ) : null}
            <div className="mt-2.5 space-y-2.5">
              <div className="flex gap-2.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-orange" />
                <div className="min-w-0 text-[13px]">
                  <p className="font-semibold text-ink">
                    {ship.fullName || user.name}
                  </p>
                  {addressLines.length ? (
                    <p className="mt-0.5 leading-snug text-ink">
                      {addressLines.join(" · ")}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-muted">No address on this order.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2.5 text-[13px]">
                <Phone className="mt-0.5 size-3.5 shrink-0 text-muted" />
                <p className="text-ink">{ship.phone || user.phone || "—"}</p>
              </div>
              <div className="flex gap-2.5 text-[13px]">
                <Mail className="mt-0.5 size-3.5 shrink-0 text-muted" />
                <p className="truncate text-ink">
                  {ship.email || order.email || user.email}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-paper px-4 py-3.5">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              Need anything?
            </h2>
            <p className="mt-1.5 text-[12px] leading-snug text-muted">
              Three messages, then wait for our reply.
            </p>
            {actionError ? (
              <p className="mt-2 text-[12px] text-red-600">{actionError}</p>
            ) : null}
            <div className="mt-3 flex flex-col gap-2">
              <Button
                type="button"
                variant="forest"
                size="sm"
                disabled={busy !== ""}
                className="w-full"
                onClick={() => {
                  setBusy("help");
                  setActionError("");
                  void openTicket(order.id)
                    .then((ticket) => router.push(`/account/help/${ticket.id}`))
                    .catch((err) =>
                      setActionError(
                        err instanceof Error
                          ? err.message
                          : "Could not open help"
                      )
                    )
                    .finally(() => setBusy(""));
                }}
              >
                <LifeBuoy className="size-3.5" strokeWidth={2.25} />
                {busy === "help" ? "Opening…" : "Need help"}
              </Button>

              {canCancel ? (
                confirmCancel ? (
                  <div className="rounded-xl border border-orange/30 bg-orange/8 p-3">
                    <p className="text-[13px] font-medium text-ink">
                      Cancel this order?
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy !== ""}
                        onClick={() => {
                          setBusy("cancel");
                          setActionError("");
                          void cancelOrder(order.id)
                            .then((next) =>
                              setOrder((current) =>
                                current
                                  ? {
                                      ...current,
                                      status: next.status,
                                      statusLabel:
                                        next.status === "refunded"
                                          ? "Refunded"
                                          : "Cancelled",
                                    }
                                  : current
                              )
                            )
                            .catch((err) =>
                              setActionError(
                                err instanceof Error
                                  ? err.message
                                  : "Could not cancel"
                              )
                            )
                            .finally(() => {
                              setBusy("");
                              setConfirmCancel(false);
                            });
                        }}
                      >
                        <XCircle className="size-3.5" strokeWidth={2.25} />
                        {busy === "cancel" ? "Cancelling…" : "Yes, cancel"}
                      </Button>
                      <Button
                        type="button"
                        variant="white"
                        size="sm"
                        className="border border-line"
                        onClick={() => setConfirmCancel(false)}
                      >
                        Keep
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="white"
                    size="sm"
                    className="w-full border border-line"
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancel order
                  </Button>
                )
              ) : (
                <p className="text-[11px] leading-snug text-muted">
                  Can’t cancel after acceptance — use Need help.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-ink px-4 py-3.5 text-white">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
              Payment
            </h2>
            <p className="mt-1 text-[13px] text-white/90">
              {order.paymentMethod === "online"
                ? "Online payment"
                : "Cash on delivery"}
            </p>
            <dl className="mt-3 space-y-1.5 text-[13px]">
              <Row
                label="Subtotal"
                value={formatPrice(order.totals?.subtotal ?? 0)}
              />
              <Row
                label="Shipping"
                value={formatPrice(order.totals?.shipping ?? 0)}
              />
              {(order.totals?.discount ?? 0) > 0 ? (
                <Row
                  label="Discount"
                  value={`−${formatPrice(order.totals?.discount ?? 0)}`}
                />
              ) : null}
            </dl>
            <div className="mt-3 flex items-end justify-between gap-2 border-t border-white/15 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                Total
              </span>
              <span className="font-display text-2xl leading-none tracking-wide">
                {formatPrice(order.totals?.total ?? 0)}
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-white/70">
      <dt>{label}</dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  );
}

function ItemCard({
  item,
  price,
  expandChanges,
}: {
  item: CustomerOrderItem;
  price: string;
  expandChanges?: boolean;
}) {
  const snap = item.measurementSnapshot || {};
  const meta = [item.materialName, item.colorName].filter(Boolean).join(" · ");
  const setName = snap.setName?.trim();
  const gender =
    snap.gender === "female"
      ? "Female"
      : snap.gender === "male"
        ? "Male"
        : "";
  const size =
    snap.size &&
    snap.size !== item.materialName &&
    !String(snap.size).includes("/")
      ? snap.size
      : "";
  const edits = (snap.adminEdits || []) as MeasAdminEdit[];
  const hasEdits = edits.length > 0;
  const [openChanges, setOpenChanges] = useState(!!expandChanges && hasEdits);
  const [openMeas, setOpenMeas] = useState(false);
  const topRows = measurementRows(snap.gender, "top", snap.top);
  const bottomRows = measurementRows(snap.gender, "bottom", snap.bottom);

  useEffect(() => {
    if (expandChanges && hasEdits) setOpenChanges(true);
  }, [expandChanges, hasEdits]);

  return (
    <article className="rounded-2xl border border-line bg-paper p-3">
      <div className="flex gap-3">
        <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-line bg-soft sm:size-[4.5rem]">
          {item.imageUrl ? (
            <img
              src={resolveMediaUrl(item.imageUrl)}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center font-display text-lg text-muted">
              {item.productName.slice(0, 1)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display text-lg leading-tight tracking-wide text-ink sm:text-xl">
              {item.productName}
            </h2>
            <p className="shrink-0 text-[13px] font-bold text-ink">{price}</p>
          </div>
          <p className="mt-0.5 text-[12px] leading-snug text-muted">
            Qty {item.qty}
            {meta ? ` · ${meta}` : ""}
            {size ? ` · Size ${size}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2 py-1 text-[11px] font-semibold text-ink">
              <Ruler className="size-3 text-orange" strokeWidth={2.25} />
              {setName || "No named set"}
            </span>
            {gender ? (
              <span className="rounded-full bg-ink px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                {gender}
              </span>
            ) : null}
            {snap.unit ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {snap.unit}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {hasEdits ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-orange/30 bg-orange/5">
          <button
            type="button"
            onClick={() => setOpenChanges((v) => !v)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
          >
            <span className="min-w-0 flex-1 text-[12px] font-semibold text-ink">
              Measurements changed by admin as per your request
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted transition-transform",
                openChanges && "rotate-180"
              )}
            />
          </button>
          {openChanges ? (
            <div className="space-y-2 border-t border-orange/20 px-3 py-2.5">
              {edits.map((edit, idx) => (
                <div key={`${edit.at || idx}`}>
                  {edit.at ? (
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                      {new Date(edit.at).toLocaleString()}
                    </p>
                  ) : null}
                  <ul className="mt-1 space-y-1">
                    {(edit.changes || []).map((change, cIdx) => (
                      <li
                        key={`${change.key}-${cIdx}`}
                        className="text-[12px] text-ink"
                      >
                        <span className="font-semibold">
                          {change.label || change.key}
                        </span>
                        {change.section === "top"
                          ? " (shirt/top)"
                          : change.section === "bottom"
                            ? " (trousers/pant)"
                            : ""}
                        :{" "}
                        <span className="text-muted">
                          {change.from || "—"}
                        </span>
                        {" → "}
                        <span className="font-semibold">{change.to || "—"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {topRows.length || bottomRows.length ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-line">
          <button
            type="button"
            onClick={() => setOpenMeas((v) => !v)}
            className="flex w-full items-center gap-2 bg-soft/60 px-3 py-2 text-left"
          >
            <span className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {openMeas ? "Hide current measurements" : "Current measurements"}
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted transition-transform",
                openMeas && "rotate-180"
              )}
            />
          </button>
          {openMeas ? (
            <div className="grid gap-3 px-3 py-2.5 sm:grid-cols-2">
              {topRows.length ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                    {snap.gender === "female" ? "Top" : "Shirt"}
                  </p>
                  <dl className="mt-1 space-y-1">
                    {topRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between gap-2 text-[12px]"
                      >
                        <dt className="text-muted">{row.label}</dt>
                        <dd className="font-semibold tabular-nums text-ink">
                          {row.value}
                          {snap.unit ? ` ${snap.unit}` : ""}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
              {bottomRows.length ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                    {snap.gender === "female" ? "Pant" : "Trouser"}
                  </p>
                  <dl className="mt-1 space-y-1">
                    {bottomRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between gap-2 text-[12px]"
                      >
                        <dt className="text-muted">{row.label}</dt>
                        <dd className="font-semibold tabular-nums text-ink">
                          {row.value}
                          {snap.unit ? ` ${snap.unit}` : ""}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
