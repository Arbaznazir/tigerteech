"use client";

import {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ExternalLink, Pencil, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000";

type MeasSnap = Record<string, unknown>;

type OrderTotals = {
  total?: number;
  refundAmount?: number;
  cancellationFee?: number;
  cancelledFromQuery?: boolean;
};

type OrderItem = {
  id: string;
  productId?: string;
  productName: string;
  productSlug?: string;
  qty: number;
  materialName?: string;
  colorName?: string;
  measurementSnapshot?: MeasSnap;
};

type Ticket = {
  id: string;
  orderId?: string;
  status: string;
  userBurst: number;
  reopenCount?: number;
  reopensRemaining?: number;
  adminUnread?: boolean;
  userName: string;
  userPhone: string;
  userEmail: string;
  orderName: string;
  preview?: string;
  updatedAt: string;
  messages?: { id: string; sender: string; body: string; createdAt: string }[];
  order?: {
    id: string;
    createdAt: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    statusLabel?: string;
    email?: string;
    shipping?: Record<string, string | unknown>;
    totals?: OrderTotals;
    items?: OrderItem[];
  };
};

type ShipDraft = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

function shipDraftFrom(ship: Record<string, unknown>): ShipDraft {
  return {
    fullName: str(ship.fullName),
    email: str(ship.email),
    phone: str(ship.phone),
    address: str(ship.address),
    city: str(ship.city),
    state: str(ship.state),
    zip: str(ship.zip),
    country: str(ship.country),
  };
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

function statusTone(status: string) {
  switch (status) {
    case "pending":
      return "bg-[var(--orange)]/20 text-[var(--ink)] ring-1 ring-[var(--orange)]/40";
    case "accepted":
      return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
    case "out_for_delivery":
      return "bg-sky-50 text-sky-800 ring-1 ring-sky-200";
    case "delivered":
      return "bg-[var(--forest)] text-[var(--paper)] ring-1 ring-[var(--forest)]";
    case "rejected":
      return "bg-red-50 text-red-700 ring-1 ring-red-200";
    case "refunded":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200";
    case "cancelled":
      return "bg-stone-100 text-stone-600 ring-1 ring-stone-200";
    default:
      return "bg-[var(--soft)] text-[var(--muted)] ring-1 ring-[var(--line)]";
  }
}

function paymentTone(method: string, paymentStatus: string) {
  if (paymentStatus === "paid") {
    return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  }
  if (paymentStatus === "refunded") {
    return "bg-amber-50 text-amber-900 ring-1 ring-amber-200";
  }
  if (method === "online") {
    return "bg-violet-50 text-violet-800 ring-1 ring-violet-200";
  }
  return "bg-[var(--orange)]/15 text-[var(--ink)] ring-1 ring-[var(--orange)]/35";
}

function paymentLabel(method: string, paymentStatus: string) {
  const base = method === "online" ? "Online" : "Cash on delivery";
  if (paymentStatus === "paid") return `${base} · Paid`;
  if (paymentStatus === "refunded") return `${base} · Refunded`;
  if (paymentStatus === "pending") return `${base} · Pending`;
  return base;
}

function asStringMap(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    out[k] = String(val ?? "").trim();
  }
  return out;
}

function MeasurementAccordion({
  snap,
  canEdit,
  saving,
  onSave,
}: {
  snap?: MeasSnap | null;
  canEdit: boolean;
  saving?: boolean;
  onSave: (payload: {
    top: Record<string, string>;
    bottom: Record<string, string>;
    notes: string;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [topDraft, setTopDraft] = useState<Record<string, string>>({});
  const [bottomDraft, setBottomDraft] = useState<Record<string, string>>({});
  const [notesDraft, setNotesDraft] = useState("");

  if (!snap || typeof snap !== "object") {
    return (
      <p className="mt-1.5 text-[11px] text-[var(--muted)]">No measurements</p>
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
  const hasFields = top.length > 0 || bottom.length > 0;

  const startEdit = () => {
    setTopDraft(asStringMap(snap.top));
    setBottomDraft(asStringMap(snap.bottom));
    setNotesDraft(notes);
    setEditing(true);
    setOpen(true);
  };

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-[var(--line)] bg-white">
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left transition hover:bg-[var(--soft)]/80"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold text-[var(--ink)]">
              {setName}
              {genderLabel ? (
                <span className="font-normal text-[var(--muted)]">
                  {" "}
                  · {genderLabel}
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
              {open ? "Hide measurements" : "View measurements"}
              {unit ? ` · ${unit}` : ""}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-[var(--muted)] transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
        {canEdit ? (
          <button
            type="button"
            title="Edit measurements"
            onClick={startEdit}
            className="shrink-0 border-l border-[var(--line)] px-2.5 text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--ink)]"
          >
            <Pencil className="size-3.5" />
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="border-t border-[var(--line)] bg-[var(--soft)]/50 px-2.5 py-2.5">
          {editing ? (
            <div className="space-y-3">
              {Object.keys(topDraft).length ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {gender === "female" ? "Top" : "Shirt"}
                  </p>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {Object.entries(topDraft).map(([key, value]) => (
                      <label key={key} className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/_/g, " ")
                            .trim()}
                        </span>
                        <input
                          value={value}
                          onChange={(e) =>
                            setTopDraft((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="mt-0.5 h-8 w-full rounded-lg border border-[var(--line)] bg-white px-2 text-[12px] outline-none focus:border-[var(--ink)]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
              {Object.keys(bottomDraft).length ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {gender === "female" ? "Pant" : "Trouser"}
                  </p>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {Object.entries(bottomDraft).map(([key, value]) => (
                      <label key={key} className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/_/g, " ")
                            .trim()}
                        </span>
                        <input
                          value={value}
                          onChange={(e) =>
                            setBottomDraft((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="mt-0.5 h-8 w-full rounded-lg border border-[var(--line)] bg-white px-2 text-[12px] outline-none focus:border-[var(--ink)]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="block">
                <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Notes
                </span>
                <input
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="mt-0.5 h-8 w-full rounded-lg border border-[var(--line)] bg-white px-2 text-[12px] outline-none focus:border-[var(--ink)]"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    onSave({
                      top: topDraft,
                      bottom: bottomDraft,
                      notes: notesDraft,
                    });
                    setEditing(false);
                  }}
                  className="rounded-full bg-[var(--ink)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditing(false)}
                  className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]"
                >
                  Discard
                </button>
              </div>
            </div>
          ) : hasFields ? (
            <div className="grid gap-3">
              {top.length ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {gender === "female" ? "Top" : "Shirt"}
                  </p>
                  <dl className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {top.map((row) => (
                      <div
                        key={row.label}
                        className="rounded-lg bg-white px-2 py-1.5 ring-1 ring-[var(--line)]"
                      >
                        <dt className="text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                          {row.label}
                        </dt>
                        <dd className="mt-0.5 text-[12px] font-semibold tabular-nums text-[var(--ink)]">
                          {row.value}
                          {unit ? (
                            <span className="ml-0.5 text-[10px] font-medium text-[var(--muted)]">
                              {unit}
                            </span>
                          ) : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
              {bottom.length ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {gender === "female" ? "Pant" : "Trouser"}
                  </p>
                  <dl className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {bottom.map((row) => (
                      <div
                        key={row.label}
                        className="rounded-lg bg-white px-2 py-1.5 ring-1 ring-[var(--line)]"
                      >
                        <dt className="text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                          {row.label}
                        </dt>
                        <dd className="mt-0.5 text-[12px] font-semibold tabular-nums text-[var(--ink)]">
                          {row.value}
                          {unit ? (
                            <span className="ml-0.5 text-[10px] font-medium text-[var(--muted)]">
                              {unit}
                            </span>
                          ) : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--muted)]">
              Set saved — no field values on this line.
            </p>
          )}
          {!editing && notes ? (
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">
              {notes}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function QueriesPage() {
  return (
    <Shell>
      <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading…</p>}>
        <Queries />
      </Suspense>
    </Shell>
  );
}

function Queries() {
  const search = useSearchParams();
  const ticketParam = search.get("ticket");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeId, setActiveId] = useState<string | null>(ticketParam);
  const [active, setActive] = useState<Ticket | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const markingRef = useRef(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMode, setCancelMode] = useState<"cancel" | "refund">("cancel");
  const [refundAmount, setRefundAmount] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [measSavingId, setMeasSavingId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [shipDraft, setShipDraft] = useState<ShipDraft | null>(null);
  const [addressBusy, setAddressBusy] = useState(false);
  const [confirmAddress, setConfirmAddress] = useState(false);

  useEffect(() => {
    setCancelOpen(false);
    setConfirmCancel(false);
    setCancelNote("");
    setEditingAddress(false);
    setConfirmAddress(false);
    setShipDraft(null);
    const total = active?.order?.totals?.total;
    setRefundAmount(
      total != null && Number.isFinite(total) ? String(total) : ""
    );
    setCancelMode(
      active?.order?.paymentMethod === "online" &&
        active?.order?.paymentStatus === "paid"
        ? "refund"
        : "cancel"
    );
  }, [active?.order?.id, active?.order?.paymentMethod, active?.order?.paymentStatus, active?.order?.totals?.total]);

  const loadList = useCallback(async () => {
    const data = await api<{ items: Ticket[] }>("/api/v1/admin/support/tickets");
    setTickets(data.items || []);
  }, []);

  const loadOne = useCallback(async (id: string) => {
    const data = await api<Ticket>(`/api/v1/admin/support/tickets/${id}`);
    setActive(data);
    return data;
  }, []);

  const markReadIfNeeded = useCallback(async (ticket: Ticket) => {
    if (!ticket.adminUnread || markingRef.current) return;
    markingRef.current = true;
    try {
      const next = await api<Ticket>(
        `/api/v1/admin/support/tickets/${ticket.id}/read`,
        { method: "POST" }
      );
      setActive(next);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticket.id ? { ...t, adminUnread: false } : t
        )
      );
    } catch {
      /* ignore */
    } finally {
      markingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (ticketParam) setActiveId(ticketParam);
  }, [ticketParam]);

  useEffect(() => {
    void loadList().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed")
    );
  }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    const sync = async () => {
      try {
        const ticket = await loadOne(activeId);
        await markReadIfNeeded(ticket);
        await loadList();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    };
    void sync();
    const timer = window.setInterval(() => {
      void sync().catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [activeId, loadOne, loadList, markReadIfNeeded]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!activeId || !body.trim()) return;
    void api<Ticket>(`/api/v1/admin/support/tickets/${activeId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: body.trim() }),
    })
      .then((next) => {
        setActive(next);
        setBody("");
        void loadList();
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not send")
      );
  };

  const resolve = () => {
    if (!activeId) return;
    void api<Ticket>(`/api/v1/admin/support/tickets/${activeId}/resolve`, {
      method: "POST",
    })
      .then((next) => {
        setActive(next);
        void loadList();
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not resolve")
      );
  };

  const orderId = active?.order?.id || active?.orderId;
  const orderStatus = active?.order?.status || "";
  const canCancelOrder =
    !!orderId && (orderStatus === "pending" || orderStatus === "accepted");
  const canEditMeas =
    orderStatus === "pending" || orderStatus === "accepted";
  const canEditAddress =
    orderStatus === "pending" ||
    orderStatus === "accepted" ||
    orderStatus === "out_for_delivery";
  const isOnlinePaid =
    active?.order?.paymentMethod === "online" &&
    active?.order?.paymentStatus === "paid";
  const orderTotal = Number(active?.order?.totals?.total || 0);
  const parsedRefund = Number(refundAmount);
  const refundValid =
    Number.isFinite(parsedRefund) &&
    parsedRefund >= 0 &&
    parsedRefund <= orderTotal;
  const feePreview = refundValid ? Math.max(0, orderTotal - parsedRefund) : 0;

  const runCancel = () => {
    if (!orderId || !canCancelOrder) return;
    setCancelBusy(true);
    const refund = cancelMode === "refund" && isOnlinePaid;
    void api(`/api/v1/admin/orders/${orderId}/cancel-query`, {
      method: "POST",
      body: JSON.stringify({
        refund,
        refundAmount: refund ? parsedRefund : undefined,
        note: cancelNote.trim() || undefined,
      }),
    })
      .then(async () => {
        setConfirmCancel(false);
        setCancelOpen(false);
        if (activeId) {
          const ticket = await loadOne(activeId);
          setActive(ticket);
        }
        void loadList();
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not cancel order")
      )
      .finally(() => setCancelBusy(false));
  };

  const saveMeasurements = (
    itemId: string,
    payload: {
      top: Record<string, string>;
      bottom: Record<string, string>;
      notes: string;
    }
  ) => {
    if (!orderId) return;
    setMeasSavingId(itemId);
    void api(`/api/v1/admin/orders/${orderId}/items/${itemId}/measurements`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
      .then(async () => {
        if (activeId) {
          const ticket = await loadOne(activeId);
          setActive(ticket);
        }
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Could not save measurements"
        )
      )
      .finally(() => setMeasSavingId(null));
  };

  const startEditAddress = () => {
    const ship = (active?.order?.shipping || {}) as Record<string, unknown>;
    setShipDraft(shipDraftFrom(ship));
    setEditingAddress(true);
  };

  const runSaveAddress = () => {
    if (!orderId || !shipDraft || !canEditAddress) return;
    if (!shipDraft.address.trim() || !shipDraft.city.trim()) {
      setError("Address and city are required.");
      return;
    }
    setAddressBusy(true);
    setError("");
    void api(`/api/v1/admin/orders/${orderId}/shipping`, {
      method: "PATCH",
      body: JSON.stringify(shipDraft),
    })
      .then(async () => {
        setConfirmAddress(false);
        setEditingAddress(false);
        setShipDraft(null);
        if (activeId) {
          const ticket = await loadOne(activeId);
          setActive(ticket);
        }
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Could not update address"
        )
      )
      .finally(() => setAddressBusy(false));
  };

  const ship = (active?.order?.shipping || {}) as Record<string, unknown>;
  const address = [ship.address, ship.city, ship.state, ship.zip, ship.country]
    .filter((v) => typeof v === "string" && v.trim())
    .join(", ");
  const addressChanged = Boolean(ship.addressChangedAsRequested);
  const addressPreview = shipDraft
    ? [shipDraft.address, shipDraft.city, shipDraft.state, shipDraft.zip, shipDraft.country]
        .filter((v) => v.trim())
        .join(", ")
    : "";

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Queries</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Customer help chats. Opening a chat marks it read. A reply unlocks three
        more customer messages.
      </p>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-5 grid min-h-[72vh] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_12px_40px_rgba(18,16,14,0.06)] lg:grid-cols-[250px_minmax(0,1fr)_300px]">
        <aside className="flex max-h-[72vh] flex-col border-b border-[var(--line)] bg-[var(--soft)]/40 lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-[var(--line)] px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Conversations
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--ink)]">
              {tickets.filter((t) => t.adminUnread).length} unread ·{" "}
              {tickets.length} total
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {tickets.length === 0 ? (
              <p className="p-3 text-sm text-[var(--muted)]">No queries yet.</p>
            ) : (
              <ul>
                {tickets.map((ticket) => {
                  const selected = activeId === ticket.id;
                  const showReopened =
                    ticket.status === "open" && (ticket.reopenCount || 0) > 0;
                  return (
                    <li key={ticket.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(ticket.id)}
                        className={cn(
                          "relative block w-full border-b border-[var(--line)] px-3 py-2 text-left transition",
                          selected
                            ? "bg-white shadow-[inset_3px_0_0_var(--orange)]"
                            : "hover:bg-white/70",
                          ticket.adminUnread && !selected && "bg-[var(--orange)]/5"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "min-w-0 truncate text-[13px] leading-tight",
                              ticket.adminUnread
                                ? "font-bold text-[var(--ink)]"
                                : "font-semibold text-[var(--ink)]"
                            )}
                          >
                            {ticket.userName || "Customer"}
                            {ticket.userPhone ? (
                              <span className="font-normal text-[var(--muted)]">
                                {" "}
                                · {ticket.userPhone}
                              </span>
                            ) : null}
                          </p>
                          {ticket.adminUnread ? (
                            <span className="size-1.5 shrink-0 rounded-full bg-[var(--orange)]" />
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] leading-snug text-[var(--ink)]/75">
                          {ticket.orderName}
                          {ticket.preview ? ` · ${ticket.preview}` : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                              ticket.status === "open"
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-stone-100 text-stone-500"
                            )}
                          >
                            {ticket.status}
                          </span>
                          {showReopened ? (
                            <span className="rounded-full bg-[var(--orange)]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--ink)]">
                              Reopened again
                              {(ticket.reopenCount || 0) > 1
                                ? ` · ${ticket.reopenCount}/2`
                                : ""}
                            </span>
                          ) : null}
                          <span className="text-[10px] text-[var(--muted)]">
                            {new Date(ticket.updatedAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <section className="flex min-h-[420px] max-h-[72vh] flex-col bg-[linear-gradient(180deg,#FAF9F7_0%,#FFFFFF_28%)]">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="text-sm font-medium text-[var(--ink)]">
                Select a customer
              </p>
              <p className="max-w-xs text-[12px] text-[var(--muted)]">
                Open a chat to read messages, reply, and review order details.
              </p>
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] bg-white/90 px-3 py-2 backdrop-blur">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold leading-tight text-[var(--ink)]">
                    {active.userName}
                  </p>
                  <p className="truncate text-[11px] leading-snug text-[var(--muted)]">
                    {[active.userPhone, active.userEmail]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {active.status === "open" &&
                  (active.reopenCount || 0) > 0 ? (
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--orange)]">
                      Reopened again · {active.reopenCount} of 2 used
                      {(active.reopensRemaining || 0) > 0
                        ? ` · ${active.reopensRemaining} left`
                        : ""}
                    </p>
                  ) : (active.reopenCount || 0) > 0 &&
                    active.status === "resolved" ? (
                    <p className="mt-0.5 text-[10px] font-medium text-[var(--muted)]">
                      Resolved · had been reopened {active.reopenCount}×
                    </p>
                  ) : null}
                </div>
                {active.status === "open" ? (
                  <button
                    type="button"
                    onClick={resolve}
                    className="shrink-0 rounded-full bg-[var(--ink)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-[var(--forest)]"
                  >
                    Resolve
                  </button>
                ) : (
                  <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                    Resolved
                  </span>
                )}
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain px-3 py-3">
                {(active.messages || []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--muted)]">
                    No messages yet.
                  </p>
                ) : (
                  (active.messages || []).map((message) => {
                    if (message.sender === "system") {
                      return (
                        <div
                          key={message.id}
                          className="mx-auto max-w-[92%] rounded-full bg-[var(--soft)] px-3 py-1 text-center text-[11px] font-medium text-[var(--muted)]"
                        >
                          {message.body}
                        </div>
                      );
                    }
                    const fromAdmin = message.sender === "admin";
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "w-fit max-w-[75%] px-3 py-1.5 text-[13px] leading-snug shadow-sm",
                          fromAdmin
                            ? "ml-auto rounded-2xl rounded-br-md bg-[var(--ink)] text-white"
                            : "rounded-2xl rounded-bl-md bg-white text-[var(--ink)] ring-1 ring-[var(--line)]"
                        )}
                      >
                        <p
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-[0.12em]",
                            fromAdmin ? "text-white/50" : "text-[var(--muted)]"
                          )}
                        >
                          {fromAdmin ? "You" : active.userName || "Customer"}
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap">
                          {message.body}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-[9px]",
                            fromAdmin ? "text-white/40" : "text-[var(--muted)]"
                          )}
                        >
                          {new Date(message.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={send}
                className="flex shrink-0 gap-2 border-t border-[var(--line)] bg-white p-2.5"
              >
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={active.status !== "open"}
                  placeholder={
                    active.status === "open"
                      ? "Write a reply…"
                      : "Chat is resolved"
                  }
                  className="h-10 min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--soft)]/40 px-3.5 text-sm outline-none transition focus:border-[var(--ink)] focus:bg-white disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={active.status !== "open" || !body.trim()}
                  className="rounded-full bg-[var(--orange)] px-4 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink)] transition hover:brightness-105 disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </section>

        <aside className="max-h-[72vh] overflow-y-auto overscroll-contain border-t border-[var(--line)] bg-[var(--soft)]/30 p-4 text-sm lg:border-t-0 lg:border-l">
          {!active?.order ? (
            <p className="text-[var(--muted)]">Order details appear here.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Bought
                </p>
                <ul className="mt-2.5 space-y-3">
                  {(active.order.items || []).map((item) => {
                    const href = item.productSlug
                      ? `${STOREFRONT_URL}/product/${item.productSlug}`
                      : null;
                    return (
                      <li
                        key={item.id}
                        className="rounded-xl border border-[var(--line)] bg-white p-2.5 shadow-sm"
                      >
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex max-w-full items-start gap-1.5 font-semibold text-[var(--ink)] transition hover:text-[var(--orange)]"
                          >
                            <span className="min-w-0">
                              {item.productName} × {item.qty}
                            </span>
                            <ExternalLink className="mt-0.5 size-3.5 shrink-0 opacity-40 transition group-hover:opacity-100" />
                          </a>
                        ) : (
                          <p className="font-semibold">
                            {item.productName} × {item.qty}
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                          {[item.materialName, item.colorName]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                        <MeasurementAccordion
                          snap={item.measurementSnapshot}
                          canEdit={canEditMeas}
                          saving={measSavingId === item.id}
                          onSave={(payload) =>
                            saveMeasurements(item.id, payload)
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Cancel order
                </p>
                {canCancelOrder ? (
                  <div className="mt-2 space-y-2 rounded-xl border border-[var(--line)] bg-white p-2.5">
                    {!cancelOpen ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (isOnlinePaid) {
                            setCancelOpen(true);
                          } else {
                            setCancelMode("cancel");
                            setConfirmCancel(true);
                          }
                        }}
                        className="w-full rounded-full bg-red-600 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-red-700"
                      >
                        Cancel as requested
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] text-[var(--muted)]">
                            Customer asked to cancel — notify them as requested.
                          </p>
                          <button
                            type="button"
                            onClick={() => setCancelOpen(false)}
                            className="text-[var(--muted)] hover:text-[var(--ink)]"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        {isOnlinePaid ? (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setCancelMode("cancel")}
                              className={cn(
                                "flex-1 rounded-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide",
                                cancelMode === "cancel"
                                  ? "bg-[var(--ink)] text-white"
                                  : "bg-[var(--soft)] text-[var(--muted)]"
                              )}
                            >
                              Cancel only
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelMode("refund")}
                              className={cn(
                                "flex-1 rounded-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide",
                                cancelMode === "refund"
                                  ? "bg-[var(--orange)] text-[var(--ink)]"
                                  : "bg-[var(--soft)] text-[var(--muted)]"
                              )}
                            >
                              Cancel + refund
                            </button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-[var(--muted)]">
                            COD / unpaid — no refund needed. Order moves to
                            Rejected.
                          </p>
                        )}
                        {cancelMode === "refund" && isOnlinePaid ? (
                          <div className="space-y-1.5 rounded-lg bg-[var(--soft)]/70 p-2">
                            <label className="block">
                              <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
                                Refund amount
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={orderTotal}
                                step="0.01"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                className="mt-0.5 h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--ink)]"
                              />
                            </label>
                            <p className="text-[11px] text-[var(--ink)]">
                              Order total{" "}
                              <span className="font-semibold">
                                ${orderTotal.toFixed(2)}
                              </span>
                              {" · "}
                              Charge kept{" "}
                              <span className="font-semibold">
                                ${feePreview.toFixed(2)}
                              </span>
                              {feePreview === 0 ? " (optional $0)" : null}
                            </p>
                            {!refundValid ? (
                              <p className="text-[11px] text-red-600">
                                Refund must be between $0 and ${orderTotal.toFixed(2)}.
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                        <label className="block">
                          <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
                            Note (optional)
                          </span>
                          <input
                            value={cancelNote}
                            onChange={(e) => setCancelNote(e.target.value)}
                            placeholder="Internal note"
                            className="mt-0.5 h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2.5 text-[12px] outline-none focus:border-[var(--ink)]"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={
                            cancelMode === "refund" && isOnlinePaid && !refundValid
                          }
                          onClick={() => setConfirmCancel(true)}
                          className="w-full rounded-full bg-red-600 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white disabled:opacity-40"
                        >
                          {cancelMode === "refund" && isOnlinePaid
                            ? "Confirm cancel & refund"
                            : "Confirm cancel"}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] leading-snug text-[var(--muted)]">
                    {["rejected", "refunded", "cancelled"].includes(orderStatus)
                      ? "This order is already cancelled / rejected."
                      : "Cancel is only available before the order is tailored or out for delivery."}
                  </p>
                )}
                {active.order.totals?.cancellationFee != null ||
                active.order.totals?.refundAmount != null ? (
                  <div className="mt-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-[11px]">
                    {active.order.totals.refundAmount != null ? (
                      <p>
                        Refunded{" "}
                        <span className="font-semibold">
                          ${Number(active.order.totals.refundAmount).toFixed(2)}
                        </span>
                      </p>
                    ) : null}
                    {active.order.totals.cancellationFee != null ? (
                      <p className="mt-0.5">
                        Cancellation charge{" "}
                        <span className="font-semibold">
                          $
                          {Number(active.order.totals.cancellationFee).toFixed(2)}
                        </span>
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  When
                </p>
                <p className="mt-1.5 text-[13px] text-[var(--ink)]">
                  {new Date(active.order.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Payment
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      paymentTone(
                        active.order.paymentMethod,
                        active.order.paymentStatus
                      )
                    )}
                  >
                    {paymentLabel(
                      active.order.paymentMethod,
                      active.order.paymentStatus
                    )}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Order status
                </p>
                <div className="mt-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      statusTone(active.order.status)
                    )}
                  >
                    {active.order.statusLabel || active.order.status}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Address
                  </p>
                  {canEditAddress && !editingAddress ? (
                    <button
                      type="button"
                      onClick={startEditAddress}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink)] transition hover:border-[var(--ink)]/30"
                      title="Edit address"
                    >
                      <Pencil className="size-3" strokeWidth={2.25} />
                      Edit
                    </button>
                  ) : null}
                </div>
                {editingAddress && shipDraft ? (
                  <div className="mt-2 space-y-2 rounded-xl border border-[var(--orange)]/40 bg-white p-2.5">
                    <p className="text-[11px] leading-snug text-[var(--muted)]">
                      Customer asked to change where this order ships. They’ll
                      get a notification with the new location.
                    </p>
                    {(
                      [
                        ["fullName", "Full name"],
                        ["phone", "Phone"],
                        ["email", "Email"],
                        ["address", "Street address"],
                        ["city", "City"],
                        ["state", "State"],
                        ["zip", "ZIP / PIN"],
                        ["country", "Country"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="block">
                        <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
                          {label}
                        </span>
                        <input
                          value={shipDraft[key]}
                          onChange={(e) =>
                            setShipDraft((prev) =>
                              prev ? { ...prev, [key]: e.target.value } : prev
                            )
                          }
                          className="mt-0.5 h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--soft)]/50 px-2.5 text-[12px] outline-none focus:border-[var(--ink)]"
                        />
                      </label>
                    ))}
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddress(false);
                          setShipDraft(null);
                        }}
                        className="flex-1 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-wide"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        disabled={
                          !shipDraft.address.trim() || !shipDraft.city.trim()
                        }
                        onClick={() => setConfirmAddress(true)}
                        className="flex-1 rounded-full bg-[var(--ink)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white disabled:opacity-40"
                      >
                        Save address
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2.5">
                    {addressChanged ? (
                      <p className="mb-2 rounded-lg bg-[var(--orange)]/10 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink)]">
                        Updated as customer requested
                      </p>
                    ) : null}
                    <p className="font-semibold text-[var(--ink)]">
                      {str(ship.fullName) || "—"}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">
                      {address || "—"}
                    </p>
                    <p className="mt-2 text-[12px] font-medium text-[var(--ink)]">
                      {str(ship.phone) || active.userPhone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Are you sure you want to cancel?"
        message={
          cancelMode === "refund" && isOnlinePaid
            ? `The user has asked you for it. Customer gets $${parsedRefund.toFixed(2)} back; you keep $${feePreview.toFixed(2)} as cancellation charge. They’ll see: “cancelled from the admin side as you requested.” Order moves to Refunded.`
            : "The user has asked you for it. No refund for COD / unpaid. Order moves to Rejected. Customer will see: “Your order is cancelled from the admin side as you requested.”"
        }
        confirmLabel={
          cancelMode === "refund" && isOnlinePaid
            ? "Yes, cancel & refund"
            : "Yes, cancel order"
        }
        cancelLabel="Keep order"
        tone="danger"
        busy={cancelBusy}
        onConfirm={runCancel}
        onCancel={() => setConfirmCancel(false)}
      />

      <ConfirmDialog
        open={confirmAddress}
        title="Save the new address?"
        message={
          addressPreview
            ? `The user has asked you for it. They’ll be notified: “As you requested, the address for this particular order has been changed to ${addressPreview}.”`
            : "The user has asked you for it. They’ll get a notification with the new shipping location."
        }
        confirmLabel="Save & notify"
        cancelLabel="Back"
        tone="default"
        busy={addressBusy}
        onConfirm={runSaveAddress}
        onCancel={() => setConfirmAddress(false)}
      />
    </div>
  );
}
