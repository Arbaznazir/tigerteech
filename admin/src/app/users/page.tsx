"use client";

import { useCallback, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { Pagination } from "@/components/Pagination";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  address?: Record<string, unknown>;
  orderCount: number;
  createdAt: string;
};

type UserDetail = UserRow & {
  role?: string;
  orders?: {
    id: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    totals?: { total?: number };
    createdAt: string;
  }[];
};

function addrLine(address?: Record<string, unknown>) {
  if (!address) return "";
  return [
    address.address,
    address.city,
    address.state,
    address.zip,
    address.country,
  ]
    .filter((v) => typeof v === "string" && v)
    .join(", ");
}

export default function UsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const offset = (page - 1) * PAGE_SIZE;
    const data = await api<{ items: UserRow[]; total: number }>(
      `/api/v1/admin/users?limit=${PAGE_SIZE}&offset=${offset}`
    );
    setItems(data.items || []);
    setTotal(data.total || 0);
  }, [page]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function openUser(id: string) {
    setError("");
    try {
      const u = await api<UserDetail>(`/api/v1/admin/users/${id}`);
      setSelected(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <Shell>
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Users</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Customers who registered — contact, address, profile photo, and order
          history.
        </p>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <ul className="divide-y divide-[var(--line)]">
            {items.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => openUser(u.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--soft)]/60",
                    selected?.id === u.id && "bg-[var(--orange)]/10"
                  )}
                >
                  <span className="size-11 shrink-0 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--soft)]">
                    {u.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.avatarUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-[11px] font-bold text-[var(--muted)]">
                        {(u.name || u.email || "?").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[var(--ink)]">
                      {u.name || "Unnamed"}
                    </span>
                    <span className="block truncate text-[11px] text-[var(--muted)]">
                      {u.email}
                      {u.phone ? ` · ${u.phone}` : ""}
                    </span>
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {u.orderCount} order{u.orderCount === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            ))}
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-[var(--muted)]">
                No customers yet.
              </li>
            ) : null}
          </ul>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          {!selected ? (
            <div className="grid min-h-[280px] place-items-center px-6 text-center">
              <p className="text-[13px] text-[var(--muted)]">
                Select a user to see profile and orders.
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-3 border-b border-[var(--line)] pb-3">
                <span className="size-14 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--soft)]">
                  {selected.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.avatarUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-[12px] font-bold text-[var(--muted)]">
                      {(selected.name || "?")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                </span>
                <div>
                  <p className="text-[15px] font-bold text-[var(--ink)]">
                    {selected.name || "Unnamed"}
                  </p>
                  <p className="text-[12px] text-[var(--muted)]">
                    {selected.email}
                  </p>
                  <p className="text-[12px] text-[var(--muted)]">
                    {selected.phone || "No phone on file"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Saved address
                </p>
                <p className="mt-1 text-[12px] leading-relaxed">
                  {addrLine(selected.address) || "No address saved yet."}
                </p>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Orders
                </p>
                {(selected.orders || []).length === 0 ? (
                  <p className="text-[12px] text-[var(--muted)]">No orders.</p>
                ) : (
                  <ul className="space-y-2">
                    {(selected.orders || []).map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2.5"
                      >
                        <div>
                          <p className="text-[12px] font-semibold">
                            {o.id.slice(0, 8)}…
                          </p>
                          <p className="text-[11px] text-[var(--muted)]">
                            {new Date(o.createdAt).toLocaleString()} ·{" "}
                            {o.paymentMethod} · {o.status}
                          </p>
                        </div>
                        <p className="text-[13px] font-bold tabular-nums">
                          ${Number(o.totals?.total || 0).toFixed(2)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
