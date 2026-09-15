import type { Metadata } from "next";
import {
  InfoBlocks,
  InfoCard,
  InfoPageShell,
} from "@/components/info/InfoPageShell";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Tigerteeh Clothing, animal-print co-ords, and street fashion.",
};

const blocks = [
  {
    type: "qa" as const,
    q: "What makes Tigerteeh clothing stand out from regular fashion brands?",
    a: "Tigerteeh creates clothing that blends streetwear comfort with bold personality. The designs feature detailed animal-inspired artwork, modern cuts, and wearable colors for everyday use. Each piece is made for people who want expressive fashion without sacrificing comfort — from casual outings and travel days to statement looks.",
  },
  {
    type: "qa" as const,
    q: "Does Tigerteeh offer clothing for both men and women?",
    a: "Yes. The collection includes co-ord sets, graphic looks, oversized fits, and stylish casual wear for men, women, and kids. Many designs work as unisex fashion, with comfortable fits, durable materials, and bold visual appeal.",
  },
  {
    type: "qa" as const,
    q: "Why are animal-themed outfits becoming popular in street fashion?",
    a: "Animal-themed outfits add personality and energy to modern streetwear. Shoppers enjoy clothing inspired by tigers, parrots, leopards, and other wildlife because the designs feel bold and expressive. Tigerteeh uses animal-inspired graphics in a creative way that feels fashionable instead of overwhelming.",
  },
  {
    type: "qa" as const,
    q: "Are Tigerteeh co-ords suitable for daily wear?",
    a: "Yes. Our sets are designed for daily comfort and practical styling — soft structure, standout prints, and silhouettes that work for travel, weekends, dinners, or relaxed evenings outdoors.",
  },
  {
    type: "qa" as const,
    q: "What styles can shoppers expect?",
    a: "Modern streetwear with artistic graphics, relaxed silhouettes, and animal-inspired fashion elements. Wearable pieces that feel stylish without looking overly complicated — trendy basics mixed with statement designs.",
  },
  {
    type: "qa" as const,
    q: "Can animal-themed clothing work for minimal fashion lovers?",
    a: "Yes. When styled properly, a single animal-inspired set can become the highlight of an otherwise simple outfit — bold graphics balanced with wearable cuts and tones.",
  },
  {
    type: "qa" as const,
    q: "What should buyers look for when shopping graphic streetwear online?",
    a: "Check fabric quality, print durability, sizing details, and styling versatility. Tigerteeh focuses on comfortable materials and eye-catching artwork that remains wearable across seasons.",
  },
];

export default function FaqPage() {
  return (
    <InfoPageShell
      eyebrow="Information"
      title="FREQUENTLY"
      accent="ASKED"
      lead="Straight answers about the brand, the prints, and how to wear the wild every day."
    >
      <InfoCard>
        <InfoBlocks blocks={blocks} />
      </InfoCard>
    </InfoPageShell>
  );
}
