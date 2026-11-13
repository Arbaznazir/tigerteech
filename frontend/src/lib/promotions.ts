import { API_URL, apiGet } from "@/lib/api";
import { getCustomerToken } from "@/lib/customer-auth";

export type Promotion = {
  id: string;
  kind: string;
  code: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  scope: string;
  minSubtotal: number;
  giftProductId?: string | null;
  usageLimitType: string;
  usageLimitCount: number;
  redemptionCount: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  cardStyle?: string;
  productIds?: string[];
  giftProductName?: string;
  giftProductImage?: string;
};

export type PromoValidateResult = {
  ok: boolean;
  promotionId?: string;
  code: string;
  title: string;
  kind: string;
  discountType: string;
  discount: number;
  discountLabel: string;
  giftProductId?: string;
  giftProductName?: string;
  message?: string;
};

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? getCustomerToken() : null;
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchActivePromotions(): Promise<Promotion[]> {
  try {
    return await apiGet<Promotion[]>("/api/v1/promotions/active", {
      headers: authHeaders(),
    });
  } catch {
    return [];
  }
}

export async function fetchProductPromotions(
  slug: string
): Promise<Promotion[]> {
  try {
    return await apiGet<Promotion[]>(`/api/v1/products/${slug}/promotions`, {
      headers: authHeaders(),
    });
  } catch {
    return [];
  }
}

export async function validatePromoCode(input: {
  code: string;
  subtotal: number;
  productIds: string[];
  productTotals?: Record<string, number>;
}): Promise<PromoValidateResult> {
  const res = await fetch(`${API_URL}/api/v1/promotions/validate`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      code: input.code.trim().toUpperCase(),
      subtotal: input.subtotal,
      productIds: input.productIds,
      productTotals: input.productTotals || undefined,
    }),
  });
  const json = (await res.json()) as {
    data?: PromoValidateResult;
    error?: string | null;
  };
  if (!res.ok || json.error || !json.data?.ok) {
    throw new Error(json.error || json.data?.message || "Invalid promo code");
  }
  return json.data;
}

export function promoBadgeLabel(p: Promotion): string {
  if (p.discountType === "gift_threshold") {
    return `Gift at $${Number(p.minSubtotal || 0).toFixed(0)}+`;
  }
  if (p.discountType === "percent") {
    return `${p.discountValue}% off`;
  }
  if (p.discountType === "fixed") {
    return `$${p.discountValue} off`;
  }
  return p.kind;
}

export function formatUsageLimit(p: Promotion): string {
  if (p.usageLimitType === "first_n" && p.usageLimitCount > 0) {
    const left = Math.max(0, p.usageLimitCount - (p.redemptionCount || 0));
    return `First ${p.usageLimitCount} · ${left} left`;
  }
  if (p.usageLimitType === "once_per_user") return "Once per customer";
  return "Reuse on every order";
}
