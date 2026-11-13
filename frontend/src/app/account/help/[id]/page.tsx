"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getTicket,
  markTicketRead,
  reopenTicket,
  sendTicketMessage,
  type SupportTicket,
} from "@/lib/support";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";

export default function HelpChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const user = useStore((s) => s.user);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [reopening, setReopening] = useState(false);

  useEffect(() => {
    if (hydrated && !user) router.replace("/account/login");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!user || !params.id) return;
    let stop = false;
    const load = () => {
      void getTicket(params.id)
        .then((next) => {
          if (!stop) setTicket(next);
        })
        .catch((err) => {
          if (!stop) setError(err instanceof Error ? err.message : "Chat not found");
        });
    };
    load();
    void markTicketRead(params.id)
      .then(() => {
        window.dispatchEvent(new Event("tt:notifications"));
      })
      .catch(() => undefined);
    const timer = window.setInterval(load, 4000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [user, params.id]);

  if (!hydrated || !user) {
    return <div className="container-site py-20 text-center text-muted">Loading…</div>;
  }

  const left = ticket ? Math.max(0, 3 - ticket.userBurst) : 0;
  const reopensLeft = ticket?.reopensRemaining ?? 0;
  const resolved = ticket?.status === "resolved";

  const onSend = (event: FormEvent) => {
    event.preventDefault();
    if (!ticket || !body.trim()) return;
    setSending(true);
    setError("");
    void sendTicketMessage(ticket.id, body.trim())
      .then((next) => {
        setTicket(next);
        setBody("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not send"))
      .finally(() => setSending(false));
  };

  const onReopen = () => {
    if (!ticket) return;
    setReopening(true);
    setError("");
    void reopenTicket(ticket.id)
      .then((next) => setTicket(next))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not reopen")
      )
      .finally(() => setReopening(false));
  };

  return (
    <div className="container-site max-w-2xl py-8 md:py-10">
      <Link
        href="/account/help"
        className="text-[12px] font-semibold uppercase tracking-wide text-muted"
      >
        Need help
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-3xl leading-tight md:text-4xl">
          {ticket?.order?.items?.[0]?.productName
            ? ticket.order.items
                .map((item) => item.productName)
                .slice(0, 2)
                .join(" & ")
            : "Order help"}
        </h1>
        {ticket ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
              resolved
                ? "bg-stone-100 text-stone-600"
                : "bg-emerald-50 text-emerald-800"
            )}
          >
            {resolved ? "Resolved" : "Open"}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted">
        {resolved
          ? reopensLeft > 0
            ? `This request is resolved. You can reopen ${reopensLeft} more time${reopensLeft === 1 ? "" : "s"}.`
            : "This request is resolved. No reopen chances left for this order."
          : `${left} message${left === 1 ? "" : "s"} left before you need a reply.`}
      </p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_40px_rgba(18,16,14,0.06)]">
        <div className="flex min-h-[280px] flex-col gap-1.5 bg-[linear-gradient(180deg,#FAF9F7_0%,#FFFFFF_40%)] p-3 sm:p-3.5">
          {(ticket?.messages || []).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              Tell us what you need help with.
            </p>
          ) : (
            (ticket?.messages || []).map((message) => {
              if (message.sender === "system") {
                return (
                  <div
                    key={message.id}
                    className="mx-auto max-w-[90%] rounded-full bg-soft px-3 py-1 text-center text-[11px] font-medium text-muted"
                  >
                    {message.body}
                  </div>
                );
              }
              const mine = message.sender === "user";
              return (
                <div
                  key={message.id}
                  className={cn(
                    "w-fit max-w-[82%] px-3 py-1.5 text-[13px] leading-snug shadow-sm",
                    mine
                      ? "ml-auto rounded-2xl rounded-br-md bg-ink text-white"
                      : "rounded-2xl rounded-bl-md bg-white text-ink ring-1 ring-line"
                  )}
                >
                  <p
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-wide",
                      mine ? "text-white/50" : "text-muted"
                    )}
                  >
                    {mine ? "You" : "Tigerteeh"}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap">{message.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[9px]",
                      mine ? "text-white/35" : "text-muted"
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

        {error ? (
          <p className="border-t border-line px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {resolved ? (
          <div className="space-y-2 border-t border-line bg-paper px-3 py-3">
            <p className="text-[12px] leading-snug text-muted">
              Reopen the query if you have any other issues.
              {reopensLeft > 0
                ? ` ${reopensLeft} reopen${reopensLeft === 1 ? "" : "s"} remaining.`
                : " You’ve used both reopens for this order."}
            </p>
            <button
              type="button"
              disabled={!ticket?.canReopen || reopening}
              onClick={onReopen}
              className="h-10 w-full rounded-full bg-ink px-4 text-[12px] font-semibold uppercase tracking-wide text-white disabled:opacity-40"
            >
              {reopening
                ? "Reopening…"
                : ticket?.canReopen
                  ? "Reopen query"
                  : "No reopens left"}
            </button>
          </div>
        ) : (
          <form
            onSubmit={onSend}
            className="flex gap-2 border-t border-line bg-paper p-2.5"
          >
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={!ticket?.canSend || sending}
              placeholder={
                ticket?.canSend ? "Write a message" : "Waiting for a reply"
              }
              className="h-10 min-w-0 flex-1 rounded-full border border-line bg-white px-3.5 text-sm outline-none focus:border-ink disabled:bg-soft"
            />
            <button
              type="submit"
              disabled={!ticket?.canSend || sending || !body.trim()}
              className="rounded-full bg-orange px-4 text-[11px] font-semibold uppercase tracking-wide text-ink disabled:opacity-40"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
