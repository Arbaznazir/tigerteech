import type { Metadata } from "next";
import {
  InfoBlocks,
  InfoCard,
  InfoPageShell,
  type InfoBlock,
} from "@/components/info/InfoPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Tigerteeh Clothing collects, uses, and protects your personal information.",
};

const blocks: InfoBlock[] = [
  {
    type: "p",
    text: "Welcome to Tigerteeh Clothing. Your privacy matters to us, and we believe online shopping should feel secure, simple, and transparent. This Privacy Policy explains how we collect, use, protect, and manage your information when you browse, shop, subscribe, or contact our team.",
  },
  { type: "h3", text: "What information do we collect?" },
  {
    type: "ul",
    items: [
      "Name",
      "Email address",
      "Shipping and billing address",
      "Phone number",
      "Payment details during checkout",
      "Device and browser information",
      "Shopping preferences and order history",
    ],
  },
  { type: "h3", text: "Why do we collect customer information?" },
  {
    type: "ul",
    items: [
      "Process and deliver orders",
      "Send order confirmations and shipping updates",
      "Improve website performance",
      "Respond to customer service requests",
      "Prevent fraudulent activity",
      "Share new arrivals, exclusive drops, and special offers",
    ],
  },
  {
    type: "note",
    text: "We only collect information necessary for legitimate business purposes.",
  },
  { type: "h3", text: "Do we store payment information?" },
  {
    type: "p",
    text: "Payments are handled through trusted payment providers with security protections in place. Tigerteeh Clothing does not store full credit card information on its servers.",
  },
  { type: "h3", text: "How do we protect personal data?" },
  {
    type: "ul",
    items: [
      "Encrypted connections",
      "Secure checkout systems",
      "Limited internal access to customer information",
      "Regular website monitoring",
    ],
  },
  { type: "h3", text: "Cookies" },
  {
    type: "p",
    text: "Cookies help improve your browsing experience — remembering cart items, saving preferences, analyzing traffic, and improving performance. You can disable cookies through your browser settings if preferred.",
  },
  { type: "h3", text: "Browsing without an account" },
  {
    type: "p",
    text: "You can explore collections and product pages without registering. Order tracking, saved addresses, and faster checkout may require an account.",
  },
  { type: "h3", text: "Do we share customer information?" },
  {
    type: "p",
    text: "We do not sell or rent customer information to unrelated third parties. Information may be shared with trusted service providers for payment processing, shipping, email communication, and analytics — only as needed to perform their services.",
  },
  { type: "h3", text: "Email subscriptions" },
  {
    type: "p",
    text: "Subscribers may receive product launches, fashion updates, promotional offers, seasonal collections, and limited-time discounts. Every promotional email includes an unsubscribe option.",
  },
  { type: "h3", text: "Advertising" },
  {
    type: "p",
    text: "We may use browsing activity and shopping behavior to show more relevant products and advertisements.",
  },
  { type: "h3", text: "Policy changes" },
  {
    type: "p",
    text: "We may update this Privacy Policy when business practices, technology, or legal requirements change. Updated versions will always be posted on this page.",
  },
  { type: "h3", text: "Children" },
  {
    type: "p",
    text: "Our website is not intended for children under 13 years old. We do not knowingly collect personal information from minors. If such information is identified, it will be removed promptly.",
  },
  {
    type: "qa",
    q: "Is my order information kept private?",
    a: "Yes. Order details are handled securely and are only used for processing purchases and customer support.",
  },
  {
    type: "qa",
    q: "Can I request deletion of my personal data?",
    a: "Customers may request updates or removal of certain personal information by contacting support@tigerteehclothing.com.",
  },
];

export default function PrivacyPage() {
  return (
    <InfoPageShell
      eyebrow="Useful Links"
      title="PRIVACY"
      accent="POLICY"
      lead="How we collect, use, and protect your information when you shop the wild."
    >
      <InfoCard>
        <InfoBlocks blocks={blocks} />
      </InfoCard>
    </InfoPageShell>
  );
}
