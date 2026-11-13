import { API_URL } from "@/lib/api";
import { getCustomerToken } from "@/lib/customer-auth";
import {
  bottomFieldsFor,
  topFieldsFor,
  type MeasField,
  type MeasGender,
} from "@/lib/measurements";

export type AddressAdminEdit = {
  at?: string;
  by?: string;
  from?: OrderShipping;
  to?: OrderShipping;
};

export type OrderShipping = {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  addressChangedAsRequested?: boolean;
  lastAdminAddressEditAt?: string;
  adminAddressEdits?: AddressAdminEdit[];
};

export type OrderTotals = {
  total?: number;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  refundAmount?: number;
  cancellationFee?: number;
  cancelledFromQuery?: boolean;
};

export type MeasFieldChange = {
  section?: string;
  key?: string;
  label?: string;
  from?: string;
  to?: string;
};

export type MeasAdminEdit = {
  at?: string;
  by?: string;
  product?: string;
  changes?: MeasFieldChange[];
  note?: string;
};

export type OrderMeasurement = {
  setName?: string;
  gender?: MeasGender | string;
  unit?: string;
  notes?: string;
  needTop?: boolean;
  needBottom?: boolean;
  top?: Record<string, string>;
  bottom?: Record<string, string>;
  size?: string;
  color?: string;
  adminEdits?: MeasAdminEdit[];
  lastAdminEditAt?: string;
};

export type CustomerOrderItem = {
  id: string;
  productId?: string;
  productName: string;
  materialName?: string;
  colorName?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string;
  measurementSnapshot?: OrderMeasurement | null;
};

export type CustomerOrder = {
  id: string;
  status: string;
  statusLabel?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  email?: string;
  shipping?: OrderShipping | null;
  totals?: OrderTotals | null;
  items?: CustomerOrderItem[];
};

export function orderTitle(order: CustomerOrder): string {
  const names = (order.items || [])
    .map((item) => item.productName?.trim())
    .filter(Boolean) as string[];
  if (names.length === 0) return "Order";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]}, ${names[1]} +${names.length - 2}`;
}

export function measurementRows(
  gender: string | undefined,
  kind: "top" | "bottom",
  values: Record<string, string> | undefined
): { label: string; value: string }[] {
  if (!values) return [];
  const fields: MeasField[] =
    kind === "top"
      ? topFieldsFor(gender === "female" ? "female" : "male")
      : bottomFieldsFor(gender === "female" ? "female" : "male");
  return fields
    .map((field) => ({
      label: field.label,
      value: String(values[field.key] || "").trim(),
    }))
    .filter((row) => row.value);
}

export async function fetchCustomerOrders(limit: number, offset: number) {
  const token = getCustomerToken();
  if (!token) throw new Error("Please log in again.");
  const res = await fetch(
    `${API_URL}/api/v1/orders?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const json = (await res.json()) as {
    data?: { items: CustomerOrder[]; total: number };
    error?: string | null;
  };
  if (!res.ok || json.error) throw new Error(json.error || "Could not load orders");
  return {
    items: json.data?.items || [],
    total: json.data?.total || 0,
  };
}

export async function fetchCustomerOrder(id: string) {
  const token = getCustomerToken();
  if (!token) throw new Error("Please log in again.");
  const res = await fetch(`${API_URL}/api/v1/orders/${id}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const json = (await res.json()) as {
    data?: CustomerOrder;
    error?: string | null;
  };
  if (!res.ok || json.error || !json.data) {
    throw new Error(json.error || "Order not found");
  }
  return json.data;
}
