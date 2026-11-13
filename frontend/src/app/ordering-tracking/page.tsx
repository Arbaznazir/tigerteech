import type { Metadata } from "next";
import {
  InfoBlocks,
  InfoCard,
  InfoPageShell,
} from "@/components/info/InfoPageShell";

export const metadata: Metadata = {
  title: "Ordering & Tracking",
  description:
    "Track Tigerteeh orders, find tracking numbers, and get help with delivery updates.",
};

const blocks = [
  {
    type: "p" as const,
    text: "Below are the most common questions customers ask when shopping for branded clothing online and tracking their orders.",
  },
  {
    type: "qa" as const,
    q: "How do I track my order after purchasing?",
    a: "Once your order is placed, you will receive a confirmation email or message with a tracking number. You can use this number on the tracking page to check real-time delivery updates.",
  },
  {
    type: "qa" as const,
    q: "Where can I find my order tracking number?",
    a: "Your tracking number is shared through your registered email or phone number after the order is shipped. If you do not see it, check your spam or message inbox.",
  },
  {
    type: "qa" as const,
    q: "Why is my tracking information not updating?",
    a: "Tracking updates may take up to 24–48 hours after dispatch. If the shipment has just been sent, the courier system may still be syncing the details.",
  },
  {
    type: "qa" as const,
    q: "How long does delivery usually take?",
    a: "Delivery time depends on your location and shipping method. Most orders arrive within the estimated time mentioned at checkout — usually a few business days to a couple of weeks.",
  },
  {
    type: "qa" as const,
    q: "Can I change my shipping address after placing the order?",
    a: "Address changes are only possible before the order is shipped. Once it is dispatched, the delivery location cannot be modified.",
  },
  {
    type: "qa" as const,
    q: "What should I do if my order is delayed?",
    a: "If your order is delayed beyond the expected delivery time, check your tracking status first. If there is no update, contact customer support with your order details for assistance.",
  },
  {
    type: "qa" as const,
    q: "How do I know my order has been confirmed?",
    a: "You will receive an order confirmation message immediately after placing your purchase. This includes your order ID and product details.",
  },
  {
    type: "qa" as const,
    q: "What if my package shows delivered but I did not receive it?",
    a: "Check with neighbours or household members first. If the package is still missing, contact support with your tracking ID for a delivery investigation.",
  },
  {
    type: "qa" as const,
    q: "Can I cancel my order after placing it?",
    a: "Orders can only be cancelled before shipping begins. Once processing starts, cancellation may not be possible.",
  },
  {
    type: "qa" as const,
    q: "How do I contact support for order-related issues?",
    a: "Reach customer support through support@tigerteehclothing.com. Always include your order number for faster assistance.",
  },
];

export default function OrderingTrackingPage() {
  return (
    <InfoPageShell
      eyebrow="Information"
      title="ORDERING &"
      accent="TRACKING"
      lead="Everything you need to confirm, track, and follow your Tigerteeh order from checkout to doorstep."
    >
      <InfoCard>
        <InfoBlocks blocks={blocks} />
      </InfoCard>
    </InfoPageShell>
  );
}
