"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/Shell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Pagination } from "@/components/Pagination";
import { DatePicker } from "@/components/DatePicker";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

type OrderItem = {
  id: string;
  productName: string;
  materialName: string;
  colorName: string;
  colorHex: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string;
  measurementSnapshot?: Record<string, unknown>;
};

type Order = {
  id: string;
  status: string;
  statusLabel?: string;
  email: string;
  paymentMethod: string;
  paymentStatus: string;
  couponCode?: string;
  dealTitle?: string;
  adminNote?: string;
  itemCount?: number;
  shipping: Record<string, unknown>;
  totals: {
    subtotal?: number;
    discount?: number;
    discountLabel?: string;
    shipping?: number;
    total?: number;
    paidAmount?: number;
  };
  measurementSnapshot?: Record<string, unknown>;
  items: OrderItem[];
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    address?: Record<string, unknown>;
  };
  createdAt: string;
};

type Facets = {
  all: number;
  new: number;
  toAccept: number;
  accepted: number;
  outForDelivery: number;
  delivered: number;
  rejected: number;
  refunded: number;
  cod: number;
  online: number;
};

type StatusFilter =
  | "all"
  | "pending"
  | "accepted"
  | "out_for_delivery"
  | "delivered"
  | "rejected"
  | "refunded";

type PaymentFilter = "" | "cod" | "online";

const STATUS_FILTERS: {
  id: StatusFilter;
  label: string;
  facet: keyof Facets;
}[] = [
  { id: "all", label: "All orders", facet: "all" },
  { id: "pending", label: "New / to accept", facet: "toAccept" },
  { id: "accepted", label: "Accepted", facet: "accepted" },
  { id: "out_for_delivery", label: "Out for delivery", facet: "outForDelivery" },
  { id: "delivered", label: "Delivered", facet: "delivered" },
  { id: "rejected", label: "Rejected", facet: "rejected" },
  { id: "refunded", label: "Refunded", facet: "refunded" },
];

function money(n?: number) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function shipField(shipping: Record<string, unknown>, key: string) {
  const v = shipping?.[key];
  return typeof v === "string" ? v : "";
}

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function fieldPairs(values: unknown): { label: string; value: string }[] {
  if (!values || typeof values !== "object" || Array.isArray(values)) return [];
  return Object.entries(values as Record<string, unknown>)
    .map(([key, value]) => ({
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim(),
      value: String(value ?? "").trim(),
    }))
    .filter((row) => row.value);
}

function orderTitle(order: Order) {
  const names = (order.items || [])
    .map((item) => item.productName?.trim())
    .filter(Boolean);
  if (names.length === 0) return `Order ${order.id.slice(0, 8)}`;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]}, ${names[1]} +${names.length - 2}`;
}

function MeasurementBlock({
  snap,
}: {
  snap?: Record<string, unknown> | null;
}) {
  if (!snap || typeof snap !== "object") {
    return (
      <p className="mt-1.5 text-[11px] text-[var(--muted)]">
        No measurements on this piece.
      </p>
    );
  }
  const setName = str(snap.setName) || "Unnamed set";
  const gender = str(snap.gender);
  const unit = str(snap.unit);
  const notes = str(snap.notes);
  const top = fieldPairs(snap.top);
  const bottom = fieldPairs(snap.bottom);
  const genderLabel =
    gender === "female" ? "Female" : gender === "male" ? "Male" : gender;

  return (
    <div className="mt-2 rounded-lg border border-[var(--line)] bg-[var(--soft)]/60 px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-[var(--ink)]">
          {setName}
        </span>
        {genderLabel ? (
          <span className="rounded-full bg-[var(--ink)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            {genderLabel}
          </span>
        ) : null}
        {unit ? (
          <span className="text-[10px] font-semibold uppercase text-[var(--muted)]">
            {unit}
          </span>
        ) : null}
      </div>
      {top.length || bottom.length ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {top.length ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                {gender === "female" ? "Top" : "Shirt"}
              </p>
              <dl className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
                {top.map((row) => (
                  <div key={row.label}>
                    <dt className="text-[10px] text-[var(--muted)]">
                      {row.label}
                    </dt>
                    <dd className="text-[11px] font-semibold tabular-nums">
                      {row.value}
                      {unit ? ` ${unit}` : ""}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
          {bottom.length ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                {gender === "female" ? "Pant" : "Trouser"}
              </p>
              <dl className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
                {bottom.map((row) => (
                  <div key={row.label}>
                    <dt className="text-[10px] text-[var(--muted)]">
                      {row.label}
                    </dt>
                    <dd className="text-[11px] font-semibold tabular-nums">
                      {row.value}
                      {unit ? ` ${unit}` : ""}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          Set saved — no field values on this line.
        </p>
      )}
      {notes ? (
        <p className="mt-1.5 text-[11px] text-[var(--muted)]">{notes}</p>
      ) : null}
    </div>
  );
}

function statusTone(status: string) {
  switch (status) {
    case "pending":
      return "bg-[var(--orange)]/15 text-[var(--ink)]";
    case "accepted":
      return "bg-emerald-50 text-emerald-800";
    case "out_for_delivery":
      return "bg-sky-50 text-sky-800";
    case "delivered":
      return "bg-[var(--forest)] text-[var(--paper)]";
    case "rejected":
      return "bg-red-50 text-red-700";
    case "refunded":
      return "bg-amber-50 text-amber-800";
    case "cancelled":
      return "bg-stone-100 text-stone-600";
    default:
      return "bg-[var(--soft)] text-[var(--muted)]";
  }
}

export default function OrdersPage() {
  return (
    <Shell>
      <Suspense
        fallback={<p className="text-sm text-[var(--muted)]">Loading orders…</p>}
      >
        <OrdersWorkbench />
      </Suspense>
    </Shell>
  );
}

function OrdersWorkbench() {
  const search = useSearchParams();
  const focusId = search.get("focus");
  const statusParam = search.get("status") as StatusFilter | null;
  const [items, setItems] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>(
    statusParam &&
      [
        "all",
        "pending",
        "accepted",
        "out_for_delivery",
        "delivered",
        "rejected",
        "refunded",
      ].includes(statusParam)
      ? statusParam
      : "pending"
  );
  const [payment, setPayment] = useState<PaymentFilter>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [pendingAction, setPendingAction] = useState<
    null | "accept" | "reject" | "refund" | "ship" | "deliver"
  >(null);

  useEffect(() => {
    if (
      statusParam &&
      [
        "all",
        "pending",
        "accepted",
        "out_for_delivery",
        "delivered",
        "rejected",
        "refunded",
      ].includes(statusParam)
    ) {
      setStatus(statusParam);
      setPage(1);
    }
  }, [statusParam]);

  const query = useMemo(() => {
    const offset = (page - 1) * PAGE_SIZE;
    const params = new URLSearchParams({
      status,
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (payment) params.set("payment", payment);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [page, status, payment, from, to]);

  const load = useCallback(async () => {
    setError("");
    const data = await api<{ items: Order[]; total: number; facets: Facets }>(
      `/api/v1/admin/orders?${query}`
    );
    setItems(data.items || []);
    setTotal(data.total || 0);
    setFacets(data.facets || null);
  }, [query]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function openOrder(id: string) {
    setError("");
    try {
      const o = await api<Order>(`/api/v1/admin/orders/${id}`);
      setSelected(o);
      setNote(o.adminNote || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  useEffect(() => {
    if (!focusId) return;
    void openOrder(focusId);
  }, [focusId]);

  function requestAct(
    action: "accept" | "reject" | "refund" | "ship" | "deliver"
  ) {
    if (!selected) return;
    setPendingAction(action);
  }

  async function confirmAct() {
    if (!selected || !pendingAction) return;
    const action = pendingAction;
    setBusy(true);
    setError("");
    try {
      const o = await api<Order>(`/api/v1/admin/orders/${selected.id}/action`, {
        method: "POST",
        body: JSON.stringify({ action, note }),
      });
      setSelected(o);
      setPendingAction(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const shipping = (selected?.shipping || {}) as Record<string, unknown>;

  const actionCopy = (() => {
    if (!selected || !pendingAction) return null;
    const title =
      pendingAction === "accept"
        ? "Accept this order?"
        : pendingAction === "reject"
          ? selected.paymentMethod === "online" &&
            selected.paymentStatus === "paid"
            ? "Reject & refund?"
            : "Reject this order?"
          : pendingAction === "refund"
            ? "Refund this order?"
            : pendingAction === "ship"
              ? "Out for delivery?"
              : "Mark delivered?";
    const message =
      pendingAction === "accept"
        ? "The customer will see this move to Order Accepted."
        : pendingAction === "reject"
          ? selected.paymentMethod === "online" &&
            selected.paymentStatus === "paid"
            ? "This paid order will be rejected and refunded. Stock will be restored."
            : "This order will be rejected and stock will be restored."
          : pendingAction === "refund"
            ? "Refund this paid online order? Stock will be restored."
            : pendingAction === "ship"
              ? "Mark this order as out for delivery for the customer."
              : "Confirm delivery is complete for this order.";
    const confirmLabel =
      pendingAction === "accept"
        ? "Accept order"
        : pendingAction === "reject"
          ? selected.paymentMethod === "online" &&
            selected.paymentStatus === "paid"
            ? "Reject & refund"
            : "Reject order"
          : pendingAction === "refund"
            ? "Refund"
            : pendingAction === "ship"
              ? "Mark out for delivery"
              : "Mark delivered";
    const tone =
      pendingAction === "reject" || pendingAction === "refund"
        ? ("danger" as const)
        : pendingAction === "deliver"
          ? ("success" as const)
          : ("default" as const);
    return { title, message, confirmLabel, tone };
  })();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Orders</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            New → Accepted → Out for delivery → Delivered. Filters, dates, and
            pagination are indexed server-side.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setStatus(f.id);
              setPage(1);
              setSelected(null);
            }}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold",
              status === f.id
                ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]"
                : "border-[var(--line)] bg-white"
            )}
          >
            {f.label}
            {facets ? (
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] tabular-nums",
                  status === f.id
                    ? "bg-white/15"
                    : "bg-[var(--soft)] text-[var(--muted)]"
                )}
              >
                {facets[f.facet]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="flex gap-1.5">
          {(
            [
              ["", "All payments"],
              ["cod", "COD"],
              ["online", "Online"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id || "all-pay"}
              type="button"
              onClick={() => {
                setPayment(id);
                setPage(1);
              }}
              className={cn(
                "h-8 rounded-lg border px-3 text-[12px] font-semibold",
                payment === id
                  ? "border-[var(--orange)] bg-[var(--orange)]/15"
                  : "border-[var(--line)] bg-white"
              )}
            >
              {label}
              {facets && id === "cod" ? ` (${facets.cod})` : null}
              {facets && id === "online" ? ` (${facets.online})` : null}
            </button>
          ))}
        </div>
        <DatePicker
          label="From"
          value={from}
          max={to || undefined}
          onChange={(v) => {
            setFrom(v);
            setPage(1);
          }}
        />
        <DatePicker
          label="To"
          value={to}
          min={from || undefined}
          onChange={(v) => {
            setTo(v);
            setPage(1);
          }}
        />
        {(from || to || payment) && (
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
              setPayment("");
              setPage(1);
            }}
            className="mb-0.5 h-10 rounded-xl border border-[var(--line)] bg-white px-3 text-[12px] font-semibold text-[var(--muted)] transition hover:border-[var(--orange)] hover:text-[var(--ink)]"
          >
            Clear dates / payment
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 xl:h-[calc(100dvh-240px)] xl:min-h-[480px] xl:grid-cols-[0.95fr_1.05fr] xl:gap-5">
        <section
          className={cn(
            "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white",
            selected ? "max-h-[34vh] xl:max-h-none" : "max-h-[70vh] xl:max-h-none"
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <ul className="divide-y divide-[var(--line)]">
              {items.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => openOrder(o.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-[var(--soft)]/60",
                      selected?.id === o.id && "bg-[var(--orange)]/10"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[var(--ink)]">
                        {o.customer?.name ||
                          shipField(o.shipping, "fullName") ||
                          o.email}
                      </p>
                      <p className="text-[11px] text-[var(--muted)]">
                        {new Date(o.createdAt).toLocaleString()} ·{" "}
                        {o.paymentMethod === "online" ? "Online" : "COD"} ·{" "}
                        {o.itemCount ?? o.items?.length ?? 0} item
                        {(o.itemCount ?? o.items?.length ?? 0) === 1 ? "" : "s"}
                      </p>
                      <span
                        className={cn(
                          "mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          statusTone(o.status)
                        )}
                      >
                        {o.statusLabel || o.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold tabular-nums">
                        {money(o.totals?.total)}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                        {o.paymentStatus}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
              {items.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-[var(--muted)]">
                  No orders in this filter.
                </li>
              ) : null}
            </ul>
          </div>
          <div className="shrink-0 border-t border-[var(--line)] bg-white">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </div>
        </section>

        <section
          className={cn(
            "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white",
            selected ? "max-h-[58vh] xl:max-h-none" : "min-h-[200px] xl:max-h-none"
          )}
        >
          {!selected ? (
            <div className="grid flex-1 place-items-center px-6 py-16 text-center">
              <p className="text-[13px] text-[var(--muted)]">
                Select an order to review details and update status.
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
                <div>
                  <p className="text-[15px] font-bold text-[var(--ink)]">
                    {orderTitle(selected)}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {new Date(selected.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                      statusTone(selected.status)
                    )}
                  >
                    {selected.statusLabel || selected.status}
                  </span>
                  <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                    {selected.paymentMethod === "online" ? "Online" : "COD"}
                  </span>
                  <span className="rounded-full bg-[var(--soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                    Pay: {selected.paymentStatus}
                  </span>
                </div>
              </header>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Customer
                  </p>
                  <p className="mt-1 text-[13px] font-semibold">
                    {selected.customer?.name ||
                      shipField(shipping, "fullName") ||
                      "—"}
                  </p>
                  <p className="text-[12px] text-[var(--muted)]">
                    {selected.customer?.email || selected.email}
                  </p>
                  <p className="text-[12px] text-[var(--muted)]">
                    {selected.customer?.phone ||
                      shipField(shipping, "phone") ||
                      "No phone"}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Shipping address
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink)]">
                    {[
                      shipField(shipping, "address"),
                      shipField(shipping, "city"),
                      shipField(shipping, "state"),
                      shipField(shipping, "zip"),
                      shipField(shipping, "country"),
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Totals
                </p>
                <dl className="mt-2 space-y-1 text-[12px]">
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd className="font-semibold tabular-nums">
                      {money(selected.totals?.subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>
                      Discount
                      {selected.totals?.discountLabel
                        ? ` (${selected.totals.discountLabel})`
                        : selected.dealTitle
                          ? ` (${selected.dealTitle})`
                          : ""}
                    </dt>
                    <dd className="font-semibold tabular-nums text-[#b42318]">
                      −{money(selected.totals?.discount)}
                    </dd>
                  </div>
                  {selected.couponCode ? (
                    <div className="flex justify-between">
                      <dt>Coupon</dt>
                      <dd className="font-semibold">{selected.couponCode}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <dt>Shipping</dt>
                    <dd className="font-semibold tabular-nums">
                      {money(selected.totals?.shipping)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-[var(--line)] pt-1 text-[13px]">
                    <dt className="font-bold">
                      {selected.paymentStatus === "paid"
                        ? "Paid"
                        : "Order total"}
                    </dt>
                    <dd className="font-bold tabular-nums">
                      {money(
                        selected.totals?.paidAmount ?? selected.totals?.total
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Products & measurements
                </p>
                <ul className="space-y-2.5">
                  {(selected.items || []).map((it) => (
                    <li
                      key={it.id}
                      className="rounded-xl border border-[var(--line)] p-2.5"
                    >
                      <div className="flex gap-3">
                        <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-[var(--soft)]">
                          {it.imageUrl ? (
                            <img
                              src={it.imageUrl}
                              alt=""
                              className="size-full object-cover object-top"
                            />
                          ) : null}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold">
                            {it.productName}
                          </p>
                          <p className="text-[11px] text-[var(--muted)]">
                            {[it.materialName, it.colorName]
                              .filter(Boolean)
                              .join(" · ")}
                            {it.qty ? ` · qty ${it.qty}` : ""}
                          </p>
                          <p className="text-[12px] font-bold tabular-nums">
                            {money(it.lineTotal)}
                          </p>
                        </div>
                      </div>
                      <MeasurementBlock snap={it.measurementSnapshot} />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 border-t border-[var(--line)] pt-3">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Admin note
                  </span>
                  <input
                    className="mt-1.5 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-[13px] outline-none focus:border-[var(--orange)]"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {selected.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => requestAct("accept")}
                        className="h-10 rounded-full bg-[var(--orange)] px-4 text-[12px] font-semibold text-[var(--ink)] disabled:opacity-50"
                      >
                        Accept order
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => requestAct("reject")}
                        className="h-10 rounded-full border border-[#b42318] px-4 text-[12px] font-semibold text-[#b42318] disabled:opacity-50"
                      >
                        {selected.paymentMethod === "online" &&
                        selected.paymentStatus === "paid"
                          ? "Reject & refund"
                          : "Reject order"}
                      </button>
                    </>
                  ) : null}
                  {selected.status === "accepted" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => requestAct("ship")}
                      className="h-10 rounded-full bg-[var(--forest)] px-4 text-[12px] font-semibold text-[var(--paper)] disabled:opacity-50"
                    >
                      Mark out for delivery
                    </button>
                  ) : null}
                  {selected.status === "out_for_delivery" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => requestAct("deliver")}
                      className="h-10 rounded-full bg-[var(--forest)] px-4 text-[12px] font-semibold text-[var(--paper)] disabled:opacity-50"
                    >
                      Mark delivered
                    </button>
                  ) : null}
                  {selected.status !== "pending" &&
                  selected.status !== "accepted" &&
                  selected.status !== "out_for_delivery" ? (
                    <p className="text-[12px] text-[var(--muted)]">
                      {selected.adminNote
                        ? `Note: ${selected.adminNote}`
                        : `No further actions — ${selected.statusLabel || selected.status}.`}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(pendingAction && actionCopy)}
        title={actionCopy?.title || ""}
        message={actionCopy?.message || ""}
        confirmLabel={actionCopy?.confirmLabel}
        tone={actionCopy?.tone || "default"}
        busy={busy}
        onCancel={() => {
          if (!busy) setPendingAction(null);
        }}
        onConfirm={() => void confirmAct()}
      />
    </>
  );
}
