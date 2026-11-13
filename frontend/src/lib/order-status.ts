export type OrderStatus =
  | "pending"
  | "accepted"
  | "out_for_delivery"
  | "delivered"
  | "rejected"
  | "refunded"
  | string;

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
    case "placed":
      return "Order Received";
    case "accepted":
      return "Order Accepted";
    case "out_for_delivery":
      return "Out for Delivery";
    case "delivered":
      return "Delivered";
    case "rejected":
      return "Rejected";
    case "refunded":
      return "Refunded";
    case "cancelled":
      return "Cancelled";
    default:
      return status || "Order Received";
  }
}

export function orderStatusTone(status: OrderStatus): string {
  switch (status) {
    case "pending":
    case "placed":
      return "bg-orange/15 text-ink";
    case "accepted":
      return "bg-emerald-50 text-emerald-800";
    case "out_for_delivery":
      return "bg-sky-50 text-sky-800";
    case "delivered":
      return "bg-forest text-paper";
    case "rejected":
      return "bg-red-50 text-red-700";
    case "refunded":
      return "bg-amber-50 text-amber-900";
    case "cancelled":
      return "bg-soft text-muted";
    default:
      return "bg-soft text-muted";
  }
}
