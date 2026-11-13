"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listTickets, type SupportTicket } from "@/lib/support";
import { useStore } from "@/lib/store";

export default function HelpPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const user = useStore((s) => s.user);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hydrated && !user) router.replace("/account/login");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!user) return;
    void listTickets()
      .then((page) => setTickets(page.items || []))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load help"));
  }, [user]);

  if (!hydrated || !user) {
    return <div className="container-site py-20 text-center text-muted">Loading…</div>;
  }

  return (
    <div className="container-site max-w-3xl py-10 md:py-14">
      <Link href="/account" className="text-[12px] font-semibold uppercase tracking-wide text-muted">
        Account
      </Link>
      <h1 className="font-display mt-3 text-4xl">Need help</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Open an order and choose Need help to message us about that purchase. You can send three messages, then wait for a reply.
      </p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {tickets.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No help requests yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/account/help/${ticket.id}`}
                className="block rounded-2xl border border-line bg-paper p-4 transition hover:border-ink/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-xl">{ticket.orderName || "Order"}</p>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      {ticket.status === "resolved" ? "Resolved" : "Open"}
                    </span>
                    {(ticket.reopenCount || 0) > 0 ? (
                      <span className="text-[10px] text-orange">
                        Reopened {ticket.reopenCount}×
                      </span>
                    ) : null}
                  </div>
                </div>
                {ticket.preview ? (
                  <p className="mt-1 truncate text-sm text-muted">{ticket.preview}</p>
                ) : (
                  <p className="mt-1 text-sm text-muted">No messages yet</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
