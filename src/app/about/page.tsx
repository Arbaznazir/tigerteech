import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  InfoCard,
  InfoPageShell,
} from "@/components/info/InfoPageShell";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The Tigerteeh story — from Dadhal Inam, Gujarat to bold fashion, fitness, and giving back.",
};

export default function AboutPage() {
  return (
    <InfoPageShell
      eyebrow="Our Story"
      title="MORE THAN"
      accent="CLOTHING"
      lead="A lifestyle born from grit, fashion, and the spirit of the tiger — built to help you dominate every room you enter."
    >
      <div className="space-y-5">
        <InfoCard>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange">
            Tale of success
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-wide text-forest md:text-4xl">
            From a small village in Gujarat to the world stage
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted md:text-[15px]">
            The journey starts from a small village in Gujarat to narrate a tale
            of success as a businessman, influencer, model, and motivator.
            Touseef Panchbhaya — AKA Tigerteeh — born in Dadhal-Inam,
            Ankleshwar, grew up with dreams bigger than his surroundings and a
            simple motive: no matter where you start, you can rise to the top.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted md:text-[15px]">
            A small village boy from Bharuch district has become a businessman,
            model, motivator, and actor. His journey serves as inspiration for
            countless young dreamers who dare to think beyond their
            circumstances.
          </p>
        </InfoCard>

        <InfoCard>
          <h2 className="font-display text-3xl tracking-wide text-forest md:text-4xl">
            The tiger as inspiration
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted md:text-[15px]">
            For him, the tiger isn&apos;t just a national animal of India — it&apos;s
            an inspiration. Tigerteeh Clothing shapes that dedication into
            outfits that make you feel confident and dominate any gathering.
            Passion of fashion meets the mindset of a tiger.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted md:text-[15px]">
            Rankings reported by a USA-based website as of early 2026 include
            strong placements in fitness and fashion influencer categories. The
            clothing range is built for youngsters and anyone who wants to flaunt
            their own style statement.
          </p>
        </InfoCard>

        <InfoCard>
          <h2 className="font-display text-3xl tracking-wide text-forest md:text-4xl">
            Tigerteeh Gives
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted md:text-[15px]">
            A big part of the motive behind this fashion range is helping those
            in need — with a meaningful share of earnings directed toward animal
            care and community support. Tigerteeh Gives focuses on social
            welfare and uplifting lives across places like Ankleshwar in
            Gujarat, Jalna, Delhi, Bangalore, Hyderabad, Rajasthan, Kashmir, and
            more.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted md:text-[15px]">
            With signature style and a positive outlook, Tigerteeh continues to
            influence people worldwide — encouraging them to strive for
            greatness. Lifestyle of Tigerteeh is here to transform wardrobes with
            unique collections preferred by the fashion model and influencer
            community.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/shop">Explore Collection</Button>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center rounded-full border border-forest/20 px-5 text-[12px] font-bold uppercase tracking-[0.12em] text-forest transition hover:border-orange hover:text-orange"
            >
              Contact us
            </Link>
          </div>
        </InfoCard>
      </div>
    </InfoPageShell>
  );
}
