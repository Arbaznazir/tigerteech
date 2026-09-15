import type { Metadata } from "next";
import {
  InfoBlocks,
  InfoCard,
  InfoPageShell,
  type InfoBlock,
} from "@/components/info/InfoPageShell";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and conditions for shopping and using Tigerteeh Clothing.",
};

const blocks: InfoBlock[] = [
  {
    type: "p",
    text: "Welcome to Tigerteeh Clothing. These Terms & Conditions explain how our website works, what you can expect from us, and what we expect from visitors and customers. By browsing, shopping, or interacting with this website, you agree to follow the terms listed below.",
  },
  { type: "h3", text: "1. Who We Are" },
  {
    type: "p",
    text: "Tigerteeh Clothing is an online fashion and lifestyle store focused on branded clothing, casual wear, accessories, and limited-edition collections. Our goal is a smooth shopping experience with reliable service and clear policies.",
  },
  { type: "h3", text: "2. Using This Website" },
  {
    type: "p",
    text: "You may use this website for personal shopping, browsing products, reading information, and placing orders. You agree not to:",
  },
  {
    type: "ul",
    items: [
      "Use the website for illegal activity",
      "Attempt to damage or interrupt the website",
      "Copy product images, content, or branding without permission",
      "Submit false information during checkout or account registration",
    ],
  },
  {
    type: "note",
    text: "We reserve the right to block or limit access if misuse is detected.",
  },
  { type: "h3", text: "3. Product Availability" },
  {
    type: "p",
    text: "While we update inventory regularly, some items may sell out quickly due to limited stock or high demand. If an item becomes unavailable after purchase, our support team will contact you with available options.",
  },
  { type: "h3", text: "4. Pricing & Payments" },
  {
    type: "p",
    text: "All prices displayed are listed in the applicable currency at checkout. We work to keep pricing accurate, but occasional errors may happen. If a pricing issue is identified before shipment, we may cancel the order and notify you immediately. We do not store sensitive payment information on our servers.",
  },
  { type: "h3", text: "5. Order Confirmation" },
  {
    type: "p",
    text: "Once payment is approved, an order confirmation email is sent automatically. This confirms that we received your order request, but it does not guarantee shipment until processing is complete.",
  },
  { type: "h3", text: "6. Shipping & Delivery" },
  {
    type: "p",
    text: "Delivery times may vary depending on location, weather, holidays, or carrier delays. Tracking details are shared once the package is shipped. If your order takes longer than expected, our support team can help review the shipment status.",
  },
  { type: "h3", text: "7. Returns & Exchanges" },
  {
    type: "p",
    text: "Eligible items may qualify for return or exchange within the stated return window. Returned products must be unused, include original tags, be in original condition, and not show signs of wear, washing, or damage. Clearance or personalized items may not qualify.",
  },
  { type: "h3", text: "8. Sizing" },
  {
    type: "p",
    text: "Check the product size guide before ordering. Measurements may differ slightly between collections or fits. If you are between sizes, reviewing fit notes or contacting support may help before placing an order.",
  },
  { type: "h3", text: "9. Account Responsibility" },
  {
    type: "ul",
    items: [
      "Keep login details secure",
      "Update accurate contact information",
      "Monitor activity under your account",
    ],
  },
  {
    type: "p",
    text: "We are not responsible for unauthorized access caused by weak passwords or shared account details.",
  },
  { type: "h3", text: "10. Promotional Offers" },
  {
    type: "p",
    text: "Discount codes, seasonal promotions, limited-time sales, and member rewards may include specific conditions, expiration dates, or product exclusions.",
  },
  { type: "h3", text: "11. Intellectual Property" },
  {
    type: "p",
    text: "Product photos, logos, graphics, written content, and branding elements belong to Tigerteeh Clothing unless otherwise stated. Unauthorized use, reproduction, or distribution is prohibited.",
  },
  { type: "h3", text: "12. User Reviews & Comments" },
  {
    type: "p",
    text: "By submitting reviews or comments, you agree the content is truthful, does not violate laws or rights, and does not contain offensive or misleading material. We may remove inappropriate submissions.",
  },
  { type: "h3", text: "13–15. Accuracy, Third Parties & Liability" },
  {
    type: "p",
    text: "We work hard to provide accurate descriptions and sizing, but occasional mistakes may occur due to device settings or technical updates. Some services connect with third-party payment, shipping, or analytics providers. Liability is limited to the amount paid for the purchased product when permitted by law.",
  },
  { type: "h3", text: "16. Privacy" },
  {
    type: "p",
    text: "We value customer privacy and handle personal information carefully. Please review our Privacy Policy for complete details.",
  },
  { type: "h3", text: "17. Changes" },
  {
    type: "p",
    text: "We may update these Terms & Conditions when necessary. Revised terms become effective once published on this page.",
  },
];

export default function TermsPage() {
  return (
    <InfoPageShell
      eyebrow="Useful Links"
      title="TERMS &"
      accent="CONDITIONS"
      lead="Clear rules for browsing, shopping, and belonging to the Tigerteeh tribe."
    >
      <InfoCard>
        <InfoBlocks blocks={blocks} />
      </InfoCard>
    </InfoPageShell>
  );
}
