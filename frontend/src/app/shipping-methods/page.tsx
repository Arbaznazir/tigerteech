import type { Metadata } from "next";
import {
  InfoBlocks,
  InfoCard,
  InfoPageShell,
} from "@/components/info/InfoPageShell";

export const metadata: Metadata = {
  title: "Shipping Methods",
  description:
    "Tigerteeh shipping methods, processing times, tracking, and free-shipping promotions.",
};

const blocks = [
  {
    type: "p" as const,
    text: "At Tigerteeh Clothing, we make shipping simple, secure, and fast for every clothing order.",
  },
  {
    type: "qa" as const,
    q: "How long does shipping take?",
    a: "Orders are usually processed within 2–3 business days. Standard delivery typically takes around 5–7 business days on domestic routes, with international timelines shown at checkout.",
  },
  {
    type: "qa" as const,
    q: "Do you offer international shipping?",
    a: "Yes — selected international locations are available during checkout.",
  },
  {
    type: "qa" as const,
    q: "How can I track my order?",
    a: "Once your order ships, a tracking number will be sent to your email.",
  },
  {
    type: "qa" as const,
    q: "Can I change my shipping address?",
    a: "Address changes may be possible before the order is shipped.",
  },
  {
    type: "qa" as const,
    q: "What if my package is delayed?",
    a: "Carrier delays or busy seasons may affect delivery times. Our support team can help check your shipment status.",
  },
  {
    type: "qa" as const,
    q: "Do you offer free shipping?",
    a: "Free shipping promotions may be available on selected orders or special events.",
  },
  {
    type: "qa" as const,
    q: "What if my package arrives damaged?",
    a: "Please contact support within 48 hours and share photos of the package and items.",
  },
  {
    type: "qa" as const,
    q: "Why is my tracking not updating?",
    a: "Tracking updates can take a few hours after shipment pickup.",
  },
];

export default function ShippingMethodsPage() {
  return (
    <InfoPageShell
      eyebrow="Useful Links"
      title="SHIPPING"
      accent="METHODS"
      lead="How we process, ship, and help you follow every Tigerteeh package."
    >
      <InfoCard>
        <InfoBlocks blocks={blocks} />
      </InfoCard>
    </InfoPageShell>
  );
}
