"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store";

function SuccessContent() {
  const params = useSearchParams();
  const lastOrderId = useStore((s) => s.lastOrderId);
  const orderId = params.get("order") ?? lastOrderId ?? "TT-DEMO";

  return (
    <div className="container-site flex flex-col items-center py-20 text-center">
      <CheckCircle2 className="mb-4 size-16 text-orange" />
      <h1 className="font-display text-4xl md:text-5xl">Order Received</h1>
      <p className="mt-3 max-w-md text-muted">
        We got your order. You can track it in your account — it will move to
        Order Accepted, Out for Delivery, then Delivered as we process it.
      </p>
      <p className="mt-6 rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white">
        Order ID: {orderId}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/account">View Account</Button>
        <Button href="/shop" variant="forest">
          Keep Shopping
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container-site py-20 text-center text-muted">Loading…</div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
