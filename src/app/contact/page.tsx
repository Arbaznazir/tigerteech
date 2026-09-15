import type { Metadata } from "next";
import { ContactForm } from "@/components/info/ContactForm";
import {
  InfoCard,
  InfoPageShell,
} from "@/components/info/InfoPageShell";
import { Mail, MapPin, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Tigerteeh Clothing — support@tigerteehclothing.com",
};

export default function ContactPage() {
  return (
    <InfoPageShell
      eyebrow="Contact"
      title="GET IN"
      accent="TOUCH"
      lead="Questions about orders, sizing, shipping, or the tribe — drop a note and we’ll help you stay bold."
    >
      <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <InfoCard>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft text-orange">
                <Mail className="size-4" strokeWidth={2} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                  Email us
                </p>
                <a
                  href="mailto:support@tigerteehclothing.com"
                  className="mt-1 block text-sm font-semibold text-forest break-all hover:text-orange"
                >
                  support@tigerteehclothing.com
                </a>
              </div>
            </div>
          </InfoCard>

          <InfoCard>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft text-orange">
                <MapPin className="size-4" strokeWidth={2} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                  Store location
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Tigerteeh Office, Pader Street
                  <br />
                  Dadhal Inam, Taluka Ankleshwar
                  <br />
                  Dist Bharuch, PIN 393001
                </p>
              </div>
            </div>
          </InfoCard>

          <InfoCard>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft text-orange">
                <MessageSquare className="size-4" strokeWidth={2} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                  Response time
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  We aim to reply as quickly as possible on business days.
                  Include your order number for faster help.
                </p>
              </div>
            </div>
          </InfoCard>
        </div>

        <InfoCard>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange">
            Send a message
          </p>
          <ContactForm />
        </InfoCard>
      </div>
    </InfoPageShell>
  );
}
