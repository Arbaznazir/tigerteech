import type { Metadata } from "next";
import {
  InfoBlocks,
  InfoCard,
  InfoPageShell,
} from "@/components/info/InfoPageShell";

export const metadata: Metadata = {
  title: "Delivery Information",
  description:
    "Tigerteeh delivery timelines, international shipping, tracking, and damaged-package help.",
};

const blocks = [
  {
    type: "p" as const,
    text: "At Tigerteeh Clothing, we aim to deliver every order quickly and securely.",
  },
  {
    type: "h3" as const,
    text: "How long does shipping take?",
  },
  {
    type: "p" as const,
    text: "Orders are usually processed within 1–3 business days.",
  },
  {
    type: "ul" as const,
    items: [
      "Standard Shipping: 5–8 business days",
      "Express Shipping: 2–4 business days",
      "International Shipping: 7–15 business days",
      "Worldwide delivery typically 10–12 days; India delivery within 7 days on eligible routes",
    ],
  },
  {
    type: "qa" as const,
    q: "Do you ship internationally?",
    a: "Yes, we ship to selected countries worldwide. Shipping availability appears during checkout.",
  },
  {
    type: "qa" as const,
    q: "How can I track my order?",
    a: "Once your order ships, you will receive a tracking number by email.",
  },
  {
    type: "qa" as const,
    q: "Can I change my shipping address?",
    a: "Address updates are possible only before the order is shipped.",
  },
  {
    type: "qa" as const,
    q: "What if my package is delayed?",
    a: "Shipping delays may happen due to weather, holidays, or carrier issues. Contact us if your order is taking longer than expected.",
  },
  {
    type: "qa" as const,
    q: "Do you offer free shipping?",
    a: "Free shipping offers may be available during special promotions and on qualifying order totals.",
  },
  {
    type: "qa" as const,
    q: "What if my order arrives damaged?",
    a: "Please contact us within 48 hours with photos of the damaged package and item.",
  },
  {
    type: "qa" as const,
    q: "Can I cancel my order?",
    a: "Orders can only be cancelled before shipment processing begins.",
  },
];

export default function DeliveryInformationPage() {
  return (
    <InfoPageShell
      eyebrow="Information"
      title="DELIVERY"
      accent="INFO"
      lead="Clear timelines, tracking, and what to do if anything goes off-track — so your look arrives wild and intact."
    >
      <InfoCard>
        <InfoBlocks blocks={blocks} />
      </InfoCard>
    </InfoPageShell>
  );
}
