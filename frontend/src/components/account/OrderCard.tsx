import Link from "next/link";
import { orderStatusLabel, orderStatusTone } from "@/lib/order-status";
import { resolveMediaUrl } from "@/lib/media";
import { orderTitle, type CustomerOrder } from "@/lib/customer-orders";

type Props = {
  order: CustomerOrder;
  price: string;
};

export function OrderCard({ order, price }: Props) {
  const title = orderTitle(order);
  const label = order.statusLabel || orderStatusLabel(order.status);
  const when = new Date(order.createdAt).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const pay =
    order.paymentMethod === "online"
      ? "Online"
      : order.paymentMethod
        ? "COD"
        : "";
  const items = order.items || [];

  return (
    <li>
      <Link
        href={`/account/orders/${order.id}`}
        className="group block rounded-2xl border border-line bg-paper p-4 transition hover:border-ink/30 md:p-5"
      >
        <div className="flex gap-4">
          <div className="flex shrink-0 -space-x-3">
            {items.slice(0, 3).map((item) => (
              <span
                key={item.id}
                className="relative block size-16 overflow-hidden rounded-xl border border-line bg-soft"
              >
                {item.imageUrl ? (
                  <img
                    src={resolveMediaUrl(item.imageUrl)}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-[11px] font-semibold text-muted">
                    {item.productName.slice(0, 1)}
                  </span>
                )}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-xl leading-tight tracking-wide text-ink md:text-2xl">
                {title}
              </h3>
              <p className="shrink-0 text-sm font-bold text-ink">{price}</p>
            </div>
            <p className="mt-1 text-[12px] text-muted">
              {when}
              {pay ? ` · ${pay}` : ""}
            </p>
            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${orderStatusTone(order.status)}`}
            >
              {label}
            </span>
            <ul className="mt-3 space-y-0.5 text-[13px] text-muted">
              {items.map((item) => (
                <li key={item.id} className="truncate">
                  {item.productName} × {item.qty}
                  {item.colorName || item.materialName
                    ? ` · ${[item.materialName, item.colorName].filter(Boolean).join(" · ")}`
                    : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Link>
    </li>
  );
}
